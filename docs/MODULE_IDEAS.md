# Ideias de Módulos Futuros - SaaS Bootstrap

Este documento registra ideias de módulos e funcionalidades que podem ser implementadas no SaaS Bootstrap, aproveitando a arquitetura multi-tenant já estabelecida.

**Última atualização:** 2024-12-24

---

## 🎤 Módulo: Checklist por Áudio (Voice-to-Task)

**Data da Ideia:** 2024-12-24
**Status:** 💡 Ideia registrada
**Prioridade:** Média

### Conceito

Módulo que permite aos usuários criar checklists priorizados através de gravação de áudio. O fluxo é:

1. **Gravação**: Usuário pressiona botão e grava um áudio
2. **Transcrição**: Áudio é transcrito automaticamente (usando API de speech-to-text)
3. **Organização e Priorização**: Transcrição é processada por IA (OpenAI) para:
   - Extrair tarefas/itens do checklist
   - Organizar e estruturar os itens
   - Priorizar conforme instruções/configurações
4. **Resultado**: Checklist priorizado criado automaticamente

### Casos de Uso

- **Reuniões rápidas**: Gravar pontos de ação durante reunião
- **Brainstorming**: Capturar ideias rapidamente por voz
- **Lembretes pessoais**: Criar lista de tarefas enquanto está em movimento
- **Anotações de campo**: Profissionais que trabalham fora do escritório
- **Acessibilidade**: Usuários com dificuldades de digitação

### Arquitetura e Compatibilidade

✅ **Totalmente compatível com a base atual:**

- **Multi-tenancy**: Cada workspace (Workspace) terá seus próprios checklists isolados
- **WorkspaceModel**: Herdar de `WorkspaceModel` para isolamento automático por workspace
- **WorkspaceViewSet**: Usar `WorkspaceViewSet` para APIs REST com filtro automático
- **Middleware**: `WorkspaceMiddleware` já define `request.workspace` automaticamente
- **Frontend**: Estrutura React pronta para adicionar nova página/módulo
- **Permissões**: `WorkspaceObjectPermission` já previne acesso entre workspaces

### Estrutura Proposta

#### Backend

```
backend/apps/voice_tasks/
├── __init__.py
├── models.py          # VoiceTask, TaskItem
├── serializers.py     # Serializers para API
├── viewsets.py        # ViewSets REST (herda WorkspaceViewSet)
├── services.py        # Lógica de transcrição e processamento IA
├── tasks.py           # Celery tasks para processamento assíncrono
├── admin.py           # Configuração Django Admin
├── urls.py            # Rotas da API
└── tests/
    ├── __init__.py
    ├── test_models.py
    ├── test_viewsets.py
    └── test_services.py
```

#### Frontend

```
frontend/src/features/voice-tasks/
├── pages/
│   └── VoiceTaskPage.tsx        # Página principal com botão de gravação
├── components/
│   ├── AudioRecorder.tsx        # Componente de gravação de áudio
│   ├── RecordingStatus.tsx     # Status do processamento
│   ├── TaskList.tsx             # Lista de tarefas priorizadas
│   ├── TaskItem.tsx             # Item individual do checklist
│   └── PriorityBadge.tsx       # Badge de prioridade
├── hooks/
│   ├── useVoiceTasks.ts         # Hook para gerenciar estado
│   ├── useAudioRecorder.ts     # Hook para gravação
│   └── useTaskProcessing.ts    # Hook para status de processamento
└── types/
    └── voiceTasks.ts            # TypeScript types
```

### Modelos Sugeridos

```python
# VoiceTask - Representa uma sessão de gravação processada
class VoiceTask(WorkspaceModel):
    """Sessão de gravação de áudio que será processada em checklist."""

    STATUS_CHOICES = [
        ("pending", "Pendente"),
        ("uploading", "Enviando"),
        ("transcribing", "Transcrevendo"),
        ("processing", "Processando"),
        ("completed", "Concluído"),
        ("failed", "Falhou"),
    ]

    title = models.CharField(max_length=255, blank=True)  # Gerado automaticamente ou manual
    audio_file = models.FileField(upload_to='voice_tasks/audio/')
    transcription = models.TextField(blank=True)  # Transcrição bruta
    processed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )
    error_message = models.TextField(blank=True)  # Mensagem de erro se falhar
    priority_config = models.JSONField(
        default=dict,
        help_text="Configurações de priorização (critérios, pesos, etc)"
    )
    metadata = models.JSONField(
        default=dict,
        help_text="Metadados adicionais (duração, formato, etc)"
    )

# TaskItem - Item individual do checklist
class TaskItem(WorkspaceModel):
    """Item individual do checklist gerado a partir do áudio."""

    PRIORITY_CHOICES = [
        (1, "Baixa"),
        (2, "Média-Baixa"),
        (3, "Média"),
        (4, "Alta"),
        (5, "Urgente"),
    ]

    voice_task = models.ForeignKey(
        VoiceTask,
        on_delete=models.CASCADE,
        related_name="task_items"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=3)
    order = models.IntegerField(default=0)  # Ordem após priorização
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    due_date = models.DateTimeField(null=True, blank=True)  # Data limite (extraída da IA)
    tags = models.JSONField(default=list)  # Tags extraídas (ex: ["urgente", "cliente"])
```

### Fluxo Técnico

#### 1. Gravação e Upload (Frontend → Backend)

```
Frontend:
  - Usuário pressiona botão "Gravar"
  - MediaRecorder API grava áudio
  - Ao parar, converte para formato (WebM/MP3)
  - Upload via FormData para /api/voice-tasks/

Backend:
  - Recebe arquivo via multipart/form-data
  - Valida formato e tamanho
  - Cria VoiceTask com status="pending"
  - Salva arquivo (local ou S3)
  - Retorna VoiceTask ID
```

#### 2. Processamento Assíncrono (Celery)

```
Celery Task: process_voice_task(voice_task_id)
  1. Atualiza status="transcribing"
  2. Chama serviço de transcrição (Google/Whisper/AWS)
  3. Salva transcrição no VoiceTask
  4. Atualiza status="processing"
  5. Chama OpenAI para organizar e priorizar:
     - Prompt: "Extraia tarefas desta transcrição e priorize..."
     - Recebe JSON estruturado com tarefas
  6. Cria TaskItem objects
  7. Atualiza status="completed"
  8. Em caso de erro: status="failed" + error_message
```

#### 3. Atualização em Tempo Real (Frontend)

```
Opções:
  A) Polling: Frontend faz GET /api/voice-tasks/{id}/ a cada 2s
  B) WebSocket: Backend envia atualizações via WebSocket
  C) Server-Sent Events (SSE): Backend envia eventos de progresso
```

### Integrações Necessárias

#### Speech-to-Text (Transcrição)

**Opções recomendadas:**

1. **OpenAI Whisper API** (Recomendado)
   - Alta qualidade
   - Suporta múltiplos idiomas
   - Preço: $0.006/minuto
   - API simples

2. **Google Cloud Speech-to-Text**
   - Alta qualidade
   - Suporta múltiplos idiomas
   - Preço: $0.006-$0.016/minuto
   - Requer setup GCP

3. **AWS Transcribe**
   - Boa qualidade
   - Integração fácil com S3
   - Preço: $0.024/minuto
   - Bom para quem já usa AWS

4. **Azure Speech Services**
   - Boa qualidade
   - Suporta múltiplos idiomas
   - Preço: $1.00/hora
   - Integração com Azure

**Recomendação inicial:** OpenAI Whisper API (simplicidade + qualidade)

#### IA para Organização e Priorização

**Opções recomendadas:**

1. **OpenAI GPT-4** (Recomendado)
   - Melhor qualidade de extração
   - Entende contexto complexo
   - Preço: $0.03/1K tokens (input) + $0.06/1K tokens (output)
   - API estável

2. **Claude (Anthropic)**
   - Excelente para análise de texto
   - Preço competitivo
   - API estável

3. **Gemini (Google)**
   - Boa qualidade
   - Preço competitivo
   - Integração com Google Cloud

**Recomendação inicial:** OpenAI GPT-4 (melhor para extração estruturada)

### Configurações por Workspace

Cada workspace (Workspace) pode ter configurações customizadas:

```python
# Exemplo de configuração por Workspace
{
    "transcription_service": "openai_whisper",  # ou "google", "aws", "azure"
    "ai_service": "openai_gpt4",  # ou "claude", "gemini"
    "default_language": "pt-BR",
    "priority_criteria": {
        "keywords_urgent": ["urgente", "asap", "hoje"],
        "keywords_high": ["importante", "prioridade"],
        "default_priority": 3
    },
    "extract_due_dates": true,
    "extract_tags": true,
    "max_audio_duration_minutes": 10,
    "max_file_size_mb": 50
}
```

### APIs REST Propostas

```
POST   /api/voice-tasks/              # Criar nova gravação (upload)
GET    /api/voice-tasks/              # Listar todas as gravações
GET    /api/voice-tasks/{id}/         # Detalhes de uma gravação
PATCH  /api/voice-tasks/{id}/         # Atualizar (ex: título)
DELETE /api/voice-tasks/{id}/        # Deletar gravação

GET    /api/voice-tasks/{id}/status/  # Status do processamento
POST   /api/voice-tasks/{id}/retry/   # Reprocessar se falhou

GET    /api/task-items/               # Listar todos os itens
GET    /api/task-items/{id}/          # Detalhes de um item
PATCH  /api/task-items/{id}/          # Atualizar (ex: completar, prioridade)
DELETE /api/task-items/{id}/          # Deletar item
```

### Considerações de Segurança

- ✅ **Isolamento por Workspace**: Áudios e checklists isolados automaticamente
- ✅ **Validação de arquivo**: Apenas formatos de áudio permitidos (MP3, WAV, WebM, OGG)
- ✅ **Limite de tamanho**: Máximo configurável por workspace (ex: 50MB)
- ✅ **Rate limiting**: Limitar uploads por usuário/workspace (ex: 10/hora)
- ✅ **LGPD Compliance**: Áudios são dados pessoais, precisam de:
  - Auditoria automática (já implementado)
  - Política de retenção configurável
  - Direito ao esquecimento (deletar áudio + transcrição)
- ✅ **Criptografia**: Áudios em repouso (S3 com encryption)
- ✅ **Validação de transcrição**: Sanitizar output da IA antes de salvar

### Considerações de Performance

- **Processamento Assíncrono**: Sempre usar Celery para não bloquear request
- **Storage**: Considerar S3/Cloud Storage para arquivos grandes
- **Caching**: Cachear resultados de transcrição/processamento para evitar reprocessamento
- **Otimização de queries**: Índices em `workspace`, `status`, `created_at`
- **Paginação**: Listas sempre paginadas (DRF padrão)

### Variáveis de Ambiente Necessárias

```bash
# Transcrição
OPENAI_API_KEY=sk-...
# ou
GOOGLE_CLOUD_CREDENTIALS=/path/to/credentials.json
# ou
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# IA para organização
OPENAI_API_KEY=sk-...  # Mesmo da transcrição se usar Whisper
# ou
ANTHROPIC_API_KEY=sk-ant-...

# Storage (opcional, se usar S3)
AWS_STORAGE_BUCKET_NAME=voice-tasks-audio
AWS_S3_REGION_NAME=us-east-1

# Configurações
MAX_AUDIO_FILE_SIZE_MB=50
MAX_AUDIO_DURATION_MINUTES=10
DEFAULT_TRANSCRIPTION_LANGUAGE=pt-BR
```

### Próximos Passos (quando implementar)

#### Fase 1: Fundação
- [ ] Criar app `voice_tasks` no backend
- [ ] Definir models (`VoiceTask`, `TaskItem`)
- [ ] Criar migrations
- [ ] Configurar Django Admin básico
- [ ] Criar testes de models

#### Fase 2: APIs REST
- [ ] Implementar serializers
- [ ] Criar ViewSets (herdar `WorkspaceViewSet`)
- [ ] Configurar rotas (`/api/voice-tasks/`)
- [ ] Implementar upload de arquivo
- [ ] Criar testes de API

#### Fase 3: Processamento
- [ ] Implementar serviço de transcrição (Whisper/Google)
- [ ] Implementar serviço de processamento IA (OpenAI)
- [ ] Criar Celery tasks
- [ ] Configurar Celery workers
- [ ] Criar testes de serviços

#### Fase 4: Frontend
- [ ] Criar página `VoiceTaskPage`
- [ ] Implementar componente `AudioRecorder`
- [ ] Implementar componente `TaskList`
- [ ] Integrar com APIs REST
- [ ] Implementar polling/WebSocket para status
- [ ] Criar testes de componentes

#### Fase 5: Melhorias
- [ ] Adicionar WebSockets para atualização em tempo real
- [ ] Implementar configurações por Workspace
- [ ] Adicionar filtros e busca
- [ ] Implementar exportação (PDF, CSV)
- [ ] Adicionar notificações

### Notas Técnicas

- **Processamento Assíncrono**: Usar Celery para não bloquear request HTTP
- **Storage**: Considerar S3/Cloud Storage para arquivos de áudio grandes
- **WebSockets**: Opcional, para atualização em tempo real do status (pode usar polling inicialmente)
- **Caching**: Cachear resultados de transcrição/processamento para evitar reprocessamento
- **Idiomas**: Suportar múltiplos idiomas (configurável por workspace)
- **Formato de áudio**: Aceitar WebM (navegador), MP3, WAV, OGG
- **Duração máxima**: Configurável (padrão: 10 minutos)

### Referências e Exemplos

- **OpenAI Whisper API**: https://platform.openai.com/docs/guides/speech-to-text
- **OpenAI GPT-4**: https://platform.openai.com/docs/guides/gpt
- **MediaRecorder API**: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- **Celery**: https://docs.celeryproject.org/
- **Django File Upload**: https://docs.djangoproject.com/en/5.0/topics/http/file-uploads/

---

## 📝 Template para Novas Ideias

**Nome do Módulo:** [Nome]
**Data da Ideia:** [Data]
**Status:** 💡 Ideia registrada | 🚧 Em desenvolvimento | ✅ Implementado
**Prioridade:** Baixa | Média | Alta

### Conceito
[Descrição clara e concisa do módulo]

### Casos de Uso
[Lista de casos de uso específicos]

### Arquitetura e Compatibilidade
[Como se encaixa na base atual - multi-tenancy, models, APIs, frontend]

### Estrutura Proposta
```
[Estrutura de arquivos backend e frontend]
```

### Modelos Sugeridos
```python
[Models Django propostos]
```

### Fluxo Técnico
[Fluxo passo a passo de como funciona]

### Integrações Necessárias
[Lista de APIs/serviços externos necessários]

### APIs REST Propostas
```
[Endpoints REST propostos]
```

### Considerações de Segurança
[Pontos de segurança específicos do módulo]

### Considerações de Performance
[Otimizações e preocupações de performance]

### Variáveis de Ambiente Necessárias
```bash
[Variáveis de ambiente necessárias]
```

### Próximos Passos
- [ ] [Tarefa 1]
- [ ] [Tarefa 2]
- [ ] [Tarefa 3]

### Notas Técnicas
[Observações técnicas importantes]

### Referências
[Links e documentação relevante]

---

## 📊 Status Geral das Ideias

| Módulo | Status | Prioridade | Data |
|--------|--------|------------|------|
| Checklist por Áudio | 💡 Ideia | Média | 2024-12-24 |

**Legenda:**
- 💡 Ideia registrada
- 🚧 Em desenvolvimento
- ✅ Implementado
- ❌ Cancelado/Arquivado

---

**Como adicionar novas ideias:**

1. Copiar o template acima
2. Preencher todas as seções
3. Adicionar à tabela de status
4. Manter o documento atualizado conforme o desenvolvimento progride



