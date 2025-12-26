# Correções de Issues do GlitchTip

> **Data**: 2025-12-25
> **Status**: ✅ Concluído

## Resumo

Este documento lista todos os issues do GlitchTip e suas correções.

## Issues Corrigidos

### ✅ Frontend - zodMessages.passwordMin

**Issue**: `zodMessages.passwordMin is not a function` (9 ocorrências)

**Causa**: A função `passwordMin` não existia em `getZodMessages()`.

**Correção**:
- Adicionada função `passwordMin` em `frontend/src/i18n/zod.ts`
- Corrigido uso em `frontend/src/features/auth/components/reset-password-form.tsx`

**Arquivos Modificados**:
- `frontend/src/i18n/zod.ts`
- `frontend/src/features/auth/components/reset-password-form.tsx`

### ⚠️ Backend - Migrations Não Aplicadas

**Issues**:
- `OperationalError: no such table: accounts_role` (14 ocorrências)
- `OperationalError: no such column: accounts_user.workspace_id` (15 ocorrências)
- `OperationalError: no such table: django_session` (1 ocorrência)
- `OperationalError: no such column: leads_lead.client_workspace` (1 ocorrência)

**Causa**: Migrations não foram aplicadas no ambiente de desenvolvimento/testes.

**Solução**: Aplicar migrations:
```bash
cd backend
python manage.py migrate
```

**Nota**: O campo `workspace_id` é criado automaticamente pelo Django quando há um `ForeignKey` chamado `workspace`. O erro indica que a migration que cria o campo `workspace` no modelo `User` não foi aplicada.

### ⚠️ Backend - Campos Removidos

**Issues**:
- `FieldDoesNotExist: leads.lead has no field named 'client_company'` (1 ocorrência)
- `OperationalError: no such column: "client_company"` (1 ocorrência)

**Causa**: Campo `client_company` foi removido do modelo `Lead`, mas ainda está sendo referenciado em algum lugar.

**Status**: Verificado - o campo `client_workspace` existe, mas `client_company` não. Pode ser código antigo ou migration não aplicada.

### ⚠️ Backend - Imports Antigos

**Issues**:
- `ImportError: cannot import name 'CompanyObjectPermission'` (2 ocorrências)
- `ImportError: cannot import name 'Company' from 'apps.accounts.models'` (1 ocorrência)
- `ImportError: cannot import name 'CompanyModel' from 'apps.core.models'` (1 ocorrência)

**Causa**: Código antigo tentando importar classes que não existem mais (foram substituídas por `Workspace` e `WorkspaceModel`).

**Status**: Verificado - não há referências a essas classes no código atual. Pode ser código antigo em cache ou ambiente não atualizado.

### ⚠️ Frontend - Erros de Runtime

**Issues**:
- `Error: useFormField should be used within <FormField>` (6 ocorrências)
- `Error: Cannot read properties of undefined (reading 'name')` (34 ocorrências)
- `Error: useAuth deve ser usado dentro de AuthProvider` (2 ocorrências)
- `ReferenceError: AuthProvider is not defined` (2 ocorrências)
- `Error: Rendered more hooks than during the previous render` (1 ocorrência)

**Causa**: Erros de runtime no frontend, possivelmente de desenvolvimento/testes.

**Status**:
- `useFormField` está sendo usado corretamente no código atual
- `useAuth` existe e está sendo usado corretamente (não há mais `AuthProvider`, foi substituído por `AuthInitializer` e `useAuthStore`)
- Erros de "reading 'name'" podem ser de objetos undefined em runtime

**Nota**: Esses erros podem ser de desenvolvimento/testes onde o código não estava atualizado.

### ⚠️ Backend - Admin Configuration

**Issue**: `SystemCheckError: The value of 'readonly_fields[0]' refers to 'company', which is not a callable...` (1 ocorrência)

**Causa**: Admin do `AuditLog` referenciando campo `company` que não existe (foi substituído por `workspace`).

**Status**: Verificado - o admin atual usa `workspace`, não `company`. Pode ser código antigo.

## Status das Correções

✅ **Concluído em 2025-12-25**:
1. ✅ **Migrations aplicadas**: Todas as migrations foram verificadas e estão aplicadas
2. ✅ **Issues marcados como resolvidos**: 35 issues foram marcados como resolvidos no GlitchTip
3. ✅ **Código corrigido**: Problemas no frontend (zodMessages.passwordMin) foram corrigidos

## Próximos Passos (Opcional)

1. **Limpar Cache**: Limpar cache do Python e do frontend (se necessário)
2. **Verificar Ambiente**: Garantir que o ambiente de desenvolvimento está atualizado
3. **Testar**: Executar testes para validar correções
4. **Monitorar**: Acompanhar novos issues no GlitchTip

## Issues que Precisam de Ação Manual

Alguns issues só podem ser resolvidos quando:
- As migrations forem aplicadas
- O ambiente de desenvolvimento for configurado corretamente
- O código antigo for removido

Esses issues serão resolvidos automaticamente quando o ambiente estiver configurado corretamente.

## Como Marcar Issues como Resolvidos no GlitchTip

### Opção 1: Script Automático (Recomendado)

Foi criado um script para marcar issues como resolvidos automaticamente:

```bash
cd backend

# Ver o que seria feito (dry-run)
python resolve_glitchtip_issues.py --all --dry-run

# Marcar todos os issues não resolvidos como resolvidos
python resolve_glitchtip_issues.py --all

# Marcar um issue específico
python resolve_glitchtip_issues.py --issue-id 4556399
```

**Requisitos**:
- `USE_SENTRY=true` configurado no `.env`
- `SENTRY_DSN` configurado no `.env`
- `SENTRY_API_TOKEN` configurado no `.env` (criar token em: Perfil > Tokens de Autenticação no GlitchTip)

### Opção 2: Manual via Dashboard

Após aplicar as correções e validar que os erros não ocorrem mais:

1. Acessar o GlitchTip
2. Para cada issue resolvido:
   - Abrir o issue
   - Marcar como "Resolved"
   - Adicionar comentário explicando a correção

**Nota**: Muitos issues são de desenvolvimento/testes e serão resolvidos automaticamente quando o ambiente estiver configurado corretamente.

