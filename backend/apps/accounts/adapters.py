"""Adapters customizados para django-allauth com suporte a multi-tenancy."""

import base64
import json

from allauth.exceptions import ImmediateHttpResponse
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponseBadRequest, HttpResponseForbidden
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Workspace


class WorkspaceSocialAccountAdapter(DefaultSocialAccountAdapter):
    """Adapter que associa usuários sociais a workspaces durante OAuth."""

    def pre_social_login(self, request, sociallogin):
        """Associa usuário ao workspace antes de completar login."""
        workspace = getattr(request, "workspace", None)

        # Se não há workspace no request, tentar extrair do state parameter
        if not workspace:
            state = request.GET.get("state")
            if state:
                try:
                    decoded_state = base64.b64decode(state).decode("utf-8")
                    state_data = json.loads(decoded_state)
                    workspace_slug = state_data.get("workspace_slug") or state_data.get("tenant_slug")  # Compatibilidade com versões antigas

                    if workspace_slug:
                        try:
                            workspace = Workspace.objects.get(slug=workspace_slug, is_active=True)
                            request.workspace = workspace
                        except Workspace.DoesNotExist:
                            raise ImmediateHttpResponse(
                                HttpResponseBadRequest("Workspace não encontrado ou inativo.")
                            )

                    # Validar nonce para prevenir replay attacks
                    nonce = state_data.get("nonce")
                    if nonce:
                        cache_key = f"oauth_nonce:{nonce}"
                        if cache.get(cache_key):
                            raise ImmediateHttpResponse(
                                HttpResponseBadRequest("Nonce já usado. Tente novamente.")
                            )
                        cache.set(cache_key, True, timeout=600)  # 10 minutos

                except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
                    # State inválido, mas não bloquear - pode ser de outro fluxo
                    pass

        # Se ainda não há workspace, não bloquear mas registrar warning
        if not hasattr(request, 'workspace') or not request.workspace:
            # Em produção, pode querer bloquear aqui
            # Por enquanto, permitir mas sem associar workspace
            return

        # Se usuário já existe, verificar se pertence ao workspace
        if sociallogin.is_existing:
            user = sociallogin.user
            workspace = getattr(request, 'workspace', None)
            if user.workspace_id and workspace and user.workspace_id != workspace.id:
                raise ImmediateHttpResponse(
                    HttpResponseForbidden(
                        "Usuário não pertence a este workspace. "
                        "Por favor, use a conta correta ou entre em contato com o suporte."
                    )
                )

        # Associar workspace ao usuário
        workspace = getattr(request, 'workspace', None)
        if workspace:
            sociallogin.user.workspace = workspace

    def save_user(self, request, sociallogin, form=None):
        """Garante que workspace seja salvo com o usuário."""
        user = super().save_user(request, sociallogin, form)

        # Associar workspace se disponível
        workspace = getattr(request, "workspace", None)
        if workspace:
            user.workspace = workspace
            user.save()

        return user

    def is_open_for_signup(self, request, sociallogin):
        """Permite signup via social auth."""
        return True

    def get_login_redirect_url(self, request):
        """Customiza o redirecionamento após login social para incluir JWT."""
        # Se usuário está autenticado, gerar JWT e redirecionar para frontend
        if request.user.is_authenticated:
            try:
                refresh = RefreshToken.for_user(request.user)
                access_token = str(refresh.access_token)
                frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
                return f"{frontend_url}/oauth/callback?token={access_token}"
            except Exception:
                # Se falhar, usar redirecionamento padrão
                pass

        # Redirecionamento padrão do django-allauth
        return super().get_login_redirect_url(request)

