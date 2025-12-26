# Leads App — Análise do Módulo

> **Última atualização**: 2024-12
> **Domínio**: Módulo de exemplo (Leads/CRM)
> **Status**: ✅ Ativo
> **Zona**: 🟢 VERDE (desenvolvimento normal)

---

## 🎯 Visão Geral

O app `leads` é um **módulo de exemplo** que demonstra:
- Como criar um app Django com multi-tenancy
- Como usar `WorkspaceModel` e `WorkspaceViewSet`
- Como implementar filtros e busca
- Como estruturar serializers e testes

**Este é um módulo de referência** — use como template para novos apps.

---

## 📁 Estrutura

```
apps/leads/
├── models.py           # Lead (herda WorkspaceModel)
├── serializers.py      # LeadSerializer, LeadListSerializer
├── viewsets.py         # LeadViewSet (herda WorkspaceViewSet)
├── admin.py            # Configuração do Django Admin
├── urls.py             # Rotas da API
└── tests/              # Testes
    ├── test_models.py
    └── test_viewsets.py
```

---

## 🏗️ Modelo Principal

### Lead

```python
class Lead(WorkspaceModel):
    """Modelo de Lead (exemplo de módulo com multi-tenancy)."""

    STATUS_CHOICES = [
        ("new", "Novo"),
        ("contacted", "Contactado"),
        ("qualified", "Qualificado"),
        ("converted", "Convertido"),
        ("lost", "Perdido"),
    ]

    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    client_workspace = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    notes = models.TextField(blank=True, null=True)
    source = models.CharField(max_length=100, blank=True, null=True)
```

**Características**:
- **Herda `WorkspaceModel`** (multi-tenancy automático)
- **Soft delete** automático
- **Timestamps** automáticos (`created_at`, `updated_at`)
- **Índices otimizados** para queries por workspace

**⚠️ Invariantes**:
- Sempre pertence a uma workspace
- Status sempre válido (choices)
- Email sempre válido

---

## 🔄 ViewSet

### LeadViewSet

```python
class LeadViewSet(WorkspaceViewSet):
    """ViewSet para modelo Lead com filtro automático por workspace."""

    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]

    def get_serializer_class(self):
        """Retorna serializer apropriado para a ação."""
        if self.action == "list":
            return LeadListSerializer
        return LeadSerializer

    def get_queryset(self):
        """Retorna queryset filtrado por workspace e com filtros opcionais."""
        queryset = super().get_queryset()

        # Filtros opcionais
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(client_workspace__icontains=search)
            )

        return queryset
```

**Características**:
- **Herda `WorkspaceViewSet`** (filtro automático por workspace)
- **Filtros opcionais** (status, search)
- **Serializers diferentes** para list/detail
- **Validação de ownership** (previne IDOR)

---

## 📋 Convenções

### ALWAYS (Sempre Fazer)

1. **Herdar `WorkspaceModel`** para dados multi-tenant
2. **Herdar `WorkspaceViewSet`** para ViewSets
3. **Usar serializers diferentes** para list/detail (performance)
4. **Implementar filtros** via query params
5. **Testes completos** (models, viewsets)

### NEVER (Nunca Fazer)

1. **Queries sem filtro de workspace**
2. **Lógica de negócio em viewsets** (usar services)
3. **Serializers muito pesados** (usar list/detail)
4. **Ignorar validação de ownership**

---

## 🔗 Dependências

```
leads (Lead)
    ↑
    └── core (WorkspaceModel, WorkspaceViewSet)
    └── accounts (Workspace)
```

**Regra**: `leads` depende de `core` e `accounts`.

---

## 🧪 Testes

### Arquivos de Teste

```
apps/leads/tests/
├── test_models.py      # Testes do modelo Lead
└── test_viewsets.py    # Testes do LeadViewSet
```

### Cobertura Esperada

- Models: 90%+
- ViewSets: 90%+
- Serializers: 80%+

---

## 📚 Referências

- `@backend/ANALYSIS.md` — Análise geral do backend
- `@backend/apps/core/ANALYSIS.md` — Análise do app core
- `@docs/ARCHITECTURE.md` — Decisões arquiteturais
- `@CLAUDE.md` — Contexto global
- `@AGENTS.md#007backend` — Agente backend

---

## ⚠️ Invariantes (Nunca Quebrar)

1. **Lead sempre pertence a uma workspace**
2. **Status sempre válido** (choices)
3. **Filtro sempre por workspace** (automático via WorkspaceViewSet)
4. **Ownership sempre validado** (WorkspaceObjectPermission)

---

## 🚀 Próximos Passos Recomendados

1. Adicionar campos customizados (ex: tags, prioridade)
2. Implementar webhooks (ex: quando lead muda de status)
3. Adicionar analytics (ex: conversão por source)
4. Implementar exportação (CSV, Excel)

---

## 🔍 Anchors Semânticos

| Termo | Significado |
|-------|-------------|
| `Lead` | Modelo de lead (exemplo de módulo) |
| `WorkspaceModel` | Base model com `workspace_id` |
| `WorkspaceViewSet` | ViewSet base com filtro automático |
| `LeadSerializer` | Serializer para detail |
| `LeadListSerializer` | Serializer para list (otimizado) |


