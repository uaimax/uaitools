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
from apps.supbrainnote.models import Box, Note, BoxShare, BoxShareInvite
from apps.supbrainnote.serializers import (
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
)
from apps.supbrainnote.services.query import QueryService
from apps.supbrainnote.services.transcription import TranscriptionService
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
                    from apps.supbrainnote.services.email import send_box_invite_email
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

        notes_queryset = Note.objects.filter(
            workspace=workspace,
            processing_status="completed",
            transcript__isnull=False,
        ).exclude(transcript="")

        # Filtrar por caixinha se fornecido
        if box_id:
            notes_queryset = notes_queryset.filter(box_id=box_id)

        notes_list = []

        # Estratégia de busca em camadas (do mais específico para o mais genérico)

        # 1. Busca exata (case-insensitive) - melhor para nomes próprios como "UAIZOUK"
        question_lower = question.lower()
        exact_match_queryset = notes_queryset.filter(
            transcript__icontains=question_lower
        )[:limit]
        notes_list = list(exact_match_queryset)

        # 2. Se não encontrou, buscar por nome de caixinha mencionado na pergunta
        if not notes_list:
            try:
                # Buscar caixinhas do workspace que possam estar mencionadas na pergunta
                boxes = Box.objects.filter(workspace=workspace)
                for box in boxes:
                    box_name_lower = box.name.lower()
                    # Verificar se o nome da caixinha está na pergunta
                    if box_name_lower in question_lower or question_lower in box_name_lower:
                        # Buscar notas dessa caixinha
                        box_notes = notes_queryset.filter(box_id=box.id)[:limit]
                        notes_list = list(box_notes)
                        if notes_list:
                            break
            except Exception:
                pass

        # 3. Se ainda não encontrou, tentar busca com similaridade trigram (pg_trgm)
        # Isso é melhor para encontrar variações como "UAIZOUK" vs "Aizouki"
        if not notes_list:
            try:
                from django.contrib.postgres.lookups import TrigramSimilarity

                trigram_queryset = notes_queryset.annotate(
                    similarity=TrigramSimilarity('transcript', question)
                ).filter(
                    similarity__gt=0.05  # Threshold mais baixo para capturar mais variações
                ).order_by('-similarity')[:limit]

                notes_list = list(trigram_queryset)
            except Exception:
                # Se pg_trgm não estiver disponível, continua
                pass

        # 4. Se ainda não encontrou, tentar full-text search (pode ser restritiva para nomes próprios)
        if not notes_list:
            try:
                from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

                # Usar full-text search nativo do PostgreSQL
                # Config 'portuguese' para melhor suporte ao português
                search_vector = SearchVector('transcript', config='portuguese')
                search_query = SearchQuery(question, config='portuguese')

                fts_queryset = notes_queryset.annotate(
                    search=search_vector,
                    rank=SearchRank(search_vector, search_query)
                ).filter(
                    search=search_query
                ).order_by('-rank')[:limit]

                notes_list = list(fts_queryset)
            except Exception as e:
                # Log do erro mas continua funcionando
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Full-text search não disponível, usando fallback: {e}")

        # 5. Fallback: busca simples por palavras-chave (case-insensitive)
        if not notes_list:
            question_words = [w for w in question_lower.split() if len(w) > 2]  # Ignorar palavras muito curtas
            if question_words:
                for note in notes_queryset[:limit * 3]:  # Buscar em mais notas
                    transcript_lower = note.transcript.lower()
                    # Contar quantas palavras da pergunta aparecem na transcrição
                    matches = sum(1 for word in question_words if word in transcript_lower)
                    if matches > 0:
                        notes_list.append(note)
                    if len(notes_list) >= limit:
                        break

        # 6. Se ainda não encontrou nada, retornar últimas anotações (fallback final)
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

