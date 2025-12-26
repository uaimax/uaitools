# Contrato: Sistema de Módulos Ativáveis por Workspace

> **Versão**: 1.0.0
> **Última atualização**: 2024-12
> **Status**: Contrato definido, não implementado (YAGNI)

---

## Contexto

O bootstrap possui RBAC com permissões no formato `"module.action"` (ex: `"leads.view"`, `"tasks.create"`), mas **não há controle de quais módulos estão disponíveis** por workspace.

**Problema:** Permissão != Disponibilidade. Um usuário pode ter permissão `"leads.view"`, mas o módulo "leads" pode não estar ativo para seu workspace.

**Solução:** Sistema de ativação de módulos por workspace que integra com RBAC existente.

---

## Casos de Uso

1. **SaaS Modular** - Clientes ativam apenas módulos que contrataram
2. **Planos Diferentes** - Plano básico tem módulos A, B; premium tem A, B, C, D
3. **Módulos com IA** - Módulo de IA precisa ser ativado e configurado por cliente
4. **Onboarding** - Novos módulos podem ser ativados gradualmente

---

## Model: WorkspaceModule

### Estrutura

```python
from apps.core.models import WorkspaceModel, UUIDPrimaryKeyMixin
from django.db import models
from django.utils.translation import gettext_lazy as _


class WorkspaceModule(UUIDPrimaryKeyMixin, WorkspaceModel):
    """Controla quais módulos estão ativos para cada workspace.

    Um módulo só está disponível se:
    1. Existe registro WorkspaceModule com is_active=True
    2. E o usuário tem permissão RBAC correspondente
    """

    MODULE_CHOICES = [
        ("leads", _("Leads")),
        ("tasks", _("Tarefas")),
        ("ai_chat", _("Chat com IA")),
        ("analytics", _("Analytics")),
        ("integrations", _("Integrações")),
        # Adicionar novos módulos conforme necessário
    ]

    module_name = models.CharField(
        max_length=100,
        choices=MODULE_CHOICES,
        verbose_name=_("Nome do Módulo"),
        help_text=_("Identificador único do módulo (snake_case)"),
    )
    is_active = models.BooleanField(
        default=False,
        verbose_name=_("Ativo"),
        help_text=_("Se o módulo está ativo para este workspace"),
        db_index=True,
    )
    activated_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Ativado em"),
        help_text=_("Data/hora em que o módulo foi ativado"),
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Configurações"),
        help_text=_("Configurações específicas do módulo para este workspace"),
    )

    class Meta:
        verbose_name = _("Módulo do Workspace")
        verbose_name_plural = _("Módulos do Workspace")
        unique_together = [["workspace", "module_name"]]
        ordering = ["module_name"]
        indexes = [
            models.Index(fields=["workspace", "is_active"]),
            models.Index(fields=["workspace", "module_name"]),
        ]

    def __str__(self) -> str:
        """Representação string do módulo."""
        status = "Ativo" if self.is_active else "Inativo"
        return f"{self.get_module_name_display()} - {self.workspace.name} ({status})"

    def activate(self) -> None:
        """Ativa o módulo para o workspace."""
        from django.utils import timezone
        self.is_active = True
        if not self.activated_at:
            self.activated_at = timezone.now()
        self.save(update_fields=["is_active", "activated_at"])

    def deactivate(self) -> None:
        """Desativa o módulo para o workspace."""
        self.is_active = False
        self.save(update_fields=["is_active"])
```

### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `workspace` | FK | Workspace que possui o módulo (herdado de `WorkspaceModel`) |
| `module_name` | CharField | Identificador do módulo (ex: "leads", "tasks") |
| `is_active` | Boolean | Se o módulo está ativo para o workspace |
| `activated_at` | DateTime | Quando o módulo foi ativado (opcional) |
| `config` | JSONField | Configurações específicas do módulo por workspace |

### Constraints

- `unique_together`: Um workspace não pode ter dois registros do mesmo módulo
- `module_name`: Deve estar em `MODULE_CHOICES` (validação de módulos disponíveis)

---

## Helpers e Utilitários

### Arquivo: `apps/core/modules.py`

```python
"""Helpers para gerenciar módulos ativáveis por workspace."""

from typing import List, Optional
from apps.accounts.models import Workspace


def get_active_modules(workspace: Workspace) -> List[str]:
    """Retorna lista de nomes de módulos ativos para o workspace.

    Args:
        workspace: Workspace para verificar módulos

    Returns:
        Lista de strings com nomes dos módulos ativos (ex: ["leads", "tasks"])
    """
    from apps.core.models import WorkspaceModule

    return list(
        WorkspaceModule.objects.filter(
            workspace=workspace,
            is_active=True,
        ).values_list("module_name", flat=True)
    )


def is_module_active(workspace: Workspace, module_name: str) -> bool:
    """Verifica se um módulo está ativo para o workspace.

    Args:
        workspace: Workspace para verificar
        module_name: Nome do módulo (ex: "leads")

    Returns:
        True se o módulo está ativo, False caso contrário
    """
    from apps.core.models import WorkspaceModule

    return WorkspaceModule.objects.filter(
        workspace=workspace,
        module_name=module_name,
        is_active=True,
    ).exists()


def activate_module(workspace: Workspace, module_name: str, config: Optional[dict] = None) -> "WorkspaceModule":
    """Ativa um módulo para o workspace.

    Args:
        workspace: Workspace que terá o módulo ativado
        module_name: Nome do módulo a ativar
        config: Configurações opcionais do módulo

    Returns:
        Instância de WorkspaceModule criada ou atualizada
    """
    from apps.core.models import WorkspaceModule
    from django.utils import timezone

    module, created = WorkspaceModule.objects.get_or_create(
        workspace=workspace,
        module_name=module_name,
        defaults={
            "is_active": True,
            "activated_at": timezone.now(),
            "config": config or {},
        },
    )

    if not created and not module.is_active:
        module.activate()
        if config:
            module.config = config
            module.save(update_fields=["is_active", "activated_at", "config"])

    return module


def deactivate_module(workspace: Workspace, module_name: str) -> None:
    """Desativa um módulo para o workspace.

    Args:
        workspace: Workspace que terá o módulo desativado
        module_name: Nome do módulo a desativar
    """
    from apps.core.models import WorkspaceModule

    WorkspaceModule.objects.filter(
        workspace=workspace,
        module_name=module_name,
    ).update(is_active=False)
```

---

## Integração com RBAC

### Permission Check Customizado

A permissão só vale se o módulo estiver ativo:

```python
# apps/core/permissions.py (extensão)

from rest_framework.permissions import BasePermission
from apps.core.modules import is_module_active


class HasModulePermission(BasePermission):
    """Verifica se usuário tem permissão E módulo está ativo.

    Combina verificação de permissão RBAC com verificação de módulo ativo.
    """

    def has_permission(self, request, view) -> bool:
        """Verifica permissão e módulo ativo."""
        from apps.core.permissions import HasPermission

        # 1. Verificar permissão RBAC (lógica existente)
        has_perm = HasPermission().has_permission(request, view)
        if not has_perm:
            return False

        # 2. Verificar se módulo está ativo
        required_permission = getattr(view, "required_permission", None)
        if not required_permission:
            return True  # Sem permissão específica, permitir

        # Extrair nome do módulo da permissão (ex: "leads.view" -> "leads")
        module_name = required_permission.split(".")[0]

        workspace = getattr(request, "workspace", None)
        if not workspace:
            return False

        # Verificar se módulo está ativo
        return is_module_active(workspace, module_name)
```

### Uso em ViewSets

```python
# apps/leads/viewsets.py (exemplo)

from apps.core.permissions import HasModulePermission
from apps.core.viewsets import WorkspaceViewSet

class LeadViewSet(WorkspaceViewSet):
    """ViewSet que requer módulo 'leads' ativo."""

    permission_classes = [IsAuthenticated, HasModulePermission]
    required_permission = "leads.view"  # Módulo "leads" deve estar ativo
```

---

## Convenções

### Nomenclatura de Módulos

- **Formato**: `snake_case` (ex: `ai_chat`, não `aiChat` ou `ai-chat`)
- **Singular ou Plural**: Usar plural quando fizer sentido (ex: `leads`, `tasks`)
- **Consistência**: Mesmo nome usado em:
  - `MODULE_CHOICES` do model
  - Permissões RBAC (`"module.action"`)
  - Helpers (`is_module_active(workspace, "module")`)

### Registro de Módulos Disponíveis

Módulos devem ser registrados em `WorkspaceModule.MODULE_CHOICES`:

```python
MODULE_CHOICES = [
    ("leads", _("Leads")),
    ("tasks", _("Tarefas")),
    # Adicionar novos módulos aqui
]
```

**Regra:** Um módulo só existe se estiver em `MODULE_CHOICES`. Isso previne ativação de módulos inexistentes.

### Declaração de Permissões

Módulos declaram suas permissões via convenção de nomenclatura:

- Permissão `"module.action"` implica módulo `"module"`
- Exemplo: `"leads.view"` → módulo `"leads"` deve estar ativo

**Padrão de permissões:**
- `{module}.view` - Visualizar
- `{module}.create` - Criar
- `{module}.update` - Atualizar
- `{module}.delete` - Deletar
- `{module}.*` - Todas as ações do módulo

---

## Configurações por Módulo

O campo `config` (JSONField) permite configurações específicas por workspace:

### Exemplo: Módulo de IA

```python
# Ativar módulo com configurações
activate_module(
    workspace=workspace,
    module_name="ai_chat",
    config={
        "provider": "openai",
        "model": "gpt-4",
        "max_tokens": 2000,
        "temperature": 0.7,
        "enabled_features": ["chat", "summarization"],
    }
)

# Usar configurações
module = WorkspaceModule.objects.get(workspace=workspace, module_name="ai_chat")
provider = module.config.get("provider", "openai")
```

### Exemplo: Módulo de Leads

```python
activate_module(
    workspace=workspace,
    module_name="leads",
    config={
        "auto_deduplication": True,
        "auto_classification": True,
        "max_leads_per_month": 1000,
    }
)
```

---

## Endpoints da API

### ViewSet: WorkspaceModuleViewSet

```python
# apps/core/viewsets.py (adicionar)

from apps.core.models import WorkspaceModule
from apps.core.viewsets import WorkspaceViewSet
from rest_framework import serializers

class WorkspaceModuleSerializer(serializers.ModelSerializer):
    """Serializer para WorkspaceModule."""

    class Meta:
        model = WorkspaceModule
        fields = ["id", "module_name", "is_active", "activated_at", "config", "created_at"]
        read_only_fields = ["id", "activated_at", "created_at"]


class WorkspaceModuleViewSet(WorkspaceViewSet):
    """ViewSet para gerenciar módulos do workspace."""

    queryset = WorkspaceModule.objects.all()
    serializer_class = WorkspaceModuleSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "modules.manage"  # Permissão para gerenciar módulos

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        """Ativa o módulo."""
        module = self.get_object()
        module.activate()
        return Response(WorkspaceModuleSerializer(module).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """Desativa o módulo."""
        module = self.get_object()
        module.deactivate()
        return Response(WorkspaceModuleSerializer(module).data)
```

### Rotas

```python
# api/v1/urls.py

urlpatterns = [
    # ...
    path("modules/", WorkspaceModuleViewSet.as_view({"get": "list", "post": "create"})),
    path("modules/<uuid:pk>/", WorkspaceModuleViewSet.as_view({"get": "retrieve", "patch": "partial_update"})),
    path("modules/<uuid:pk>/activate/", WorkspaceModuleViewSet.as_view({"post": "activate"})),
    path("modules/<uuid:pk>/deactivate/", WorkspaceModuleViewSet.as_view({"post": "deactivate"})),
]
```

---

## Frontend: Hook de Módulos

```typescript
// frontend/src/features/admin/hooks/useModules.ts

import { useAuth } from "@/features/auth/context/AuthContext";
import { api } from "@/config/api";

export function useModules() {
  const { workspace } = useAuth();

  const { data: modules, isLoading } = useQuery({
    queryKey: ["modules", workspace?.id],
    queryFn: () => api.get(`/modules/`).then((res) => res.data),
    enabled: !!workspace,
  });

  const activeModules = modules?.filter((m: any) => m.is_active).map((m: any) => m.module_name) || [];

  const isModuleActive = (moduleName: string) => {
    return activeModules.includes(moduleName);
  };

  return {
    modules,
    activeModules,
    isModuleActive,
    isLoading,
  };
}
```

### Uso em Componentes

```typescript
// frontend/src/features/leads/pages/LeadsPage.tsx

import { useModules } from "@/features/admin/hooks/useModules";

export function LeadsPage() {
  const { isModuleActive } = useModules();

  if (!isModuleActive("leads")) {
    return <ModuleNotActive module="leads" />;
  }

  return <LeadsList />;
}
```

---

## Migração e Seed

### Migration

```python
# apps/core/migrations/XXXX_add_workspace_module.py

from django.db import migrations, models
import uuid

class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkspaceModule",
            fields=[
                ("id", models.UUIDField(...)),
                ("workspace", models.ForeignKey(...)),
                ("module_name", models.CharField(...)),
                ("is_active", models.BooleanField(...)),
                ("activated_at", models.DateTimeField(...)),
                ("config", models.JSONField(...)),
                ("created_at", models.DateTimeField(...)),
                ("updated_at", models.DateTimeField(...)),
            ],
            options={...},
        ),
    ]
```

### Seed (Ativar Módulos Padrão)

```python
# apps/core/management/commands/seed.py (adicionar)

def _activate_default_modules(self, workspace: Workspace) -> None:
    """Ativa módulos padrão para o workspace."""
    from apps.core.modules import activate_module

    default_modules = ["leads"]  # Módulos ativados por padrão

    for module_name in default_modules:
        activate_module(workspace, module_name)
        self.stdout.write(
            self.style.SUCCESS(f"   ✅ Módulo ativado: {module_name}")
        )
```

---

## Testes

### Testes de Helpers

```python
# apps/core/tests/test_modules.py

from django.test import TestCase
from apps.accounts.models import Workspace
from apps.core.modules import (
    get_active_modules,
    is_module_active,
    activate_module,
    deactivate_module,
)

class ModuleHelpersTestCase(TestCase):
    def setUp(self):
        self.workspace = Workspace.objects.create(
            name="Test Workspace",
            slug="test-workspace",
        )

    def test_activate_module(self):
        """Testa ativação de módulo."""
        module = activate_module(self.workspace, "leads")
        self.assertTrue(module.is_active)
        self.assertTrue(is_module_active(self.workspace, "leads"))

    def test_deactivate_module(self):
        """Testa desativação de módulo."""
        activate_module(self.workspace, "leads")
        deactivate_module(self.workspace, "leads")
        self.assertFalse(is_module_active(self.workspace, "leads"))

    def test_get_active_modules(self):
        """Testa listagem de módulos ativos."""
        activate_module(self.workspace, "leads")
        activate_module(self.workspace, "tasks")
        deactivate_module(self.workspace, "tasks")

        active = get_active_modules(self.workspace)
        self.assertIn("leads", active)
        self.assertNotIn("tasks", active)
```

---

## Referências

- [`@backend/apps/core/models.py`](../../backend/apps/core/models.py) - `WorkspaceModel` base
- [`@backend/apps/accounts/models.py`](../../backend/apps/accounts/models.py) - `Workspace`, `Role`, `User`
- [`@backend/apps/core/permissions.py`](../../backend/apps/core/permissions.py) - Sistema RBAC existente
- [`@docs/contracts/README.md`](README.md) - Índice de contratos

---

**Versão**: 1.0.0
**Última atualização**: 2024-12


