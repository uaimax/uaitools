"""Views para autenticação e gerenciamento de usuários."""

from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib.auth import login, logout
from django.shortcuts import redirect
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Workspace, LegalDocument, User
from .serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    WorkspaceSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)
from .services import generate_password_reset_token, get_active_legal_document, render_legal_document, send_password_reset_email

if TYPE_CHECKING:
    from rest_framework.serializers import Serializer


@extend_schema(
    summary="Login",
    description="Autentica um usuário usando email e senha.",
    tags=["Autenticação"],
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "email": {"type": "string", "format": "email"},
                "password": {"type": "string"},
            },
            "required": ["email", "password"],
        }
    },
    responses={
        200: OpenApiResponse(description="Login realizado com sucesso"),
        400: OpenApiResponse(description="Dados inválidos"),
        401: OpenApiResponse(description="Credenciais inválidas"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request: Request) -> Response:
    """Endpoint de login usando email."""
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"error": "Email e senha são obrigatórios."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Usar authenticate do Django que suporta email quando USERNAME_FIELD = email
        from django.contrib.auth import authenticate

        user = authenticate(request, username=email, password=password)

        if user is None:
            return Response(
                {"error": "Credenciais inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"error": "Usuário inativo."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)

        # Gerar JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        serializer = UserProfileSerializer(user)
        return Response(
            {
                "message": "Login realizado com sucesso.",
                "user": serializer.data,
                "access": access_token,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"error": "Erro ao fazer login. Tente novamente."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@extend_schema(
    summary="Logout",
    description="Encerra a sessão do usuário atual.",
    tags=["Autenticação"],
    responses={
        200: OpenApiResponse(description="Logout realizado com sucesso"),
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request: Request) -> Response:
    """Endpoint de logout."""
    logout(request)
    return Response(
        {"message": "Logout realizado com sucesso."},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    summary="Registro",
    description="Registra um novo usuário.",
    tags=["Autenticação"],
    responses={
        201: OpenApiResponse(description="Usuário criado com sucesso"),
        400: OpenApiResponse(description="Dados inválidos"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request: Request) -> Response:
    """Endpoint de registro usando email."""
    serializer = UserRegistrationSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        user = serializer.save()
        login(request, user)

        # Gerar JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        user_serializer = UserProfileSerializer(user)
        return Response(
            {
                "message": "Usuário criado com sucesso.",
                "user": user_serializer.data,
                "access": access_token,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Perfil do Usuário",
    description="Retorna informações do usuário autenticado.",
    tags=["Autenticação"],
    responses={
        200: UserProfileSerializer,
        401: OpenApiResponse(description="Não autenticado"),
    },
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request: Request) -> Response:
    """Endpoint para obter perfil do usuário atual."""
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Atualizar Perfil",
    description="Atualiza informações do usuário autenticado.",
    tags=["Autenticação"],
    responses={
        200: UserProfileSerializer,
        400: OpenApiResponse(description="Dados inválidos"),
        401: OpenApiResponse(description="Não autenticado"),
    },
)
@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_profile_view(request: Request) -> Response:
    """Endpoint para atualizar perfil do usuário atual."""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        profile_serializer = UserProfileSerializer(serializer.instance)
        return Response(profile_serializer.data, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="Listar Workspaces",
    description="Lista todos os workspaces ativos.",
    tags=["Workspaces"],
    responses={
        200: OpenApiResponse(description="Lista de workspaces"),
    },
)
@api_view(["GET"])
@permission_classes([AllowAny])
def workspaces_list_view(request: Request) -> Response:
    """Endpoint para listar workspaces ativos.

    Super admins veem todos os workspaces ativos.
    Usuários normais veem apenas seu próprio workspace (se tiver).
    Não usa cache para garantir dados atualizados (pode ser otimizado depois).
    """
    # Super admins veem todos os workspaces ativos
    # Usuários normais veem apenas seu próprio workspace
    if request.user and request.user.is_authenticated and request.user.is_superuser:
        workspaces = Workspace.objects.filter(is_active=True)
    elif request.user and request.user.is_authenticated and hasattr(request.user, "workspace") and request.user.workspace:
        # Usuário normal: apenas seu próprio workspace
        workspaces = Workspace.objects.filter(id=request.user.workspace.id, is_active=True)
    else:
        # Não autenticado: todos os workspaces ativos (para registro, etc)
        workspaces = Workspace.objects.filter(is_active=True)

    serializer = WorkspaceSerializer(workspaces, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    summary="Listar Providers Sociais Disponíveis",
    description="Retorna lista de providers de autenticação social configurados e ativos.",
    tags=["Autenticação"],
    responses={
        200: OpenApiResponse(description="Lista de providers disponíveis"),
    },
)
@api_view(["GET"])
@permission_classes([AllowAny])
def available_social_providers(request: Request) -> Response:
    """Retorna lista de providers sociais configurados.

    Verifica SocialApps criados no banco de dados (via Admin ou sync_social_apps).
    Se nenhum SocialApp existir, retorna lista vazia.
    """
    try:
        from allauth.socialaccount.models import SocialApp
        from django.contrib.sites.models import Site

        site = Site.objects.get_current()
        # SocialApp tem relacionamento ManyToMany com Site
        # Nota: SocialApp não tem campo 'active', apenas verifica se está configurado
        apps = SocialApp.objects.filter(sites=site)

        # Filtrar apenas providers que estão na lista de habilitados via settings
        enabled_providers = getattr(settings, "SOCIAL_AUTH_ENABLED_PROVIDERS", [])
        if enabled_providers:
            apps = apps.filter(provider__in=enabled_providers)

        providers = []
        for app in apps:
            providers.append(
                {
                    "provider": app.provider,
                    "name": app.name or app.provider.title(),
                }
            )

        return Response({"providers": providers}, status=status.HTTP_200_OK)
    except ImportError:
        # django-allauth não está instalado ou configurado
        return Response({"providers": []}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def oauth_callback_view(request: Request):
    """View customizada para callback OAuth que gera JWT e redireciona para frontend.

    Nota: Esta view é um fallback. O redirecionamento principal é feito
    via adapter.get_login_redirect_url() após login social bem-sucedido.
    """
    # Verificar se usuário foi autenticado via social auth
    if not request.user.is_authenticated:
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
        return redirect(f"{frontend_url}/oauth/callback?error=not_authenticated")

    try:
        # Gerar JWT
        refresh = RefreshToken.for_user(request.user)
        access_token = str(refresh.access_token)

        # Redirecionar para frontend com token
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
        return redirect(f"{frontend_url}/oauth/callback?token={access_token}")

    except Exception as e:
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
        return redirect(f"{frontend_url}/oauth/callback?error={str(e)}")


@extend_schema(
    summary="Obter Termos e Condições",
    description="Retorna os Termos e Condições renderizados para a empresa do tenant atual.",
    tags=["Documentos Legais"],
    responses={
        200: OpenApiResponse(description="Termos e Condições renderizados"),
        404: OpenApiResponse(description="Documento não encontrado"),
    },
)
@api_view(["GET"])
@permission_classes([AllowAny])
def legal_terms_view(request: Request) -> Response:
    """Endpoint para obter Termos e Condições renderizados.

    Retorna o documento global do sistema.
    Usa cache para melhorar performance (1 hora - documentos mudam raramente).
    """
    from apps.core.cache import cache_get_or_set, get_cache_key

    cache_key = get_cache_key("legal_terms")

    def fetch_terms():
        # Buscar documento ativo global
        document = get_active_legal_document("terms")

        if not document:
            return {
                "error": "Termos e Condições não encontrados.",
                "status": status.HTTP_404_NOT_FOUND,
            }

        # Renderizar documento usando configurações globais do SaaS
        rendered_content = render_legal_document(document)

        return {
            "content": rendered_content,
            "version": document.version,
            "last_updated": document.last_updated,
            "status": status.HTTP_200_OK,
        }

    result = cache_get_or_set(cache_key, fetch_terms, timeout=3600)  # 1 hora
    return Response(
        {k: v for k, v in result.items() if k != "status"},
        status=result.get("status", status.HTTP_200_OK),
    )


@extend_schema(
    summary="Obter Política de Privacidade",
    description="Retorna a Política de Privacidade renderizada para a empresa do tenant atual.",
    tags=["Documentos Legais"],
    responses={
        200: OpenApiResponse(description="Política de Privacidade renderizada"),
        404: OpenApiResponse(description="Documento não encontrado"),
    },
)
@api_view(["GET"])
@permission_classes([AllowAny])
def legal_privacy_view(request: Request) -> Response:
    """Endpoint para obter Política de Privacidade renderizada.

    Retorna o documento global do sistema.
    Usa cache para melhorar performance (1 hora - documentos mudam raramente).
    """
    from apps.core.cache import cache_get_or_set, get_cache_key

    cache_key = get_cache_key("legal_privacy")

    def fetch_privacy():
        # Buscar documento ativo global
        document = get_active_legal_document("privacy")

        if not document:
            return {
                "error": "Política de Privacidade não encontrada.",
                "status": status.HTTP_404_NOT_FOUND,
            }

        # Renderizar documento usando configurações globais do SaaS
        rendered_content = render_legal_document(document)

        return {
            "content": rendered_content,
            "version": document.version,
            "last_updated": document.last_updated,
            "status": status.HTTP_200_OK,
        }

    result = cache_get_or_set(cache_key, fetch_privacy, timeout=3600)  # 1 hora
    return Response(
        {k: v for k, v in result.items() if k != "status"},
        status=result.get("status", status.HTTP_200_OK),
    )


@extend_schema(
    summary="Solicitar Reset de Senha",
    description="Solicita um link de reset de senha por email. Sempre retorna sucesso genérico para evitar enumeração de emails.",
    tags=["Autenticação"],
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "email": {"type": "string", "format": "email"},
            },
            "required": ["email"],
        }
    },
    responses={
        200: OpenApiResponse(description="Se o email existe, um link de reset foi enviado. Sempre retorna sucesso genérico."),
        400: OpenApiResponse(description="Dados inválidos"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_request_view(request: Request) -> Response:
    """Endpoint para solicitar reset de senha.

    Sempre retorna sucesso genérico para evitar enumeração de emails.
    Se o email existe, envia email com link de reset.
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]

    try:
        # Buscar usuário (sem expor se existe ou não)
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            # Gerar token
            token = generate_password_reset_token(user)

            # Enviar email
            try:
                send_password_reset_email(user, token, request)
            except Exception as email_error:
                # Log do erro de email (mas não expor ao usuário)
                import logging
                logger = logging.getLogger(__name__)
                logger.error(
                    f"Erro ao enviar email de reset de senha para {user.email}: {email_error}",
                    exc_info=True,
                )
                # Continuar e retornar sucesso genérico mesmo com erro de email

        # Sempre retornar sucesso genérico (segurança)
        return Response(
            {
                "message": "Se o email fornecido estiver cadastrado, você receberá um link para redefinir sua senha.",
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        # Em caso de erro, ainda retornar sucesso genérico
        # Log do erro será feito pelo ErrorLoggingMiddleware
        import logging
        logger = logging.getLogger(__name__)
        logger.error(
            f"Erro ao processar solicitação de reset de senha para {email}: {e}",
            exc_info=True,
        )
        return Response(
            {
                "message": "Se o email fornecido estiver cadastrado, você receberá um link para redefinir sua senha.",
            },
            status=status.HTTP_200_OK,
        )


@extend_schema(
    summary="Confirmar Reset de Senha",
    description="Confirma o reset de senha usando o token recebido por email.",
    tags=["Autenticação"],
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "token": {"type": "string", "format": "uuid"},
                "new_password": {"type": "string", "minLength": 8},
            },
            "required": ["token", "new_password"],
        }
    },
    responses={
        200: OpenApiResponse(description="Senha redefinida com sucesso"),
        400: OpenApiResponse(description="Dados inválidos ou token inválido/expirado"),
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def password_reset_confirm_view(request: Request) -> Response:
    """Endpoint para confirmar reset de senha."""
    serializer = PasswordResetConfirmSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = serializer.save()

        # Opcional: Invalidar todas as sessões JWT do usuário (segurança extra)
        # Isso pode ser feito invalidando refresh tokens, mas por simplicidade
        # vamos apenas retornar sucesso

        return Response(
            {
                "message": "Senha redefinida com sucesso. Você já pode fazer login com sua nova senha.",
            },
            status=status.HTTP_200_OK,
        )
    except serializers.ValidationError as e:
        return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {"error": "Erro ao redefinir senha. Tente novamente."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

