# bau_mental App — Análise do Módulo

> **Última atualização**: 2025-01-27
> **Domínio**: Organização de anotações por áudio com IA
> **Status**: ✅ Ativo
> **Zona**: 🟢 VERDE (desenvolvimento normal)

---

## 🎯 Visão Geral

O app `bau_mental` é um módulo completo para organização de anotações por áudio com classificação automática em "caixinhas" (categorias) e consulta inteligente via IA.

**Funcionalidades principais:**
- Gravação de áudio (memo próprio)
- Upload de áudio (de grupos, WhatsApp, etc.)
- Transcrição automática (Whisper API)
- Classificação automática em caixinhas (LLM)
- Consulta inteligente ("O que já foi dito sobre X?")
- Inbox para não-classificados

---

## 📁 Estrutura

```
apps/bau_mental/
├── models.py              # Box, Note
├── serializers.py         # BoxSerializer, NoteSerializer, NoteListSerializer, NoteUploadSerializer
├── viewsets.py            # BoxViewSet, NoteViewSet, QueryViewSet
├── services/              # Serviços de integração
│   ├── transcription.py   # TranscriptionService (Whisper)
│   ├── classification.py  # ClassificationService (LLM)
│   └── query.py           # QueryService (consulta IA)
├── tasks.py               # Celery tasks (transcribe_audio, classify_note)
├── throttles.py           # Rate limiting customizado
├── urls.py                # Rotas da API
├── admin.py               # Django Admin
└── tests/                 # Testes
    ├── test_models.py
    └── test_viewsets.py
```

---

## 🏗️ Modelos Principais

### Box (Caixinha)

```python
class Box(WorkspaceModel):
    """Caixinha (categoria) para organizar anotações."""

    name = models.CharField(max_length=255)
    color = models.CharField(max_length=7, blank=True, null=True)  # Hex color
    description = models.TextField(blank=True, null=True)
```

**Características:**
- Herda `WorkspaceModel` (multi-tenancy)
- Soft delete automático
- Propriedade `notes_count` para contagem de anotações

### Note (Anotação)

```python
class Note(WorkspaceModel):
    """Anotação criada a partir de áudio."""

    box = models.ForeignKey(Box, null=True, blank=True)  # Null = inbox
    audio_file = models.FileField(upload_to=audio_upload_path)
    transcript = models.TextField(blank=True, null=True)
    source_type = models.CharField(choices=SOURCE_CHOICES)
    processing_status = models.CharField(choices=PROCESSING_STATUS_CHOICES)
    ai_confidence = models.FloatField(null=True, blank=True)
    duration_seconds = models.FloatField(null=True, blank=True)
    file_size_bytes = models.IntegerField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
```

**Características:**
- Herda `WorkspaceModel` (multi-tenancy)
- `box` nullable → se `None`, fica na inbox
- `processing_status` para rastrear transcrição/classificação
- Propriedade `is_in_inbox` para verificar se está sem caixinha

---

## 🔄 ViewSets

### BoxViewSet

**Endpoints:**
- `GET /api/v1/bau-mental/boxes/` - Lista caixinhas
- `POST /api/v1/bau-mental/boxes/` - Cria caixinha
- `GET /api/v1/bau-mental/boxes/{id}/` - Detalhe
- `PATCH /api/v1/bau-mental/boxes/{id}/` - Atualiza
- `DELETE /api/v1/bau-mental/boxes/{id}/` - Deleta (soft delete)

### NoteViewSet

**Endpoints:**
- `GET /api/v1/bau-mental/notes/` - Lista anotações
- `POST /api/v1/bau-mental/notes/upload/` - Upload de áudio (rate limit: 10/hora)
- `POST /api/v1/bau-mental/notes/record/` - Gravação direta (rate limit: 10/hora)
- `POST /api/v1/bau-mental/notes/{id}/move/` - Mover para caixinha
- `GET /api/v1/bau-mental/notes/{id}/` - Detalhe
- `PATCH /api/v1/bau-mental/notes/{id}/` - Atualiza
- `DELETE /api/v1/bau-mental/notes/{id}/` - Deleta (soft delete)

**Filtros:**
- `?box={id}` - Filtrar por caixinha
- `?inbox=true` - Filtrar inbox (sem caixinha)
- `?status={status}` - Filtrar por status
- `?search={query}` - Busca full-text na transcrição

### QueryViewSet

**Endpoints:**
- `POST /api/v1/bau-mental/query/ask/` - Consulta com IA (rate limit: 50/hora)

---

## 🔧 Serviços

### TranscriptionService

**Responsabilidade:** Transcrição de áudio usando Whisper API (OpenAI).

**Método principal:**
```python
def transcribe(audio_file_path: str, language: str = "pt") -> dict
```

**Retorna:**
```python
{
    "text": "transcrição completa",
    "language": "pt",
    "duration": 45.2,  # Pode ser None
}
```

### ClassificationService

**Responsabilidade:** Classificação automática de anotações em caixinhas usando LLM.

**Método principal:**
```python
def classify(transcript: str, available_boxes: list[dict], workspace_id: str) -> dict
```

**Retorna:**
```python
{
    "box_id": "uuid-da-caixinha" ou None,
    "confidence": 0.85,  # 0-1
    "reason": "Motivo da classificação",
}
```

**Lógica:**
- Se confiança >= 0.5, associa à caixinha
- Se confiança < 0.5, retorna `None` (vai para inbox)

### QueryService

**Responsabilidade:** Consultas inteligentes com IA.

**Método principal:**
```python
def query(question: str, notes: list[dict], workspace_id: str) -> dict
```

**Retorna:**
```python
{
    "answer": "Resposta da IA",
    "sources": [
        {
            "note_id": "uuid",
            "excerpt": "trecho relevante",
            "date": "2025-01-27",
            "box_name": "Casa",
        }
    ],
}
```

---

## ⚙️ Celery Tasks

### transcribe_audio

**Responsabilidade:** Transcreve áudio de uma anotação de forma assíncrona.

**Fluxo:**
1. Busca `Note` por ID
2. Atualiza status para `processing`
3. Chama `TranscriptionService.transcribe()`
4. Atualiza `Note.transcript` e `Note.duration_seconds`
5. Atualiza status para `completed`
6. Dispara `classify_note.delay(note_id)` automaticamente

### classify_note

**Responsabilidade:** Classifica anotação em uma caixinha de forma assíncrona.

**Fluxo:**
1. Busca `Note` por ID
2. Verifica se tem `transcript` (se não, aguarda)
3. Busca caixinhas do workspace
4. Chama `ClassificationService.classify()`
5. Se confiança >= 0.5, associa à caixinha
6. Se confiança < 0.5, deixa `box=None` (inbox)
7. Atualiza `Note.ai_confidence`

---

## 🔐 Segurança

### Rate Limiting

- **Uploads:** 10 uploads/hora por workspace (`BauMentalUploadThrottle`)
- **Consultas:** 50 consultas/hora por workspace (`BauMentalQueryThrottle`)

### Validação de Uploads

- **Tipos permitidos:** `.m4a`, `.mp3`, `.wav`, `.ogg`, `.webm`
- **Tamanho máximo:** 50MB
- **Tamanho mínimo:** 1KB (evitar arquivos vazios)

### Proteção de Dados

- **Multi-tenancy:** Todos os dados filtrados por workspace
- **Ownership validation:** `WorkspaceObjectPermission` previne IDOR
- **Sanitização:** Inputs sanitizados antes de enviar para IA

---

## 📋 Convenções

### ALWAYS (Sempre Fazer)

1. **Herdar `WorkspaceModel`** para dados multi-tenant
2. **Herdar `WorkspaceViewSet`** para ViewSets
3. **Usar processamento assíncrono** para transcrição/classificação
4. **Validar uploads** antes de processar
5. **Rate limiting** em endpoints críticos
6. **Testes completos** (models, viewsets)

### NEVER (Nunca Fazer)

1. **Processar áudio síncronamente** (bloqueia request)
2. **Ignorar validação de uploads**
3. **Expor áudios sem validação de ownership**
4. **Queries sem filtro de workspace**
5. **Ignorar rate limiting**

---

## 🔗 Dependências

```
bau_mental
    ↑
    └── core (WorkspaceModel, WorkspaceViewSet, Celery)
    └── accounts (Workspace, User)
    └── OpenAI API (Whisper, GPT-4)
```

**Variáveis de ambiente necessárias:**
- `OPENAI_API_KEY` - Para transcrição e classificação
- `CELERY_BROKER_URL` - Para processamento assíncrono
- `CELERY_RESULT_BACKEND` - Para resultados de tasks

---

## 🧪 Testes

### Arquivos de Teste

```
apps/bau_mental/tests/
├── test_models.py      # Testes dos modelos Box e Note
└── test_viewsets.py    # Testes dos ViewSets
```

### Cobertura Esperada

- Models: 90%+
- ViewSets: 80%+
- Services: 70%+ (com mocks)

---

## 📚 Referências

- `@docs/BAU_MENTAL_ARCHITECTURE.md` — Arquitetura detalhada
- `@backend/ANALYSIS.md` — Análise geral do backend
- `@backend/apps/core/ANALYSIS.md` — Análise do app core
- `@docs/ARCHITECTURE.md` — Decisões arquiteturais
- `@AGENTS.md#007backend` — Agente backend

---

## ⚠️ Invariantes (Nunca Quebrar)

1. **Note sempre pertence a uma workspace**
2. **Box sempre pertence a uma workspace**
3. **Filtro sempre por workspace** (automático via WorkspaceViewSet)
4. **Ownership sempre validado** (WorkspaceObjectPermission)
5. **Processamento sempre assíncrono** (Celery)

---

## 🚀 Próximos Passos Recomendados

1. Adicionar validação de duração de áudio (máximo 5 minutos)
2. Implementar full-text search melhorado (PostgreSQL)
3. Adicionar endpoint para download seguro de áudios
4. Implementar cache de transcrições (evitar reprocessamento)
5. Adicionar métricas de uso (áudios por workspace, taxa de classificação)

---

## 🔍 Anchors Semânticos

| Termo | Significado |
|-------|-------------|
| `Box` | Caixinha (categoria) para organizar anotações |
| `Note` | Anotação criada a partir de áudio |
| `Inbox` | Anotações sem caixinha (box=None) |
| `TranscriptionService` | Serviço de transcrição (Whisper) |
| `ClassificationService` | Serviço de classificação (LLM) |
| `QueryService` | Serviço de consulta inteligente |



