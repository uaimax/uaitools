"""Base ViewSets para APIs com multi-tenancy."""

from typing import TYPE_CHECKING

from django.db import models
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import WorkspaceObjectPermission

if TYPE_CHECKING:
    from apps.accounts.models import Workspace
    from rest_framework.response import Response


class WorkspaceViewSet(viewsets.ModelViewSet):
    """ViewSet base com filtro automático por workspace.

    Todos os ViewSets que trabalham com models WorkspaceModel devem herdar desta classe.
    O filtro por workspace é aplicado automaticamente usando request.workspace do middleware.
    Usa soft delete: destroy() marca como deletado ao invés de remover do banco.

    Segurança:
    - Valida explicitamente que objetos pertencem ao workspace do request (previne IDOR)
    - Filtra automaticamente por workspace em todas as queries
    """

    permission_classes = [permissions.IsAuthenticated, WorkspaceObjectPermission]

    def get_queryset(self) -> models.QuerySet:
        """Retorna queryset filtrado por workspace e excluindo deletados.

        Super admins (is_superuser=True) podem ver todos os dados sem filtro de workspace.
        Se super admin tiver workspace selecionado, filtra por ele (para ver dados de tenant específico).
        """
        queryset = super().get_queryset()

        # Obter workspace do request (definida pelo middleware)
        workspace: "Workspace | None" = getattr(self.request, "workspace", None)
        is_superuser = getattr(self.request.user, "is_superuser", False) if hasattr(self.request, "user") and self.request.user.is_authenticated else False

        # Super admins podem ver todos os dados (sem filtro de workspace)
        # MAS se tiverem workspace selecionado, filtram por ele para ver dados do tenant específico
        if is_superuser:
            if workspace:
                # Super admin com tenant selecionado: mostrar apenas dados desse tenant
                queryset = queryset.filter(workspace=workspace)
            # Se não tiver workspace, retorna todos (comportamento padrão para super admin)
            return queryset

        # Usuários normais: sempre filtrar por workspace
        if workspace:
            queryset = queryset.filter(workspace=workspace)

        # objects manager já filtra deletados automaticamente
        return queryset

    def perform_create(self, serializer: serializers.Serializer) -> None:
        """Define workspace automaticamente ao criar.

        Para super admins sem request.workspace, usa o workspace do usuário se disponível.
        Se não houver workspace, lança erro de validação com instruções claras.
        """
        workspace: "Workspace | None" = getattr(self.request, "workspace", None)

        # Se não há workspace no request, tentar usar o workspace do usuário
        # Isso é especialmente importante para super admins que não têm request.workspace
        if not workspace and hasattr(self.request, "user") and self.request.user.is_authenticated:
            user = self.request.user
            # Verificar se o usuário tem um workspace associado
            if hasattr(user, "workspace") and user.workspace:
                workspace = user.workspace

        if workspace:
            serializer.save(workspace=workspace)
        else:
            # Se ainda não há workspace, lançar erro de validação
            from rest_framework.exceptions import ValidationError
            is_superuser = getattr(self.request.user, "is_superuser", False) if hasattr(self.request, "user") else False

            if is_superuser:
                error_message = (
                    "Workspace é obrigatório. Como super admin, você precisa selecionar um tenant "
                    "usando o seletor de tenant no cabeçalho antes de criar recursos. "
                    "Ou configure o header X-Workspace-ID na requisição."
                )
            else:
                error_message = (
                    "Workspace é obrigatório. Configure o header X-Workspace-ID ou associe um workspace ao usuário."
                )

            raise ValidationError({"workspace": error_message})

    def get_object(self):
        """Obtém o objeto, permitindo que super admins acessem qualquer objeto.

        Para super admins, usa queryset sem filtro de workspace para garantir
        que possam acessar objetos de qualquer tenant.
        """
        # Se for super admin, usar queryset sem filtro de workspace
        if getattr(self.request.user, "is_superuser", False):
            # Salvar queryset original
            original_queryset = self.queryset
            # Usar queryset sem filtro de workspace para super admins
            # Usa o model diretamente para evitar filtros de get_queryset()
            # Se o model tem manager with_deleted (SoftDeleteModel), usa ele
            model = self.queryset.model
            if hasattr(model.objects, "with_deleted"):
                self.queryset = model.objects.with_deleted().all()
            else:
                self.queryset = model.objects.all()
            try:
                obj = super().get_object()
            finally:
                # Restaurar queryset original
                self.queryset = original_queryset
            return obj
        # Para usuários normais, usar comportamento padrão
        return super().get_object()

    def destroy(self, request, *args, **kwargs) -> "Response":
        """Realiza soft delete ao invés de deletar permanentemente."""
        instance = self.get_object()
        # Verifica se tem método soft_delete (herda de SoftDeleteModel)
        if hasattr(instance, "soft_delete"):
            instance.soft_delete()
            from rest_framework.response import Response
            from rest_framework import status
            return Response(status=status.HTTP_204_NO_CONTENT)
        # Fallback para delete permanente se não tiver soft_delete
        return super().destroy(request, *args, **kwargs)


class BaseViewSet(viewsets.ModelViewSet):
    """ViewSet base sem filtro de workspace (para models globais).

    Use WorkspaceViewSet se o model precisa de multi-tenancy.
    """

    pass


class ApplicationLogViewSet(WorkspaceViewSet):
    """ViewSet para receber logs do frontend.

    Endpoint: POST /api/v1/logs/frontend/
    Rate limit: 100 logs/hora por workspace
    """

    from apps.core.models import ApplicationLog
    from apps.core.serializers import ApplicationLogSerializer
    from apps.core.services.error_logger import log_error
    from apps.core.throttles import LoggingRateThrottle

    queryset = ApplicationLog.objects.none()  # Não permitir listagem via API
    serializer_class = ApplicationLogSerializer
    permission_classes = []  # Permitir logs mesmo sem autenticação (com rate limit)
    throttle_classes = [LoggingRateThrottle]

    @action(detail=False, methods=["post"], url_path="frontend")
    def log_frontend(self, request):
        """Endpoint para receber logs do frontend."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Obter dados do request
        workspace = getattr(request, "workspace", None)
        user = request.user if request.user.is_authenticated else None

        # Usar service ErrorLogger (ele decide: Sentry ou banco)
        log_error(
            level=serializer.validated_data["level"],
            message=serializer.validated_data["message"],
            error_type=serializer.validated_data.get("error_type"),
            url=serializer.validated_data.get("url"),
            stack_trace=serializer.validated_data.get("stack_trace"),
            extra_data=serializer.validated_data.get("extra_data", {}),
            request=request,
            user=user,
            workspace=workspace,
            session_id=serializer.validated_data.get("session_id"),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
        )

        return Response({"status": "logged"}, status=status.HTTP_201_CREATED)

