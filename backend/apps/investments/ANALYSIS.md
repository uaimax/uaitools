# Investments App — Análise do Módulo

> **Última atualização**: 2024-12
> **Domínio**: Consultor de Investimentos Pessoal
> **Status**: ✅ Ativo
> **Zona**: 🟢 VERDE (desenvolvimento normal)

## 🎯 Visão Geral

Módulo de consultor de investimentos pessoal que permite ao usuário:
- Cadastrar sua carteira de investimentos (ações brasileiras)
- Definir estratégia de investimento em texto livre
- Receber recomendações determinísticas baseadas na estratégia
- Monitorar status da carteira com alertas quando ativos saem dos critérios

**Não é um app de investimentos.** É um assistente que aplica as regras que o usuário definiu sobre dados reais de mercado.

## 📁 Estrutura

```
backend/apps/investments/
├── __init__.py
├── models.py              # Portfolio, Asset, Strategy
├── serializers.py          # Serializers com validação
├── viewsets.py             # ViewSets + endpoints customizados
├── urls.py                 # Rotas da API
├── admin.py                # Django Admin
├── services/
│   ├── __init__.py
│   ├── brapi_provider.py      # Integração com Brapi API
│   ├── strategy_parser.py      # Parser de estratégias
│   └── investment_advisor.py  # Gerador de recomendações
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   └── test_viewsets.py
└── ANALYSIS.md
```

## 🏗️ Modelos Principais

### Portfolio
Carteira de investimentos do usuário. Cada workspace pode ter múltiplas carteiras do mesmo tipo.

**Campos:**
- `portfolio_type`: Tipo de carteira (acoes_br, crypto - extensível)
- `name`: Nome opcional da carteira
- `workspace`: FK para Workspace (multi-tenancy)

**Multi-tenancy:**
- Múltiplos usuários no mesmo workspace veem as mesmas carteiras
- Cada usuário filtra automaticamente pelo seu `user.workspace`
- Quando um usuário é adicionado a um workspace existente, ele automaticamente vê as carteiras daquele workspace

**Métodos:**
- `get_total_invested()`: Calcula total investido na carteira

**Constraints:**
- ~~UniqueConstraint removida~~: Permite múltiplas carteiras do mesmo tipo no mesmo workspace

### Asset
Ativo na carteira de investimentos.

**Campos:**
- `portfolio`: FK para Portfolio
- `ticker`: Código do ativo (ex: TAEE11, PETR4)
- `quantity`: Quantidade de unidades
- `average_price`: Preço médio de compra
- `notes`: Observações opcionais

**Métodos:**
- `get_total_invested()`: Calcula total investido no ativo

### Strategy
Estratégia de investimento do usuário.

**Campos:**
- `portfolio`: OneToOne com Portfolio
- `raw_text`: Texto livre da estratégia
- `parsed_rules`: JSONField com regras estruturadas (preenchido automaticamente)
- `strategy_type`: Tipo identificado (dividendos, value, growth, hibrida)

**Comportamento:**
- Ao criar/atualizar, o serializer automaticamente parseia o `raw_text` e preenche `parsed_rules` e `strategy_type`

## 🔄 ViewSets

### PortfolioViewSet
CRUD de portfolios + endpoints customizados:
- `GET /portfolios/{id}/status/`: Status da carteira (alertas)
- `POST /portfolios/{id}/analyze/`: Recomendação de onde investir

**Filtro de Workspace:**
- Sempre filtra por `user.workspace` (não permite ver carteiras de outros workspaces)
- Múltiplos usuários no mesmo workspace veem as mesmas carteiras
- Super admins também veem apenas carteiras do seu próprio workspace

### AssetViewSet
CRUD de ativos com filtro por portfolio.

### StrategyViewSet
CRUD de estratégias com filtro por portfolio.

### QuoteViewSet
Endpoint para buscar cotações:
- `GET /quotes/{ticker}/`: Cotação e dados fundamentalistas

## 📋 Convenções

### Multi-tenancy
- Todos os models herdam `WorkspaceModel`
- ViewSets herdam `WorkspaceViewSet`
- Filtro automático por workspace do usuário (`user.workspace`)
- **Múltiplos usuários no mesmo workspace**: Todos os usuários do mesmo workspace veem as mesmas carteiras
- Quando um usuário é adicionado a um workspace existente, ele automaticamente vê todas as carteiras daquele workspace
- Super admins também veem apenas carteiras do seu próprio workspace (não todas)

### Services

**BrapiProvider:**
- Busca cotações e dados fundamentalistas via Brapi API
- Cache de 5 minutos por ticker
- Suporta token opcional (aumenta rate limit)

**StrategyParser:**
- Parseia texto livre em regras estruturadas
- Identifica tipo de estratégia por palavras-chave
- Extrai critérios numéricos (DY mínimo, P/L máximo, etc)

**InvestmentAdvisor:**
- Avalia carteira vs estratégia (gera alertas)
- Gera recomendações de alocação (template estruturado)
- Em MVP: recomendações mockadas (sem busca real de ativos candidatos)

### APIs Externas

**Brapi (brapi.dev):**
- Endpoint: `https://brapi.dev/api/quote/{ticker}`
- Token opcional via `BRAPI_TOKEN` (env)
- Rate limit: sem token = 5 req/min, com token = mais requisições

## 🔗 Dependências

### Backend
- `requests`: Para chamadas HTTP à Brapi
- `django.core.cache`: Para cache de cotações

### Frontend
- TanStack Query: Para gerenciamento de estado
- React Router: Para navegação
- i18next: Para traduções

## 🧪 Testes

**Cobertura:**
- Testes de models (criação, cálculos, constraints)
- Testes de viewsets (CRUD, filtros, endpoints customizados)

**Estrutura:**
```
tests/
├── test_models.py      # Testes de Portfolio, Asset, Strategy
└── test_viewsets.py    # Testes de ViewSets e endpoints
```

## 📚 Referências

- [`@docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md) - Decisões arquiteturais
- [`@docs/SHARED_VS_CUSTOMIZABLE.md`](../../../docs/SHARED_VS_CUSTOMIZABLE.md) - Código compartilhado vs customizável
- [`@backend/apps/core/models.py`](../../core/models.py) - Models base
- [`@backend/apps/leads/ANALYSIS.md`](../../leads/ANALYSIS.md) - Exemplo de módulo similar

## 🚀 Próximos Passos (Futuro)

1. **Integração com IA real**: Substituir templates por OpenAI/Claude
2. **Busca real de ativos candidatos**: Buscar ativos que passam nos critérios
3. **Módulo Crypto**: Adicionar suporte para criptomoedas
4. **Histórico de consultas**: Salvar recomendações anteriores
5. **Notificações**: Alertar quando ativos saem dos critérios
6. **Conexão com corretoras**: Importar carteira automaticamente

## ⚠️ Limitações do MVP

1. **Recomendações mockadas**: Não busca ativos reais que passam nos critérios
2. **Apenas ações BR**: Crypto e renda fixa não implementados
3. **Parser simples**: Identifica apenas padrões básicos
4. **Sem histórico**: Não salva consultas anteriores
5. **Cache básico**: Usa cache do Django (não Redis dedicado)

## 🔐 Segurança

- Multi-tenancy: Filtro automático por workspace
- Permissões: `WorkspaceObjectPermission` em todos os ViewSets
- Validação: Serializers validam dados de entrada
- Rate limiting: Brapi tem rate limit próprio (respeitado via cache)

