"""Serializers for supbrainnote app."""

from rest_framework import serializers

from apps.core.serializers import WorkspaceSerializer
from apps.supbrainnote.models import Box, Note


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
        ]

    def get_audio_url(self, obj: Note) -> str | None:
        """Retorna URL do arquivo de áudio."""
        if obj.audio_file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
            return obj.audio_file.url
        return None


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
            "transcript_preview",
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
        allowed_types = [".m4a", ".mp3", ".wav", ".ogg", ".webm"]
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

