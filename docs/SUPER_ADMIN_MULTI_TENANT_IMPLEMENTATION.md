# Super Admin e Multi-Tenant Selector - Implementação

## Resumo

Implementação completa de suporte a **super admin** e **seletor de tenant** para usuários com acesso a múltiplos tenants.

## Funcionalidades Implementadas

### Backend

1. **UserProfileSerializer atualizado**
   - Agora retorna `is_superuser` e `is_staff` no perfil do usuário
   - Arquivo: `backend/apps/accounts/serializers.py`

2. **WorkspaceViewSet modificado**
   - Super admins (`is_superuser=True`) podem ver **todos os dados** sem filtro de workspace
   - Usuários normais continuam vendo apenas dados de sua workspace
   - Arquivo: `backend/apps/core/viewsets.py`

3. **WorkspaceObjectPermission atualizado**
   - Super admins têm acesso a todos os objetos (bypass de validação de workspace)
   - Arquivo: `backend/apps/core/permissions.py`

### Frontend

1. **AuthContext atualizado**
   - Interface `User` agora inclui `is_superuser` e `is_staff`
   - Arquivo: `frontend/src/contexts/AuthContext.tsx`

2. **Hook useAvailableTenants**
   - Lista tenants disponíveis para o usuário
   - Super admins veem todos os tenants ativos
   - Usuários normais veem apenas seu próprio tenant
   - Arquivo: `frontend/src/hooks/admin/useAvailableTenants.ts`

3. **Componente TenantSelector**
   - Seletor de tenant no header
   - Exibido apenas quando há mais de um tenant disponível
   - Permite trocar de tenant (recarrega a página)
   - Arquivo: `frontend/src/components/admin/layout/TenantSelector.tsx`

4. **Header atualizado**
   - Inclui o `TenantSelector` no header
   - Arquivo: `frontend/src/components/admin/layout/Header.tsx`

5. **Hook useTable atualizado**
   - Super admins não precisam de `tenantId` para buscar dados
   - Usuários normais continuam precisando de `tenantId`
   - Arquivo: `frontend/src/hooks/admin/useTable.ts`

## Como Funciona

### Super Admin

1. **Backend**: Quando `is_superuser=True`, o `WorkspaceViewSet` não aplica filtro de workspace
2. **Frontend**: O `useTable` permite buscar dados sem `tenantId` quando `is_superuser=True`
3. **Permissões**: `WorkspaceObjectPermission` permite acesso a todos os objetos para super admins

### Seletor de Tenant

1. **Listagem**: `useAvailableTenants` busca tenants disponíveis
   - Super admins: todos os tenants ativos via `/workspaces/`
   - Usuários normais: apenas seu próprio tenant

2. **Troca de Tenant**:
   - Atualiza `localStorage` com o novo `workspace_id`
   - Recarrega a página para aplicar o novo tenant

3. **Exibição**:
   - `TenantSelector` só aparece quando há mais de um tenant disponível
   - Integrado no `Header` do admin panel

## Endpoints Utilizados

- `GET /api/workspaces/` - Lista todos os tenants ativos (público, com cache)
- `GET /api/auth/profile/` - Retorna perfil do usuário (inclui `is_superuser`)

## Fluxo de Dados

### Super Admin Visualizando Todos os Leads

```
1. Frontend: useTable detecta is_superuser=True
2. Frontend: Faz requisição sem exigir tenantId
3. Backend: WorkspaceViewSet.get_queryset() detecta is_superuser=True
4. Backend: Retorna queryset sem filtro de workspace
5. Frontend: Exibe todos os leads de todos os tenants
```

### Troca de Tenant

```
1. Usuário seleciona novo tenant no TenantSelector
2. Frontend: Atualiza localStorage com novo workspace_id
3. Frontend: Recarrega página (window.location.reload())
4. Frontend: apiClient interceptor adiciona novo X-Workspace-ID
5. Backend: WorkspaceMiddleware identifica novo tenant
6. Backend: Filtra dados pelo novo tenant
```

## Segurança

### Backend

- ✅ Super admins têm acesso explícito via `is_superuser`
- ✅ Validação de permissões mantida para usuários normais
- ✅ Filtro de workspace aplicado automaticamente para não-super-admins

### Frontend

- ✅ `TenantSelector` só aparece quando há múltiplos tenants
- ✅ Troca de tenant requer recarregar página (garante consistência)
- ✅ `localStorage` usado apenas para header `X-Workspace-ID`

## Testes

### Como Testar Super Admin

1. Criar um super admin no backend:
   ```python
   python manage.py createsuperuser
   ```

2. Fazer login como super admin

3. Acessar `/admin/leads` - deve ver leads de todos os tenants

4. Verificar se `TenantSelector` aparece no header

5. Trocar de tenant e verificar se dados mudam

### Como Testar Usuário Normal

1. Criar usuário normal (não super admin)

2. Fazer login

3. Acessar `/admin/leads` - deve ver apenas leads do próprio tenant

4. Verificar se `TenantSelector` **não aparece** (apenas 1 tenant)

## Arquivos Modificados

### Backend
- `backend/apps/accounts/serializers.py` - UserProfileSerializer
- `backend/apps/core/viewsets.py` - WorkspaceViewSet
- `backend/apps/core/permissions.py` - WorkspaceObjectPermission

### Frontend
- `frontend/src/contexts/AuthContext.tsx` - Interface User
- `frontend/src/hooks/admin/useAvailableTenants.ts` - Novo hook
- `frontend/src/hooks/admin/useTable.ts` - Suporte a super admin
- `frontend/src/components/admin/layout/TenantSelector.tsx` - Novo componente
- `frontend/src/components/admin/layout/Header.tsx` - Inclui TenantSelector

## Dependências Adicionadas

- `cmdk` - Para componente Command (já estava no package.json)
- `@radix-ui/react-popover` - Para componente Popover (já estava no package.json)

## Próximos Passos (Opcional)

- [ ] Adicionar indicador visual de "Super Admin" no header
- [ ] Adicionar filtro por tenant na DataTable para super admins
- [ ] Melhorar UX da troca de tenant (sem recarregar página)
- [ ] Adicionar cache de tenants disponíveis
- [ ] Adicionar permissão para usuários terem acesso a múltiplos tenants (não apenas super admin)

## Notas

- Super admin é uma funcionalidade poderosa - use com cuidado
- Troca de tenant recarrega a página para garantir consistência
- O seletor só aparece quando há múltiplos tenants disponíveis
- Backend valida permissões mesmo para super admins (segurança em camadas)




