# Padrões de Segurança - Guia para LLMs

Este arquivo documenta **padrões obrigatórios de segurança** que devem ser seguidos em todo o código.

---

## 🔒 Validação de Ownership (IDOR Prevention)

### Padrão Obrigatório

**SEMPRE** incluir `WorkspaceObjectPermission` em ViewSets que herdam de `WorkspaceViewSet`.

### ✅ CORRETO

```python
from apps.core.permissions import WorkspaceObjectPermission
from apps.core.viewsets import WorkspaceViewSet
from rest_framework.permissions import IsAuthenticated

class MyViewSet(WorkspaceViewSet):
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]
```

### ❌ ERRADO

```python
# ❌ Remove proteção contra IDOR!
class MyViewSet(WorkspaceViewSet):
    permission_classes = [IsAuthenticated]  # Faltou WorkspaceObjectPermission
```

### Por Que É Crítico

- **IDOR (Insecure Direct Object Reference)**: Permite acesso a objetos de outras workspaces
- **Violação de isolamento multi-tenant**: Quebra segurança fundamental
- **Risco crítico**: Vazamento de dados entre tenants

### Quando Aplicar

- ✅ **SEMPRE** em ViewSets que herdam de `WorkspaceViewSet`
- ✅ Mesmo se sobrescrever `permission_classes`
- ✅ Em todas as ações de objeto (`retrieve`, `update`, `destroy`)

### Como Funciona

`WorkspaceObjectPermission` valida que `obj.workspace_id == request.workspace.id` antes de permitir acesso.

---

## 🔐 Filtro de Dados Sensíveis em Logs

### Padrão Automático

O `SensitiveDataFilter` já está configurado automaticamente em todos os handlers de log.

### Adicionar Novos Campos Sensíveis

**Quando:** Identificar campo que contém dados sensíveis (senha, token, chave, etc.)

**Como:** Editar `SENSITIVE_FIELDS` em `apps/core/logging.py`:

```python
SENSITIVE_FIELDS = [
    # ... campos existentes ...
    "meu_campo_sensivel",  # ✅ Adicionar aqui
]
```

### Campos Já Protegidos

- `password`, `password_confirm`, `old_password`, `new_password`
- `token`, `secret`, `api_key`, `access_token`, `refresh_token`
- `authorization`, `auth`, `credentials`, `private_key`, `secret_key`
- `api_secret`, `client_secret`

### Onde Está Configurado

- `backend/config/settings/base.py` → `LOGGING` → `filters` → `sensitive_data`
- Aplicado em: `handlers.console` e `handlers.file`

### ⚠️ Atenção

**NUNCA** logar dados sensíveis diretamente:

```python
# ❌ ERRADO
logger.info(f"Password: {password}")

# ✅ CORRETO
logger.info("Login attempt", extra={"user_id": user.id})  # Filtro redige automaticamente
```

---

## 🛡️ Mass Assignment Prevention

### Padrão Obrigatório

**SEMPRE** definir `read_only_fields` explicitamente em serializers.

### ✅ CORRETO

```python
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'is_staff', 'is_active', 'workspace_id']
        read_only_fields = ['id', 'is_staff']  # ✅ Explícito
        # Campos sensíveis não podem ser alterados
```

### ❌ ERRADO

```python
# ❌ Permite alterar campos sensíveis
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'is_staff', 'is_active']
        # read_only_fields não definido - is_staff pode ser alterado!
```

### Campos Que Devem Ser read_only

- `id` (sempre)
- `created_at`, `updated_at` (sempre)
- `is_staff`, `is_superuser` (sempre)
- `workspace_id` (em models WorkspaceModel)
- Campos calculados ou derivados
- Campos que só podem ser alterados por admins

### Checklist para Novos Serializers

- [ ] `read_only_fields` definido explicitamente?
- [ ] Campos sensíveis estão em `read_only_fields`?
- [ ] Campos de controle (`is_staff`, etc.) estão protegidos?
- [ ] Campos de auditoria (`created_at`, etc.) estão protegidos?

---

## 🔍 Validação de Query Parameters

### Padrão Obrigatório

**SEMPRE** validar query parameters antes de usar em queries.

### ✅ CORRETO

```python
class LeadViewSet(WorkspaceViewSet):
    def get_queryset(self):
        queryset = super().get_queryset()

        # Validar status
        VALID_STATUSES = ['new', 'contacted', 'converted']
        status = self.request.query_params.get("status")
        if status and status in VALID_STATUSES:  # ✅ Validação
            queryset = queryset.filter(status=status)

        # Validar search (sanitizar)
        search = self.request.query_params.get("search")
        if search:
            # Django ORM já protege contra SQL injection, mas validar formato
            search = search.strip()[:100]  # Limitar tamanho
            queryset = queryset.filter(name__icontains=search)

        return queryset
```

### ❌ ERRADO

```python
# ❌ Sem validação - permite qualquer valor
def get_queryset(self):
    queryset = super().get_queryset()
    status = self.request.query_params.get("status")
    queryset = queryset.filter(status=status)  # Pode ser qualquer coisa!
    return queryset
```

### ⚠️ NUNCA Usar

```python
# ❌ PERIGO: SQL injection se não sanitizar
queryset = queryset.extra(where=[f"status = '{status}'"])  # NUNCA fazer isso!

# ❌ PERIGO: Raw SQL sem sanitização
queryset = Model.objects.raw(f"SELECT * FROM table WHERE status = '{status}'")
```

### Padrão para Validação

1. **Lista de valores válidos** (para enums/choices):
   ```python
   VALID_VALUES = ['value1', 'value2']
   if value and value in VALID_VALUES:
       queryset = queryset.filter(field=value)
   ```

2. **Sanitização de texto** (para busca):
   ```python
   search = search.strip()[:100]  # Limitar tamanho
   queryset = queryset.filter(name__icontains=search)
   ```

3. **Validação de tipo** (para números):
   ```python
   try:
       limit = int(self.request.query_params.get("limit", 10))
       limit = min(limit, 100)  # Limitar máximo
   except (ValueError, TypeError):
       limit = 10
   ```

---

## 🧹 Sanitização de Input (XSS Prevention)

### Padrão Recomendado

Para campos de texto livre que podem conter HTML, usar sanitização.

### Quando Aplicar

- Campos `TextField` ou `CharField` que podem conter HTML
- Campos de `notes`, `description`, `content`
- Campos que são renderizados no frontend

### Padrão Documentado (Implementar Quando Necessário)

```python
# apps/core/serializers.py
from django.utils.html import strip_tags
from bleach import clean

class SanitizedCharField(serializers.CharField):
    """CharField que sanitiza HTML automaticamente."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        # Remove HTML tags e sanitiza
        cleaned = clean(strip_tags(value), tags=[], strip=True)
        return cleaned
```

### Uso

```python
class LeadSerializer(serializers.ModelSerializer):
    notes = SanitizedCharField(required=False)  # ✅ HTML sanitizado
```

### ⚠️ Nota

- `bleach` deve ser adicionado ao `requirements.txt` quando necessário
- Padrão está documentado, implementação pode ser feita quando necessário

---

## 📋 Checklist de Segurança para Novos Códigos

Ao criar novos ViewSets, Serializers ou Views:

### ViewSets
- [ ] Herda de `WorkspaceViewSet` se precisa multi-tenancy?
- [ ] Inclui `WorkspaceObjectPermission` em `permission_classes`?
- [ ] Query parameters são validados?
- [ ] Não usa `.extra()` ou `.raw()` sem sanitização?

### Serializers
- [ ] `read_only_fields` definido explicitamente?
- [ ] Campos sensíveis estão protegidos?
- [ ] Campos de texto livre usam sanitização (se necessário)?

### Logging
- [ ] Não loga dados sensíveis diretamente?
- [ ] Usa `extra={}` para contexto estruturado?
- [ ] Campos sensíveis serão redigidos automaticamente?

### Queries
- [ ] Sempre filtra por `workspace` (se WorkspaceModel)?
- [ ] Usa Django ORM (não SQL raw)?
- [ ] Query parameters validados?

---

## 🔗 Referências

- `apps/core/permissions.py` - `WorkspaceObjectPermission`
- `apps/core/logging.py` - `SensitiveDataFilter`
- `apps/core/viewsets.py` - `WorkspaceViewSet`
- `docs/SECURITY_ANALYSIS.md` - Análise completa
- `docs/SECURITY_IMPLEMENTATION.md` - Implementação
- `docs/ARCHITECTURE.md` - Seções 13 e 14

---

**Última atualização:** 2025-12-24
**Mantido por:** LLMs e desenvolvedores




