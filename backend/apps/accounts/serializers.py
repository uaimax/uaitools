"""Serializers para o app accounts."""

import uuid

from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.core.translations import COMMON_ERRORS

from .models import Workspace, User
from .services import validate_password_reset_token


class WorkspaceSerializer(serializers.ModelSerializer):
    """Serializer para modelo Workspace."""

    class Meta:
        model = Workspace
        fields = ["id", "name", "slug", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para registro de usuário usando email.

    Fluxo típico de SaaS:
    - Usuário se registra sem workspace → cria Workspace automaticamente
    - Usuário se registra com workspace_slug → junta-se a Workspace existente (convite)
    - Usuário pode fornecer workspace_name opcional para personalizar nome do Workspace criado
    """

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    workspace_slug = serializers.CharField(
        write_only=True,
        required=False,
        help_text="Slug do workspace existente para se juntar (opcional). Se não fornecido, cria novo workspace automaticamente.",
    )
    workspace_name = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=255,
        help_text="Nome do workspace a ser criado (opcional). Se não fornecido, usa nome baseado no usuário.",
    )
    accepted_terms = serializers.BooleanField(write_only=True)
    accepted_privacy = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
            "workspace_slug",
            "workspace_name",
            "workspace",
            "accepted_terms",
            "accepted_privacy",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "created_at", "updated_at"]
        extra_kwargs = {
            "email": {"required": True},
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def validate(self, attrs: dict) -> dict:
        """Valida se as senhas coincidem e se os termos foram aceitos."""
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError(
                {"password_confirm": _("Passwords do not match.")}
            )

        if not attrs.get("accepted_terms"):
            raise serializers.ValidationError(
                {"accepted_terms": _("You must accept the Terms and Conditions.")}
            )

        if not attrs.get("accepted_privacy"):
            raise serializers.ValidationError(
                {"accepted_privacy": _("You must accept the Privacy Policy.")}
            )

        return attrs

    def validate_workspace_name(self, value: str) -> str | None:
        """Valida e normaliza workspace_name: converte strings vazias em None."""
        if value and value.strip():
            return value.strip()
        return None

    def validate_workspace_slug(self, value: str) -> str:
        """Valida se o workspace existe e está ativo (se fornecido)."""
        if value:
            try:
                workspace = Workspace.objects.filter(is_active=True).get(slug=value)
            except Workspace.DoesNotExist:
                raise serializers.ValidationError(_("Workspace not found or inactive."))
        return value

    def _generate_unique_slug(self, base_name: str) -> str:
        """Gera um slug único a partir de um nome base.

        Se o slug já existir, adiciona sufixo numérico (ex: workspace, workspace-2, workspace-3).
        """
        base_slug = slugify(base_name)
        if not base_slug:
            # Se slugify retornar vazio (ex: apenas caracteres especiais), usar fallback
            base_slug = "workspace"

        slug = base_slug
        counter = 1
        while Workspace.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        return slug

    def create(self, validated_data: dict) -> User:
        """Cria um novo usuário e Workspace automaticamente se necessário.

        Fluxo:
        1. Se workspace_slug fornecido → junta-se a Workspace existente (convite)
        2. Se não fornecido → cria Workspace automaticamente para o usuário
        """
        from apps.accounts.models import LegalDocumentAcceptance
        from apps.accounts.services import get_active_legal_document
        from apps.core.audit import log_audit
        from django.utils import timezone

        validated_data.pop("password_confirm", None)
        accepted_terms = validated_data.pop("accepted_terms", False)
        accepted_privacy = validated_data.pop("accepted_privacy", False)
        workspace_slug = validated_data.pop("workspace_slug", None)
        workspace_name = validated_data.pop("workspace_name", None)

        password = validated_data.pop("password")
        email = validated_data.pop("email")
        first_name = validated_data.get("first_name", "")
        last_name = validated_data.get("last_name", "")

        # Determinar workspace
        workspace = None
        if workspace_slug:
            # Caso 1: Usuário se junta a Workspace existente (convite)
            workspace = Workspace.objects.filter(is_active=True).get(slug=workspace_slug)
        else:
            # Caso 2: Criar Workspace automaticamente para novo usuário
            if workspace_name:
                # Usar nome fornecido pelo usuário
                name = workspace_name.strip()
            else:
                # Gerar nome baseado no usuário
                user_full_name = f"{first_name} {last_name}".strip()
                if user_full_name:
                    name = f"Workspace de {user_full_name}"
                else:
                    # Fallback: usar email
                    name = f"Workspace de {email.split('@')[0]}"

            # Gerar slug único
            slug = self._generate_unique_slug(name)

            # Criar Workspace
            workspace = Workspace.objects.create(
                name=name,
                slug=slug,
                is_active=True,
                email=email,  # Email de contato inicial
            )

        # Criar usuário com email
        user = User.objects.create_user(
            email=email,
            workspace=workspace,  # Sempre terá um workspace agora
            password=password,
            **validated_data
        )

        # Registrar aceitação de termos e política de privacidade
        request = self.context.get("request")
        ip_address = None
        user_agent = None
        if request:
            x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(",")[0].strip()
            else:
                ip_address = request.META.get("REMOTE_ADDR")
            user_agent = request.META.get("HTTP_USER_AGENT", "")[:500]

        # Registrar aceitação de Termos e Condições
        if accepted_terms:
            terms_doc = get_active_legal_document("terms")
            if terms_doc:
                LegalDocumentAcceptance.objects.create(
                    user=user,
                    document=terms_doc,
                    workspace=workspace,
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
                log_audit(
                    instance=user,
                    action="create",
                    field_name="accepted_terms",
                    new_value=f"Versão {terms_doc.version} aceita em {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}",
                    request=request,
                )

        # Registrar aceitação de Política de Privacidade
        if accepted_privacy:
            privacy_doc = get_active_legal_document("privacy")
            if privacy_doc:
                LegalDocumentAcceptance.objects.create(
                    user=user,
                    document=privacy_doc,
                    workspace=workspace,
                    ip_address=ip_address,
                    user_agent=user_agent,
                )
                log_audit(
                    instance=user,
                    action="create",
                    field_name="accepted_privacy",
                    new_value=f"Versão {privacy_doc.version} aceita em {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}",
                    request=request,
                )

        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer para modelo User (leitura e atualização)."""

    workspace = WorkspaceSerializer(read_only=True)
    workspace_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_active",
            "workspace",
            "workspace_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",  # Email não pode ser alterado após criação
            "is_staff",
            "created_at",
            "updated_at",
        ]

    def validate_workspace_id(self, value: int) -> int:
        """Valida se o workspace existe e está ativo."""
        if value:
            try:
                workspace = Workspace.objects.filter(is_active=True).get(pk=value)
            except Workspace.DoesNotExist:
                raise serializers.ValidationError(_("Workspace not found or inactive."))
        return value

    def update(self, instance: User, validated_data: dict) -> User:
        """Atualiza o usuário."""
        workspace_id = validated_data.pop("workspace_id", None)
        if workspace_id is not None:
            workspace = Workspace.objects.filter(is_active=True).get(pk=workspace_id)
            instance.workspace = workspace

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer simplificado para perfil do usuário atual."""

    workspace = WorkspaceSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "workspace",
            "is_superuser",
            "is_staff",
            "permissions",
            "created_at",
        ]
        read_only_fields = ["id", "email", "is_superuser", "is_staff", "created_at"]

    def get_permissions(self, obj: User) -> list[str]:
        """Retorna permissões do usuário no workspace atual."""
        # Obter workspace do request (middleware)
        request = self.context.get("request")
        workspace = getattr(request, "workspace", None) if request else None

        # Se não há workspace no request, usar workspace do usuário
        return obj.get_permissions(workspace=workspace)


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer para solicitar reset de senha."""

    email = serializers.EmailField(required=True)

    def validate_email(self, value: str) -> str:
        """Valida email (sempre retorna sucesso para não expor se email existe)."""
        # Sempre retorna sucesso para evitar enumeração de emails
        # A validação real acontece na view, mas sempre retorna mensagem genérica
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer para confirmar reset de senha."""

    token = serializers.UUIDField(required=True)
    new_password = serializers.CharField(
        required=True,
        min_length=8,
        write_only=True,
        help_text="Nova senha (mínimo 8 caracteres)",
    )

    def validate_token(self, value: uuid.UUID) -> uuid.UUID:
        """Valida se o token é válido."""
        user = validate_password_reset_token(value)
        if not user:
            raise serializers.ValidationError(
                _("Token inválido ou expirado. Solicite um novo link de reset de senha.")
            )
        return value

    def validate_new_password(self, value: str) -> str:
        """Valida se a senha atende aos requisitos."""
        # Usar validadores do Django
        from django.contrib.auth.password_validation import validate_password

        validate_password(value)
        return value

    def save(self) -> User:
        """Atualiza a senha do usuário e marca o token como usado."""
        from .models import PasswordResetToken

        token_value = self.validated_data["token"]
        new_password = self.validated_data["new_password"]

        # Obter token e usuário
        try:
            token = PasswordResetToken.objects.get(
                token=token_value,
                used_at__isnull=True,
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError(
                {"token": _("Token inválido ou já utilizado.")}
            )

        if not token.is_valid():
            raise serializers.ValidationError(
                {"token": _("Token expirado. Solicite um novo link de reset de senha.")}
            )

        user = token.user

        # Atualizar senha
        user.set_password(new_password)
        user.save(update_fields=["password"])

        # Marcar token como usado
        token.mark_as_used()

        return user

