# Contrato: Formulários Dinâmicos

> **Versão**: 1.0.0
> **Última atualização**: 2024-12
> **Status**: Contrato definido, não implementado (YAGNI)

---

## Contexto

O bootstrap possui `ResourceConfig` que permite formulários configuráveis **em código**, mas **não há sistema para criar formulários em runtime** pelo usuário.

**Problema:** Clientes precisam de formulários customizados (campos diferentes, validações específicas) que não podem ser hardcoded.

**Solução:** Sistema de formulários dinâmicos onde usuários criam formulários via interface, definem campos, validações e recebem submissões.

---

## Casos de Uso

1. **Formulários de Captura** - Clientes criam formulários públicos para capturar leads
2. **Campos Customizados** - Cada cliente precisa de campos diferentes
3. **Formulários Internos** - Formulários administrativos criados dinamicamente
4. **Integração com Leads** - Formulários podem criar leads automaticamente

---

## Models

### DynamicForm

```python
from apps.core.models import WorkspaceModel, UUIDPrimaryKeyMixin
from django.db import models
from django.utils.translation import gettext_lazy as _


class DynamicForm(UUIDPrimaryKeyMixin, WorkspaceModel):
    """Formulário dinâmico criado pelo usuário.

    Permite criar formulários em runtime com campos customizados.
    """

    name = models.CharField(
        max_length=255,
        verbose_name=_("Nome"),
        help_text=_("Nome do formulário (ex: 'Formulário de Contato')"),
    )
    slug = models.SlugField(
        max_length=255,
        verbose_name=_("Slug"),
        help_text=_("URL-friendly identifier (ex: 'formulario-contato')"),
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Descrição"),
        help_text=_("Descrição do formulário (opcional)"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Ativo"),
        help_text=_("Se o formulário está ativo e aceitando submissões"),
        db_index=True,
    )
    is_public = models.BooleanField(
        default=False,
        verbose_name=_("Público"),
        help_text=_("Se o formulário pode ser acessado sem autenticação"),
    )
    fields = models.JSONField(
        default=list,
        verbose_name=_("Campos"),
        help_text=_("Array de definições de campos (ver estrutura abaixo)"),
    )
    settings = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Configurações"),
        help_text=_("Configurações do formulário (redirect_url, success_message, etc)"),
    )

    class Meta:
        verbose_name = _("Formulário Dinâmico")
        verbose_name_plural = _("Formulários Dinâmicos")
        unique_together = [["workspace", "slug"]]
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "is_active"]),
            models.Index(fields=["workspace", "slug"]),
            models.Index(fields=["is_public", "is_active"]),
        ]

    def __str__(self) -> str:
        """Representação string do formulário."""
        return f"{self.name} ({self.workspace.name})"

    def get_field_by_name(self, field_name: str) -> dict | None:
        """Retorna definição de campo pelo nome.

        Args:
            field_name: Nome do campo

        Returns:
            Dict com definição do campo ou None se não encontrado
        """
        for field in self.fields:
            if field.get("name") == field_name:
                return field
        return None

    def validate_submission(self, data: dict) -> tuple[bool, dict]:
        """Valida dados submetidos contra definição de campos.

        Args:
            data: Dict com dados submetidos

        Returns:
            Tuple (is_valid, errors_dict)
        """
        errors = {}

        for field_def in self.fields:
            field_name = field_def.get("name")
            field_value = data.get(field_name)

            # Validar required
            if field_def.get("required", False) and not field_value:
                errors[field_name] = f"Campo '{field_def.get('label')}' é obrigatório"
                continue

            # Validar tipo
            field_type = field_def.get("type")
            if field_value and not self._validate_field_type(field_value, field_type, field_def):
                errors[field_name] = f"Valor inválido para campo '{field_def.get('label')}'"
                continue

            # Validar regras customizadas
            validation_rules = field_def.get("validation_rules", {})
            if field_value:
                field_errors = self._validate_rules(field_value, validation_rules, field_def)
                if field_errors:
                    errors[field_name] = field_errors

        return len(errors) == 0, errors

    def _validate_field_type(self, value: any, field_type: str, field_def: dict) -> bool:
        """Valida tipo do campo."""
        if field_type == "email":
            return "@" in str(value)
        elif field_type == "number":
            try:
                float(value)
                return True
            except (ValueError, TypeError):
                return False
        elif field_type == "date":
            # Validação básica - pode ser melhorada
            return isinstance(value, str) and len(value) > 0
        return True  # text, textarea, select, checkbox

    def _validate_rules(self, value: any, rules: dict, field_def: dict) -> str | None:
        """Valida regras customizadas."""
        # Validar min/max length
        if "min_length" in rules and len(str(value)) < rules["min_length"]:
            return f"Mínimo {rules['min_length']} caracteres"
        if "max_length" in rules and len(str(value)) > rules["max_length"]:
            return f"Máximo {rules['max_length']} caracteres"

        # Validar regex
        if "regex" in rules:
            import re
            if not re.match(rules["regex"], str(value)):
                return f"Formato inválido"

        # Validar min/max (para números)
        if field_def.get("type") == "number":
            try:
                num_value = float(value)
                if "min" in rules and num_value < rules["min"]:
                    return f"Valor mínimo: {rules['min']}"
                if "max" in rules and num_value > rules["max"]:
                    return f"Valor máximo: {rules['max']}"
            except (ValueError, TypeError):
                pass

        return None
```

### DynamicFormSubmission

```python
class DynamicFormSubmission(UUIDPrimaryKeyMixin, WorkspaceModel):
    """Submissão de um formulário dinâmico.

    Armazena dados submetidos e metadados da submissão.
    """

    form = models.ForeignKey(
        DynamicForm,
        on_delete=models.CASCADE,
        related_name="submissions",
        verbose_name=_("Formulário"),
    )
    data = models.JSONField(
        default=dict,
        verbose_name=_("Dados"),
        help_text=_("Dados submetidos no formato {field_name: value}"),
    )
    submitted_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Submetido em"),
        db_index=True,
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name=_("Endereço IP"),
    )
    user_agent = models.TextField(
        null=True,
        blank=True,
        max_length=500,
        verbose_name=_("User Agent"),
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="form_submissions",
        verbose_name=_("Usuário"),
        help_text=_("Usuário autenticado que submeteu (se aplicável)"),
    )

    class Meta:
        verbose_name = _("Submissão de Formulário")
        verbose_name_plural = _("Submissões de Formulários")
        ordering = ["-submitted_at"]
        indexes = [
            models.Index(fields=["form", "submitted_at"]),
            models.Index(fields=["workspace", "submitted_at"]),
        ]

    def __str__(self) -> str:
        """Representação string da submissão."""
        return f"Submissão de {self.form.name} em {self.submitted_at}"
```

---

## Estrutura de Campos (JSON Schema)

### Formato de Field Definition

```json
{
  "name": "email",
  "type": "email",
  "label": "E-mail",
  "placeholder": "seu@email.com",
  "help_text": "Digite seu e-mail",
  "required": true,
  "order": 1,
  "validation_rules": {
    "regex": "^[\\w\\.-]+@[\\w\\.-]+\\.[a-z]{2,}$"
  },
  "options": []
}
```

### Tipos de Campo Suportados

| Tipo | Descrição | Validação |
|------|-----------|-----------|
| `text` | Campo de texto simples | Min/max length, regex |
| `email` | E-mail | Formato de e-mail |
| `phone` | Telefone | Formato de telefone (opcional) |
| `number` | Número | Min/max value |
| `textarea` | Texto longo | Min/max length |
| `select` | Dropdown | Deve estar em `options` |
| `radio` | Radio buttons | Deve estar em `options` |
| `checkbox` | Checkbox | Boolean |
| `date` | Data | Formato de data |
| `file` | Upload de arquivo | Tamanho, tipo (futuro) |

### Estrutura Completa de Field

```typescript
interface FieldDefinition {
  name: string;              // Identificador único (snake_case)
  type: FieldType;           // Tipo do campo
  label: string;             // Label exibido
  placeholder?: string;      // Placeholder (opcional)
  help_text?: string;        // Texto de ajuda (opcional)
  required: boolean;         // Se é obrigatório
  order: number;             // Ordem de exibição
  validation_rules?: {       // Regras de validação (opcional)
    min_length?: number;
    max_length?: number;
    min?: number;            // Para number
    max?: number;            // Para number
    regex?: string;          // Regex pattern
  };
  options?: Array<{          // Para select/radio
    value: string;
    label: string;
  }>;
  default_value?: any;       // Valor padrão (opcional)
}
```

### Exemplo Completo de Formulário

```json
{
  "name": "Formulário de Contato",
  "slug": "contato",
  "description": "Formulário para captura de leads",
  "is_active": true,
  "is_public": true,
  "fields": [
    {
      "name": "nome",
      "type": "text",
      "label": "Nome Completo",
      "placeholder": "Digite seu nome",
      "required": true,
      "order": 1,
      "validation_rules": {
        "min_length": 3,
        "max_length": 100
      }
    },
    {
      "name": "email",
      "type": "email",
      "label": "E-mail",
      "placeholder": "seu@email.com",
      "required": true,
      "order": 2,
      "validation_rules": {
        "regex": "^[\\w\\.-]+@[\\w\\.-]+\\.[a-z]{2,}$"
      }
    },
    {
      "name": "telefone",
      "type": "phone",
      "label": "Telefone",
      "placeholder": "(00) 00000-0000",
      "required": false,
      "order": 3
    },
    {
      "name": "assunto",
      "type": "select",
      "label": "Assunto",
      "required": true,
      "order": 4,
      "options": [
        { "value": "vendas", "label": "Vendas" },
        { "value": "suporte", "label": "Suporte" },
        { "value": "outros", "label": "Outros" }
      ]
    },
    {
      "name": "mensagem",
      "type": "textarea",
      "label": "Mensagem",
      "placeholder": "Digite sua mensagem",
      "required": true,
      "order": 5,
      "validation_rules": {
        "min_length": 10,
        "max_length": 1000
      }
    }
  ],
  "settings": {
    "success_message": "Obrigado! Entraremos em contato em breve.",
    "redirect_url": "/obrigado",
    "create_lead": true,
    "lead_mapping": {
      "name": "nome",
      "email": "email",
      "phone": "telefone",
      "notes": "mensagem"
    }
  }
}
```

---

## Endpoints da API

### ViewSet: DynamicFormViewSet

```python
# apps/forms/viewsets.py (novo app)

from apps.core.models import DynamicForm, DynamicFormSubmission
from apps.core.viewsets import WorkspaceViewSet
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated


class DynamicFormSerializer(serializers.ModelSerializer):
    """Serializer para DynamicForm."""

    class Meta:
        model = DynamicForm
        fields = [
            "id", "name", "slug", "description", "is_active", "is_public",
            "fields", "settings", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DynamicFormSubmissionSerializer(serializers.ModelSerializer):
    """Serializer para DynamicFormSubmission."""

    form_name = serializers.CharField(source="form.name", read_only=True)

    class Meta:
        model = DynamicFormSubmission
        fields = [
            "id", "form", "form_name", "data", "submitted_at",
            "ip_address", "user_agent", "user"
        ]
        read_only_fields = ["id", "submitted_at", "user"]


class DynamicFormViewSet(WorkspaceViewSet):
    """ViewSet para gerenciar formulários dinâmicos."""

    queryset = DynamicForm.objects.all()
    serializer_class = DynamicFormSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Permissões diferentes para ações públicas."""
        if self.action == "public_submit":
            return [AllowAny()]
        return super().get_permissions()

    @action(detail=True, methods=["get"], url_path="public")
    def public_form(self, request, pk=None):
        """Retorna formulário público (sem autenticação).

        Usado para embed de formulários em sites externos.
        """
        form = self.get_object()
        if not form.is_public or not form.is_active:
            return Response(
                {"error": "Formulário não disponível"},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(DynamicFormSerializer(form).data)

    @action(detail=True, methods=["post"], url_path="public/submit", permission_classes=[AllowAny])
    def public_submit(self, request, pk=None):
        """Submete formulário público (sem autenticação).

        Valida dados, cria submission e opcionalmente cria lead.
        """
        form = self.get_object()

        if not form.is_public or not form.is_active:
            return Response(
                {"error": "Formulário não disponível"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validar dados
        is_valid, errors = form.validate_submission(request.data)
        if not is_valid:
            return Response(
                {"errors": errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Criar submission
        submission = DynamicFormSubmission.objects.create(
            form=form,
            workspace=form.workspace,
            data=request.data,
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT"),
        )

        # Criar lead se configurado
        if form.settings.get("create_lead"):
            self._create_lead_from_submission(form, submission)

        # Resposta
        success_message = form.settings.get(
            "success_message",
            "Formulário submetido com sucesso!"
        )

        return Response({
            "message": success_message,
            "submission_id": str(submission.id),
            "redirect_url": form.settings.get("redirect_url"),
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def submissions(self, request, pk=None):
        """Lista submissões do formulário."""
        form = self.get_object()
        submissions = DynamicFormSubmission.objects.filter(form=form)
        serializer = DynamicFormSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)

    def _get_client_ip(self, request):
        """Obtém IP do cliente."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip

    def _create_lead_from_submission(self, form: DynamicForm, submission: DynamicFormSubmission):
        """Cria lead a partir de submissão (se configurado)."""
        mapping = form.settings.get("lead_mapping", {})
        if not mapping:
            return

        # Mapear campos do formulário para lead
        lead_data = {}
        for lead_field, form_field in mapping.items():
            lead_data[lead_field] = submission.data.get(form_field)

        # Criar lead
        from apps.leads.models import Lead
        Lead.objects.create(
            workspace=form.workspace,
            name=lead_data.get("name", "Lead de Formulário"),
            email=lead_data.get("email", ""),
            phone=lead_data.get("phone", ""),
            notes=lead_data.get("notes", ""),
            source=f"Formulário: {form.name}",
            status="new",
        )
```

### Rotas

```python
# api/v1/urls.py

urlpatterns = [
    # ...
    path("forms/", DynamicFormViewSet.as_view({"get": "list", "post": "create"})),
    path("forms/<uuid:pk>/", DynamicFormViewSet.as_view({"get": "retrieve", "patch": "partial_update", "delete": "destroy"})),
    path("forms/<uuid:pk>/public/", DynamicFormViewSet.as_view({"get": "public_form"})),
    path("forms/<uuid:pk>/public/submit/", DynamicFormViewSet.as_view({"post": "public_submit"})),
    path("forms/<uuid:pk>/submissions/", DynamicFormViewSet.as_view({"get": "submissions"})),
]
```

---

## Integração com Leads

### Mapeamento Automático

Formulários podem criar leads automaticamente via `settings.lead_mapping`:

```json
{
  "settings": {
    "create_lead": true,
    "lead_mapping": {
      "name": "nome",
      "email": "email",
      "phone": "telefone",
      "notes": "mensagem",
      "source": "Formulário de Contato"
    }
  }
}
```

**Campos mapeáveis:**
- `name` → `Lead.name`
- `email` → `Lead.email`
- `phone` → `Lead.phone`
- `notes` → `Lead.notes`
- `source` → `Lead.source` (pode ser string fixa ou campo do form)

---

## Frontend: Builder de Formulários

### Hook: useDynamicForm

```typescript
// frontend/src/features/forms/hooks/useDynamicForm.ts

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/config/api";

export function useDynamicForm(formId: string | null) {
  const { data: form, isLoading } = useQuery({
    queryKey: ["dynamic-form", formId],
    queryFn: () => api.get(`/forms/${formId}/`).then((res) => res.data),
    enabled: !!formId,
  });

  const submitMutation = useMutation({
    mutationFn: (data: Record<string, any>) =>
      api.post(`/forms/${formId}/public/submit/`, data),
  });

  return {
    form,
    isLoading,
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    error: submitMutation.error,
  };
}
```

### Componente: DynamicFormRenderer

```typescript
// frontend/src/features/forms/components/DynamicFormRenderer.tsx

import { useDynamicForm } from "../hooks/useDynamicForm";
import { FormField } from "@/features/admin/components/forms/FormField";

export function DynamicFormRenderer({ formId }: { formId: string }) {
  const { form, submit, isSubmitting } = useDynamicForm(formId);

  if (!form) return <div>Carregando...</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    submit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {form.fields
        .sort((a, b) => a.order - b.order)
        .map((field) => (
          <FormField
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type}
            placeholder={field.placeholder}
            required={field.required}
            options={field.options}
          />
        ))}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
}
```

---

## Migração

```python
# apps/forms/migrations/0001_initial.py

from django.db import migrations, models
import uuid

class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("core", "0001_initial"),
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="DynamicForm",
            fields=[
                ("id", models.UUIDField(...)),
                ("workspace", models.ForeignKey(...)),
                ("name", models.CharField(...)),
                ("slug", models.SlugField(...)),
                ("description", models.TextField(...)),
                ("is_active", models.BooleanField(...)),
                ("is_public", models.BooleanField(...)),
                ("fields", models.JSONField(...)),
                ("settings", models.JSONField(...)),
                ("created_at", models.DateTimeField(...)),
                ("updated_at", models.DateTimeField(...)),
            ],
        ),
        migrations.CreateModel(
            name="DynamicFormSubmission",
            fields=[
                ("id", models.UUIDField(...)),
                ("form", models.ForeignKey(...)),
                ("workspace", models.ForeignKey(...)),
                ("data", models.JSONField(...)),
                ("submitted_at", models.DateTimeField(...)),
                ("ip_address", models.GenericIPAddressField(...)),
                ("user_agent", models.TextField(...)),
                ("user", models.ForeignKey(...)),
            ],
        ),
    ]
```

---

## Referências

- [`@backend/apps/core/models.py`](../../backend/apps/core/models.py) - `WorkspaceModel` base
- [`@backend/apps/leads/models.py`](../../backend/apps/leads/models.py) - Model `Lead` para integração
- [`@docs/contracts/README.md`](README.md) - Índice de contratos

---

**Versão**: 1.0.0
**Última atualização**: 2024-12


