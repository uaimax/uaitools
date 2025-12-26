# Plano Completo de Reescrita do Frontend - Componentes UI → Tailwind Direto

**Data de Criação**: 2025-12-24
**Status**: 📋 Planejado
**Objetivo**: Reescrita completa do frontend usando Tailwind CSS direto, mantendo TODAS as features e integrações existentes

---

## 📋 Índice

1. [Estado Atual Completo](#estado-atual-completo)
2. [Integrações com Backend](#integrações-com-backend)
3. [Features e Funcionalidades](#features-e-funcionalidades)
4. [Estrutura de Código](#estrutura-de-código)
5. [Plano de Reescrita](#plano-de-reescrita)
6. [Checklist Completo](#checklist-completo)

---

## 📊 Estado Atual Completo

### Estrutura de Pastas

```
frontend/src/
├── App.tsx                    # Roteamento principal
├── main.tsx                   # Entry point
├── index.css                  # Estilos globais
├── App.css                    # Estilos do App
│
├── components/                # Componentes compartilhados
│   ├── ui/                    # Componentes UI (21 componentes)
│   ├── Layout.tsx             # Layout principal
│   ├── ProtectedRoute.tsx     # Proteção de rotas
│   ├── theme-provider.tsx     # Provider de tema (dark/light)
│   ├── theme-toggle.tsx      # Toggle de tema
│   └── forms/                 # Formulários (login, register)
│
├── features/                  # Features organizadas por módulo
│   ├── auth/                  # Autenticação
│   │   ├── AuthContext.tsx    # Context de autenticação
│   │   ├── components/        # Componentes de auth
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   ├── pages/            # Páginas de auth
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── OAuthCallback.tsx
│   │   ├── hooks/            # Hooks de auth
│   │   │   └── useSocialProviders.ts
│   │   └── services/         # Serviços de auth
│   │       └── socialAuth.ts
│   │
│   ├── admin/                 # Admin UI Kit
│   │   ├── components/        # Componentes admin
│   │   │   ├── layout/        # Layout admin
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Breadcrumbs.tsx
│   │   │   │   └── TenantSelector.tsx
│   │   │   ├── resources/     # Sistema de recursos
│   │   │   │   ├── ResourceListPage.tsx
│   │   │   │   └── ResourceFormPage.tsx
│   │   │   ├── forms/         # Formulários admin
│   │   │   │   ├── FormField.tsx
│   │   │   │   └── SubmitButton.tsx
│   │   │   └── data-display/  # Exibição de dados
│   │   │       ├── DataTable.tsx
│   │   │       ├── SearchBar.tsx
│   │   │       ├── Pagination.tsx
│   │   │       ├── BulkActions.tsx
│   │   │       ├── EmptyState.tsx
│   │   │       └── LoadingState.tsx
│   │   ├── pages/            # Páginas admin
│   │   │   ├── DashboardPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   └── hooks/             # Hooks admin
│   │       ├── useResource.ts      # CRUD genérico
│   │       ├── useTable.ts          # Tabela com paginação
│   │       ├── usePagination.ts     # Paginação
│   │       ├── usePermissions.ts    # Permissões RBAC
│   │       ├── useTenant.ts         # Multi-tenancy
│   │       └── useAvailableTenants.ts
│   │
│   ├── leads/                 # Módulo de Leads (exemplo)
│   │   ├── pages/            # Páginas de leads
│   │   │   └── LeadsPage.tsx
│   │   ├── config/           # Configuração do recurso
│   │   │   └── leads.tsx     # ResourceConfig para leads
│   │   └── services/         # Serviços de leads (se houver)
│   │
│   └── legal/                 # Documentos legais
│       ├── components/        # Componentes legais
│       │   └── legal-document-dialog.tsx
│       └── services/          # Serviços legais
│           └── legal.ts
│
├── pages/                     # Páginas gerais (legado)
│   ├── Home.tsx              # Home page
│   ├── Dashboard.tsx         # Dashboard (legado)
│   └── admin/                # Páginas admin (legado)
│
├── config/                    # Configurações
│   ├── api.ts                # Cliente HTTP (axios)
│   └── resources/            # Configurações de recursos (legado)
│
├── contexts/                  # Contexts (legado)
│   └── AuthContext.tsx
│
├── hooks/                     # Hooks (legado)
│   ├── use-toast.ts
│   └── admin/
│
├── services/                  # Serviços (legado)
│   ├── socialAuth.ts
│   └── legal.ts
│
└── lib/                       # Utilitários
    ├── utils.ts              # Utilitários gerais (cn, etc)
    └── admin/                # Utilitários admin
        ├── resource-config.ts # Sistema de configuração de recursos
        └── formatters.ts      # Formatadores (data, etc)
```

---

## 🔗 Integrações com Backend

### Cliente HTTP (`config/api.ts`)

**Características:**
- Base URL: `VITE_API_URL` ou `/api/v1`
- Credenciais: `withCredentials: true` (cookies/sessão)
- Timeout: 30 segundos
- Headers automáticos:
  - `X-Workspace-ID` / `X-Tenant-ID` (do localStorage)
  - `Authorization: Bearer {token}` (JWT do localStorage)
  - `X-CSRFToken` (do cookie, se não usar JWT)

**Interceptadores:**
- **Request**: Adiciona headers de tenant, JWT e CSRF
- **Response**: Trata 401 (logout) e 403 (acesso negado)

### Endpoints Utilizados

#### Autenticação (`/auth/`)
- `GET /auth/profile/` - Perfil do usuário atual
- `POST /auth/login/` - Login com email/senha
- `POST /auth/register/` - Registro de novo usuário
- `POST /auth/logout/` - Logout
- `GET /auth/providers/` - Lista de providers OAuth disponíveis
- `GET /auth/social/{provider}/login/` - Iniciar OAuth (redirect)

#### Leads (`/leads/`)
- `GET /leads/` - Lista de leads (com paginação, busca, ordenação)
- `GET /leads/{id}/` - Detalhes de um lead
- `POST /leads/` - Criar novo lead
- `PATCH /leads/{id}/` - Atualizar lead
- `DELETE /leads/{id}/` - Deletar lead

#### Legal (`/legal/`)
- `GET /legal/terms/` - Termos e Condições
- `GET /legal/privacy/` - Política de Privacidade

#### Workspaces (`/workspaces/`)
- `GET /workspaces/` - Lista de empresas disponíveis (para super admin)

#### Health Check (`/health/`)
- `GET /health/` - Health check da API

### Multi-Tenancy

**Como Funciona:**
1. Header `X-Workspace-ID` / `X-Tenant-ID` enviado automaticamente
2. Valor vem de `localStorage.getItem("workspace_id")` ou `localStorage.getItem("tenant_id")`
3. Definido após login/registro (do campo `user.workspace.slug`)
4. Super admins podem ver todos os tenants (via `useAvailableTenants`)

### Autenticação

**Fluxos:**
1. **Email/Senha**: Login → JWT token → localStorage → Header Authorization
2. **OAuth Social**: Redirect para backend → Callback → JWT token
3. **Session/Cookies**: Fallback se não houver JWT (CSRF token)

**Estado:**
- Context `AuthContext` gerencia `user`, `loading`, `login`, `register`, `logout`
- `user` contém: `id`, `email`, `first_name`, `last_name`, `workspace`, `is_superuser`, `is_staff`, `permissions`

---

## 🎯 Features e Funcionalidades

### 1. Autenticação (`features/auth/`)

#### Login
- **Página**: `/login`
- **Componente**: `LoginForm`
- **Funcionalidades**:
  - Formulário com email e senha
  - Validação com Zod
  - Tratamento de erros
  - Botões de OAuth social (Google, GitHub, etc)
  - Link para registro
  - Redirecionamento após login bem-sucedido

#### Registro
- **Página**: `/register`
- **Componente**: `RegisterForm`
- **Funcionalidades**:
  - Formulário completo (email, senha, confirmação, nome, sobrenome)
  - Validação com Zod
  - Aceite de termos e política de privacidade
  - Botões de OAuth social
  - Link para login
  - Redirecionamento após registro

#### OAuth Social
- **Página**: `/oauth/callback`
- **Funcionalidades**:
  - Callback após OAuth
  - Tratamento de sucesso/erro
  - Redirecionamento apropriado
- **Hooks**: `useSocialProviders` - Lista providers disponíveis
- **Serviço**: `socialAuth.ts` - `getAvailableProviders()`, `initiateSocialLogin()`

#### Context de Autenticação
- **Context**: `AuthContext`
- **Hook**: `useAuth()`
- **Estado**: `user`, `loading`
- **Métodos**: `login()`, `register()`, `logout()`, `refreshProfile()`

### 2. Admin UI Kit (`features/admin/`)

#### Sistema de Recursos Genérico
- **Conceito**: Similar ao Django Admin - configuração de recursos
- **Configuração**: `ResourceConfig<T>` define campos, colunas, permissões
- **Componentes**:
  - `ResourceListPage` - Lista de recursos (tabela, busca, paginação)
  - `ResourceFormPage` - Formulário de criar/editar
- **Hook**: `useResource()` - CRUD completo genérico

#### Layout Admin
- **Componente**: `MainLayout`
- **Sub-componentes**:
  - `Sidebar` - Menu lateral (colapsável)
  - `Header` - Cabeçalho (título, breadcrumbs, ações)
  - `Breadcrumbs` - Navegação hierárquica
  - `TenantSelector` - Seletor de tenant (super admin)

#### Tabela de Dados
- **Componente**: `DataTable`
- **Funcionalidades**:
  - Colunas configuráveis
  - Seleção de linhas (checkbox)
  - Ordenação por coluna
  - Renderização customizada
  - Ações por linha
- **Hook**: `useTable()` - Estado da tabela (dados, loading, paginação, busca, ordenação)

#### Formulários Admin
- **Componente**: `FormField` - Campo genérico (input, select, textarea)
- **Componente**: `SubmitButton` - Botão de submit com loading
- **Integração**: React Hook Form + Zod

#### Outros Componentes
- `SearchBar` - Busca com debounce
- `Pagination` - Paginação (página, tamanho)
- `BulkActions` - Ações em massa (deletar selecionados)
- `EmptyState` - Estado vazio
- `LoadingState` - Estado de carregamento (skeleton)

#### Hooks Admin
- `useResource()` - CRUD genérico
- `useTable()` - Tabela com paginação/busca/ordenação
- `usePagination()` - Paginação
- `usePermissions()` - Permissões RBAC
- `useTenant()` - Multi-tenancy
- `useAvailableTenants()` - Lista de tenants (super admin)

### 3. Módulo de Leads (`features/leads/`)

#### Configuração do Recurso
- **Arquivo**: `config/leads.tsx`
- **Interface**: `Lead` (id, name, email, phone, status, created_at)
- **Campos**: name, email, phone, status
- **Colunas**: name, email, phone, status (badge), created_at
- **Permissões**: `leads.create`, `leads.view`, `leads.update`, `leads.delete`
- **Status**: new, contacted, qualified, converted, lost

#### Página de Leads
- **Rota**: `/admin/leads`
- **Componente**: `LeadsPage`
- **Funcionalidades**:
  - Lista de leads (via `ResourceListPage`)
  - Busca, paginação, ordenação
  - Ações: criar, editar, deletar
  - Badges de status coloridos

#### Formulário de Leads
- **Rotas**: `/admin/leads/new`, `/admin/leads/:id`
- **Componente**: `ResourceFormPage` (genérico)
- **Funcionalidades**:
  - Criar novo lead
  - Editar lead existente
  - Validação de campos
  - Mensagens de sucesso/erro

### 4. Documentos Legais (`features/legal/`)

#### Componente
- **Componente**: `LegalDocumentDialog`
- **Funcionalidades**:
  - Dialog para exibir termos ou política
  - Markdown renderizado
  - Versão e data de atualização

#### Serviço
- **Serviço**: `legal.ts`
- **Métodos**:
  - `getTerms()` - Busca termos e condições
  - `getPrivacyPolicy()` - Busca política de privacidade

### 5. Páginas Gerais

#### Home
- **Rota**: `/`
- **Componente**: `Home`
- **Funcionalidades**:
  - Health check da API
  - Informações do sistema
  - Links para login/registro

#### Dashboard
- **Rota**: `/admin/dashboard`
- **Componente**: `DashboardPage`
- **Funcionalidades**:
  - Visão geral do sistema
  - Cards com estatísticas
  - Links rápidos

#### Settings
- **Rota**: `/admin/settings`
- **Componente**: `SettingsPage`
- **Funcionalidades**:
  - Configurações do tenant
  - Informações do usuário
  - Gerenciamento de conta

### 6. Proteção de Rotas

#### ProtectedRoute
- **Componente**: `ProtectedRoute`
- **Funcionalidades**:
  - Verifica autenticação
  - Redireciona para `/login` se não autenticado
  - Mostra loading durante verificação

### 7. Tema (Dark/Light)

#### ThemeProvider
- **Componente**: `ThemeProvider` (next-themes)
- **Funcionalidades**:
  - Tema dark/light
  - Persistência no localStorage
  - Suporte a system preference

#### ThemeToggle
- **Componente**: `ThemeToggle`
- **Funcionalidades**:
  - Botão para alternar tema

---

## 🏗️ Estrutura de Código

### Componentes UI Utilizados (21)

#### Simples (substituir por Tailwind)
1. `button` - Botões com variantes
2. `input` - Inputs de texto
3. `badge` - Badges/tags
4. `label` - Labels de formulário
5. `separator` - Separadores visuais
6. `textarea` - Textareas
7. `skeleton` - Loading skeletons
8. `alert` - Alertas/mensagens

#### Médios (criar versões Tailwind)
9. `card` - Cards/containers
10. `avatar` - Avatares de usuário
11. `checkbox` - Checkboxes

#### Complexos (manter ou substituir)
12. `dialog` - Modals/dialogs
13. `alert-dialog` - Dialogs de confirmação
14. `dropdown-menu` - Menus dropdown
15. `popover` - Popovers
16. `select` - Selects customizados
17. `command` - Command palette (usado em TenantSelector)
18. `form` - Integração React Hook Form
19. `table` - Tabelas
20. `toast` - Notificações toast
21. `toaster` - Provider de toasts

### Dependências Principais

#### Core
- `react` ^19.2.0
- `react-dom` ^19.2.0
- `react-router-dom` ^7.11.0
- `typescript` ~5.9.3

#### Estilização
- `tailwindcss` ^3.4.19
- `tailwindcss-animate` ^1.0.7
- `clsx` ^2.1.1
- `tailwind-merge` ^3.4.0
- `class-variance-authority` ^0.7.1

#### Formulários
- `react-hook-form` ^7.69.0
- `@hookform/resolvers` ^5.2.2
- `zod` ^4.2.1

#### HTTP
- `axios` ^1.13.2

#### UI (Radix UI - remover onde possível)
- `@radix-ui/react-*` (múltiplos pacotes)

#### Outros
- `lucide-react` ^0.562.0 (ícones)
- `next-themes` ^0.4.6 (tema)
- `react-markdown` ^10.1.0 (markdown)
- `cmdk` ^1.1.1 (command palette)

### Utilitários

#### `lib/utils.ts`
- `cn()` - Merge de classes Tailwind (clsx + tailwind-merge)

#### `lib/admin/resource-config.ts`
- `ResourceConfig<T>` - Interface de configuração
- `FormFieldConfig` - Configuração de campo
- `TableColumnConfig` - Configuração de coluna
- `createResourceSchema()` - Cria schema Zod

#### `lib/admin/formatters.ts`
- `formatDate()` - Formatação de datas

---

## 📝 Plano de Reescrita

### Fase 0: Preparação (1-2 horas)

#### 0.1 Backup e Documentação
- [ ] Criar branch `rewrite-tailwind-direct`
- [ ] Documentar estado atual (este documento)
- [ ] Listar todos os componentes UI em uso
- [ ] Mapear todas as integrações de API
- [ ] Documentar todos os hooks e contexts

#### 0.2 Setup do Novo Ambiente
- [ ] Criar pasta `frontend-v2/` (temporária) ou trabalhar na mesma
- [ ] Copiar estrutura base (Vite, TypeScript, Tailwind)
- [ ] Configurar Tailwind CSS
- [ ] Configurar variáveis de ambiente
- [ ] Configurar paths (`@/` aliases)

### Fase 1: Infraestrutura Base (2-3 horas)

#### 1.1 Cliente HTTP e Configurações
- [ ] Copiar `config/api.ts` (sem mudanças)
- [ ] Testar integração com backend
- [ ] Verificar interceptadores funcionando

#### 1.2 Contexts e Hooks Base
- [ ] Copiar `AuthContext.tsx` (sem mudanças)
- [ ] Testar autenticação
- [ ] Copiar hooks base (`useTable`, `useResource`, etc)
- [ ] Testar hooks com API

#### 1.3 Utilitários
- [ ] Copiar `lib/utils.ts` (manter `cn()`)
- [ ] Copiar `lib/admin/resource-config.ts`
- [ ] Copiar `lib/admin/formatters.ts`
- [ ] Criar utilitários de classes Tailwind (se necessário)

### Fase 2: Componentes Base Tailwind (3-4 horas)

#### 2.1 Componentes Simples
Criar versões Tailwind direto de:
- [ ] `Button` - Componente simples com variantes
- [ ] `Input` - Input HTML com classes Tailwind
- [ ] `Badge` - Badge simples
- [ ] `Label` - Label HTML com classes
- [ ] `Separator` - HR ou div com classes
- [ ] `Textarea` - Textarea HTML com classes
- [ ] `Alert` - Div com classes de alerta
- [ ] `Skeleton` - Div com animação de loading

#### 2.2 Componentes Médios
Criar versões Tailwind de:
- [ ] `Card` - Card simples (div com classes)
- [ ] `Avatar` - Avatar simples (img ou div)
- [ ] `Checkbox` - Checkbox HTML estilizado

#### 2.3 Testes Visuais
- [ ] Criar página de teste com todos os componentes
- [ ] Verificar responsividade
- [ ] Verificar tema dark/light
- [ ] Ajustar classes conforme necessário

### Fase 3: Autenticação (3-4 horas)

#### 3.1 Formulários de Auth
- [ ] Reescrever `LoginForm` com Tailwind direto
- [ ] Reescrever `RegisterForm` com Tailwind direto
- [ ] Manter validação (React Hook Form + Zod)
- [ ] Manter integração com `AuthContext`
- [ ] Testar fluxo completo de login/registro

#### 3.2 Páginas de Auth
- [ ] Reescrever `Login` page
- [ ] Reescrever `Register` page
- [ ] Reescrever `OAuthCallback` page
- [ ] Testar OAuth social

#### 3.3 Componentes de Auth
- [ ] Reescrever `SocialButton` (se necessário)
- [ ] Testar providers sociais

### Fase 4: Admin UI Kit - Layout (4-5 horas)

#### 4.1 Layout Base
- [ ] Reescrever `MainLayout` com Tailwind
- [ ] Reescrever `Sidebar` com Tailwind
- [ ] Reescrever `Header` com Tailwind
- [ ] Reescrever `Breadcrumbs` com Tailwind
- [ ] Reescrever `TenantSelector` (manter Command ou substituir)

#### 4.2 Navegação
- [ ] Testar navegação entre páginas
- [ ] Testar colapso da sidebar
- [ ] Testar breadcrumbs dinâmicos

### Fase 5: Admin UI Kit - Tabelas e Dados (5-6 horas)

#### 5.1 Tabela de Dados
- [ ] Reescrever `DataTable` com Tailwind (table HTML)
- [ ] Manter funcionalidades: seleção, ordenação, renderização
- [ ] Integrar com `useTable` hook
- [ ] Testar paginação, busca, ordenação

#### 5.2 Componentes de Dados
- [ ] Reescrever `SearchBar` com Tailwind
- [ ] Reescrever `Pagination` com Tailwind
- [ ] Reescrever `BulkActions` com Tailwind
- [ ] Reescrever `EmptyState` com Tailwind
- [ ] Reescrever `LoadingState` com Tailwind (skeleton)

#### 5.3 Testes
- [ ] Testar tabela com dados reais
- [ ] Testar todas as funcionalidades
- [ ] Verificar performance

### Fase 6: Admin UI Kit - Formulários (4-5 horas)

#### 6.1 Formulários Genéricos
- [ ] Reescrever `FormField` com Tailwind
- [ ] Suportar: text, email, password, number, select, textarea
- [ ] Manter integração com React Hook Form
- [ ] Manter validação com Zod
- [ ] Reescrever `SubmitButton` com Tailwind

#### 6.2 Páginas de Formulário
- [ ] Reescrever `ResourceFormPage` com Tailwind
- [ ] Reescrever `ResourceListPage` com Tailwind
- [ ] Testar CRUD completo

### Fase 7: Módulo de Leads (2-3 horas)

#### 7.1 Configuração
- [ ] Copiar `config/leads.tsx` (sem mudanças)
- [ ] Verificar compatibilidade

#### 7.2 Páginas
- [ ] Reescrever `LeadsPage` com Tailwind
- [ ] Testar lista de leads
- [ ] Testar criar/editar/deletar leads
- [ ] Testar busca, paginação, ordenação

### Fase 8: Páginas Gerais (2-3 horas)

#### 8.1 Home
- [ ] Reescrever `Home` page com Tailwind
- [ ] Manter health check
- [ ] Testar integração

#### 8.2 Dashboard
- [ ] Reescrever `DashboardPage` com Tailwind
- [ ] Manter cards e estatísticas
- [ ] Testar visualização

#### 8.3 Settings
- [ ] Reescrever `SettingsPage` com Tailwind
- [ ] Manter funcionalidades
- [ ] Testar edição

### Fase 9: Componentes Complexos (4-6 horas)

#### 9.1 Decisão de Estratégia
Decidir para cada componente complexo:
- [ ] `Dialog` - Manter componente UI ou criar próprio?
- [ ] `AlertDialog` - Manter componente UI ou criar próprio?
- [ ] `DropdownMenu` - Manter componente UI ou criar próprio?
- [ ] `Popover` - Manter componente UI ou criar próprio?
- [ ] `Select` - Manter componente UI ou usar nativo estilizado?
- [ ] `Command` - Manter componente UI ou criar próprio?
- [ ] `Toast` - Manter componente UI ou criar próprio?

#### 9.2 Implementação
- [ ] Implementar estratégia escolhida para cada componente
- [ ] Testar acessibilidade
- [ ] Testar funcionalidade

### Fase 10: Documentos Legais (1-2 horas)

#### 10.1 Componente Legal
- [ ] Reescrever `LegalDocumentDialog` com Tailwind
- [ ] Manter renderização de markdown
- [ ] Testar exibição de termos/política

#### 10.2 Serviço
- [ ] Copiar `legal.ts` (sem mudanças)
- [ ] Testar integração

### Fase 11: Proteção e Roteamento (1-2 horas)

#### 11.1 Roteamento
- [ ] Copiar `App.tsx` (ajustar imports)
- [ ] Verificar todas as rotas
- [ ] Testar navegação

#### 11.2 Proteção
- [ ] Reescrever `ProtectedRoute` com Tailwind (loading)
- [ ] Testar redirecionamento
- [ ] Testar proteção de rotas

### Fase 12: Tema e Estilos (2-3 horas)

#### 12.1 Tema
- [ ] Copiar `ThemeProvider` (sem mudanças)
- [ ] Reescrever `ThemeToggle` com Tailwind
- [ ] Testar dark/light mode
- [ ] Verificar todas as páginas com ambos os temas

#### 12.2 Estilos Globais
- [ ] Ajustar `index.css` (variáveis CSS do Tailwind)
- [ ] Remover estilos não utilizados
- [ ] Verificar consistência visual

### Fase 13: Limpeza e Otimização (2-3 horas)

#### 13.1 Remoção de Dependências
- [ ] Remover componentes UI não utilizados
- [ ] Remover dependências Radix UI não utilizadas
- [ ] Atualizar `package.json`
- [ ] Rodar `npm install`

#### 13.2 Limpeza de Código
- [ ] Remover arquivos duplicados (legado)
- [ ] Remover imports não utilizados
- [ ] Limpar código comentado
- [ ] Verificar estrutura de pastas

#### 13.3 Documentação
- [ ] Atualizar `README.md`
- [ ] Atualizar `ANALYSIS.md`
- [ ] Atualizar `.context/` com novos padrões
- [ ] Documentar componentes Tailwind criados

### Fase 14: Testes Finais (3-4 horas)

#### 14.1 Testes Funcionais
- [ ] Testar autenticação (login, registro, logout, OAuth)
- [ ] Testar CRUD de leads
- [ ] Testar navegação
- [ ] Testar permissões RBAC
- [ ] Testar multi-tenancy
- [ ] Testar documentos legais
- [ ] Testar tema dark/light

#### 14.2 Testes Visuais
- [ ] Verificar todas as páginas
- [ ] Verificar responsividade (mobile, tablet, desktop)
- [ ] Verificar acessibilidade básica
- [ ] Verificar performance

#### 14.3 Testes de Integração
- [ ] Testar com backend real
- [ ] Verificar todos os endpoints
- [ ] Verificar headers e interceptadores
- [ ] Verificar tratamento de erros

### Fase 15: Deploy e Validação (1-2 horas)

#### 15.1 Build
- [ ] Rodar `npm run build`
- [ ] Verificar erros de build
- [ ] Verificar tamanho do bundle
- [ ] Otimizar se necessário

#### 15.2 Deploy
- [ ] Deploy em ambiente de teste
- [ ] Testar em produção
- [ ] Validar funcionalidades

---

## ✅ Checklist Completo

### Autenticação
- [ ] Login com email/senha funciona
- [ ] Registro de novo usuário funciona
- [ ] OAuth social funciona (Google, GitHub, etc)
- [ ] Callback OAuth funciona
- [ ] Logout funciona
- [ ] Refresh de perfil funciona
- [ ] Redirecionamento após login funciona
- [ ] Proteção de rotas funciona
- [ ] Tratamento de erros de autenticação funciona

### Admin UI Kit
- [ ] Layout admin renderiza corretamente
- [ ] Sidebar funciona (colapso, navegação)
- [ ] Header funciona (título, breadcrumbs, ações)
- [ ] Breadcrumbs funcionam
- [ ] TenantSelector funciona (super admin)
- [ ] Tabela de dados funciona (listagem)
- [ ] Busca funciona
- [ ] Paginação funciona
- [ ] Ordenação funciona
- [ ] Seleção de linhas funciona
- [ ] Ações em massa funcionam
- [ ] Formulário de criar funciona
- [ ] Formulário de editar funciona
- [ ] Validação de formulários funciona
- [ ] Deletar recurso funciona
- [ ] Permissões RBAC funcionam
- [ ] Multi-tenancy funciona (filtro automático)

### Módulo de Leads
- [ ] Lista de leads funciona
- [ ] Criar lead funciona
- [ ] Editar lead funciona
- [ ] Deletar lead funciona
- [ ] Busca de leads funciona
- [ ] Paginação de leads funciona
- [ ] Ordenação de leads funciona
- [ ] Badges de status funcionam
- [ ] Formatação de datas funciona

### Documentos Legais
- [ ] Dialog de termos funciona
- [ ] Dialog de política funciona
- [ ] Markdown renderiza corretamente
- [ ] Versão e data exibem corretamente

### Páginas Gerais
- [ ] Home page funciona
- [ ] Health check funciona
- [ ] Dashboard funciona
- [ ] Settings funciona

### Integrações
- [ ] Cliente HTTP funciona
- [ ] Headers automáticos funcionam (tenant, JWT, CSRF)
- [ ] Interceptadores funcionam
- [ ] Tratamento de erros 401/403 funciona
- [ ] Todos os endpoints funcionam

### UI/UX
- [ ] Tema dark funciona
- [ ] Tema light funciona
- [ ] Toggle de tema funciona
- [ ] Responsividade funciona (mobile, tablet, desktop)
- [ ] Acessibilidade básica funciona
- [ ] Loading states funcionam
- [ ] Error states funcionam
- [ ] Empty states funcionam
- [ ] Toasts/notificações funcionam

### Performance
- [ ] Bundle size reduzido
- [ ] Carregamento inicial rápido
- [ ] Navegação fluida
- [ ] Sem memory leaks

### Código
- [ ] Sem componentes UI não utilizados
- [ ] Sem dependências Radix UI não utilizadas
- [ ] Sem código duplicado
- [ ] Sem imports não utilizados
- [ ] TypeScript sem erros
- [ ] ESLint sem erros
- [ ] Estrutura de pastas organizada
- [ ] Documentação atualizada

---

## 📚 Aprendizados a Preservar

### Integrações com Backend
1. **Cliente HTTP**: `apiClient` com interceptadores para tenant, JWT, CSRF
2. **Multi-tenancy**: Header `X-Workspace-ID` automático via localStorage
3. **Autenticação**: JWT token + fallback para session/cookies
4. **Endpoints**: Todos os endpoints documentados e testados

### Hooks e Lógica
1. **useResource**: CRUD genérico baseado em configuração
2. **useTable**: Tabela com paginação, busca, ordenação, seleção
3. **usePermissions**: RBAC integrado
4. **useTenant**: Multi-tenancy integrado
5. **AuthContext**: Estado global de autenticação

### Padrões de Código
1. **Estrutura modular**: Features organizadas por módulo
2. **Configuração de recursos**: Similar ao Django Admin
3. **Validação**: React Hook Form + Zod
4. **TypeScript**: Type safety em todo o código
5. **Componentes funcionais**: Hooks ao invés de classes

### Funcionalidades Específicas
1. **OAuth Social**: Fluxo completo implementado
2. **RBAC**: Permissões integradas no sistema
3. **Multi-tenancy**: Filtro automático por tenant
4. **Super Admin**: Acesso a todos os tenants
5. **Documentos Legais**: Renderização de markdown

---

## 🎯 Critérios de Sucesso

### Funcional
- ✅ Todas as features funcionam como antes
- ✅ Todas as integrações com backend funcionam
- ✅ Nenhuma funcionalidade foi perdida

### Técnico
- ✅ Código mais simples (menos abstrações)
- ✅ Menos dependências (sem Radix UI onde possível)
- ✅ Bundle size menor
- ✅ Performance igual ou melhor

### Qualidade
- ✅ TypeScript sem erros
- ✅ ESLint sem erros
- ✅ Código limpo e organizado
- ✅ Documentação atualizada

---

## 📝 Notas Finais

### Estratégia de Migração
- **Reescrita completa** ao invés de refatoração incremental
- **Manter toda a lógica** de integração e hooks
- **Substituir apenas UI** (componentes UI → Tailwind direto)
- **Testar cada fase** antes de prosseguir

### Componentes Complexos
- Decidir caso a caso se manter componentes UI ou criar próprio
- Priorizar simplicidade e menos dependências
- Manter acessibilidade quando criar próprio

### Timeline Estimado
- **Total**: 35-50 horas
- **Fases críticas**: Fase 5 (Tabelas), Fase 6 (Formulários), Fase 9 (Complexos)
- **Fases rápidas**: Fase 1 (Infra), Fase 10 (Legal), Fase 11 (Roteamento)

---

**Status**: 📋 Pronto para iniciar Fase 0

**Próximo Passo**: Revisar este plano e iniciar Fase 0 - Preparação

