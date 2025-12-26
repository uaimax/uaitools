# Arquitetura do Módulo SupBrainNote

> **Versão**: 1.0.0
> **Data**: 2025-01-27
> **Status**: 🏗️ Em Planejamento

---

## 🎯 Visão Geral

Módulo para organização de anotações por áudio com classificação automática em "caixinhas" (categorias) e consulta inteligente via IA.

**Principais funcionalidades:**
- Gravação de áudio (memo próprio)
- Upload de áudio (de grupos, WhatsApp, etc.)
- Transcrição automática (Whisper)
- Classificação automática em caixinhas (LLM)
- Consulta inteligente ("O que já foi dito sobre X?")
- Inbox para não-classificados

---

## 📁 Estrutura do Módulo

```
backend/apps/supbrainnote/
├── models.py              # Box, Note
├── serializers.py         # BoxSerializer, NoteSerializer, NoteListSerializer, NoteUploadSerializer
├── viewsets.py            # BoxViewSet, NoteViewSet
├── services/              # Serviços de integração
│   ├── __init__.py
│   ├── transcription.py  # TranscriptionService (Whisper)
│   ├── classification.py  # ClassificationService (LLM)
│   └── query.py           # QueryService (consulta IA)
├── tasks.py               # Celery tasks (transcribe_audio, classify_note)
├── urls.py                # Rotas da API
├── admin.py               # Django Admin
└── tests/
    ├── test_models.py
    ├── test_viewsets.py
    └── test_services.py
```

---

## 🏗️ Models

### Box (Caixinha)

```python
class Box(WorkspaceModel):
    """Caixinha (categoria) para organizar anotações."""

    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, blank=True, null=True)  # Hex color
    description = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Caixinha"
        verbose_name_plural = "Caixinhas"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["workspace", "name"]),
        ]
```

**Características:**
- Herda `WorkspaceModel` (multi-tenancy)
- Soft delete automático
- Índice em `workspace + name` para busca rápida

### Note (Anotação)

```python
class Note(WorkspaceModel):
    """Anotação criada a partir de áudio."""

    SOURCE_CHOICES = [
        ("memo", "Memo próprio"),
        ("group_audio", "Áudio de grupo"),
    ]

    PROCESSING_STATUS_CHOICES = [
        ("pending", "Pendente"),
        ("processing", "Processando"),
        ("completed", "Concluído"),
        ("failed", "Falhou"),
    ]

    # Relacionamentos
    box = models.ForeignKey(
        "supbrainnote.Box",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notes",
        verbose_name="Caixinha",
    )

    # Conteúdo
    audio_file = models.FileField(
        upload_to="supbrainnote/audios/%Y/%m/%d/",
        verbose_name="Arquivo de áudio",
    )
    transcript = models.TextField(blank=True, null=True, verbose_name="Transcrição")

    # Metadados
    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="memo",
        verbose_name="Tipo de origem",
    )
    processing_status = models.CharField(
        max_length=20,
        choices=PROCESSING_STATUS_CHOICES,
        default="pending",
        verbose_name="Status de processamento",
    )
    ai_confidence = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Confiança da IA",
        help_text="Confiança da classificação (0-1)",
    )

    # Metadados do áudio
    duration_seconds = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Duração (segundos)",
    )
    file_size_bytes = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="Tamanho do arquivo (bytes)",
    )

    # Metadados extras (JSON)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Metadados extras",
    )

    class Meta:
        verbose_name = "Anotação"
        verbose_name_plural = "Anotações"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "box", "created_at"]),
            models.Index(fields=["workspace", "processing_status"]),
            models.Index(fields=["workspace", "box", "processing_status"]),
        ]
```

**Características:**
- Herda `WorkspaceModel` (multi-tenancy)
- `box` nullable → se `None`, fica na inbox
- `processing_status` para rastrear transcrição/classificação
- Índices otimizados para queries comuns

---

## 🔄 ViewSets

### BoxViewSet

```python
class BoxViewSet(WorkspaceViewSet):
    """ViewSet para caixinhas."""

    queryset = Box.objects.all()
    serializer_class = BoxSerializer
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]
```

**Endpoints:**
- `GET /api/v1/supbrainnote/boxes/` - Lista caixinhas
- `POST /api/v1/supbrainnote/boxes/` - Cria caixinha
- `GET /api/v1/supbrainnote/boxes/{id}/` - Detalhe
- `PATCH /api/v1/supbrainnote/boxes/{id}/` - Atualiza
- `DELETE /api/v1/supbrainnote/boxes/{id}/` - Deleta (soft delete)

### NoteViewSet

```python
class NoteViewSet(WorkspaceViewSet):
    """ViewSet para anotações."""

    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["transcript"]
    ordering_fields = ["created_at", "updated_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return NoteListSerializer
        return NoteSerializer

    def get_queryset(self):
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
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(processing_status=status)

        return queryset

    @action(detail=False, methods=["post"], url_path="upload")
    def upload_audio(self, request):
        """Endpoint para upload de áudio."""
        # Implementação aqui
        pass

    @action(detail=False, methods=["post"], url_path="record")
    def record_audio(self, request):
        """Endpoint para gravação direta."""
        # Implementação aqui
        pass

    @action(detail=True, methods=["post"], url_path="move")
    def move_to_box(self, request, pk=None):
        """Move anotação para outra caixinha."""
        # Implementação aqui
        pass
```

**Endpoints:**
- `GET /api/v1/supbrainnote/notes/` - Lista anotações
- `POST /api/v1/supbrainnote/notes/` - Cria anotação
- `GET /api/v1/supbrainnote/notes/{id}/` - Detalhe
- `PATCH /api/v1/supbrainnote/notes/{id}/` - Atualiza
- `DELETE /api/v1/supbrainnote/notes/{id}/` - Deleta (soft delete)
- `POST /api/v1/supbrainnote/notes/upload/` - Upload de áudio
- `POST /api/v1/supbrainnote/notes/record/` - Gravação direta
- `POST /api/v1/supbrainnote/notes/{id}/move/` - Mover para caixinha

### QueryViewSet

```python
class QueryViewSet(viewsets.ViewSet):
    """ViewSet para consultas com IA."""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="ask")
    def ask(self, request):
        """Consulta inteligente: 'O que já foi dito sobre X?'"""
        # Implementação aqui
        pass
```

**Endpoints:**
- `POST /api/v1/supbrainnote/query/ask/` - Consulta com IA

---

## 🔧 Serviços

### TranscriptionService

```python
class TranscriptionService:
    """Serviço para transcrição de áudio usando Whisper (OpenAI)."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def transcribe(self, audio_file_path: str, language: str = "pt") -> dict:
        """Transcreve áudio usando Whisper API.

        Returns:
            {
                "text": "transcrição completa",
                "language": "pt",
                "duration": 45.2,
            }
        """
        pass
```

**Características:**
- Usa Whisper API (OpenAI)
- Suporta múltiplos idiomas
- Retorna duração do áudio
- Tratamento de erros robusto

### ClassificationService

```python
class ClassificationService:
    """Serviço para classificação automática de anotações em caixinhas."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        # Suporta OpenAI ou Anthropic

    def classify(
        self,
        transcript: str,
        available_boxes: list[dict],
        workspace_id: str,
    ) -> dict:
        """Classifica anotação em uma caixinha.

        Args:
            transcript: Texto transcrito
            available_boxes: Lista de caixinhas disponíveis
            workspace_id: ID do workspace

        Returns:
            {
                "box_id": "uuid-da-caixinha",
                "confidence": 0.85,
                "reason": "Motivo da classificação",
            }
            ou
            {
                "box_id": None,
                "confidence": 0.3,
                "reason": "Não consegui classificar",
            }
        """
        pass
```

**Características:**
- Usa LLM (GPT-4 ou Claude)
- Prompt estruturado com lista de caixinhas
- Retorna confiança (0-1)
- Se confiança < 0.5, retorna `None` (vai para inbox)

### QueryService

```python
class QueryService:
    """Serviço para consultas inteligentes com IA."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")

    def query(
        self,
        question: str,
        notes: list[dict],
        workspace_id: str,
    ) -> dict:
        """Responde pergunta com base nas anotações.

        Args:
            question: Pergunta do usuário
            notes: Lista de anotações relevantes (já filtradas)
            workspace_id: ID do workspace

        Returns:
            {
                "answer": "Resposta da IA",
                "sources": [
                    {
                        "note_id": "uuid",
                        "excerpt": "trecho relevante",
                        "date": "2025-01-27",
                    }
                ],
            }
        """
        pass
```

**Características:**
- Usa LLM para responder perguntas
- Inclui fontes (quais anotações foram usadas)
- Filtra anotações relevantes antes de consultar IA

---

## ⚙️ Celery Tasks

### transcribe_audio

```python
@shared_task
def transcribe_audio(note_id: str) -> dict:
    """Transcreve áudio de uma anotação.

    Args:
        note_id: ID da anotação

    Returns:
        {
            "status": "completed",
            "transcript": "texto transcrito",
            "duration": 45.2,
        }
    """
    pass
```

**Fluxo:**
1. Busca `Note` por ID
2. Atualiza status para `processing`
3. Chama `TranscriptionService.transcribe()`
4. Atualiza `Note.transcript` e `Note.duration_seconds`
5. Atualiza status para `completed`
6. Dispara `classify_note.delay(note_id)` automaticamente

### classify_note

```python
@shared_task
def classify_note(note_id: str) -> dict:
    """Classifica anotação em uma caixinha.

    Args:
        note_id: ID da anotação

    Returns:
        {
            "status": "completed",
            "box_id": "uuid-da-caixinha",
            "confidence": 0.85,
        }
    """
    pass
```

**Fluxo:**
1. Busca `Note` por ID
2. Verifica se tem `transcript` (se não, aguarda)
3. Busca caixinhas do workspace
4. Chama `ClassificationService.classify()`
5. Se confiança >= 0.5, associa à caixinha
6. Se confiança < 0.5, deixa `box=None` (inbox)
7. Atualiza `Note.ai_confidence`

---

## 📦 Storage de Áudios

### Configuração

```python
# settings/base.py
MEDIA_ROOT = BASE_DIR / "media"
MEDIA_URL = "/media/"

# Para produção (S3 futuro):
# DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
# AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
```

### Upload Path

```python
# models.py
audio_file = models.FileField(
    upload_to="supbrainnote/audios/%Y/%m/%d/",
    verbose_name="Arquivo de áudio",
)
```

**Estrutura:**
```
media/
└── supbrainnote/
    └── audios/
        └── 2025/
            └── 01/
                └── 27/
                    └── {uuid}.m4a
```

**Validação:**
- Tipos permitidos: `.m4a`, `.mp3`, `.wav`, `.ogg`
- Tamanho máximo: 50MB (configurável)
- Duração máxima: 5 minutos (MVP)

---

## 🔐 Segurança

### Validação de Uploads

```python
# viewsets.py
def validate_audio_file(file):
    """Valida arquivo de áudio."""
    # Tipo de arquivo
    allowed_types = [".m4a", ".mp3", ".wav", ".ogg"]
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in allowed_types:
        raise ValidationError("Tipo de arquivo não permitido")

    # Tamanho máximo (50MB)
    max_size = 50 * 1024 * 1024
    if file.size > max_size:
        raise ValidationError("Arquivo muito grande (máximo 50MB)")

    # Duração (validar após upload)
    # TODO: Validar duração usando ffprobe ou similar
```

### Rate Limiting

```python
# viewsets.py
from apps.core.throttles import WorkspaceRateThrottle

class NoteViewSet(WorkspaceViewSet):
    throttle_classes = [WorkspaceRateThrottle]
    throttle_scope = "supbrainnote_upload"  # Limite específico
```

**Limites sugeridos:**
- Upload: 10 uploads/hora por workspace
- Gravação: 20 gravações/hora por workspace
- Consulta: 50 consultas/hora por workspace

### Proteção de Áudios

```python
# viewsets.py
@action(detail=True, methods=["get"], url_path="audio")
def get_audio(self, request, pk=None):
    """Retorna URL assinada para download do áudio."""
    note = self.get_object()

    # Validar ownership (já feito por WorkspaceViewSet)
    # Retornar URL assinada (S3) ou URL direta (dev)
    pass
```

---

## 📊 Índices e Performance

### Índices do Banco

```python
# models.py
class Meta:
    indexes = [
        # Box
        models.Index(fields=["workspace", "name"]),

        # Note
        models.Index(fields=["workspace", "box", "created_at"]),
        models.Index(fields=["workspace", "processing_status"]),
        models.Index(fields=["workspace", "box", "processing_status"]),
        # Full-text search (PostgreSQL)
        models.Index(fields=["workspace"], name="note_transcript_gin_idx"),
    ]
```

### Full-Text Search

```python
# viewsets.py
from django.contrib.postgres.search import SearchVector

def get_queryset(self):
    queryset = super().get_queryset()

    search = self.request.query_params.get("search")
    if search:
        # PostgreSQL full-text search
        queryset = queryset.annotate(
            search=SearchVector("transcript")
        ).filter(search=search)

    return queryset
```

---

## 🔄 Fluxo de Processamento

### Upload de Áudio

```
1. Usuário faz upload → POST /api/v1/supbrainnote/notes/upload/
2. Backend valida arquivo
3. Cria Note com status="pending"
4. Retorna Note com status
5. Dispara task Celery: transcribe_audio.delay(note_id)
6. Task transcreve áudio
7. Atualiza Note.transcript
8. Dispara task: classify_note.delay(note_id)
9. Task classifica
10. Atualiza Note.box e Note.ai_confidence
11. Frontend faz polling para ver status
```

### Gravação Direta

```
1. Usuário grava → POST /api/v1/supbrainnote/notes/record/
2. Backend recebe blob de áudio
3. Salva como arquivo temporário
4. Cria Note com status="pending"
5. Mesmo fluxo de upload
```

---

## 🌐 Variáveis de Ambiente

```bash
# Transcrição (Whisper)
OPENAI_API_KEY=sk-...

# Classificação e Consulta (LLM)
OPENAI_API_KEY=sk-...  # Mesmo da transcrição
# ou
ANTHROPIC_API_KEY=sk-ant-...

# Storage (opcional, futuro)
AWS_STORAGE_BUCKET_NAME=supbrainnote-audios
AWS_S3_REGION_NAME=us-east-1

# Limites
MAX_AUDIO_FILE_SIZE_MB=50
MAX_AUDIO_DURATION_MINUTES=5
DEFAULT_TRANSCRIPTION_LANGUAGE=pt
```

---

## 📚 Próximos Passos

1. ✅ Arquitetura definida
2. ⏳ Implementar backend (models, serializers, viewsets)
3. ⏳ Implementar serviços (transcrição, classificação, consulta)
4. ⏳ Implementar Celery tasks
5. ⏳ Implementar frontend
6. ⏳ Testes completos
7. ⏳ Documentação

---

**Referências:**
- `@docs/ARCHITECTURE.md` - Decisões arquiteturais gerais
- `@backend/apps/leads/` - Exemplo de módulo
- `@backend/apps/core/models.py` - Models base
- `@backend/apps/core/viewsets.py` - ViewSets base

