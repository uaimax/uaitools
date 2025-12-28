# PLANEJAMENTO: Sistema Inteligente de Investimentos com IA - PARTE 2: LÓGICA E FLUXOS

> **Status**: 📋 Planejamento - Parte 2 de 3
> **Foco**: Serviços Backend, APIs e Fluxos de Dados

---

## 🔧 SERVIÇOS E LÓGICA

### 1. ContextAnalyzer
**Arquivo**: `backend/apps/investments/services/context_analyzer.py`
- Analisa carteira (alocação, diversificação), transações e recomendações passadas.
- Analisa contexto macro (Selic, IBOV).
- Usa IA para inferir perfil (`risk_tolerance`, `goal`) e recomendar a melhor estratégia.

### 2. SmartInvestmentAdvisor
**Arquivo**: `backend/apps/investments/services/smart_investment_advisor.py`
- Gera recomendações baseadas no contexto analisado.
- Gera alocações dinâmicas (sem depender de TARGET_ALLOCATION fixo).
- Aplica e valida preferências do usuário.

### 3. StrategyValidator
**Arquivo**: `backend/apps/investments/services/strategy_validator.py`
- Valida se os critérios da estratégia ainda fazem sentido no mercado atual.
- Sugere ajustes (ex: reduzir DY mínimo se a média de mercado cair).

### 4. PerformanceCalculator
**Arquivo**: `backend/apps/investments/services/performance_calculator.py`
- Calcula retorno total, DY realizado e taxa de aderência.
- Atualiza o `performance_score` (estrelas) de cada estratégia.

### 5. DataFreshnessManager
**Arquivo**: `backend/apps/investments/services/data_freshness_manager.py`
- Gerencia o status dos dados ("frescos" vs "desatualizados").
- Aciona atualizações automáticas conforme a necessidade.

### 6. PortfolioChatService
**Arquivo**: `backend/apps/investments/services/portfolio_chat_service.py`
- Processa o chat contextual construindo um prompt rico para a IA.
- Simplifica a resposta técnica para uma linguagem acessível a leigos.

### 7. BCBProvider & SectorMapper
- **BCBProvider**: Integração com API do Banco Central para Selic e IPCA.
- **SectorMapper**: Mapeamento inteligente de tickers para setores da B3.

---

## 📡 APIS E LIMITAÇÕES

### Fontes de Dados
1. **BRAPI**: Cotações, fundamentos básicos (P/L, DY) e dividendos.
2. **BCB API**: Índices macroeconômicos oficiais.
3. **SectorMapping (Próprio)**: Tabela gerenciada para setores da B3.

### Limitações Aceitas
- Ausência de dados complexos (ROE, Payout, Dívida/EBITDA) em APIs gratuitas.
- **Estratégia**: IA infere qualidade baseada em histórico e métricas disponíveis.

---

## 🔄 FLUXOS PRINCIPAIS

### Fluxo 1: Recomendação Inteligente
Usuário solicita → ContextAnalyzer gera snapshot → Advisor seleciona estratégia e ativos → Validator checa conformidade → Usuário recebe recomendação com justificativa.

### Fluxo 2: Validação Periódica (Background)
Job diário → Validator checa macro/yields → Se necessário, altera status para "needs_review" e sugere ajustes.

### Fluxo 3: Performance (Semanal)
Job semanal → Calculator processa retornos e dividendos reais → Atualiza score de estrelas das estratégias.

### Fluxo 4: Chat na Carteira
Usuário pergunta → ChatService monta contexto (Carteira + Estratégia + Mercado) → IA responde explicando conceitos de forma simples.

---

*Continua na Parte 3: Interface e Roadmap.*


