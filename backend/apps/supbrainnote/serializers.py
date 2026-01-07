"""Serializers for supbrainnote app."""

from rest_framework import serializers

from apps.core.serializers import WorkspaceSerializer
from apps.supbrainnote.models import Box, Note, BoxShare, BoxShareInvite


class BoxSerializer(WorkspaceSerializer):
    """Serializer para modelo Box."""

    notes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Box
        fields = [
            "id",
            "workspace_id",
            "name",
            "color",
            "description",
            "notes_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace_id", "created_at", "updated_at", "notes_count"]


class BoxListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de caixinhas."""

    notes_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Box
        fields = [
            "id",
            "name",
            "color",
            "description",
            "notes_count",
            "created_at",
        ]


class NoteSerializer(WorkspaceSerializer):
    """Serializer para modelo Note."""

    source_type_display = serializers.CharField(source="get_source_type_display", read_only=True)
    processing_status_display = serializers.CharField(
        source="get_processing_status_display", read_only=True
    )
    box_name = serializers.CharField(source="box.name", read_only=True)
    audio_url = serializers.SerializerMethodField()
    is_in_inbox = serializers.BooleanField(read_only=True)
    days_until_expiration = serializers.SerializerMethodField()
    is_audio_expired = serializers.SerializerMethodField()
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)
    last_edited_by_email = serializers.EmailField(source="last_edited_by.email", read_only=True)

    class Meta:
        model = Note
        fields = [
            "id",
            "workspace_id",
            "box",
            "box_name",
            "audio_file",
            "audio_url",
            "transcript",
            "source_type",
            "source_type_display",
            "processing_status",
            "processing_status_display",
            "ai_confidence",
            "duration_seconds",
            "file_size_bytes",
            "metadata",
            "is_in_inbox",
            "days_until_expiration",
            "is_audio_expired",
            "created_by",
            "created_by_email",
            "last_edited_by",
            "last_edited_by_email",
            "last_edited_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
            "processing_status",
            "ai_confidence",
            "duration_seconds",
            "file_size_bytes",
            "created_by",
            "created_by_email",
            "last_edited_by",
            "last_edited_by_email",
            "last_edited_at",
        ]

    def get_audio_url(self, obj: Note) -> str | None:
        """Retorna URL do arquivo de áudio."""
        if obj.audio_file and obj.audio_file.name:
            try:
                # Obter URL do storage
                file_url = obj.audio_file.url
                request = self.context.get("request")
                if request:
                    # Se for URL relativa, construir URL absoluta
                    if file_url.startswith("/"):
                        return request.build_absolute_uri(file_url)
                    return file_url
                return file_url
            except (AttributeError, ValueError) as e:
                # Se houver erro ao obter URL, retornar None
                # Isso pode acontecer se o storage não estiver configurado corretamente
                return None
        return None

    def get_days_until_expiration(self, obj: Note) -> int:
        """Retorna quantos dias faltam para o áudio expirar."""
        return obj.days_until_expiration

    def get_is_audio_expired(self, obj: Note) -> bool:
        """Verifica se o áudio está expirado."""
        return obj.is_audio_expired


class NoteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de anotações."""

    source_type_display = serializers.CharField(source="get_source_type_display", read_only=True)
    processing_status_display = serializers.CharField(
        source="get_processing_status_display", read_only=True
    )
    box_name = serializers.CharField(source="box.name", read_only=True)
    is_in_inbox = serializers.BooleanField(read_only=True)
    transcript_preview = serializers.SerializerMethodField()

    class Meta:
        model = Note
        fields = [
            "id",
            "box",
            "box_name",
            "transcript",  # Campo completo da transcrição (frontend espera isso)
            "transcript_preview",  # Preview (mantido para compatibilidade)
            "source_type",
            "source_type_display",
            "processing_status",
            "processing_status_display",
            "ai_confidence",
            "duration_seconds",
            "is_in_inbox",
            "created_at",
        ]

    def get_transcript_preview(self, obj: Note) -> str:
        """Retorna preview da transcrição (primeiros 100 caracteres)."""
        if obj.transcript:
            return obj.transcript[:100] + "..." if len(obj.transcript) > 100 else obj.transcript
        return ""


class NoteUploadSerializer(serializers.Serializer):
    """Serializer para upload de áudio."""

    audio_file = serializers.FileField(required=True)
    box_id = serializers.UUIDField(required=False, allow_null=True)
    source_type = serializers.ChoiceField(
        choices=Note.SOURCE_CHOICES, default="memo", required=False
    )

    def validate_audio_file(self, value) -> object:
        """Valida arquivo de áudio."""
        # Tipos permitidos (whitelist)
        # Inclui formatos suportados pelo Whisper API e WhatsApp
        allowed_types = [".m4a", ".mp3", ".wav", ".ogg", ".opus", ".webm", ".aac", ".amr", ".flac", ".mpeg", ".mpga"]
        ext = value.name.lower().split(".")[-1] if "." in value.name else ""
        if f".{ext}" not in allowed_types:
            raise serializers.ValidationError(
                f"Tipo de arquivo não permitido. Tipos permitidos: {', '.join(allowed_types)}"
            )

        # Validar extensão real do arquivo (não apenas nome)
        # Por enquanto, confiamos no nome. Em produção, validar MIME type também.

        # Tamanho máximo (50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"Arquivo muito grande. Tamanho máximo: 50MB (atual: {value.size / 1024 / 1024:.2f}MB)"
            )

        # Tamanho mínimo (1KB - evitar arquivos vazios ou corrompidos)
        min_size = 1024  # 1KB
        if value.size < min_size:
            raise serializers.ValidationError(
                "Arquivo muito pequeno. O arquivo pode estar corrompido."
            )

        return value


class NoteMoveSerializer(serializers.Serializer):
    """Serializer para mover anotação para outra caixinha."""

    box_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_box_id(self, value) -> object:
        """Valida se caixinha existe e pertence ao workspace."""
        if value is None:
            return value  # Permite None (mover para inbox)

        request = self.context.get("request")
        if not request:
            raise serializers.ValidationError("Request não disponível no contexto")

        workspace = getattr(request, "workspace", None)
        if not workspace:
            raise serializers.ValidationError("Workspace não disponível no request")

        try:
            box = Box.objects.get(id=value, workspace=workspace)
            return value
        except Box.DoesNotExist:
            raise serializers.ValidationError("Caixinha não encontrada ou não pertence ao workspace")


class QuerySerializer(serializers.Serializer):
    """Serializer para consulta com IA."""

    question = serializers.CharField(
        required=True,
        max_length=500,
        min_length=3,
        help_text="Pergunta sobre as anotações",
        trim_whitespace=True,
    )
    box_id = serializers.UUIDField(required=False, allow_null=True)
    limit = serializers.IntegerField(default=10, min_value=1, max_value=50, required=False)

    def validate_question(self, value: str) -> str:
        """Sanitiza e valida a pergunta."""
        # Remover caracteres perigosos (básico)
        # Em produção, usar biblioteca de sanitização mais robusta
        value = value.strip()

        # Validar que não é apenas espaços ou caracteres especiais
        if len(value.replace(" ", "")) < 3:
            raise serializers.ValidationError(
                "Pergunta deve ter pelo menos 3 caracteres."
            )

        return value


class BoxShareSerializer(serializers.ModelSerializer):
    """Serializer para compartilhamento de caixinha."""

    shared_with_email = serializers.EmailField(source="shared_with.email", read_only=True)
    invited_by_email = serializers.EmailField(source="invited_by.email", read_only=True)
    box_name = serializers.CharField(source="box.name", read_only=True)

    class Meta:
        model = BoxShare
        fields = [
            "id",
            "box",
            "box_name",
            "shared_with",
            "shared_with_email",
            "permission",
            "invited_by",
            "invited_by_email",
            "status",
            "created_at",
            "accepted_at",
        ]
        read_only_fields = ["id", "invited_by", "created_at", "accepted_at"]


class BoxShareInviteSerializer(serializers.Serializer):
    """Serializer para convite de caixinha por email."""

    email = serializers.EmailField(required=True)
    permission = serializers.ChoiceField(
        choices=BoxShare.PERMISSION_CHOICES,
        default="read",
        required=False,
    )

    def validate_email(self, value: str) -> str:
        """Valida email."""
        # Normalizar email
        return value.lower().strip()


class BoxShareCreateSerializer(serializers.Serializer):
    """Serializer para criar compartilhamento."""

    user_id = serializers.UUIDField(required=False)
    email = serializers.EmailField(required=False)
    permission = serializers.ChoiceField(
        choices=BoxShare.PERMISSION_CHOICES,
        default="read",
        required=False,
    )

    def validate(self, attrs: dict) -> dict:
        """Valida que user_id ou email foi fornecido."""
        if not attrs.get("user_id") and not attrs.get("email"):
            raise serializers.ValidationError("user_id ou email deve ser fornecido.")
        return attrs

