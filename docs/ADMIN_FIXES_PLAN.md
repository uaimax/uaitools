# Plano de Correções - Admin Frontend

## Problemas Identificados

1. **Super Admin não consegue selecionar tenant globalmente**
   - `TenantSelector` só aparece se `tenants.length > 1`
   - Super admin deve poder ver e selecionar qualquer tenant, mesmo tendo apenas um associado
   - Precisa de tratamento especial para `is_superuser`

2. **Página `/admin/documents` não existe**
   - Rota não está definida no `App.tsx`
   - Está no menu do `Sidebar` mas não tem página correspondente

3. **Página `/admin/settings` não mostra seletor de tenant para super admin**
   - `TenantSelector` está presente mas pode não estar funcionando corretamente
   - Super admin precisa de acesso global a todos os tenants

4. **Página `/admin/leads/new` não abre**
   - Preciso verificar `LeadFormPage` e `ResourceFormPage`
   - Pode ser problema de rota ou componente

## Soluções

### 1. Super Admin - Seleção Global de Tenant

**Arquivos a modificar:**
- `frontend/src/features/admin/hooks/useAvailableTenants.ts`
  - Modificar para buscar TODOS os tenants se usuário for super admin
  - Endpoint: `/tenants/` deve retornar todos os tenants para super admin

- `frontend/src/features/admin/components/layout/TenantSelector.tsx`
  - Verificar `is_superuser` do usuário
  - Mostrar seletor sempre que for super admin, mesmo com apenas 1 tenant
  - Adicionar indicador visual de que é super admin

- `frontend/src/features/admin/components/layout/Header.tsx`
  - Adicionar `TenantSelector` no header para super admin
  - Ou garantir que apareça em todas as páginas admin

**Lógica:**
```typescript
// Se super admin, buscar TODOS os tenants
if (user?.is_superuser) {
  // Buscar todos os tenants do sistema
  // Mostrar seletor sempre
} else {
  // Buscar apenas tenants do usuário
  // Mostrar seletor apenas se > 1
}
```

### 2. Página `/admin/documents`

**Opções:**
- **Opção A**: Criar página de documentos (se houver funcionalidade no backend)
- **Opção B**: Remover do menu se não existir funcionalidade
- **Opção C**: Criar placeholder com mensagem "Em breve"

**Decisão**: Criar página placeholder por enquanto, pode ser expandida depois.

**Arquivos a criar/modificar:**
- `frontend/src/features/admin/pages/DocumentsPage.tsx` (novo)
- `frontend/src/App.tsx` (adicionar rota)

### 3. Settings - Seletor de Tenant para Super Admin

**Arquivos a modificar:**
- `frontend/src/features/admin/pages/SettingsPage.tsx`
  - Garantir que `TenantSelector` funcione para super admin
  - Adicionar seção específica para super admin gerenciar tenants

### 4. Página `/admin/leads/new` não abre

**Arquivos a verificar:**
- `frontend/src/features/admin/pages/LeadFormPage.tsx`
- `frontend/src/features/admin/components/resources/ResourceFormPage.tsx`
- `frontend/src/config/resources/leads.ts`

**Possíveis problemas:**
- Erro no componente `ResourceFormPage`
- Problema com configuração do `leadResource`
- Erro de TypeScript ou runtime

## Implementação

### Fase 1: Super Admin - Tenant Selection
1. Modificar `useAvailableTenants` para suportar super admin
2. Modificar `TenantSelector` para sempre mostrar para super admin
3. Adicionar `TenantSelector` no `Header` para acesso global
4. Testar seleção de tenant como super admin

### Fase 2: Página Documents
1. Criar `DocumentsPage.tsx` (placeholder)
2. Adicionar rota no `App.tsx`
3. Testar navegação

### Fase 3: Settings - Super Admin
1. Verificar e corrigir `TenantSelector` em Settings
2. Adicionar seção específica para super admin se necessário
3. Testar troca de tenant em Settings

### Fase 4: Leads New - Debug e Fix
1. Verificar console para erros
2. Verificar `ResourceFormPage` e `leadResource`
3. Corrigir problemas encontrados
4. Testar criação de lead

## Testes

Após cada fase:
- [ ] Super admin consegue ver todos os tenants
- [ ] Super admin consegue trocar de tenant
- [ ] Página `/admin/documents` abre
- [ ] Página `/admin/settings` mostra seletor para super admin
- [ ] Página `/admin/leads/new` abre e funciona

## Notas

- Super admin deve ter acesso a TODOS os tenants do sistema
- Usuários normais só veem seus próprios tenants
- O seletor de tenant deve estar sempre visível para super admin
- Todas as ações devem respeitar o tenant selecionado via `X-Workspace-ID` header



