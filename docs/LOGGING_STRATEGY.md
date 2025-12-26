# Estratégia de Logging Centralizado - Frontend + Backend

**Data:** 2025-01-XX
**Status:** 📋 Recomendação

---

## 🎯 Decisão Estratégica

### Abordagem Recomendada: Híbrida

**Fase 1 (Atual - MicroSaaS):** Endpoint customizado simples
- ✅ Custo zero
- ✅ Controle total
- ✅ Integração com infraestrutura existente
- ✅ Multi-tenancy nativo

**Fase 2 (Crescimento):** Migrar para Sentry quando:
- Volume de erros > 1000/dia
- Necessidade de stack traces detalhados
- Necessidade de alertas automáticos
- Necessidade de performance monitoring

---

## 📊 Comparação: Custom vs Sentry

| Aspecto | Custom Endpoint | Sentry |
|---------|----------------|--------|
| **Custo** | Gratuito | $26/mês (Developer) |
| **Setup** | Médio | Baixo |
| **Stack Traces** | Manual | Automático |
| **Source Maps** | Manual | Automático |
| **Agrupamento** | Manual | Automático |
| **Alertas** | Manual | Automático |
| **Performance** | Não | Sim |
| **Controle** | Total | Limitado |
| **Multi-tenancy** | Nativo | Configurável |

---

## 🏗️ Implementação Customizada

### 1. Model de Logs

```python
# backend/apps/core/models.py

class ApplicationLog(WorkspaceModel):
    """Log centralizado de erros e eventos da aplicação."""

    LEVEL_CHOICES = [
        ("DEBUG", "Debug"),
        ("INFO", "Info"),
        ("WARNING", "Warning"),
        ("ERROR", "Error"),
        ("CRITICAL", "Critical"),
    ]

    SOURCE_CHOICES = [
        ("frontend", "Frontend"),
        ("backend", "Backend"),
        ("api", "API"),
    ]

    # Identificação
    level = models.CharField(max_length=10, choices=LEVEL_CHOICES, db_index=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, db_index=True)

    # Mensagem
    message = models.TextField(verbose_name="Mensagem")
    error_type = models.CharField(max_length=255, null=True, blank=True, db_index=True)

    # Contexto
    url = models.URLField(null=True, blank=True, max_length=500)
    user_agent = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    # Stack trace e dados extras (JSON)
    stack_trace = models.TextField(null=True, blank=True)
    extra_data = models.JSONField(default=dict, blank=True)

    # Usuário (se disponível)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="application_logs",
    )

    # Metadados
    session_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    request_id = models.CharField(max_length=255, null=True, blank=True, db_index=True)

    class Meta:
        verbose_name = "Log de Aplicação"
        verbose_name_plural = "Logs de Aplicação"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "level", "created_at"]),
            models.Index(fields=["workspace", "source", "created_at"]),
            models.Index(fields=["workspace", "error_type", "created_at"]),
            models.Index(fields=["created_at"]),  # Para cleanup
        ]

    def __str__(self) -> str:
        return f"{self.level} - {self.source} - {self.message[:50]}"
```

### 2. Serializer

```python
# backend/apps/core/serializers.py

from rest_framework import serializers
from apps.core.models import ApplicationLog

class ApplicationLogSerializer(serializers.Serializer):
    """Serializer para receber logs do frontend."""

    level = serializers.ChoiceField(choices=ApplicationLog.LEVEL_CHOICES)
    message = serializers.CharField()
    error_type = serializers.CharField(required=False, allow_null=True)
    url = serializers.URLField(required=False, allow_null=True)
    stack_trace = serializers.CharField(required=False, allow_null=True)
    extra_data = serializers.JSONField(required=False, default=dict)
    session_id = serializers.CharField(required=False, allow_null=True)
    request_id = serializers.CharField(required=False, allow_null=True)

    def validate_level(self, value):
        """Apenas aceitar ERROR e CRITICAL do frontend."""
        if value in ["DEBUG", "INFO"]:
            raise serializers.ValidationError("Frontend não pode enviar logs DEBUG/INFO")
        return value
```

### 3. ViewSet

```python
# backend/apps/core/viewsets.py

from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.models import ApplicationLog
from apps.core.serializers import ApplicationLogSerializer
from apps.core.viewsets import WorkspaceViewSet

class ApplicationLogViewSet(WorkspaceViewSet):
    """ViewSet para receber logs do frontend."""

    queryset = ApplicationLog.objects.none()  # Não permitir listagem via API
    serializer_class = ApplicationLogSerializer
    permission_classes = []  # Permitir logs mesmo sem autenticação (com rate limit)

    @action(detail=False, methods=["post"], url_path="frontend")
    def log_frontend(self, request):
        """Endpoint para receber logs do frontend."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Obter dados do request
        ip_address = self._get_client_ip(request)
        user_agent = request.META.get("HTTP_USER_AGENT", "")
        user = request.user if request.user.is_authenticated else None

        # Criar log
        ApplicationLog.objects.create(
            workspace=request.workspace,  # Do middleware
            user=user,
            level=serializer.validated_data["level"],
            source="frontend",
            message=serializer.validated_data["message"],
            error_type=serializer.validated_data.get("error_type"),
            url=serializer.validated_data.get("url"),
            stack_trace=serializer.validated_data.get("stack_trace"),
            extra_data=serializer.validated_data.get("extra_data", {}),
            session_id=serializer.validated_data.get("session_id"),
            request_id=serializer.validated_data.get("request_id"),
            ip_address=ip_address,
            user_agent=user_agent,
        )

        return Response({"status": "logged"}, status=status.HTTP_201_CREATED)

    def _get_client_ip(self, request):
        """Obtém IP do cliente."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip
```

### 4. Rate Limiting Específico

```python
# backend/apps/core/throttles.py

class LoggingRateThrottle(WorkspaceRateThrottle):
    """Throttle específico para endpoint de logs."""

    scope = "logging"

    def get_rate(self) -> str:
        """Limite: 100 logs/hora por workspace."""
        return "100/hour"
```

### 5. Batching no Frontend

```typescript
// frontend/src/lib/error-logger.ts

interface LogEntry {
  level: 'ERROR' | 'CRITICAL' | 'WARNING';
  message: string;
  error_type?: string;
  url?: string;
  stack_trace?: string;
  extra_data?: Record<string, any>;
  session_id?: string;
  request_id?: string;
}

class ErrorLogger {
  private queue: LogEntry[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 segundos
  private flushTimer: number | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.setupErrorHandlers();
    this.startFlushTimer();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  private setupErrorHandlers(): void {
    // Erros não capturados
    window.addEventListener('error', (event) => {
      this.log({
        level: 'ERROR',
        message: event.message,
        error_type: event.error?.name || 'Error',
        url: window.location.href,
        stack_trace: event.error?.stack,
        extra_data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
      this.log({
        level: 'ERROR',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        error_type: event.reason?.name || 'UnhandledRejection',
        url: window.location.href,
        stack_trace: event.reason?.stack,
        extra_data: {
          reason: String(event.reason),
        },
      });
    });
  }

  log(entry: LogEntry): void {
    this.queue.push({
      ...entry,
      session_id: this.sessionId,
      request_id: crypto.randomUUID(),
    });

    // Flush imediato se atingir batch size
    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = window.setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);

    try {
      await fetch('/api/v1/logs/frontend/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': localStorage.getItem('tenant_id') || '',
        },
        credentials: 'include',
        body: JSON.stringify(batch.length === 1 ? batch[0] : { batch: batch }),
      });
    } catch (error) {
      // Se falhar, re-adicionar à fila (com limite)
      if (this.queue.length < 100) {
        this.queue.unshift(...batch);
      }
      console.error('Failed to send logs:', error);
    }
  }

  // Flush manual antes de sair da página
  beforeUnload(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Singleton
export const errorLogger = new ErrorLogger();

// Flush antes de sair
window.addEventListener('beforeunload', () => {
  errorLogger.beforeUnload();
});
```

### 6. Cleanup Automático (Celery Task)

```python
# backend/apps/core/tasks/logging.py

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from apps.core.models import ApplicationLog

@shared_task
def cleanup_old_logs():
    """Remove logs mais antigos que o período de retenção."""
    retention_days = int(os.environ.get("LOG_RETENTION_DAYS", "30"))
    cutoff_date = timezone.now() - timedelta(days=retention_days)

    deleted_count, _ = ApplicationLog.objects.filter(
        created_at__lt=cutoff_date
    ).delete()

    return f"Deleted {deleted_count} old logs"
```

### 7. Configuração

```python
# backend/config/settings/base.py

# Logging
LOG_RETENTION_DAYS = int(os.environ.get("LOG_RETENTION_DAYS", "30"))

# Rate limiting para logs
REST_FRAMEWORK = {
    # ...
    "DEFAULT_THROTTLE_RATES": {
        # ...
        "logging": "100/hour",  # Limite para endpoint de logs
    },
}
```

```python
# backend/config/celery.py (adicionar task periódica)

from celery.schedules import crontab

app.conf.beat_schedule = {
    "cleanup-old-logs": {
        "task": "apps.core.tasks.logging.cleanup_old_logs",
        "schedule": crontab(hour=2, minute=0),  # Todo dia às 2h
    },
}
```

---

## 🔒 Segurança

### 1. Filtro de Dados Sensíveis

```python
# backend/apps/core/logging.py (adicionar ao SensitiveDataFilter existente)

def sanitize_log_data(data: dict) -> dict:
    """Remove dados sensíveis dos logs."""
    sensitive_fields = [
        "password", "token", "secret", "api_key", "access_token",
        "authorization", "credit_card", "ssn", "cpf", "email",
    ]

    sanitized = {}
    for key, value in data.items():
        if any(sensitive in key.lower() for sensitive in sensitive_fields):
            sanitized[key] = "[REDACTED]"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        else:
            sanitized[key] = value

    return sanitized
```

### 2. Rate Limiting Agressivo

- 100 logs/hora por workspace (via `LoggingRateThrottle`)
- Previne spam e ataques

### 3. Validação de Input

- Serializer valida todos os campos
- Limite de tamanho para `message` e `stack_trace`
- Sanitização de HTML/JS

---

## 📊 Consultas Úteis

```python
# Erros mais frequentes
ApplicationLog.objects.filter(
    workspace=workspace,
    level__in=["ERROR", "CRITICAL"],
    created_at__gte=timezone.now() - timedelta(days=7),
).values("error_type", "message").annotate(
    count=Count("id")
).order_by("-count")[:10]

# Erros por usuário
ApplicationLog.objects.filter(
    workspace=workspace,
    user=user,
    level__in=["ERROR", "CRITICAL"],
).order_by("-created_at")

# Erros por URL
ApplicationLog.objects.filter(
    workspace=workspace,
    level__in=["ERROR", "CRITICAL"],
).values("url").annotate(
    count=Count("id")
).order_by("-count")
```

---

## 🚀 Migração Futura para Sentry

Quando migrar para Sentry:

1. **Mantém endpoint customizado** para logs de negócio (não erros)
2. **Adiciona Sentry** para erros técnicos
3. **Integra ambos** no dashboard

```typescript
// frontend/src/lib/error-logger.ts (com Sentry)

import * as Sentry from "@sentry/react";

class ErrorLogger {
  log(entry: LogEntry): void {
    // Sentry para erros técnicos
    if (entry.level === "ERROR" || entry.level === "CRITICAL") {
      Sentry.captureException(new Error(entry.message), {
        level: entry.level.toLowerCase(),
        tags: {
          source: "frontend",
          error_type: entry.error_type,
        },
        extra: entry.extra_data,
      });
    }

    // Endpoint customizado para logs de negócio
    // (se necessário)
  }
}
```

---

## ✅ Checklist de Implementação

- [ ] Criar model `ApplicationLog`
- [ ] Criar serializer e viewset
- [ ] Adicionar rate limiting específico
- [ ] Implementar batching no frontend
- [ ] Adicionar filtro de dados sensíveis
- [ ] Criar task de cleanup
- [ ] Configurar task periódica no Celery
- [ ] Adicionar índices no banco
- [ ] Testar volume e performance
- [ ] Documentar no README

---

## 📈 Métricas de Sucesso

- **Volume**: < 1000 logs/dia por tenant (ajustar retention se necessário)
- **Performance**: < 50ms para criar log
- **Storage**: < 100MB por tenant (com retention de 30 dias)
- **Uptime**: 99.9% (endpoint não deve quebrar aplicação)

---

**Próximo Passo**: Implementar Fase 1 (Custom Endpoint) e monitorar volume. Planejar migração para Sentry quando necessário.



