"""ViewSets for bau_mental app."""

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
from apps.bau_mental.models import Box, Note, BoxShare, BoxShareInvite, Thread, ThreadMessage
from apps.bau_mental.serializers import (
    BoxListSerializer,
    BoxSerializer,
    BoxShareSerializer,
    BoxShareInviteSerializer,
    BoxShareCreateSerializer,
    NoteListSerializer,
    NoteMoveSerializer,
    NoteSerializer,
    NoteUploadSerializer,
    QuerySerializer,
    ThreadSerializer,
    ThreadListSerializer,
    ThreadCreateSerializer,
    ThreadMessageSerializer,
    ThreadMessageCreateSerializer,
)
from apps.bau_mental.services.query import QueryService
from apps.bau_mental.services.transcription import TranscriptionService
from apps.bau_mental.tasks import classify_note, transcribe_audio
from apps.bau_mental.throttles import BauMentalQueryThrottle, BauMentalUploadThrottle

if TYPE_CHECKING:
    from apps.accounts.models import Workspace
    from rest_framework.request import Request

from apps.bau_mental.utils import get_or_create_workspace_for_user


class BoxViewSet(WorkspaceViewSet):
    """ViewSet para caixinhas."""

    queryset = Box.objects.all()
    serializer_class = BoxSerializer
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    @action(detail=True, methods=["post"], url_path="summarize")
    def summarize_box(self, request: "Request", pk: str | None = None) -> Response:
        """Gera resumo de caixinha."""
        from apps.bau_mental.services.query import QueryService

        box = self.get_object()
        workspace = box.workspace

        # Buscar todas as notas da caixinha
        notes = Note.objects.filter(
            workspace=workspace,
            box=box,
            processing_status="completed",
            transcript__isnull=False,
        ).exclude(transcript="")

        if not notes.exists():
            return Response(
                {"error": "Nenhuma nota encontrada na caixinha"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Preparar dados
        notes_data = [
            {
                "id": str(note.id),
                "transcript": note.transcript or "",
                "created_at": note.created_at.strftime("%d/%m/%Y"),
                "box_name": box.name,
            }
            for note in notes[:50]  # Limitar a 50 notas
        ]

        # Consultar IA para gerar resumo
        query_service = QueryService()
        if not query_service.is_available():
            return Response(
                {"error": "Serviço de consulta não disponível"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            question = f"Faça um resumo completo e organizado de tudo que foi discutido ou mencionado sobre '{box.name}'. Inclua pontos principais, decisões, ideias e contexto temporal quando relevante."
            result = query_service.query(question, notes_data, str(workspace.id))

            return Response(
                {
                    "summary": result["answer"],
                    "sources": result.get("sources", []),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Erro ao gerar resumo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get_serializer_class(self) -> type[BoxSerializer | BoxListSerializer]:
        """Retorna serializer apropriado para a ação."""
        if self.action == "list":
            return BoxListSerializer
        return BoxSerializer

    def perform_destroy(self, instance: Box) -> None:
        """Soft delete da caixinha e de todas as notas associadas.

        Quando uma caixinha é deletada:
        1. Faz soft delete de todas as notas da caixinha
        2. Faz soft delete da caixinha

        Isso evita notas órfãs e mantém consistência.
        """
        from django.utils import timezone

        # Soft delete de todas as notas da caixinha
        notes_to_delete = Note.objects.filter(box=instance)
        notes_count = notes_to_delete.count()

        if notes_count > 0:
            notes_to_delete.update(deleted_at=timezone.now())

        # Soft delete da caixinha
        instance.soft_delete()

    @action(detail=True, methods=["post"], url_path="share")
    def share_box(self, request: "Request", pk: str | None = None) -> Response:
        """Compartilha caixinha com usuário ou envia convite por email."""
        from apps.accounts.models import User
        from django.utils import timezone
        from datetime import timedelta

        box = self.get_object()
        serializer = BoxShareCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data.get("user_id")
        email = serializer.validated_data.get("email")
        permission = serializer.validated_data.get("permission", "read")

        # Se user_id foi fornecido, criar compartilhamento direto
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                # Verificar se já existe compartilhamento
                share, created = BoxShare.objects.get_or_create(
                    box=box,
                    shared_with=user,
                    defaults={
                        "permission": permission,
                        "invited_by": request.user,
                        "status": "accepted",
                        "accepted_at": timezone.now(),
                    },
                )
                if not created:
                    # Atualizar permissão se já existe
                    share.permission = permission
                    share.save(update_fields=["permission"])

                response_serializer = BoxShareSerializer(share, context={"request": request})
                return Response(response_serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response(
                    {"error": "Usuário não encontrado"}, status=status.HTTP_404_NOT_FOUND
                )

        # Se email foi fornecido, criar convite pendente
        if email:
            # Verificar se usuário com esse email já existe
            try:
                user = User.objects.get(email=email.lower().strip())
                # Criar compartilhamento direto
                share, created = BoxShare.objects.get_or_create(
                    box=box,
                    shared_with=user,
                    defaults={
                        "permission": permission,
                        "invited_by": request.user,
                        "status": "accepted",
                        "accepted_at": timezone.now(),
                    },
                )
                if not created:
                    share.permission = permission
                    share.save(update_fields=["permission"])

                response_serializer = BoxShareSerializer(share, context={"request": request})
                return Response(response_serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            except User.DoesNotExist:
                # Criar convite pendente
                invite, created = BoxShareInvite.objects.get_or_create(
                    box=box,
                    email=email.lower().strip(),
                    defaults={
                        "permission": permission,
                        "invited_by": request.user,
                        "expires_at": timezone.now() + timedelta(days=7),
                    },
                )
                if not created:
                    # Atualizar convite existente
                    invite.permission = permission
                    invite.expires_at = timezone.now() + timedelta(days=7)
                    invite.save(update_fields=["permission", "expires_at"])

                # Enviar email de convite
                try:
                    from apps.bau_mental.services.email import send_box_invite_email
                    send_box_invite_email(invite, request)
                except Exception as e:
                    # Log do erro mas não falhar a requisição
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Erro ao enviar email de convite: {e}", exc_info=True)
                    # Continuar mesmo com erro de email

                return Response(
                    {"message": "Convite enviado por email", "invite_id": str(invite.id)},
                    status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
                )

        return Response(
            {"error": "user_id ou email deve ser fornecido"}, status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=["get"], url_path="shares")
    def list_shares(self, request: "Request", pk: str | None = None) -> Response:
        """Lista compartilhamentos da caixinha."""
        box = self.get_object()
        shares = BoxShare.objects.filter(box=box)
        serializer = BoxShareSerializer(shares, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["delete"], url_path="shares/(?P<share_id>[^/.]+)")
    def remove_share(self, request: "Request", pk: str | None = None, share_id: str | None = None) -> Response:
        """Remove compartilhamento."""
        box = self.get_object()
        try:
            share = BoxShare.objects.get(id=share_id, box=box)
            share.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except BoxShare.DoesNotExist:
            return Response(
                {"error": "Compartilhamento não encontrado"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=["patch"], url_path="shares/(?P<share_id>[^/.]+)")
    def update_share(self, request: "Request", pk: str | None = None, share_id: str | None = None) -> Response:
        """Atualiza permissão de compartilhamento."""
        box = self.get_object()
        try:
            share = BoxShare.objects.get(id=share_id, box=box)
            permission = request.data.get("permission")
            if permission not in ["read", "write"]:
                return Response(
                    {"error": "Permissão inválida"}, status=status.HTTP_400_BAD_REQUEST
                )
            share.permission = permission
            share.save(update_fields=["permission"])
            serializer = BoxShareSerializer(share, context={"request": request})
            return Response(serializer.data)
        except BoxShare.DoesNotExist:
            return Response(
                {"error": "Compartilhamento não encontrado"}, status=status.HTTP_404_NOT_FOUND
            )


class NoteViewSet(WorkspaceViewSet):
    """ViewSet para anotações."""

    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]

    filter_backends = [filters.OrderingFilter]  # Removido SearchFilter, usando busca customizada
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self) -> type[NoteSerializer | NoteListSerializer]:
        """Retorna serializer apropriado para a ação."""
        if self.action == "list":
            return NoteListSerializer
        return NoteSerializer

    def get_queryset(self) -> models.QuerySet[Note]:
        """Retorna queryset filtrado por workspace e com filtros opcionais.

        Exclui automaticamente:
        - Notas deletadas (via soft delete do manager)
        - Notas de caixinhas deletadas (exceto inbox)
        """
        queryset = super().get_queryset()

        # Excluir notas de caixinhas deletadas (box existe mas foi soft-deleted)
        # Notas na inbox (box=NULL) devem aparecer normalmente
        queryset = queryset.filter(
            models.Q(box__isnull=True) |  # Inbox
            models.Q(box__deleted_at__isnull=True)  # Caixinha não deletada
        )

        # Filtro por caixinha (APLICAR PRIMEIRO conforme PRD)
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

        # Busca full-text usando websearch_to_tsquery (APLICAR DEPOIS do filtro de box)
        search_query = self.request.query_params.get("search")
        if search_query:
            try:
                from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
                from django.db.models import F

                # Usar websearch_to_tsquery para sintaxe natural
                tsquery = SearchQuery(search_query, config='portuguese', search_type='websearch')
                search_vector = SearchVector('search_vector', config='portuguese')

                queryset = queryset.annotate(
                    rank=SearchRank(search_vector, tsquery)
                ).filter(
                    search_vector=tsquery
                ).order_by('-rank', '-created_at')
            except Exception as e:
                # Fallback para busca simples se PostgreSQL não suportar
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Full-text search não disponível, usando fallback: {e}")
                queryset = queryset.filter(transcript__icontains=search_query)

        return queryset

    def perform_update(self, serializer) -> None:
        """Atualiza nota e registra última edição."""
        from django.utils import timezone

        # Atualizar rastreabilidade
        serializer.save(
            last_edited_by=self.request.user,
            last_edited_at=timezone.now(),
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="upload",
        throttle_classes=[BauMentalUploadThrottle],
    )
    def upload_audio(self, request: "Request") -> Response:
        """Endpoint para upload de áudio.

        Rate limit: 10 uploads/hora por workspace.
        """
        import logging
        import sentry_sdk
        logger = logging.getLogger("apps.bau_mental")

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
                created_by=request.user,
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
        throttle_classes=[BauMentalUploadThrottle],
    )
    def record_audio(self, request: "Request") -> Response:
        """Endpoint para gravação direta (blob de áudio).

        Rate limit: 10 gravações/hora por workspace.
        """
        # Por enquanto, usar mesmo fluxo de upload
        # Frontend deve converter blob para File antes de enviar
        return self.upload_audio(request)

    @action(detail=False, methods=["post"], url_path="create-text")
    def create_text_note(self, request: "Request") -> Response:
        """Cria nota a partir de texto (sem áudio).
        
        Aceita texto direto e processa classificação normalmente.
        """
        workspace = get_or_create_workspace_for_user(request)
        if not workspace:
            from rest_framework.exceptions import ValidationError
            workspace_id = request.headers.get("X-Workspace-ID", "").strip()
            error_message = (
                f"Workspace é obrigatório. Configure o header X-Workspace-ID ou associe um workspace ao usuário. "
                f"Header recebido: '{workspace_id}'"
            )
            raise ValidationError({"workspace": error_message})

        text = request.data.get("text", "").strip()
        if not text:
            return Response(
                {"error": "text é obrigatório"}, status=status.HTTP_400_BAD_REQUEST
            )

        box_id = request.data.get("box_id")
        box = None
        if box_id:
            try:
                box = Box.objects.get(id=box_id, workspace=workspace)
            except Box.DoesNotExist:
                pass  # Se não encontrar, deixa sem caixinha (vai para Inbox)

        # Criar nota sem áudio
        note = Note.objects.create(
            workspace=workspace,
            transcript=text,
            source_type="memo",
            processing_status="completed",  # Texto já está "transcrito"
            created_by=request.user,
            box=box,
        )

        # Disparar classificação se não tiver caixinha
        if not box:
            classify_note.delay(str(note.id))

        response_serializer = NoteSerializer(note, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="upload-file")
    def upload_file(self, request: "Request") -> Response:
        """Upload de arquivo (txt, md, pdf, docx, etc) para caixinha.
        
        Aceita file (multipart) e box_id (opcional).
        Processa arquivo e cria nota(s) baseado em opções de processamento.
        """
        workspace = get_or_create_workspace_for_user(request)
        if not workspace:
            from rest_framework.exceptions import ValidationError
            workspace_id = request.headers.get("X-Workspace-ID", "").strip()
            error_message = (
                f"Workspace é obrigatório. Configure o header X-Workspace-ID ou associe um workspace ao usuário. "
                f"Header recebido: '{workspace_id}'"
            )
            raise ValidationError({"workspace": error_message})

        if "file" not in request.FILES:
            return Response(
                {"error": "Arquivo não fornecido"}, status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES["file"]
        box_id = request.data.get("box_id")
        processing_mode = request.data.get("processing_mode", "single")

        box = None
        if box_id:
            try:
                box = Box.objects.get(id=box_id, workspace=workspace)
            except Box.DoesNotExist:
                pass

        # Ler conteúdo do arquivo
        try:
            # Por enquanto, suportar apenas arquivos de texto
            # PDF e DOCX requerem bibliotecas adicionais (futuro)
            content = file.read().decode("utf-8")
        except UnicodeDecodeError:
            return Response(
                {"error": "Arquivo não é texto válido (UTF-8)"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Erro ao ler arquivo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Processar baseado no modo
        notes_created = []
        if processing_mode == "single":
            # Uma nota grande
            note = Note.objects.create(
                workspace=workspace,
                transcript=content,
                source_type="memo",
                processing_status="completed",
                created_by=request.user,
                box=box,
            )
            notes_created.append(note)
        elif processing_mode == "split_paragraphs":
            # Dividir por parágrafos
            paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
            for para in paragraphs:
                note = Note.objects.create(
                    workspace=workspace,
                    transcript=para,
                    source_type="memo",
                    processing_status="completed",
                    created_by=request.user,
                    box=box,
                )
                notes_created.append(note)
        elif processing_mode == "split_lines":
            # Dividir por linhas
            lines = [l.strip() for l in content.split("\n") if l.strip()]
            for line in lines:
                note = Note.objects.create(
                    workspace=workspace,
                    transcript=line,
                    source_type="memo",
                    processing_status="completed",
                    created_by=request.user,
                    box=box,
                )
                notes_created.append(note)

        # Disparar classificação para notas sem caixinha
        for note in notes_created:
            if not note.box:
                classify_note.delay(str(note.id))

        # Retornar primeira nota (ou todas se necessário)
        if len(notes_created) == 1:
            serializer = NoteSerializer(notes_created[0], context={"request": request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            serializer = NoteSerializer(
                notes_created, many=True, context={"request": request}
            )
            return Response(
                {"notes": serializer.data, "count": len(notes_created)},
                status=status.HTTP_201_CREATED,
            )

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

    @action(detail=False, methods=["post"], url_path="summarize")
    def summarize_notes(self, request: "Request") -> Response:
        """Gera resumo de múltiplas notas."""
        from apps.bau_mental.services.query import QueryService

        workspace = get_or_create_workspace_for_user(request)
        if not workspace:
            return Response(
                {"error": "Workspace não disponível"}, status=status.HTTP_400_BAD_REQUEST
            )

        note_ids = request.data.get("note_ids", [])
        if not note_ids or not isinstance(note_ids, list):
            return Response(
                {"error": "note_ids é obrigatório e deve ser uma lista"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Buscar notas
        notes = Note.objects.filter(
            id__in=note_ids,
            workspace=workspace,
            processing_status="completed",
            transcript__isnull=False,
        ).exclude(transcript="")

        if not notes.exists():
            return Response(
                {"error": "Nenhuma nota válida encontrada"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Preparar dados
        notes_data = [
            {
                "id": str(note.id),
                "transcript": note.transcript or "",
                "created_at": note.created_at.strftime("%d/%m/%Y"),
                "box_name": note.box.name if note.box else "Inbox",
            }
            for note in notes
        ]

        # Consultar IA para gerar resumo
        query_service = QueryService()
        if not query_service.is_available():
            return Response(
                {"error": "Serviço de consulta não disponível"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            question = "Faça um resumo completo e organizado das seguintes notas. Inclua pontos principais, decisões, ideias e contexto temporal quando relevante."
            result = query_service.query(question, notes_data, str(workspace.id))

            return Response(
                {
                    "summary": result["answer"],
                    "sources": result.get("sources", []),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Erro ao gerar resumo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class QueryViewSet(viewsets.ViewSet):
    """ViewSet para consultas com IA."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [BauMentalQueryThrottle]

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

        notes_queryset = Note.objects.filter(
            workspace=workspace,
            processing_status="completed",
            transcript__isnull=False,
        ).exclude(transcript="")

        # Filtrar por caixinha PRIMEIRO (conforme PRD)
        if box_id:
            notes_queryset = notes_queryset.filter(box_id=box_id)

        # Busca full-text usando websearch_to_tsquery
        try:
            from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

            # Usar websearch_to_tsquery para sintaxe natural
            tsquery = SearchQuery(question, config='portuguese', search_type='websearch')
            search_vector = SearchVector('search_vector', config='portuguese')

            notes_queryset = notes_queryset.annotate(
                rank=SearchRank(search_vector, tsquery)
            ).filter(
                search_vector=tsquery
            ).order_by('-rank')[:limit]

            notes_list = list(notes_queryset)
        except Exception as e:
            # Fallback para busca simples se PostgreSQL não suportar
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Full-text search não disponível, usando fallback: {e}")
            # Fallback: busca simples
            notes_list = list(notes_queryset.filter(transcript__icontains=question)[:limit])
            if not notes_list:
                # Se ainda não encontrou, retornar últimas anotações
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

    @action(detail=False, methods=["post"], url_path="transcribe")
    def transcribe(self, request: "Request") -> Response:
        """Transcreve áudio sem criar nota (para perguntas).

        Este endpoint é usado apenas para transcrever áudio de perguntas,
        não cria uma nota no sistema.
        """
        if "audio_file" not in request.FILES:
            return Response(
                {"error": "Arquivo de áudio não fornecido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        audio_file = request.FILES["audio_file"]

        # Validar arquivo (mesma validação do NoteUploadSerializer)
        allowed_types = [".m4a", ".mp3", ".wav", ".ogg", ".opus", ".webm", ".aac", ".amr", ".flac", ".mpeg", ".mpga"]
        ext = audio_file.name.lower().split(".")[-1] if "." in audio_file.name else ""
        if f".{ext}" not in allowed_types:
            return Response(
                {"error": f"Tipo de arquivo não permitido. Tipos permitidos: {', '.join(allowed_types)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Tamanho máximo (50MB)
        max_size = 50 * 1024 * 1024
        if audio_file.size > max_size:
            return Response(
                {"error": f"Arquivo muito grande. Tamanho máximo: 50MB"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Salvar arquivo temporariamente
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as temp_file:
            for chunk in audio_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name

        try:
            # Transcrever usando TranscriptionService
            transcription_service = TranscriptionService()
            if not transcription_service.is_available():
                return Response(
                    {"error": "Serviço de transcrição não disponível"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            result = transcription_service.transcribe(temp_file_path, language="pt")
            transcript = result.get("text", "")

            if not transcript:
                return Response(
                    {"error": "Não foi possível transcrever o áudio"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {"transcript": transcript},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Erro ao transcrever áudio para query: {e}")
            return Response(
                {"error": f"Erro ao transcrever áudio: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            # Limpar arquivo temporário
            try:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
            except Exception:
                pass


class ThreadViewSet(WorkspaceViewSet):
    """ViewSet para threads (estilo ChatGPT)."""

    queryset = Thread.objects.all()
    serializer_class = ThreadSerializer
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title"]
    ordering_fields = ["last_message_at", "created_at"]
    ordering = ["-last_message_at"]

    def get_serializer_class(self) -> type[ThreadSerializer | ThreadListSerializer | ThreadCreateSerializer]:
        """Retorna serializer apropriado para a ação."""
        if self.action == "list":
            return ThreadListSerializer
        if self.action == "create":
            return ThreadCreateSerializer
        return ThreadSerializer

    def get_queryset(self) -> models.QuerySet[Thread]:
        """Retorna queryset filtrado por workspace e com filtros opcionais."""
        queryset = super().get_queryset()

        # Filtro por caixinha
        box_id = self.request.query_params.get("box")
        if box_id:
            queryset = queryset.filter(box_id=box_id)

        # Filtro por global
        is_global = self.request.query_params.get("global")
        if is_global == "true":
            queryset = queryset.filter(is_global=True)

        return queryset

    def create(self, request: "Request", *args, **kwargs) -> Response:
        """Cria thread usando ThreadCreateSerializer."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        thread = serializer.save()  # Chama o método create() do serializer
        
        # Serializar a thread criada para retornar
        output_serializer = ThreadSerializer(thread, context={"request": request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"], url_path="messages")
    def messages(self, request: "Request", pk: str | None = None) -> Response:
        """Lista mensagens (GET) ou adiciona mensagem (POST) à thread."""
        thread = self.get_object()
        
        # Se for GET, retornar lista de mensagens
        if request.method == "GET":
            messages = thread.messages.order_by("created_at")
            serializer = ThreadMessageSerializer(
                messages, many=True, context={"request": request}
            )
            return Response(serializer.data)
        
        # Se for POST, adicionar mensagem
        from django.utils import timezone

        serializer = ThreadMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        content = serializer.validated_data["content"]
        note_ids = serializer.validated_data.get("note_ids", [])

        # Criar mensagem do usuário
        user_message = ThreadMessage.objects.create(
            workspace=thread.workspace,
            thread=thread,
            role="user",
            content=content,
            created_by=request.user,
        )

        # Adicionar notas referenciadas se fornecidas
        if note_ids:
            notes = Note.objects.filter(id__in=note_ids, workspace=thread.workspace)
            user_message.notes_referenced.set(notes)

        # Buscar notas relevantes para contexto
        notes_queryset = Note.objects.filter(
            workspace=thread.workspace,
            processing_status="completed",
            transcript__isnull=False,
        ).exclude(transcript="")

        # Filtrar por contexto da thread (FILTRAR PRIMEIRO conforme PRD)
        box_id_for_query = None
        if thread.box:
            notes_queryset = notes_queryset.filter(box=thread.box)
            box_id_for_query = str(thread.box.id)
        elif thread.boxes.exists():
            notes_queryset = notes_queryset.filter(box__in=thread.boxes.all())
        # Se is_global, não filtrar por caixinha

        # Buscar TODAS as notas (não limitar aqui, QueryService decide contexto completo vs reduzido)
        # Ordenar por created_at (mais antiga primeiro) - ordem cronológica
        notes_list = list(notes_queryset.order_by('created_at'))

        # Preparar dados para QueryService
        notes_data = [
            {
                "id": str(note.id),
                "transcript": note.transcript or "",
                "created_at": note.created_at.strftime("%d/%m/%Y"),
                "box_name": note.box.name if note.box else "Inbox",
            }
            for note in notes_list
        ]

        # Consultar IA (QueryService decide contexto completo vs reduzido)
        query_service = QueryService()
        if not query_service.is_available():
            return Response(
                {"error": "Serviço de consulta não disponível"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            result = query_service.query(content, notes_data, str(thread.workspace.id), box_id_for_query)

            # Criar mensagem da IA
            assistant_message = ThreadMessage.objects.create(
                workspace=thread.workspace,
                thread=thread,
                role="assistant",
                content=result["answer"],
                created_by=None,  # IA não tem usuário
            )

            # Adicionar notas referenciadas
            if result.get("sources"):
                source_note_ids = [
                    source["note_id"] for source in result["sources"]
                ]
                notes = Note.objects.filter(
                    id__in=source_note_ids, workspace=thread.workspace
                )
                assistant_message.notes_referenced.set(notes)

            # Atualizar last_message_at da thread
            thread.last_message_at = timezone.now()
            
            # Se o título ainda é "Nova conversa", atualizar com a primeira mensagem
            if thread.title == "Nova conversa" or not thread.title:
                thread.title = content[:50] if len(content) > 50 else content
                thread.save(update_fields=["last_message_at", "title"])
            else:
                thread.save(update_fields=["last_message_at"])

            # Retornar ambas as mensagens
            return Response(
                {
                    "user_message": ThreadMessageSerializer(
                        user_message, context={"request": request}
                    ).data,
                    "assistant_message": ThreadMessageSerializer(
                        assistant_message, context={"request": request}
                    ).data,
                },
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"error": f"Erro ao consultar IA: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="pin")
    def pin_summary(self, request: "Request", pk: str | None = None) -> Response:
        """Fixa resposta como síntese."""
        thread = self.get_object()
        summary = request.data.get("summary", "")
        if not summary:
            return Response(
                {"error": "summary é obrigatório"}, status=status.HTTP_400_BAD_REQUEST
            )

        thread.pinned_summary = summary
        thread.save(update_fields=["pinned_summary"])

        serializer = ThreadSerializer(thread, context={"request": request})
        return Response(serializer.data)


class BoxSummaryViewSet(viewsets.ViewSet):
    """ViewSet para resumos de caixinhas."""

    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="summarize")
    def summarize_box(self, request: "Request", pk: str | None = None) -> Response:
        """Gera resumo de caixinha (com cache)."""
        from apps.bau_mental.models import Box
        from apps.bau_mental.services.query import QueryService
        from django.utils import timezone

        workspace = getattr(request, "workspace", None)
        if not workspace:
            return Response(
                {"error": "Workspace não disponível"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            box = Box.objects.get(id=pk, workspace=workspace)
        except Box.DoesNotExist:
            return Response(
                {"error": "Caixinha não encontrada"}, status=status.HTTP_404_NOT_FOUND
            )

        # Verificar cache antes de gerar
        if box.summary and not box.summary_stale:
            return Response(
                {
                    "summary": box.summary,
                    "sources": [],
                    "cached": True,
                },
                status=status.HTTP_200_OK,
            )

        # Buscar todas as notas da caixinha
        notes = Note.objects.filter(
            workspace=workspace,
            box=box,
            processing_status="completed",
            transcript__isnull=False,
        ).exclude(transcript="")

        if not notes.exists():
            return Response(
                {"error": "Nenhuma nota encontrada na caixinha"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Preparar dados
        notes_data = [
            {
                "id": str(note.id),
                "transcript": note.transcript or "",
                "created_at": note.created_at.strftime("%d/%m/%Y"),
                "box_name": box.name,
            }
            for note in notes[:50]  # Limitar a 50 notas
        ]

        # Consultar IA para gerar resumo
        query_service = QueryService()
        if not query_service.is_available():
            return Response(
                {"error": "Serviço de consulta não disponível"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            question = f"Faça um resumo completo e organizado de tudo que foi discutido ou mencionado sobre '{box.name}'. Inclua pontos principais, decisões, ideias e contexto temporal quando relevante."
            result = query_service.query(question, notes_data, str(workspace.id))

            # Salvar em cache
            box.summary = result["answer"]
            box.summary_generated_at = timezone.now()
            box.summary_stale = False
            box.save(update_fields=["summary", "summary_generated_at", "summary_stale"])

            return Response(
                {
                    "summary": result["answer"],
                    "sources": result.get("sources", []),
                    "cached": False,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": f"Erro ao gerar resumo: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

