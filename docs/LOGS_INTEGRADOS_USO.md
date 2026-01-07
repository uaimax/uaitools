# Sistema de Logs Integrados - Guia de Uso

**Data:** 2025-01-XX
**Status:** ✅ Implementado (Fases 1, 2 e 3)

---

## 📋 Visão Geral

Sistema completo de logs estruturados em JSON para análise por LLMs, implementado em 3 fases:

1. **Fase 1**: Logging JSON no frontend (wrapper console.*)
2. **Fase 2**: Captura de logs via TMUX (pipe-pane)
3. **Fase 3**: Log Aggregator e API para streaming

---

## 🚀 Como Usar

### Iniciar Ambiente com Captura de Logs

O `dev-start.sh` já está configurado para capturar logs automaticamente:

```bash
./dev-start.sh
```

**O que acontece:**
- ✅ Backend e frontend iniciam em sessão TMUX
- ✅ Logs são capturados automaticamente em `logs/backend-YYYYMMDD.log`
- ✅ Logs do frontend são capturados em `logs/frontend-YYYYMMDD.log`
- ✅ Rotação diária automática (novo arquivo a cada dia)

### Estrutura de Logs

```
logs/
├── backend-20250115.log      # Logs do Django (JSON)
├── frontend-20250115.log     # Logs do React/Vite (JSON)
└── frontend-20250115.log     # Logs de console do frontend (JSONL)
```

---

## 📊 Endpoints da API

### 1. Enviar Logs de Console (Frontend)

**Endpoint:** `POST /api/v1/logs/frontend/console/`

**Payload:**
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "INFO",
  "source": "frontend",
  "message": "Usuário fez login",
  "data": [{"userId": "123"}],
  "url": "http://localhost:5173/login",
  "sessionId": "session_abc123"
}
```

**Resposta:**
```json
{
  "status": "logged"
}
```

### 2. Obter Logs Recentes (Batch)

**Endpoint:** `GET /api/v1/logs/stream/?limit=100&source=backend&level=ERROR`

**Query Params:**
- `limit`: Número máximo de logs (padrão: 100)
- `source`: Filtrar por source (`backend`, `frontend`)
- `level`: Filtrar por nível (`DEBUG`, `INFO`, `WARN`, `ERROR`)
- `since`: Timestamp Unix (retornar apenas logs após este timestamp)

**Resposta:**
```json
{
  "logs": [
    {
      "timestamp": "2025-01-15T10:30:00Z",
      "level": "ERROR",
      "source": "backend",
      "message": "Erro ao processar requisição",
      "aggregated_at": 1705312200.0,
      "aggregated_iso": "2025-01-15T10:30:00"
    }
  ],
  "count": 1,
  "filters": {
    "source": "backend",
    "level": "ERROR",
    "limit": 100,
    "since": null
  }
}
```

### 3. Streaming de Logs em Tempo Real (SSE)

**Endpoint:** `GET /api/v1/logs/stream/?stream=true&source=backend`

**Query Params:**
- `stream`: `true` para SSE em tempo real
- `source`: Filtrar por source
- `level`: Filtrar por nível

**Resposta:** Server-Sent Events (SSE)
```
data: {"timestamp":"2025-01-15T10:30:00Z","level":"ERROR","source":"backend","message":"Erro..."}

data: {"timestamp":"2025-01-15T10:30:01Z","level":"INFO","source":"frontend","message":"..."}
```

**Exemplo de uso com JavaScript:**
```javascript
const eventSource = new EventSource('/api/v1/logs/stream/?stream=true&source=backend');

eventSource.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log('Novo log:', log);
};
```

---

## 🔧 Configuração

### Frontend

**Variáveis de ambiente (`.env`):**
```bash
# Habilitar envio de logs para backend
VITE_ENABLE_LOG_API=true

# Debug: mostrar logs JSON no console
VITE_DEBUG_JSON_LOGS=true
```

**Como funciona:**
- Wrapper intercepta `console.*` automaticamente
- Formata em JSON estruturado
- Salva em `localStorage` (dev) ou envia para backend (se `VITE_ENABLE_LOG_API=true`)

### Backend

**Variáveis de ambiente (`.env`):**
```bash
# Formato de logs (text ou json)
LOG_FORMAT=json

# Nível de logs
LOG_LEVEL=INFO
```

**Log Aggregator:**
- Inicia automaticamente quando primeiro acesso ao endpoint `/api/v1/logs/stream/`
- Faz tail de arquivos de log em tempo real
- Mantém cache dos últimos 1000 logs
- Thread separada (não bloqueia aplicação)

---

## 📝 Formato dos Logs

### Backend (Django)

```json
{
  "asctime": "2025-01-15 10:30:00,123",
  "name": "django.request",
  "levelname": "ERROR",
  "message": "Internal Server Error: /api/v1/leads/",
  "pathname": "/app/views.py",
  "lineno": 42
}
```

### Frontend (Console)

```json
{
  "timestamp": "2025-01-15T10:30:00.123Z",
  "level": "ERROR",
  "source": "frontend",
  "message": "Erro ao carregar dados",
  "data": [{"component": "LeadsList"}],
  "stack": "Error: ...",
  "url": "http://localhost:5173/admin/leads",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "session_abc123",
  "aggregated_at": 1705312200.123,
  "aggregated_iso": "2025-01-15T10:30:00"
}
```

---

## 🎯 Uso com LLMs (Cursor/Claude)

### Análise de Logs

**1. Obter logs recentes:**
```bash
curl "http://localhost:8001/api/v1/logs/stream/?limit=50&level=ERROR" \
  -H "Authorization: Bearer TOKEN"
```

**2. Streaming em tempo real:**
```bash
curl "http://localhost:8001/api/v1/logs/stream/?stream=true&source=backend" \
  -H "Authorization: Bearer TOKEN"
```

**3. Filtrar por timestamp:**
```bash
# Logs desde 1 hora atrás
SINCE=$(date -d "1 hour ago" +%s)
curl "http://localhost:8001/api/v1/logs/stream/?since=$SINCE" \
  -H "Authorization: Bearer TOKEN"
```

### Integração com Cursor

O Cursor pode usar o endpoint de streaming para:
- Analisar erros em tempo real
- Identificar padrões de comportamento
- Sugerir correções baseadas em logs
- Monitorar performance da aplicação

**Exemplo de prompt para Cursor:**
```
Analise os logs de erro dos últimos 10 minutos:
GET /api/v1/logs/stream/?since=1705311600&level=ERROR

Identifique padrões e sugira correções.
```

---

## 🔍 Debug e Troubleshooting

### Verificar se logs estão sendo capturados

**1. Verificar arquivos de log:**
```bash
ls -lh logs/
tail -f logs/backend-$(date +%Y%m%d).log
tail -f logs/frontend-$(date +%Y%m%d).log
```

**2. Verificar se pipe-pane está ativo:**
```bash
tmux list-panes -t saas-dev -F "#{pane_id} #{pane_tty}"
```

**3. Verificar logs no frontend (localStorage):**
```javascript
// No console do navegador
JSON.parse(localStorage.getItem('dev_logs'))
```

### Problemas Comuns

**Logs não aparecem:**
- Verificar se `logs/` existe e tem permissão de escrita
- Verificar se TMUX está capturando (verificar saída do `dev-start.sh`)
- Verificar se `LOG_FORMAT=json` no `.env` do backend

**Log Aggregator não inicia:**
- Verificar se arquivos de log existem
- Verificar logs do Django para erros
- Reiniciar servidor Django

**Performance:**
- Log Aggregator usa thread separada (não bloqueia)
- Cache limitado a 1000 logs (ajustável)
- Rotação diária de arquivos (evita arquivos muito grandes)

---

## 📚 Referências

- [Análise Técnica Completa](ANALISE_LOGS_INTEGRADOS_LLM.md)
- [Estratégia de Logging](LOGGING_STRATEGY.md)
- [Arquitetura do Sistema](ARCHITECTURE.md)

---

## ✅ Checklist de Implementação

- [x] Fase 1: Wrapper console.* no frontend
- [x] Fase 1: Endpoint para receber logs de console
- [x] Fase 2: Captura via TMUX (pipe-pane)
- [x] Fase 2: Rotação diária de arquivos
- [x] Fase 3: Log Aggregator em Python
- [x] Fase 3: Endpoint de streaming (SSE)
- [x] Fase 3: Filtros e cache de logs

---

**Próximos Passos:**
- [ ] Adicionar compressão de logs antigos
- [ ] Adicionar dashboard web para visualização
- [ ] Integrar com sistema de alertas
- [ ] Adicionar métricas de performance



