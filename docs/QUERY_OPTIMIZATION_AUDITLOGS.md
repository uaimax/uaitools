# Otimização de Queries - AuditLogs

**Data:** 2025-01-28  
**Status:** ✅ Concluído

## 📊 Problema Identificado

O `AuditLogViewSet` estava gerando **queries N+1** ao listar logs de auditoria, causando lentidão quando havia muitos registros.

### Sintomas

- Queries lentas ao listar auditlogs
- Múltiplas queries ao banco para cada log (uma para `user`, outra para `workspace`)
- Performance degradando com o aumento de registros
- Possível detecção no GlitchTip de queries pesadas

### Causa Raiz

Os serializers `AuditLogSerializer` e `AuditLogListSerializer` acessam:
- `user.username` e `user.email` (via `source="user.username"`, `source="user.email"`)
- `workspace.name` (via `source="workspace.name"`)

Mas o `get_queryset()` do `AuditLogViewSet` não estava usando `select_related()` para fazer JOIN com essas tabelas, causando uma query adicional para cada log na lista.

**Exemplo do problema:**
```python
# ❌ ANTES: 1 query principal + N queries para user + N queries para workspace
# Para 25 logs (página padrão): 1 + 25 + 25 = 51 queries!
logs = AuditLog.objects.filter(workspace=workspace)
for log in logs:
    print(log.user.username)  # Query adicional!
    print(log.workspace.name)  # Query adicional!
```

## ✅ Solução Implementada

Adicionado `select_related('user', 'workspace')` no `get_queryset()` do `AuditLogViewSet`:

```python
def get_queryset(self) -> models.QuerySet[AuditLog]:
    """Retorna queryset filtrado por workspace e com filtros opcionais.
    
    Otimizações de performance:
    - select_related('user', 'workspace'): Evita N+1 queries ao acessar
      user.username, user.email e workspace.name nos serializers
    """
    queryset = super().get_queryset()
    
    # Otimização: select_related para evitar N+1 queries
    # Os serializers acessam user.username, user.email e workspace.name
    queryset = queryset.select_related('user', 'workspace')
    
    # ... filtros opcionais ...
    
    return queryset
```

**Resultado:**
```python
# ✅ DEPOIS: 1 query única com JOIN
# Para 25 logs: apenas 1 query!
logs = AuditLog.objects.filter(workspace=workspace).select_related('user', 'workspace')
for log in logs:
    print(log.user.username)  # Sem query adicional (já carregado no JOIN)
    print(log.workspace.name)  # Sem query adicional (já carregado no JOIN)
```

## 📈 Impacto de Performance

### Antes da Otimização

- **25 logs (1 página)**: ~51 queries (1 principal + 25 user + 25 workspace)
- **100 logs (4 páginas)**: ~201 queries
- **Tempo estimado**: 200-500ms+ dependendo do banco

### Depois da Otimização

- **25 logs (1 página)**: 1 query única com JOIN
- **100 logs (4 páginas)**: 4 queries (uma por página)
- **Tempo estimado**: 10-50ms

**Melhoria:** Redução de ~98% no número de queries e ~80-90% no tempo de resposta.

## 🔍 Outros ViewSets que Podem Precisar de Otimização

Durante a análise, foram identificados outros serializers que acessam campos relacionados:

### 1. bau_mental - NoteViewSet

**Serializer:** `NoteSerializer`, `NoteListSerializer`
- Acessa: `box.name`, `created_by.email`, `last_edited_by.email`

**Status:** ⚠️ Verificar se já está otimizado

**Recomendação:**
```python
queryset = queryset.select_related('box', 'created_by', 'last_edited_by')
```

### 2. Investments - DividendReceivedViewSet

**Serializer:** `DividendReceivedSerializer`
- Acessa: `portfolio.name`, `workspace.name`

**Status:** ⚠️ Verificar se já está otimizado

**Recomendação:**
```python
queryset = queryset.select_related('portfolio', 'workspace')
```

### 3. Core - NotificationViewSet

**Serializer:** `NotificationSerializer`
- Acessa: `related_box.name`

**Status:** ⚠️ Verificar se já está otimizado

**Recomendação:**
```python
queryset = queryset.select_related('related_box')
```

## 📝 Boas Práticas Aplicadas

1. ✅ **select_related()** para ForeignKey (relacionamento 1:1 ou N:1)
2. ✅ **prefetch_related()** para ManyToMany ou reverse ForeignKey (quando necessário)
3. ✅ **Paginação** já configurada globalmente (25 itens por página)
4. ✅ **Índices** já existem no model `AuditLog` para campos filtrados

## 🔧 Como Verificar Queries N+1

### 1. Usando Django Debug Toolbar

```python
# settings.py (apenas desenvolvimento)
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
```

### 2. Usando django-silk

```bash
pip install django-silk
```

### 3. Logging de Queries

```python
# settings.py
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['console'],
        },
    },
}
```

### 4. Usando `assertNumQueries()` em Testes

```python
from django.test import TestCase
from django.test.utils import override_settings

class AuditLogViewSetTest(TestCase):
    def test_list_auditlogs_no_n_plus_one(self):
        # Criar alguns logs
        # ...
        
        # Verificar que apenas 1 query é executada
        with self.assertNumQueries(1):
            response = self.client.get('/api/v1/audit/logs/')
            self.assertEqual(response.status_code, 200)
```

## 📚 Referências

- [Django select_related() documentation](https://docs.djangoproject.com/en/stable/ref/models/querysets/#select-related)
- [Django prefetch_related() documentation](https://docs.djangoproject.com/en/stable/ref/models/querysets/#prefetch-related)
- [Anti-patterns - Queries N+1](../backend/.context/anti-patterns.md#-anti-pattern-queries-n1)
- [Django ORM Optimization Guide](https://docs.djangoproject.com/en/stable/topics/db/optimization/)

## ✅ Checklist de Verificação

Ao criar novos ViewSets que acessam campos relacionados:

- [ ] Verificar se o serializer acessa campos de ForeignKey (`source="related.field"`)
- [ ] Adicionar `select_related()` para cada ForeignKey acessado
- [ ] Adicionar `prefetch_related()` para ManyToMany ou reverse ForeignKey
- [ ] Testar com `assertNumQueries()` para garantir que não há N+1
- [ ] Verificar performance com Django Debug Toolbar ou django-silk
- [ ] Documentar otimizações no código (docstring)

---

**Arquivos Modificados:**
- `backend/apps/core/audit_viewsets.py` - Adicionado `select_related('user', 'workspace')`
