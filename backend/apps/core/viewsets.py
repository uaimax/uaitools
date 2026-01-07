"""Base ViewSets para APIs com multi-tenancy."""

from typing import TYPE_CHECKING

from django.db import models
from django.utils import timezone
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import WorkspaceObjectPermission

if TYPE_CHECKING:
    from apps.accounts.models import Workspace
    from rest_framework.response import Response

# Imports para NotificationViewSet (fora de TYPE_CHECKING para uso real)
try:
    from apps.core.models import Notification
    from apps.core.serializers import NotificationSerializer
except ImportError:
    # Evita importação circular durante inicialização
    Notification = None
    NotificationSerializer = None


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

        Para super admins sem request.workspace, cria ou obtém um workspace exclusivo.
        Para usuários normais, usa o workspace do usuário ou do request.
        """
        workspace: "Workspace | None" = getattr(self.request, "workspace", None)

        # Se não há workspace no request, tentar usar o workspace do usuário
        if not workspace and hasattr(self.request, "user") and self.request.user.is_authenticated:
            user = self.request.user
            # Verificar se o usuário tem um workspace associado
            if hasattr(user, "workspace") and user.workspace:
                workspace = user.workspace

        # Se ainda não há workspace e é super admin, criar workspace exclusivo
        if not workspace and hasattr(self.request, "user") and self.request.user.is_authenticated:
            is_superuser = getattr(self.request.user, "is_superuser", False)
            if is_superuser:
                # Criar ou obter workspace exclusivo para super admin
                from apps.accounts.models import Workspace
                from django.utils.text import slugify

                user_email = self.request.user.email
                workspace_name = f"Super Admin - {user_email}"
                workspace_slug = slugify(f"super-admin-{user_email.split('@')[0]}")

                # Tentar obter workspace existente ou criar novo
                workspace, created = Workspace.objects.get_or_create(
                    slug=workspace_slug,
                    defaults={
                        "name": workspace_name,
                        "is_active": True,
                    }
                )

                # Associar workspace ao usuário se não estiver associado
                if hasattr(user, "workspace") and not user.workspace:
                    user.workspace = workspace
                    user.save(update_fields=["workspace"])

        if workspace:
            serializer.save(workspace=workspace)
        else:
            # Se ainda não há workspace, lançar erro de validação
            from rest_framework.exceptions import ValidationError
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

    @action(detail=False, methods=["post"], url_path="frontend/console")
    def log_console(self, request):
        """Endpoint para receber logs de console do frontend (estruturado em JSON).

        Aceita logs de todos os níveis (DEBUG, INFO, WARN, ERROR).
        Salva apenas em arquivo de log (não envia para Sentry/banco).
        """
        from apps.core.serializers import ConsoleLogSerializer
        import json
        from pathlib import Path
        from django.conf import settings

        serializer = ConsoleLogSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Criar diretório de logs se não existir
        logs_dir = Path(settings.BASE_DIR).parent / "logs"
        logs_dir.mkdir(exist_ok=True)

        # Salvar log em arquivo JSONL (uma linha por log)
        log_file = logs_dir / f"frontend-{timezone.now().strftime('%Y%m%d')}.log"

        log_entry = {
            **serializer.validated_data,
            "received_at": timezone.now().isoformat(),
            "workspace_id": getattr(request, "workspace", {}).id if hasattr(request, "workspace") and request.workspace else None,
            "user_id": request.user.id if request.user.is_authenticated else None,
        }

        try:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        except Exception:
            # Não quebrar aplicação se falhar ao salvar log
            pass

        return Response({"status": "logged"}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="stream")
    def stream_logs(self, request):
        """Endpoint para streaming de logs em tempo real (SSE para LLMs).

        Query params:
        - source: Filtrar por source (backend, frontend)
        - level: Filtrar por nível (DEBUG, INFO, WARN, ERROR)
        - limit: Número máximo de logs (padrão: 100)
        - since: Timestamp Unix (retornar apenas logs após este timestamp)
        - stream: true para SSE em tempo real, false para batch (padrão: false)
        """
        from apps.core.services.log_aggregator import get_aggregator
        from django.http import StreamingHttpResponse
        import json

        aggregator = get_aggregator()

        # Obter parâmetros de filtro
        source = request.query_params.get("source")
        level = request.query_params.get("level")
        limit = int(request.query_params.get("limit", 100))
        since = request.query_params.get("since")
        since_float = float(since) if since else None

        # Modo streaming (SSE) ou batch
        stream_mode = request.query_params.get("stream", "false").lower() == "true"

        if stream_mode:
            # Streaming em tempo real (SSE)
            def generate():
                try:
                    for log_entry in aggregator.stream_logs(source=source, level=level):
                        yield f"data: {json.dumps(log_entry, ensure_ascii=False)}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

            response = StreamingHttpResponse(
                generate(),
                content_type="text/event-stream",
            )
            response["Cache-Control"] = "no-cache"
            response["X-Accel-Buffering"] = "no"
            return response
        else:
            # Batch (retornar logs recentes)
            logs = aggregator.get_recent_logs(
                limit=limit,
                source=source,
                level=level,
                since=since_float,
            )

            return Response({
                "logs": logs,
                "count": len(logs),
                "filters": {
                    "source": source,
                    "level": level,
                    "limit": limit,
                    "since": since,
                },
            }, status=status.HTTP_200_OK)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para notificações do usuário."""

    # Atributos de classe necessários para o DRF gerar rotas corretamente
    queryset = Notification.objects.all() if Notification else models.QuerySet().none()
    serializer_class = NotificationSerializer if NotificationSerializer else None
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> models.QuerySet:
        """Retorna apenas notificações do usuário autenticado."""
        from apps.core.models import Notification
        queryset = Notification.objects.filter(user=self.request.user)

        # Filtro opcional por unread
        unread = self.request.query_params.get("unread")
        if unread is not None:
            unread_bool = unread.lower() in ("true", "1", "yes")
            queryset = queryset.filter(read=not unread_bool)

        return queryset

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_as_read(self, request, pk=None) -> "Response":
        """Marca notificação como lida."""
        notification = self.get_object()
        notification.mark_as_read()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request) -> "Response":
        """Marca todas as notificações do usuário como lidas."""
        from django.utils import timezone
        count = self.get_queryset().filter(read=False).update(
            read=True,
            read_at=timezone.now()
        )
        return Response({"marked_count": count})

    @action(detail=True, methods=["post"], url_path="dismiss-box")
    def dismiss_box_notifications(self, request, pk=None) -> "Response":
        """Desativa notificações de uma caixinha específica."""
        # Por enquanto, apenas marca como lida
        # Futuro: criar tabela de preferências de notificação
        notification = self.get_object()
        if notification.related_box:
            # Marcar todas as notificações desta caixinha como lidas
            count = self.get_queryset().filter(
                related_box=notification.related_box,
                read=False
            ).update(
                read=True,
                read_at=timezone.now()
            )
            return Response({"marked_count": count})
        return Response({"error": "Notificação não está relacionada a uma caixinha"}, status=status.HTTP_400_BAD_REQUEST)

