# Seed de Investments - Guia de Uso

## Visão Geral

O comando `seed_investments` popula dados iniciais necessários para o módulo de investimentos funcionar.

## O Que É Populado

### Dados de Referência (Sempre Populados)
Estes dados são **necessários** para o sistema funcionar:

1. **Templates de Estratégias** (`StrategyTemplate`)
   - 5 templates pré-configurados (Dividendos, Value, Crescimento, etc.)
   - Usados pelo sistema de recomendações inteligentes
   - **Sempre populados** (mesmo em modo minimal)

2. **Mapeamento de Setores** (`SectorMapping`)
   - Mapeamento de ~40 tickers principais da B3 por setor
   - Usado para análise de diversificação e recomendações
   - **Sempre populado** (mesmo em modo minimal)

### Dados de Exemplo/Mock (Apenas em Modo Completo)
Estes dados são **opcionais** e apenas para demonstração:

3. **Carteira Padrão com Ativos** (`Portfolio` + `Asset`)
   - Cria uma carteira "Carteira Principal" com 6 ativos de exemplo
   - Quantidades e preços fictícios para demonstração
   - **NÃO populado** em modo minimal

## Modos de Execução

### Modo Completo (Padrão)
Popula tudo: templates, mapeamentos **E** carteiras/ativos de exemplo.

```bash
# Via Makefile
make seed-investments

# Direto
python manage.py seed_investments
```

**Quando usar:**
- Desenvolvimento local
- Ambiente de demonstração
- Testes manuais

### Modo Mínimo (`--minimal`)
Popula apenas dados de referência (templates e mapeamentos), **sem mocks**.

```bash
# Via Makefile
make seed-investments-minimal

# Direto
python manage.py seed_investments --minimal
```

**Quando usar:**
- **Build/Produção** (recomendado)
- Deploy inicial
- Quando usuários criarão suas próprias carteiras via UI
- Ambientes onde não queremos dados de exemplo

## Opções Adicionais

### Limpar Antes de Popular
```bash
python manage.py seed_investments --clear
python manage.py seed_investments --minimal --clear
```

### Para Workspace Específico
```bash
# Por ID
python manage.py seed_investments --workspace-id=<uuid>

# Por nome
python manage.py seed_investments --workspace-name="Meu Workspace"
```

## Integração com Build/Deploy

### Em Produção (Recomendado)
Use o modo minimal no script de inicialização:

```bash
# No entrypoint.sh ou script de deploy
python manage.py migrate
python manage.py seed_investments --minimal  # Apenas dados essenciais
python manage.py collectstatic --noinput
```

### Em Desenvolvimento
Use o modo completo para ter dados de exemplo:

```bash
python manage.py migrate
python manage.py seed_investments  # Com mocks
```

## Resumo

| Modo | Templates | Mapeamentos | Carteiras/Ativos | Uso |
|------|-----------|-------------|------------------|-----|
| **Completo** (padrão) | ✅ | ✅ | ✅ | Dev, Demo |
| **Minimal** (`--minimal`) | ✅ | ✅ | ❌ | **Build/Prod** |

## Comandos Makefile

```bash
make seed-investments              # Modo completo
make seed-investments-minimal      # Modo mínimo (recomendado para prod)
make seed-investments-clear        # Limpa e recria (completo)
```

