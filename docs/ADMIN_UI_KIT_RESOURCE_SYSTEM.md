# Admin UI Kit - Sistema de Recursos Genérico

## 🎯 Problema Resolvido

**Antes**: Cada recurso (Lead, User, Product, etc.) exigia criar 3-4 páginas separadas com muito código repetitivo:
- `LeadsPage.tsx` (lista)
- `LeadFormPage.tsx` (criar)
- `LeadDetailPage.tsx` (detalhes/editar)

**Agora**: Similar ao Django Admin - apenas **configuração**, sem código repetitivo!

## 🏗️ Arquitetura

### 1. Configuração de Recurso (`ResourceConfig`)

Similar ao `ModelAdmin` do Django, você define uma configuração:

```typescript
// frontend/src/config/resources/leads.ts
export const leadResource: ResourceConfig<Lead> = {
  name: "lead",
  namePlural: "leads",
  endpoint: "/leads/",

  fields: [
    { name: "name", label: "Nome", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ],

  tableColumns: [
    { key: "name", label: "Nome" },
    { key: "email", label: "Email" },
  ],

  permissions: {
    create: "leads.create",
    view: "leads.view",
    update: "leads.update",
    delete: "leads.delete",
  },
};
```

### 2. Componentes Genéricos

- **`ResourceListPage`** - Listagem genérica (substitui `LeadsPage`, `UsersPage`, etc.)
- **`ResourceFormPage`** - Formulário genérico (substitui `LeadFormPage`, `UserFormPage`, etc.)
- **`ResourceDetailPage`** - Detalhes genérico (substitui `LeadDetailPage`, etc.)

### 3. Hook Genérico

- **`useResource`** - Gerencia CRUD completo, permissões, navegação

## 📝 Como Usar

### Passo 1: Criar Configuração do Recurso

```typescript
// frontend/src/config/resources/users.ts
import { ResourceConfig } from "@/lib/admin/resource-config";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export const userResource: ResourceConfig<User> = {
  name: "user",
  namePlural: "users",
  endpoint: "/users/",

  fields: [
    { name: "email", label: "Email", type: "email", required: true },
    { name: "first_name", label: "Nome", required: true },
    { name: "last_name", label: "Sobrenome", required: true },
  ],

  tableColumns: [
    { key: "email", label: "Email" },
    { key: "first_name", label: "Nome" },
    { key: "last_name", label: "Sobrenome" },
  ],

  permissions: {
    create: "users.create",
    view: "users.view",
    update: "users.update",
    delete: "users.delete",
  },
};
```

### Passo 2: Criar Páginas (Apenas 1 arquivo!)

```typescript
// frontend/src/pages/admin/UsersPage.tsx
import { ResourceListPage } from "@/components/admin/resources/ResourceListPage";
import { userResource } from "@/config/resources/users";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <ResourceListPage
      config={userResource}
      sidebarIcon={<Users className="h-4 w-4" />}
    />
  );
}
```

### Passo 3: Adicionar Rotas

```typescript
// frontend/src/App.tsx
import UsersPage from "./pages/admin/UsersPage";
import { ResourceFormPage } from "@/components/admin/resources/ResourceFormPage";
import { userResource } from "@/config/resources/users";

<Route
  path="/admin/users"
  element={<ProtectedRoute><UsersPage /></ProtectedRoute>}
/>
<Route
  path="/admin/users/new"
  element={
    <ProtectedRoute>
      <ResourceFormPage config={userResource} />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/users/:id"
  element={
    <ProtectedRoute>
      <ResourceFormPage config={userResource} />
    </ProtectedRoute>
  }
/>
```

## ✨ Vantagens

### Antes (Abordagem Manual)
```typescript
// LeadsPage.tsx - ~170 linhas
// LeadFormPage.tsx - ~173 linhas
// LeadDetailPage.tsx - ~300 linhas
// Total: ~643 linhas por recurso
```

### Agora (Abordagem Configurável)
```typescript
// leads.ts (config) - ~80 linhas
// LeadsPage.tsx - ~10 linhas
// Total: ~90 linhas por recurso
```

**Redução de ~85% de código!** 🎉

## 🔧 Funcionalidades Incluídas Automaticamente

- ✅ Listagem com DataTable
- ✅ Criação de registros
- ✅ Edição de registros
- ✅ Visualização de detalhes
- ✅ Deleção com confirmação
- ✅ Validação de formulários (Zod)
- ✅ Permissões RBAC
- ✅ Breadcrumbs
- ✅ Sidebar navigation
- ✅ Estados de loading/error
- ✅ Empty states
- ✅ Multi-tenancy (automático)

## 🎨 Customização

### Renderização Customizada de Colunas

```typescript
tableColumns: [
  {
    key: "status",
    label: "Status",
    render: (value, row) => (
      <Badge variant={row.status === "active" ? "default" : "secondary"}>
        {row.status_display}
      </Badge>
    ),
  },
],
```

### Campos Customizados

```typescript
fields: [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Ativo" },
      { value: "inactive", label: "Inativo" },
    ],
    schema: z.enum(["active", "inactive"]),
  },
],
```

### Ações Customizadas no Header

```typescript
<ResourceListPage
  config={leadResource}
  headerActions={
    <Button onClick={handleExport}>Exportar</Button>
  }
/>
```

## 📊 Comparação: Django Admin vs Nosso Sistema

| Feature | Django Admin | Nosso Sistema |
|---------|--------------|---------------|
| Configuração declarativa | ✅ `ModelAdmin` | ✅ `ResourceConfig` |
| CRUD automático | ✅ | ✅ |
| Permissões | ✅ | ✅ (RBAC) |
| Validação | ✅ (Model) | ✅ (Zod) |
| Customização de campos | ✅ `fieldsets` | ✅ `fields` |
| Customização de listagem | ✅ `list_display` | ✅ `tableColumns` |
| Filtros | ✅ `list_filter` | 🚧 (Fase 2) |
| Busca | ✅ `search_fields` | 🚧 (Fase 2) |
| Multi-tenancy | ❌ | ✅ (Automático) |

## 🚀 Próximos Passos

1. **Migrar Leads existente** para usar o novo sistema
2. **Criar novos recursos** usando apenas configuração
3. **Adicionar filtros e busca** (Fase 2)
4. **Adicionar ações em massa** (Fase 2)
5. **Exportação de dados** (Fase 2)

## 📚 Exemplo Completo

Veja `frontend/src/config/resources/leads.ts` para um exemplo completo de configuração.

## 🎯 Conclusão

Agora você pode criar CRUD completo para qualquer recurso com:
- **1 arquivo de configuração** (~80 linhas)
- **1 arquivo de página** (~10 linhas)
- **3 rotas** no App.tsx

**Sem repetição de código!** 🎉




