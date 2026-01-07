# Issues do GlitchTip Resolvidos

## 📋 Resumo

Todos os issues relacionados à refatoração do módulo `investments` foram identificados e corrigidos no código.

## ✅ Issues Corrigidos

### 1. ImportError: DividendHistory (2 issues)
- **IDs**: `4567995` (1426 ocorrências), `4567972` (5 ocorrências)
- **Problema**: `admin.py` tentava importar `DividendHistory` que foi removido
- **Solução**: Modelo removido, `admin.py` atualizado para não importar mais
- **Status**: ✅ Corrigido no código

### 2. ImportError: Asset
- **ID**: `4571218` (7 ocorrências)
- **Problema**: `models.py` estava vazio, `Asset` não existia
- **Solução**: `models.py` restaurado com todos os modelos
- **Status**: ✅ Corrigido no código

### 3. IntegrityError: UNIQUE constraint failed: slug
- **ID**: `4568210` (1 ocorrência)
- **Problema**: `StrategyTemplate.slug` tinha `unique=True` mas deveria ser único por workspace
- **Solução**: Adicionado `unique_together = [("workspace", "slug")]`
- **Status**: ✅ Corrigido no código

### 4. ImportError: Workspace from apps.core.models
- **ID**: `4568209` (1 ocorrência)
- **Problema**: `seed_investments.py` importava `Workspace` de lugar errado
- **Solução**: Import corrigido para `apps.accounts.models`
- **Status**: ✅ Corrigido no código

### 5. KeyError: ('investments', 'dividendhistory')
- **ID**: `4568193` (3 ocorrências)
- **Problema**: Migration tentava referenciar modelo removido
- **Solução**: Migration corrigida, modelo removido explicitamente
- **Status**: ✅ Corrigido no código

### 6. FieldDoesNotExist: PortfolioSnapshot
- **ID**: `4568169` (1 ocorrência)
- **Problema**: Migration tentava remover campo de modelo que estava sendo deletado
- **Solução**: Migration corrigida para deletar modelo primeiro
- **Status**: ✅ Corrigido no código

### 7. NameError: StrategyTemplate
- **ID**: `4568168` (2 ocorrências)
- **Problema**: `viewsets.py` usava `StrategyTemplate` sem importar
- **Solução**: Import adicionado
- **Status**: ✅ Corrigido no código

### 8. ModuleNotFoundError: investment_advisor
- **ID**: `4568062` (1 ocorrência)
- **Problema**: `services/__init__.py` importava serviço removido
- **Solução**: Import removido, serviço deletado
- **Status**: ✅ Corrigido no código

### 9. NameError: MarketPriceHistory, Recommendation, Strategy
- **IDs**: `4568060`, `4568059`, `4568058` (1 ocorrência cada)
- **Problema**: Serializers tentavam usar modelos removidos
- **Solução**: Modelos removidos, serializers atualizados
- **Status**: ✅ Corrigido no código

### 10. ImportError: MarketPriceHistory (2 issues)
- **IDs**: `4568047`, `4568045` (1-2 ocorrências cada)
- **Problema**: `serializers.py` e `viewsets.py` importavam modelo removido
- **Solução**: Imports removidos, modelos deletados
- **Status**: ✅ Corrigido no código

## 🔧 Como Marcar Issues como Resolvidos

### Opção 1: Script Automático (Recomendado)

Foi criado um script específico para marcar os issues corrigidos:

```bash
cd backend
source venv/bin/activate

# Executar o script
python resolve_fixed_issues.py
```

**Requisitos**:
- `USE_SENTRY=true` no `.env` do backend
- `SENTRY_DSN` configurado no `.env` do backend
- `SENTRY_API_TOKEN` configurado no `.env` do backend (criar token em: Perfil > Tokens de Autenticação no GlitchTip)

### Opção 2: Script Genérico

Para marcar todos os issues não resolvidos:

```bash
cd backend
source venv/bin/activate

# Dry-run (ver o que seria feito)
python resolve_glitchtip_issues.py --all --dry-run

# Marcar todos como resolvidos
python resolve_glitchtip_issues.py --all
```

### Opção 3: Manual via Dashboard

1. Acesse https://app.glitchtip.com
2. Para cada issue listado acima:
   - Abra o issue
   - Clique em "Resolve"
   - Adicione comentário: "Corrigido no código - modelo removido/import corrigido"

## 📝 Notas

- Todos os issues foram corrigidos no código
- Os erros devem parar de aparecer após o próximo deploy
- O script `resolve_fixed_issues.py` lista todos os issues corrigidos
- O parser do DSN foi melhorado para lidar com comentários no `.env`

## 🔍 Verificação

Para verificar se os issues foram marcados como resolvidos:

```bash
cd backend
source venv/bin/activate
python test_glitchtip_api.py
```

Ou acesse diretamente: https://app.glitchtip.com/saas-bootstrap/issues/



