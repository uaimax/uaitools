"""ViewSets for supbrainnote app."""

import os
import tempfile
from typing import TYPE_CHECKING

from django.db import models
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import WorkspaceObjectPermission
from apps.core.viewsets import WorkspaceViewSet
from apps.supbrainnote.models import Box, Note
from apps.supbrainnote.serializers import (
    BoxListSerializer,
    BoxSerializer,
    NoteListSerializer,
    NoteMoveSerializer,
    NoteSerializer,
    NoteUploadSerializer,
    QuerySerializer,
)
from apps.supbrainnote.services.query import QueryService
from apps.supbrainnote.tasks import classify_note, transcribe_audio
from apps.supbrainnote.throttles import SupBrainNoteQueryThrottle, SupBrainNoteUploadThrottle

if TYPE_CHECKING:
    from apps.accounts.models import Workspace
    from rest_framework.request import Request


def get_or_create_workspace_for_user(request: "Request") -> "Workspace | None":
    """Obtém ou cria workspace para o usuário.

    Segue a mesma lógica do WorkspaceViewSet.perform_create:
    1. Tenta usar request.workspace (do middleware)
    2. Se não houver, tenta usar user.workspace
    3. Se for super admin e não houver workspace, cria automaticamente
    4. Retorna None se nenhum workspace foi encontrado/criado

    Args:
        request: Request HTTP com user autenticado

    Returns:
        Workspace ou None se não foi possível obter/criar
    """
    from apps.accounts.models import Workspace
    from django.utils.text import slugify
    import logging

    logger = logging.getLogger("apps.supbrainnote")

    workspace: "Workspace | None" = getattr(request, "workspace", None)

    # Se não há workspace no request, tentar usar o workspace do usuário
    if not workspace and hasattr(request, "user") and request.user.is_authenticated:
        user = request.user
        if hasattr(user, "workspace") and user.workspace:
            workspace = user.workspace
            logger.debug(f"[get_or_create_workspace] Usando workspace do usuário: {workspace.id} ({workspace.slug})")

    # Se ainda não há workspace e é super admin, criar workspace exclusivo
    if not workspace and hasattr(request, "user") and request.user.is_authenticated:
        is_superuser = getattr(request.user, "is_superuser", False)
        if is_superuser:
            user_email = request.user.email
            workspace_name = f"Super Admin - {user_email}"
            workspace_slug = slugify(f"super-admin-{user_email.split('@')[0]}")

            # Tentar obter workspace existente ou criar novo
            workspace, created = Workspace.objects.get_or_create(
                slug=workspace_slug,
                defaults={
                    "name": workspace_name,
                    "is_active": True,
                    "email": user_email,
                }
            )

            if created:
                logger.info(f"[get_or_create_workspace] Workspace criado automaticamente para super admin: {workspace.id} ({workspace.slug})")
            else:
                logger.debug(f"[get_or_create_workspace] Workspace existente encontrado para super admin: {workspace.id} ({workspace.slug})")

            # Associar workspace ao usuário se não estiver associado
            if hasattr(user, "workspace") and not user.workspace:
                user.workspace = workspace
                user.save(update_fields=["workspace"])
                logger.info(f"[get_or_create_workspace] Workspace associado ao usuário: {workspace.id}")

    return workspace


class BoxViewSet(WorkspaceViewSet):
    """ViewSet para caixinhas."""

    queryset = Box.objects.all()
    serializer_class = BoxSerializer
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_serializer_class(self) -> type[BoxSerializer | BoxListSerializer]:
        """Retorna serializer apropriado para a ação."""
        if self.action == "list":
            return BoxListSerializer
        return BoxSerializer


class NoteViewSet(WorkspaceViewSet):
    """ViewSet para anotações."""

    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["transcript"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self) -> type[NoteSerializer | NoteListSerializer]:
        """Retorna serializer apropriado para a ação."""
        if self.action == "list":
            return NoteListSerializer
        return NoteSerializer

    def get_queryset(self) -> models.QuerySet[Note]:
        """Retorna queryset filtrado por workspace e com filtros opcionais."""
        queryset = super().get_queryset()

        # Filtro por caixinha
        box_id = self.request.query_params.get("box")
        if box_id:
            queryset = queryset.filter(box_id=box_id)

        # Filtro por inbox (sem caixinha)
        inbox = self.request.query_params.get("inbox")
        if inbox == "true":
            queryset = queryset.filter(box__isnull=True)

        # Filtro por status
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(processing_status=status_param)

        return queryset

    @action(
        detail=False,
        methods=["post"],
        url_path="upload",
        throttle_classes=[SupBrainNoteUploadThrottle],
    )
    def upload_audio(self, request: "Request") -> Response:
        """Endpoint para upload de áudio.

        Rate limit: 10 uploads/hora por workspace.
        """
        import logging
        import sentry_sdk
        logger = logging.getLogger("apps.supbrainnote")

        # Log de entrada detalhado
        logger.info(f"[UPLOAD] Iniciando upload - user={request.user.id}, workspace={getattr(request, 'workspace', None)}")
        logger.info(f"[UPLOAD] Request data keys: {list(request.data.keys())}")
        logger.info(f"[UPLOAD] Files: {list(request.FILES.keys()) if request.FILES else 'None'}")

        # Obter ou criar workspace (cria automaticamente para super admins)
        workspace = get_or_create_workspace_for_user(request)

        # Se ainda não há workspace, retornar erro
        if not workspace:
            from rest_framework.exceptions import ValidationError
            workspace_id = request.headers.get("X-Workspace-ID", "").strip()
            error_message = (
                f"Workspace é obrigatório. Configure o header X-Workspace-ID ou associe um workspace ao usuário. "
                f"Header recebido: '{workspace_id}'"
            )
            logger.error(f"[UPLOAD] {error_message}")
            sentry_sdk.capture_message(f"Upload failed: workspace not found - {workspace_id}", level="error")
            raise ValidationError({"workspace": error_message})

        serializer = NoteUploadSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            logger.error(f"[UPLOAD] Validação falhou: {serializer.errors}")
            sentry_sdk.capture_message(f"Upload validation failed: {serializer.errors}", level="warning")
        serializer.is_valid(raise_exception=True)

        logger.info(f"[UPLOAD] Dados validados: source_type={serializer.validated_data.get('source_type')}, box_id={serializer.validated_data.get('box_id')}")

        # Criar anotação
        # Se houver erro ao salvar no storage (ex: rate limit R2), o storage fará fallback automático
        try:
            logger.info(f"[UPLOAD] Criando Note com workspace_id={workspace.id}")
            note = Note.objects.create(
                workspace=workspace,
                audio_file=serializer.validated_data["audio_file"],
                source_type=serializer.validated_data.get("source_type", "memo"),
                processing_status="pending",
            )
            logger.info(f"[UPLOAD] Note criada com sucesso: id={note.id}")
        except Exception as e:
            # Se ainda assim falhar, logar e re-raise
            logger.error(f"[UPLOAD] Erro ao criar anotação: {str(e)}", exc_info=True)
            sentry_sdk.capture_exception(e)
            raise

        # Se box_id foi fornecido, associar
        box_id = serializer.validated_data.get("box_id")
        if box_id:
            try:
                box = Box.objects.get(id=box_id, workspace=workspace)
                note.box = box
                note.save(update_fields=["box"])
            except Box.DoesNotExist:
                pass  # Se não encontrar, deixa sem caixinha

        # Disparar transcrição
        transcribe_audio.delay(str(note.id))

        # Retornar anotação criada
        response_serializer = NoteSerializer(note, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=False,
        methods=["post"],
        url_path="record",
        throttle_classes=[SupBrainNoteUploadThrottle],
    )
    def record_audio(self, request: "Request") -> Response:
        """Endpoint para gravação direta (blob de áudio).

        Rate limit: 10 gravações/hora por workspace.
        """
        # Por enquanto, usar mesmo fluxo de upload
        # Frontend deve converter blob para File antes de enviar
        return self.upload_audio(request)

    @action(detail=True, methods=["post"], url_path="move")
    def move_to_box(self, request: "Request", pk: str | None = None) -> Response:
        """Move anotação para outra caixinha."""
        # Obter ou criar workspace (cria automaticamente para super admins)
        workspace = get_or_create_workspace_for_user(request)

        # Se ainda não há workspace, retornar erro
        if not workspace:
            from rest_framework.exceptions import ValidationError
            workspace_id = request.headers.get("X-Workspace-ID", "").strip()
            error_message = (
                f"Workspace é obrigatório. Configure o header X-Workspace-ID ou associe um workspace ao usuário. "
                f"Header recebido: '{workspace_id}'"
            )
            raise ValidationError({"workspace": error_message})

        note = self.get_object()
        serializer = NoteMoveSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        box_id = serializer.validated_data.get("box_id")
        if box_id:
            try:
                box = Box.objects.get(id=box_id, workspace=workspace)
                note.box = box
            except Box.DoesNotExist:
                return Response(
                    {"error": "Caixinha não encontrada"}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Mover para inbox
            note.box = None

        note.save(update_fields=["box"])

        response_serializer = NoteSerializer(note, context={"request": request})
        return Response(response_serializer.data)


class QueryViewSet(viewsets.ViewSet):
    """ViewSet para consultas com IA."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [SupBrainNoteQueryThrottle]

    @action(detail=False, methods=["post"], url_path="ask")
    def ask(self, request: "Request") -> Response:
        """Consulta inteligente: 'O que já foi dito sobre X?'

        Rate limit: 50 consultas/hora por workspace.
        """
        serializer = QuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question = serializer.validated_data["question"]
        box_id = serializer.validated_data.get("box_id")
        limit = serializer.validated_data.get("limit", 10)

        # Buscar anotações relevantes
        workspace = getattr(request, "workspace", None)
        if not workspace:
            return Response(
                {"error": "Workspace não disponível"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Usar busca full-text do PostgreSQL para melhor performance
        from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

        notes_queryset = Note.objects.filter(
            workspace=workspace,
            processing_status="completed",
            transcript__isnull=False,
        ).exclude(transcript="")

        # Filtrar por caixinha se fornecido
        if box_id:
            notes_queryset = notes_queryset.filter(box_id=box_id)

        # Busca full-text usando PostgreSQL tsvector (nativo)
        # Isso é muito mais rápido que buscar em Python
        try:
            # Usar full-text search nativo do PostgreSQL
            # Config 'portuguese' para melhor suporte ao português
            search_vector = SearchVector('transcript', config='portuguese')
            search_query = SearchQuery(question, config='portuguese')

            notes_queryset = notes_queryset.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(
                search=search_query
            ).order_by('-rank')[:limit]

            notes_list = list(notes_queryset)

            # Se não encontrou nada, tentar busca com similaridade trigram (pg_trgm)
            if not notes_list:
                try:
                    from django.contrib.postgres.lookups import TrigramSimilarity

                    # Buscar notas com similaridade > 0.1 (ajustável)
                    notes_queryset = Note.objects.filter(
                        workspace=workspace,
                        processing_status="completed",
                        transcript__isnull=False,
                    ).exclude(transcript="")

                    if box_id:
                        notes_queryset = notes_queryset.filter(box_id=box_id)

                    notes_queryset = notes_queryset.annotate(
                        similarity=TrigramSimilarity('transcript', question)
                    ).filter(
                        similarity__gt=0.1  # Threshold de similaridade
                    ).order_by('-similarity')[:limit]

                    notes_list = list(notes_queryset)
                except Exception:
                    # Se pg_trgm não estiver disponível, continua
                    pass
        except Exception as e:
            # Fallback para busca simples se extensão não estiver disponível
            # Log do erro mas continua funcionando
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Full-text search não disponível, usando fallback: {e}")

            # Busca simples por palavras-chave (fallback)
            question_words = question.lower().split()
            notes_list = []
            for note in notes_queryset[:limit * 2]:
                if any(word in note.transcript.lower() for word in question_words):
                    notes_list.append(note)
                if len(notes_list) >= limit:
                    break

        # Se ainda não encontrou nada, retornar últimas anotações
        if not notes_list:
            notes_list = list(notes_queryset[:limit])

        # Preparar dados para serviço
        notes_data = [
            {
                "id": str(note.id),
                "transcript": note.transcript,
                "created_at": note.created_at.strftime("%d/%m/%Y"),
                "box_name": note.box.name if note.box else "Inbox",
            }
            for note in notes_list
        ]

        # Consultar IA
        query_service = QueryService()
        if not query_service.is_available():
            return Response(
                {"error": "Serviço de consulta não disponível"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            result = query_service.query(question, notes_data, str(workspace.id))
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Erro ao consultar IA: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

