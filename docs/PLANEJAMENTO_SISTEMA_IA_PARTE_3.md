# PLANEJAMENTO: Sistema Inteligente de Investimentos com IA - PARTE 3: INTERFACE E ROADMAP

> **Status**: 📋 Planejamento - Parte 3 de 3
> **Foco**: UI/UX, Background Jobs e Plano de Implementação

---

## 🎨 INTERFACE DO USUÁRIO

### SmartInvestmentsPage
**Substitui**: `InvestmentsDashboard.tsx`
Interface focada em simplicidade:
- **SmartRecommendationForm**: Input simples de valor ("Quanto quer investir?").
- **RecommendationResult**: Exibição clara de ativos, quantidades e **Justificativa da IA**.
- **PortfolioChat**: Chat flutuante ou lateral para tirar dúvidas sobre a carteira.
- **StrategyCard**: Exibição da estratégia ativa com nota em estrelas (⭐⭐⭐⭐☆).

### Componentes de Suporte
- **UserPreferences**: Modal para excluir setores (ex: "Armas", "Tabaco").
- **StrategyPerformance**: Detalhamento da rentabilidade vs IBOV.
- **StrategyValidation**: Alertas sobre necessidade de revisão da estratégia.

---

## 🔄 BACKGROUND JOBS (Tasks)

1. **update_market_data**: A cada 5 min durante pregão (Cotações/Selic).
2. **revalidate_strategies**: Diário às 18h (Ajustes de critérios).
3. **calculate_performance**: Semanal (Nota de performance).
4. **analyze_profiles**: Semanal ou por evento (Perfil do Investidor).
5. **cleanup_cache**: Diário (Manutenção de dados).

---

## 🚀 PLANO DE IMPLEMENTAÇÃO (Roadmap)

### Fase 1: Fundação (Semana 1-2)
- Criação dos 8 novos modelos e migrations.
- Implementação dos Providers (BCB, SectorMapper).
- Carga de templates iniciais.

### Fase 2: Inteligência Core (Semana 3-4)
- ContextAnalyzer e SmartInvestmentAdvisor.
- Atualização do prompt da OpenAI para modo proativo.

### Fase 3: Qualidade e Jobs (Semana 5-6)
- StrategyValidator e PerformanceCalculator.
- Configuração do Celery/Redis para as tarefas automáticas.

### Fase 4: Dados e Chat (Semana 7-10)
- DataFreshnessManager.
- PortfolioChatService e interface do chat.

### Fase 5: UI Nova e Substituição (Semana 11-14)
- SmartInvestmentsPage e componentes React.
- Substituição total da página de investimentos antiga.

### Fase 6: Refinamento (Semana 15-18)
- Endpoints finais, testes automatizados e documentação técnica.
- Otimizações de cache e UX.

---

## 📝 TEMPLATES INICIAIS EXAMPLES

1. **Dividendos Defensivos**: Foco em setores perenes (Energia, Bancos), DY 6-10%.
2. **Value Investing**: Foco em P/L e P/VP baixos, margem de segurança.
3. **Crescimento Balanceado**: Mix de renda e valorização de capital.
4. **Renda Passiva**: Foco em dividendos mensais consistentes.
5. **Conservador**: Baixa volatilidade, foco em preservação de capital.

---

## ✅ CHECKLIST DE VALIDAÇÃO FINAL
- [ ] Recomendação sem configuração manual.
- [ ] IA justifica escolhas de forma clara.
- [ ] Preferências de exclusão são respeitadas.
- [ ] Estratégias auto-ajustáveis conforme o mercado.
- [ ] Performance transparente vs IBOV.
- [ ] Chat funcional com contexto total da conta.

---

**Status Final**: 📋 Planejamento Completo e Organizado
**Próxima Ação**: Iniciar Fase 1 (Modelos e Migrations)



