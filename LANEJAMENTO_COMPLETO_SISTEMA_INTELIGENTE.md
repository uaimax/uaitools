# PLANEJAMENTO COMPLETO: Sistema Inteligente de Investimentos com IA

> **Data**: 2025-01-XX
> **Objetivo**: Transformar sistema atual em assistente inteligente onde IA é o cérebro proativo
> **Escopo**: Ações B3 (extensível para Bitcoin e outros no futuro)
> **Status**: 📋 Planejamento Completo---

## 🎯 VISÃO GERAL### Problema AtualSistema exige muito do usuário:- Definir estratégia em texto livre- Definir alocações-alvo fixas (TARGET_ALLOCATION)- Definir critérios (DY mínimo, etc.)- IA apenas executa regras pré-definidas### Solução PropostaIA como cérebro proativo que:- ✅ Tem estratégias próprias pré-cadastradas (templates)- ✅ Analisa contexto completo do usuário automaticamente- ✅ Gera recomendações inteligentes sem exigir configuração- ✅ Valida e revalida estratégias continuamente- ✅ Mostra performance histórica de cada estratégia- ✅ Mantém dados sempre atualizados- ✅ Oferece chat contextual na carteira### Fluxo Ideal

---
Usuário: "Tenho R$200, onde invisto?"
↓
Sistema: Analisa contexto completo
↓
Sistema: Escolhe estratégia adequada
↓
Sistema: Gera alocações dinamicamente
↓
Sistema: Retorna recomendação com justificativa
↓
Usuário: Confirma ou ajusta
---## 📋 REQUISITOS FUNCIONAIS### RF1: Dicas/Preferências do Usuário ✅**Objetivo**: Usuário pode dar "dicas" para IA sem precisar configurar tudo.**Funcionalidades**:- Usuário pode definir preferências (ex: "Não investir em armas, setores destrutivos")- Preferências são respeitadas em todas as recomendações- Preferências podem ser editadas a qualquer momento- IA explica quando uma recomendação foi ajustada por preferências- Interface simples: checkboxes de setores + campo de texto livre**Modelo**: `UserPreferences`- `excluded_sectors`: JSON array (ex: ["armas", "defesa", "mineração"])- `preferred_sectors`: JSON array (opcional)- `additional_criteria`: Texto livre (ex: "Não topo investir em setores destrutivos")- `restrictions`: JSON dict (ex: max_concentration_per_asset, excluded_tickers)### RF2: Validação e Revalidação de Estratégias ✅**Objetivo**: Garantir que estratégias sempre fazem sentido no contexto atual.**Funcionalidades**:- Estratégias são validadas antes de serem aplicadas- Estratégias são revalidadas periodicamente (diariamente via background job)- IA alerta quando estratégia precisa de ajustes- Histórico de validações é mantido- Sistema sugere ajustes quando necessário**Modelo**: `StrategyValidation`- Registra cada validação realizada- Status: "valid", "needs_review", "invalid", "warning"- Armazena problemas encontrados e ajustes sugeridos### RF3: Nota/Performance Histórica ✅**Objetivo**: Usuário leigo sabe se estratégia está funcionando bem.**Funcionalidades**:- Cada estratégia tem nota automática de desempenho (0-5 estrelas)- Nota é calculada baseada em resultados reais (não teóricos)- Nota é atualizada continuamente (semanalmente)- Interface mostra nota de forma clara para leigos (⭐⭐⭐⭐☆)- Comparação com benchmark (IBOV)**Modelo**: `StrategyPerformance`- Calcula: total_return, dividend_yield_realized, adherence_rate- Fórmula: `score = (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2)`- Compara com IBOV- Atualiza `StrategyTemplate.performance_score` automaticamente### RF4: Sistema Vivo (Dados Atualizados) ✅**Objetivo**: Garantir que sempre usamos dados mais atualizados possíveis.**Funcionalidades**:- Dados de mercado são atualizados automaticamente- Cache inteligente (atualiza quando necessário, não quando expira)- Background jobs para atualização periódica- Sistema detecta quando dados estão desatualizados- Alertas se dados não puderem ser atualizados**Modelo**: `DataFreshness`- Controla: quote, fundamental, dividend_history, market_context- `freshness_score`: 1.0 = totalmente atualizado, 0.0 = desatualizado- `next_update_due`: Próxima atualização necessária- Sistema verifica antes de usar cache### RF5: Chat Contextual na Carteira ✅**Objetivo**: Usuário pode perguntar qualquer coisa sobre sua carteira.**Funcionalidades**:- Chat simples na interface da carteira- IA tem acesso a TODO o contexto (carteira, histórico, estratégia, mercado)- Respostas em linguagem para leigos (sem jargão técnico)- Histórico de conversas é mantido- Contexto é construído automaticamente a cada mensagem**Modelo**: `PortfolioChat`- Armazena mensagens do usuário e respostas da IA- `context_snapshot`: Snapshot do contexto no momento da mensagem- Permite análise de conversas passadas---## 🏗️ ARQUITETURA DE DADOS### Novos Modelos Django#### 1. StrategyTemplate**Arquivo**: `backend/apps/investments/models.py`class StrategyTemplate(WorkspaceModel):    """Template de estratégia pré-cadastrada pela IA."""        # Identificação    name = models.CharField(max_length=255)  # "Dividendos Defensivos"    slug = models.SlugField(unique=True)    description = models.TextField()    category = models.CharField(max_length=50)  # "dividendos", "value", "growth", "balanced"        # Critérios base (podem ser ajustados pela IA)    base_criteria = models.JSONField(default=dict)    # Exemplo:    # {    #   "dividend_yield_min": 0.06,    #   "dividend_yield_max": 0.10,    #   "pe_ratio_max": 15.0,    #   "price_to_book_max": 2.0,    #   "allowed_sectors": ["financeiro", "energia", "utilities"],    #   "excluded_sectors": ["mineração", "armas"],    #   "min_diversification": 0.70,    #   "max_concentration_per_asset": 0.15,    #   "max_concentration_per_sector": 0.35    # }        # Lógica de adaptação (instruções para IA)    adaptation_logic = models.TextField()    # Exemplo:    # "Ajustar DY mínimo baseado em média de mercado atual.    # Se Selic < 10%, reduzir DY mínimo em 1pp.    # Se volatilidade alta, aumentar filtros de qualidade.    # Se mercado em alta, ser mais seletivo."        # Performance    performance_score = models.DecimalField(        max_digits=5,         decimal_places=2,         default=0    )  # 0-5 (convertido de 0-100)        # Status    is_active = models.BooleanField(default=True)    is_system_template = models.BooleanField(default=True)  # Sistema vs customizado    priority = models.IntegerField(default=0)  # Ordem de prioridade        # Metadados    created_by_ai = models.BooleanField(default=True)    last_validated = models.DateTimeField(null=True, blank=True)    validation_status = models.CharField(        max_length=20,         default="pending"    )  # "valid", "needs_review", "invalid", "pending"        class Meta:        verbose_name = "Template de Estratégia"        verbose_name_plural = "Templates de Estratégias"        ordering = ["-performance_score", "priority"]        indexes = [            models.Index(fields=["category", "is_active"]),            models.Index(fields=["performance_score"]),        ]#### 2. InvestorProfile**Arquivo**: `backend/apps/investments/models.py`class InvestorProfile(WorkspaceModel):    """Perfil do investidor inferido pela IA."""        portfolio = models.OneToOneField(        Portfolio,        on_delete=models.CASCADE,        related_name="profile"    )        # Inferido pela IA    risk_tolerance = models.CharField(        max_length=20    )  # "conservador", "moderado", "arrojado"        investment_horizon = models.CharField(        max_length=20    )  # "curto", "médio", "longo"        primary_goal = models.CharField(        max_length=50    )  # "renda_passiva", "crescimento", "preservação"        experience_level = models.CharField(        max_length=20,        default="iniciante"    )  # "iniciante", "intermediário", "avançado"        # Dados calculados    total_invested = models.DecimalField(        max_digits=15,         decimal_places=2,         default=0    )        average_dividend_yield = models.DecimalField(        max_digits=5,         decimal_places=2,         default=0    )        diversification_score = models.DecimalField(        max_digits=5,         decimal_places=2,         default=0    )  # 0-1 (quanto mais diversificado, maior)        concentration_risk = models.DecimalField(        max_digits=5,         decimal_places=2,         default=0    )  # 0-1 (quanto mais concentrado, maior risco)        # Comportamento    adherence_to_recommendations = models.DecimalField(        max_digits=5,         decimal_places=2,         default=0    )  # % de recomendações seguidas (0-1)        average_holding_period = models.IntegerField(        default=0    )  # Dias médios de retenção        # Metadados    last_analyzed = models.DateTimeField(auto_now=True)    confidence_score = models.DecimalField(        max_digits=5,         decimal_places=2,         default=0    )  # Confiança na inferência (0-1)        # Dados brutos para análise    analysis_data = models.JSONField(default=dict)    # Histórico de análises, padrões identificados, etc.        class Meta:        verbose_name = "Perfil do Investidor"        verbose_name_plural = "Perfis de Investidores"#### 3. UserPreferences**Arquivo**: `backend/apps/investments/models.py`class UserPreferences(WorkspaceModel):    """Preferências do usuário (dicas para IA)."""        portfolio = models.OneToOneField(        Portfolio,        on_delete=models.CASCADE,        related_name="preferences"    )        # Setores excluídos    excluded_sectors = models.JSONField(default=list)    # Exemplo: ["armas", "defesa", "tabaco", "mineração"]        # Setores preferidos (opcional)    preferred_sectors = models.JSONField(default=list)    # Exemplo: ["energia", "utilities"]        # Critérios adicionais (texto livre)    additional_criteria = models.TextField(blank=True)    # Exemplo: "Não topo investir em armas ou setores destrutivos"        # Restrições específicas    restrictions = models.JSONField(default=dict)    # Exemplo: {    #   "max_concentration_per_asset": 0.15,    #   "min_diversification": 0.70,    #   "excluded_tickers": ["PETR4", "VALE3"]    # }        # Metadados    last_updated = models.DateTimeField(auto_now=True)        class Meta:        verbose_name = "Preferências do Usuário"        verbose_name_plural = "Preferências dos Usuários"#### 4. StrategyValidation**Arquivo**: `backend/apps/investments/models.py`class StrategyValidation(WorkspaceModel):    """Registro de validação de estratégia."""        strategy_template = models.ForeignKey(        StrategyTemplate,        on_delete=models.CASCADE,        related_name="validations"    )        portfolio = models.ForeignKey(        Portfolio,        on_delete=models.CASCADE,        related_name="strategy_validations"    )        # Resultado da validação    validation_status = models.CharField(max_length=20)    # "valid", "needs_review", "invalid", "warning"        # Detalhes    validation_result = models.JSONField(default=dict)    # {    #   "criteria_valid": true,    #   "market_conditions_ok": true,    #   "issues": [],    #   "warnings": ["DY mínimo muito alto para mercado atual"]    # }        # Ajustes sugeridos    suggested_adjustments = models.JSONField(default=dict)    # {    #   "dividend_yield_min": {"current": 0.08, "suggested": 0.06, "reason": "Média de mercado atual é 6-7%"}    # }        # Metadados    validated_at = models.DateTimeField(auto_now_add=True)    validated_by = models.CharField(        max_length=50,         default="ai"    )  # "ai" ou "user"        class Meta:        verbose_name = "Validação de Estratégia"        verbose_name_plural = "Validações de Estratégias"        ordering = ["-validated_at"]        indexes = [            models.Index(fields=["strategy_template", "validated_at"]),            models.Index(fields=["portfolio", "validated_at"]),        ]#### 5. StrategyPerformance**Arquivo**: `backend/apps/investments/models.py`class StrategyPerformance(WorkspaceModel):    """Performance histórica de uma estratégia."""        strategy_template = models.ForeignKey(        StrategyTemplate,        on_delete=models.CASCADE,        related_name="performance_records"    )        portfolio = models.ForeignKey(        Portfolio,        on_delete=models.CASCADE,        related_name="strategy_performances"    )        # Período    period_start = models.DateField()    period_end = models.DateField()        # Métricas    total_return = models.DecimalField(        max_digits=10,         decimal_places=2    )  # Retorno total no período (%)        dividend_yield_realized = models.DecimalField(        max_digits=5,         decimal_places=2    )  # DY realizado (dividendos recebidos / valor investido)        recommendations_followed = models.IntegerField(default=0)    recommendations_total = models.IntegerField(default=0)    adherence_rate = models.DecimalField(        max_digits=5,         decimal_places=2    )  # recommendations_followed / recommendations_total        # Score calculado (0-100, depois convertido para 0-5 estrelas)    performance_score = models.DecimalField(        max_digits=5,         decimal_places=2    )    # Fórmula: (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2) * 100        # Comparação com benchmark    vs_ibovespa = models.DecimalField(        max_digits=10,         decimal_places=2    )  # Diferença percentual vs IBOV        # Metadados    calculated_at = models.DateTimeField(auto_now_add=True)        class Meta:        verbose_name = "Performance de Estratégia"        verbose_name_plural = "Performances de Estratégias"        ordering = ["-period_end"]        indexes = [            models.Index(fields=["strategy_template", "period_end"]),            models.Index(fields=["portfolio", "period_end"]),        ]#### 6. PortfolioChat**Arquivo**: `backend/apps/investments/models.py`honclass PortfolioChat(WorkspaceModel):    """Mensagens do chat na carteira."""        portfolio = models.ForeignKey(        Portfolio,        on_delete=models.CASCADE,        related_name="chat_messages"    )        # Mensagem    message = models.TextField()    is_from_user = models.BooleanField(default=True)        # Contexto usado pela IA    context_snapshot = models.JSONField(default=dict)    # Snapshot do contexto no momento da mensagem:    # {    #   "portfolio_value": 10000.00,    #   "strategy": {...},    #   "market_context": {...},    #   "profile": {...}    # }        # Resposta da IA    ai_response = models.TextField(blank=True)    ai_confidence = models.DecimalField(        max_digits=5,         decimal_places=2,         null=True    )  # Confiança da resposta (0-1)        # Metadados    created_at = models.DateTimeField(auto_now_add=True)        class Meta:        verbose_name = "Mensagem do Chat"        verbose_name_plural = "Mensagens do Chat"        ordering = ["created_at"]        indexes = [            models.Index(fields=["portfolio", "created_at"]),        ]#### 7. DataFreshness**Arquivo**: `backend/apps/investments/models.py`class DataFreshness(WorkspaceModel):    """Controle de atualização de dados."""        data_type = models.CharField(max_length=50)    # "quote", "fundamental", "dividend_history", "market_context"        ticker = models.CharField(        max_length=20,         null=True,         blank=True    )  # Null se for dados gerais (ex: IBOV, Selic)        last_updated = models.DateTimeField()    next_update_due = models.DateTimeField()        # Status    is_fresh = models.BooleanField(default=True)    freshness_score = models.DecimalField(        max_digits=5,         decimal_places=2,         default=1.0    )  # 1.0 = totalmente atualizado, 0.0 = desatualizado        # Metadados    update_frequency_minutes = models.IntegerField(default=5)    # Frequência de atualização em minutos        class Meta:        verbose_name = "Controle de Atualização"        verbose_name_plural = "Controles de Atualização"        unique_together = [("workspace", "data_type", "ticker")]        indexes = [            models.Index(fields=["data_type", "last_updated"]),            models.Index(fields=["is_fresh", "next_update_due"]),        ]#### 8. SectorMapping**Arquivo**: `backend/apps/investments/models.py`class SectorMapping(WorkspaceModel):    """Mapeamento de tickers para setores.        Tabela de referência para mapear ticker → setor.    Pode ser populada manualmente ou via importação.    """        ticker = models.CharField(        max_length=20,        unique=True,        db_index=True    )        sector = models.CharField(max_length=100)    # Exemplos: "financeiro", "energia", "utilities", "consumo",     # "telecomunicações", "mineração", "armas", "defesa"        subsector = models.CharField(        max_length=100,        blank=True,        null=True    )  # Opcional: "bancos", "seguros", "transmissão", etc.        company_name = models.CharField(        max_length=255,        blank=True,        null=True    )  # Nome da empresa (opcional)        is_active = models.BooleanField(default=True)        class Meta:        verbose_name = "Mapeamento de Setor"        verbose_name_plural = "Mapeamentos de Setores"        indexes = [            models.Index(fields=["sector", "is_active"]),            models.Index(fields=["ticker"]),        ]        def __str__(self) -> str:        return f"{self.ticker} → {self.sector}"---## 🔧 SERVIÇOS E LÓGICA### 1. ContextAnalyzer**Arquivo**: `backend/apps/investments/services/context_analyzer.py` (NOVO)**Responsabilidades**:- Analisar carteira atual (alocação, diversificação, performance)- Analisar histórico de transações (padrões de comportamento)- Analisar histórico de recomendações (aderência, resultados)- Analisar contexto de mercado (Selic, IBOV, volatilidade, yields médios)- Inferir perfil do investidor usando IA- Recomendar estratégia adequada**Métodos principais**:class ContextAnalyzer:    def analyze_user_context(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa contexto completo do usuário.                Returns:            {                "profile": {...},  # Perfil inferido                "current_strategy": {...},  # Estratégia atual (se houver)                "recommended_strategy": {...},  # Estratégia recomendada                "market_context": {...},  # Contexto de mercado                "portfolio_health": {...},  # Saúde da carteira            }        """        def _analyze_portfolio(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa carteira atual."""        # Calcula: valor total, alocação por ativo, diversificação,        # concentração, DY médio, etc.        def _analyze_transactions(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa histórico de transações."""        # Padrões: frequência, valores, tipos de ativos,        # período de retenção, etc.        def _analyze_recommendations(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa histórico de recomendações."""        # Taxa de aderência, performance das recomendações seguidas,        # padrões de ajustes do usuário, etc.        def _analyze_market_context(        self    ) -> Dict[str, Any]:        """Analisa contexto de mercado atual."""        # Selic, IBOV, volatilidade, yields médios do mercado,        # tendências, etc.        def _infer_profile_with_ai(        self,        portfolio_analysis: Dict[str, Any],        transaction_history: Dict[str, Any],        recommendation_history: Dict[str, Any],        market_context: Dict[str, Any]    ) -> Dict[str, Any]:        """Usa IA para inferir perfil do investidor."""        # Prompt para IA analisar e inferir:        # - Tolerância a risco        # - Horizonte de investimento        # - Objetivo principal        # - Nível de experiência        # - Padrões de comportamento        def _recommend_strategy(        self,        inferred_profile: Dict[str, Any],        portfolio_analysis: Dict[str, Any],        market_context: Dict[str, Any]    ) -> Dict[str, Any]:        """Recomenda estratégia adequada baseado em contexto."""        # Busca templates disponíveis        # Usa IA para escolher melhor template        # Adapta critérios baseado em contexto### 2. SmartInvestmentAdvisor**Arquivo**: `backend/apps/investments/services/smart_investment_advisor.py` (NOVO)**Responsabilidades**:- Gerar recomendações sem exigir configuração do usuário- Selecionar e adaptar estratégia baseado em contexto- Gerar alocações dinamicamente (não usar TARGET_ALLOCATION fixo)- Respeitar preferências do usuário- Validar recomendações antes de retornar**Métodos principais**:class SmartInvestmentAdvisor:    def generate_recommendation(        self,        portfolio: Portfolio,        amount: Decimal,        user_preference: Optional[str] = None  # "mais conservador", "mais agressivo"    ) -> Dict[str, Any]:        """Gera recomendação inteligente baseada em contexto."""        # 1. Analisa contexto completo        # 2. Seleciona/adapta estratégia        # 3. Busca dados de mercado atualizados        # 4. Gera alocações dinamicamente        # 5. Valida e ajusta        # 6. Retorna recomendação completa        def _select_and_adapt_strategy(        self,        context: Dict[str, Any],        user_preference: Optional[str]    ) -> Dict[str, Any]:        """Seleciona e adapta estratégia baseado em contexto."""        # Busca templates adequados        # Usa IA para escolher melhor template        # Adapta critérios baseado em:        # - Contexto de mercado atual        # - Perfil do investidor        # - Estado da carteira        # - Preferências do usuário        def _generate_dynamic_allocations(        self,        context: Dict[str, Any],        strategy: Dict[str, Any],        market_data: Dict[str, Any],        amount: Decimal    ) -> List[Dict[str, Any]]:        """Gera alocações dinamicamente baseado em oportunidades atuais."""        # NÃO usa TARGET_ALLOCATION fixo        # Analisa oportunidades de mercado ATUAIS        # Considera diversificação adequada        # Respeita critérios da estratégia        # Usa IA para gerar alocações inteligentes        def _validate_and_adjust(        self,        allocations: List[Dict[str, Any]],        context: Dict[str, Any],        market_data: Dict[str, Any],        amount: Decimal    ) -> List[Dict[str, Any]]:        """Valida e ajusta alocações."""        # Verifica se respeitam critérios        # Verifica diversificação        # Verifica preferências do usuário        # Ajusta se necessário        def _apply_user_preferences(        self,        allocations: List[Dict[str, Any]],        preferences: UserPreferences    ) -> List[Dict[str, Any]]:        """Aplica preferências do usuário nas alocações."""        # Remove setores excluídos        # Remove tickers excluídos        # Ajusta concentração se necessário### 3. StrategyValidator**Arquivo**: `backend/apps/investments/services/strategy_validator.py` (NOVO)**Responsabilidades**:- Validar estratégia antes de aplicar- Revalidar estratégias periodicamente- Detectar quando estratégia precisa de ajustes- Sugerir melhorias**Métodos principais**:class StrategyValidator:    def validate_strategy(        self,        strategy_template: StrategyTemplate,        portfolio: Portfolio,        market_context: Dict[str, Any]    ) -> Dict[str, Any]:        """Valida estratégia antes de aplicar."""        # Verifica se critérios fazem sentido agora        # Verifica condições de mercado        # Identifica problemas        # Sugere ajustes        def revalidate_all_strategies(self):        """Revalida todas as estratégias ativas."""        # Background job: roda diariamente        def _check_criteria_validity(        self,        criteria: Dict[str, Any],        market_context: Dict[str, Any]    ) -> bool:        """Verifica se critérios são válidos no contexto atual."""        # Ex: DY mínimo de 8% faz sentido se média de mercado é 6-7%?        def _check_market_conditions(        self,        strategy_template: StrategyTemplate,        market_context: Dict[str, Any]    ) -> bool:        """Verifica se condições de mercado são adequadas."""        # Ex: Estratégia de dividendos faz sentido com Selic em queda?        def _suggest_adjustments(        self,        strategy_template: StrategyTemplate,        market_context: Dict[str, Any]    ) -> List[Dict[str, Any]]:        """Sugere ajustes na estratégia."""        # Ex: "Reduzir DY mínimo de 8% para 6% (média de mercado atual)"### 4. PerformanceCalculator**Arquivo**: `backend/apps/investments/services/performance_calculator.py` (NOVO)**Responsabilidades**:- Calcular performance histórica de estratégias- Atualizar notas automaticamente- Comparar com benchmarks- Gerar relatórios**Métodos principais**:class PerformanceCalculator:    def calculate_strategy_performance(        self,        strategy_template: StrategyTemplate,        portfolio: Portfolio,        period_start: date,        period_end: date    ) -> Dict[str, Any]:        """Calcula performance histórica."""        # Calcula: total_return, dividend_yield_realized, adherence_rate        # Compara com IBOV        # Calcula score (0-100)        # Cria registro StrategyPerformance        def update_all_performance_scores(self):        """Atualiza scores de todas as estratégias."""        # Background job: roda semanalmente        # Atualiza StrategyTemplate.performance_score        def _calculate_total_return(        self,        portfolio: Portfolio,        period_start: date,        period_end: date    ) -> Decimal:        """Calcula retorno total no período."""        # (valor_final - valor_inicial) / valor_inicial        def _calculate_dividend_yield_realized(        self,        portfolio: Portfolio,        period_start: date,        period_end: date    ) -> Decimal:        """Calcula DY realizado."""        # dividendos_recebidos / valor_investido        def _calculate_performance_score(        self,        total_return: Decimal,        dividend_yield_realized: Decimal,        adherence_rate: Decimal    ) -> Decimal:        """Calcula score de performance (0-100)."""        # score = (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2)        # return score * 100### 5. DataFreshnessManager**Arquivo**: `backend/apps/investments/services/data_freshness_manager.py` (NOVO)**Responsabilidades**:- Controlar atualização de dados- Detectar dados desatualizados- Agendar atualizações- Garantir que dados estão sempre frescos**Métodos principais**:honclass DataFreshnessManager:    def check_data_freshness(        self,        data_type: str,        ticker: Optional[str] = None    ) -> bool:        """Verifica se dados estão atualizados."""        # Consulta DataFreshness        # Verifica se is_fresh e next_update_due        def update_data_if_needed(        self,        data_type: str,        ticker: Optional[str] = None    ):        """Atualiza dados se necessário."""        # Se não está fresh, força atualização        # Atualiza DataFreshness após buscar        def schedule_updates(self):        """Agenda atualizações."""        # Background job: verifica e agenda atualizações        def _calculate_freshness_score(        self,        last_updated: datetime,        update_frequency_minutes: int    ) -> Decimal:        """Calcula score de atualização (0-1)."""        # Quanto mais próximo de next_update_due, menor o score### 6. PortfolioChatService**Arquivo**: `backend/apps/investments/services/portfolio_chat_service.py` (NOVO)**Responsabilidades**:- Processar mensagens do chat- Construir contexto completo para IA- Gerar respostas em linguagem para leigos- Manter histórico de conversas**Métodos principais**:onclass PortfolioChatService:    def send_message(        self,        portfolio: Portfolio,        message: str    ) -> Dict[str, Any]:        """Processa mensagem do chat."""        # 1. Constrói contexto completo        # 2. Envia para IA com prompt especializado        # 3. Simplifica resposta para leigo        # 4. Salva mensagem e resposta        # 5. Retorna resposta        def _build_complete_context(        self,        portfolio: Portfolio    ) -> Dict[str, Any]:        """Constrói contexto completo para IA."""        # Inclui:        # - Carteira atual (ativos, alocação, valor total)        # - Estratégia ativa (template, critérios, nota)        # - Histórico de recomendações (últimas 10)        # - Performance da estratégia        # - Dados de mercado atualizados        # - Perfil do investidor        # - Preferências do usuário        # - Histórico de transações (últimas 20)        # - Dividendos recebidos (últimos 12 meses)        def _generate_ai_response(        self,        message: str,        context: Dict[str, Any]    ) -> str:        """Gera resposta da IA."""        # Prompt especializado:        # "Você é um consultor de investimentos. Responda em linguagem        # simples para leigos. Use o contexto completo da carteira..."        def _simplify_for_layperson(        self,        response: str    ) -> str:        """Simplifica resposta para leigos."""        # Remove jargão técnico        # Explica termos complexos        # Usa analogias quando necessário### 7. BCBProvider**Arquivo**: `backend/apps/investments/services/bcb_provider.py` (NOVO)**Responsabilidades**:- Buscar dados do Banco Central do Brasil- Selic, IPCA, índices macroeconômicos**Métodos principais**:thonclass BCBProvider:    BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs"        def get_selic_rate(self) -> Decimal:        """Busca taxa Selic atual."""        # Código da série: 432        def get_ipca(self) -> Decimal:        """Busca IPCA atual."""        # Código da série: 433        def get_market_indices(self) -> Dict[str, Any]:        """Busca índices de mercado."""        # IBOV, IBrX, etc.### 8. SectorMapper**Arquivo**: `backend/apps/investments/services/sector_mapper.py` (NOVO)**Responsabilidades**:- Mapear ticker → setor- Buscar todos os tickers de um setor- Validar setores**Métodos principais**:class SectorMapper:    def get_sector(        self,        ticker: str    ) -> Optional[str]:        """Retorna setor de um ticker."""        # Busca em SectorMapping        def get_all_tickers_by_sector(        self,        sector: str    ) -> List[str]:        """Retorna todos os tickers de um setor."""        def is_sector_allowed(        self,        sector: str,        allowed_sectors: List[str]    ) -> bool:        """Verifica se setor é permitido."""---## 📡 APIS E LIMITAÇÕES### APIs Disponíveis#### 1. BRAPI (já integrado)**URL**: `https://brapi.dev/api`**O que oferece**:- ✅ Cotações em tempo real- ✅ P/L, P/VP, DY, EPS- ✅ Histórico de dividendos (últimos 12 meses)- ✅ Market cap, volume**O que NÃO oferece**:- ❌ ROE (Return on Equity)- ❌ Payout ratio- ❌ Dívida líquida / EBITDA- ❌ Setor da empresa- ❌ Histórico de preços (série temporal)- ❌ Dados de balanço completos#### 2. BCB API (Banco Central)**URL**: `https://api.bcb.gov.br/dados/serie/bcdata.sgs`**O que oferece**:- ✅ Selic (taxa de juros)- ✅ IPCA (inflação)- ✅ Dados macroeconômicos- ✅ Histórico completo**Status**: Gratuito, oficial, confiável#### 3. SectorMapping (próprio)**Tipo**: Model Django + dados manuais**O que oferece**:- ✅ Mapeamento ticker → setor- ✅ Lista de setores permitidos/excluídos**Implementação**: Tabela no banco populada manualmente com ~100 principais tickers da B3### Limitações Aceitas**Importante**: Aceitamos que não temos acesso a:- ROE, payout ratio, dívida/EBITDA via APIs gratuitas- Dados de balanço completos**Estratégia**:1. Trabalhar com dados disponíveis (BRAPI + BCB)2. Usar IA para inferir qualidade quando necessário3. Focar em métricas disponíveis: DY, P/L, P/VP, histórico de dividendos4. Futuro: Integrar globaldatafinance (Python) para dados da CVM quando necessário---## 🔄 FLUXOS PRINCIPAIS### Fluxo 1: Usuário Pede RecomendaçãosequenceDiagram    participant User as Usuário    participant UI as SmartInvestmentsPage    participant API as Backend API    participant Context as ContextAnalyzer    participant Advisor as SmartAdvisor    participant Validator as StrategyValidator    participant OpenAI as OpenAI    participant BRAPI as BRAPI    participant BCB as BCB API    User->>UI: "Tenho R$200, onde invisto?"    UI->>API: POST /smart-recommendation/ {amount: 200}        API->>Context: analyze_user_context()    Context->>BRAPI: Busca cotações atualizadas    Context->>BCB: Busca Selic, IBOV    Context->>Context: Analisa carteira, transações, recomendações    Context->>OpenAI: Infere perfil do investidor    Context-->>API: Contexto completo        API->>Advisor: generate_recommendation()    Advisor->>Advisor: _select_and_adapt_strategy()    Advisor->>BRAPI: Busca dados de mercado (candidatos)    Advisor->>Advisor: _generate_dynamic_allocations()    Advisor->>Validator: validate_strategy()    Advisor->>Advisor: _apply_user_preferences()    Advisor->>OpenAI: Gera recomendações finais    Advisor-->>API: Recomendação completa        API-->>UI: {recommendations: [...], strategy: {...}, reasoning: "..."}    UI-->>User: Exibe recomendações com justificativa### Fluxo 2: Validação PeriódicamaidsequenceDiagram    participant Job as Background Job    participant Validator as StrategyValidator    participant Templates as StrategyTemplate    participant BCB as BCB API    participant BRAPI as BRAPI    participant DB as Database    Job->>Templates: Busca estratégias ativas    loop Para cada estratégia        Job->>Validator: validate_strategy()        Validator->>BCB: Busca contexto macro atualizado        Validator->>BRAPI: Busca yields médios do mercado        Validator->>Validator: Valida critérios        Validator->>Validator: Verifica condições de mercado        alt Precisa ajustes            Validator->>Validator: _suggest_adjustments()            Validator->>DB: Salva StrategyValidation (status: "needs_review")        else Válida            Validator->>DB: Salva StrategyValidation (status: "valid")        end    end### Fluxo 3: Cálculo de PerformancemaidsequenceDiagram    participant Job as Background Job    participant Calculator as PerformanceCalculator    participant Portfolio as Portfolio    participant Transactions as Transaction    participant Dividends as DividendReceived    participant DB as Database    Job->>Calculator: update_all_performance_scores()    Calculator->>Portfolio: Busca portfolios com estratégias ativas    loop Para cada portfolio        Calculator->>Calculator: calculate_strategy_performance()        Calculator->>Transactions: Calcula total_return        Calculator->>Dividends: Calcula dividend_yield_realized        Calculator->>Portfolio: Calcula adherence_rate        Calculator->>Calculator: Calcula performance_score        Calculator->>DB: Cria StrategyPerformance        Calculator->>DB: Atualiza StrategyTemplate.performance_score    end### Fluxo 4: Chat na CarteirasequenceDiagram    participant User as Usuário    participant UI as PortfolioChat    participant API as Backend API    participant ChatService as PortfolioChatService    participant Context as ContextAnalyzer    participant OpenAI as OpenAI    participant DB as Database    User->>UI: "Por que você recomendou TAEE11?"    UI->>API: POST /chat/ {message: "..."}        API->>ChatService: send_message()    ChatService->>Context: _build_complete_context()    Context->>Context: Busca carteira, estratégia, histórico, mercado    Context-->>ChatService: Contexto completo        ChatService->>OpenAI: _generate_ai_response()    OpenAI-->>ChatService: Resposta técnica    ChatService->>ChatService: _simplify_for_layperson()    ChatService->>DB: Salva PortfolioChat    ChatService-->>API: Resposta simplificada        API-->>UI: {response: "...", confidence: 0.95}    UI-->>User: Exibe resposta em linguagem simples---## 📊 ENDPOINTS E INTEGRAÇÃO### Novos Endpoints#### 1. Recomendação Inteligente**POST** `/api/investments/portfolios/{id}/smart-recommendation/`**Body**:{  "amount": 200.00,  "user_preference": "mais conservador"  // opcional}**Response**:{  "recommendation": {    "total_amount": 200.00,    "allocations": [      {        "ticker": "TAEE11",        "quantity": 5,        "unit_price": 35.50,        "amount": 177.50,        "reason": "Oportunidade atual, DY 7.9%, contrato ANEEL de 30 anos"      }    ],    "remaining_balance": 22.50,    "reasoning": "Com base na sua carteira atual de R$X e perfil conservador..."  },  "strategy_used": {    "id": 1,    "name": "Dividendos Defensivos",    "performance_score": 4.5,    "category": "dividendos"  },  "context_analyzed": {    "profile": {...},    "market_context": {...}  }}#### 2. Chat na Carteira**POST** `/api/investments/portfolios/{id}/chat/`**Body**:{  "message": "Por que você recomendou TAEE11?"}**Response**:n{  "response": "Recomendei TAEE11 porque ela tem um contrato de 30 anos com a ANEEL que garante receita inflacionada. Isso significa que mesmo em crises, ela continua pagando dividendos. Além disso, o DY atual de 7.9% está acima da média do mercado (6-7%), o que é uma boa oportunidade.",  "confidence": 0.95,  "message_id": "123"}**GET** `/api/investments/portfolios/{id}/chat/`**Response**:{  "messages": [    {      "id": "123",      "message": "Por que você recomendou TAEE11?",      "is_from_user": true,      "ai_response": "...",      "created_at": "2025-01-XX..."    }  ]}#### 3. Preferências do Usuário**GET** `/api/investments/portfolios/{id}/preferences/`**Response**:{  "excluded_sectors": ["armas", "defesa"],  "preferred_sectors": [],  "additional_criteria": "Não topo investir em setores destrutivos",  "restrictions": {    "max_concentration_per_asset": 0.15  }}**PUT** `/api/investments/portfolios/{id}/preferences/`**Body**:on{  "excluded_sectors": ["armas", "defesa", "mineração"],  "additional_criteria": "Não topo investir em armas ou setores destrutivos"}#### 4. Templates de Estratégias**GET** `/api/investments/strategy-templates/`**Response**:n{  "templates": [    {      "id": 1,      "name": "Dividendos Defensivos",      "description": "Foco em dividendos consistentes de setores defensivos",      "category": "dividendos",      "performance_score": 4.5,      "is_active": true    }  ]}#### 5. Validação de Estratégia**POST** `/api/investments/portfolios/{id}/validate-strategy/`**Response**:{  "status": "valid",  "issues": [],  "warnings": [],  "suggested_adjustments": {}}#### 6. Performance de Estratégia**GET** `/api/investments/portfolios/{id}/strategy-performance/`**Response**:{  "current_score": 4.5,  "score_display": "⭐⭐⭐⭐☆",  "historical_performance": [    {      "period_start": "2024-01-01",      "period_end": "2024-12-31",      "total_return": 12.5,      "dividend_yield_realized": 7.2,      "vs_ibovespa": 2.3    }  ],  "vs_ibovespa": 2.3}#### 7. Contexto Analisado (Debug/Transparência)**GET** `/api/investments/portfolios/{id}/context/`**Response**:{  "profile": {    "risk_tolerance": "conservador",    "investment_horizon": "longo",    "primary_goal": "renda_passiva"  },  "portfolio_health": {    "total_value": 10000.00,    "diversification_score": 0.75,    "average_dividend_yield": 7.5  },  "market_context": {    "selic": 8.75,    "ibov": 145000,    "average_dividend_yield_market": 6.8  },  "recommended_strategy": {    "id": 1,    "name": "Dividendos Defensivos"  }}---## 🎨 INTERFACE DO USUÁRIO### Nova Página Principal**Arquivo**: `frontend/src/features/investments/pages/SmartInvestmentsPage.tsx` (NOVO)**Substitui**: `InvestmentsDashboard.tsx`**Interface**:
2. InvestorProfile
Arquivo: backend/apps/investments/models.py
**Componentes**:- `SmartRecommendationForm`: Input de valor + botão- `RecommendationResult`: Exibição de recomendações- `StrategyCard`: Card com estratégia e nota- `ConfirmationDialog`: Diálogo de confirmação- `PortfolioChat`: Chat na carteira- `UserPreferences`: Modal de preferências- `StrategyPerformance`: Modal de performance### Chat na Carteira**Arquivo**: `frontend/src/features/investments/components/PortfolioChat.tsx` (NOVO)**Interface**:
3. UserPreferences
Arquivo: backend/apps/investments/models.py

### Preferências**Arquivo**: `frontend/src/features/investments/components/UserPreferences.tsx` (NOVO)**Interface**:
4. StrategyValidation
Arquivo: backend/apps/investments/models.py
---## 🔄 BACKGROUND JOBS### Jobs Necessários#### 1. Atualização de Dados de Mercado**Frequência**: A cada 5 minutos (horário de mercado: 10h-17h)**Responsabilidade**:- Atualizar cotações de ativos na carteira- Atualizar dados fundamentalistas- Atualizar histórico de dividendos (se necessário)- Atualizar Selic, IBOV**Arquivo**: `backend/apps/investments/tasks.py`n@periodic_task(run_every=crontab(minute='*/5', hour='10-17'))def update_market_data():    """Atualiza dados de mercado a cada 5 minutos."""    # Verifica DataFreshness    # Atualiza se necessário    # Atualiza DataFreshness após atualizar#### 2. Revalidação de Estratégias**Frequência**: Diariamente (após fechamento do mercado: 18h)**Responsabilidade**:- Validar todas as estratégias ativas- Detectar quando precisa de ajustes- Gerar alertas@periodic_task(run_every=crontab(hour=18, minute=0))def revalidate_strategies():    """Revalida todas as estratégias ativas."""    # Para cada StrategyTemplate ativo    # Valida critérios    # Salva StrategyValidation#### 3. Cálculo de Performance**Frequência**: Semanalmente (domingo, 20h)**Responsabilidade**:- Calcular performance de todas as estratégias- Atualizar notas- Comparar com benchmarks@periodic_task(run_every=crontab(day_of_week=0, hour=20, minute=0))def calculate_performance():    """Calcula performance semanalmente."""    # Para cada estratégia com histórico    # Calcula métricas    # Atualiza StrategyTemplate.performance_score#### 4. Análise de Perfil**Frequência**: Semanalmente (domingo, 21h) ou quando houver novas transações**Responsabilidade**:- Re-analisar perfil do investidor- Atualizar InvestorProfileython@periodic_task(run_every=crontab(day_of_week=0, hour=21, minute=0))def analyze_profiles():    """Re-analisa perfis dos investidores."""    # Para cada portfolio    # Analisa contexto    # Atualiza InvestorProfile#### 5. Limpeza de Cache**Frequência**: Diariamente (02h)**Responsabilidade**:- Limpar cache antigo- Manter dados frescosthon@periodic_task(run_every=crontab(hour=2, minute=0))def cleanup_cache():    """Limpa cache antigo."""    # Remove cache expirado    # Otimiza DataFreshness---## 🚀 PLANO DE IMPLEMENTAÇÃO### Fase 1: Fundação - Modelos e APIs (Semana 1-2)**Objetivo**: Criar base de dados e integrações com APIs.**Tarefas**:1. Criar modelos: StrategyTemplate, InvestorProfile, UserPreferences, StrategyValidation, StrategyPerformance, PortfolioChat, DataFreshness, SectorMapping2. Criar migrations para todos os modelos3. Criar BCBProvider (integração com API do Banco Central)4. Criar SectorMapper (service + popular tabela inicial com ~100 tickers)5. Popular templates iniciais (5 estratégias)6. Popular SectorMapping com principais tickers da B3**Entregáveis**:- ✅ Todos os modelos criados- ✅ Migrations aplicadas- ✅ BCBProvider funcionando- ✅ SectorMapper funcionando- ✅ 5 templates iniciais no banco- ✅ ~100 tickers mapeados por setor### Fase 2: Serviços Core - Análise e Advisor (Semana 3-4)**Objetivo**: Criar lógica de análise e geração de recomendações.**Tarefas**:1. Criar ContextAnalyzer   - Analisar carteira, transações, recomendações   - Analisar contexto de mercado   - Inferir perfil usando IA   - Recomendar estratégia2. Criar SmartInvestmentAdvisor   - Selecionar e adaptar estratégia   - Gerar alocações dinamicamente   - Aplicar preferências do usuário   - Validar recomendações3. Atualizar prompt da IA em `openai_service.py`   - Tornar mais proativo   - Incluir análise de contexto   - Gerar alocações dinamicamente**Entregáveis**:- ✅ ContextAnalyzer funcionando- ✅ SmartInvestmentAdvisor funcionando- ✅ Prompt da IA atualizado- ✅ Testes unitários básicos### Fase 3: Validação e Performance (Semana 5-6)**Objetivo**: Garantir qualidade e rastreabilidade.**Tarefas**:1. Criar StrategyValidator   - Validar estratégias   - Revalidar periodicamente   - Sugerir ajustes2. Criar PerformanceCalculator   - Calcular performance histórica   - Atualizar notas automaticamente   - Comparar com benchmarks3. Configurar background jobs (Celery ou cron)   - Atualização de dados   - Revalidação de estratégias   - Cálculo de performance   - Análise de perfil**Entregáveis**:- ✅ StrategyValidator funcionando- ✅ PerformanceCalculator funcionando- ✅ Background jobs configurados- ✅ Notas de performance sendo calculadas### Fase 4: Sistema Vivo - Atualização Automática (Semana 7-8)**Objetivo**: Garantir que dados estão sempre atualizados.**Tarefas**:1. Criar DataFreshnessManager   - Controlar atualização de dados   - Detectar dados desatualizados   - Agendar atualizações2. Integrar DataFreshnessManager com BrapiProvider   - Verificar freshness antes de usar cache   - Atualizar automaticamente se necessário3. Integrar DataFreshnessManager com BCBProvider4. Criar endpoint de monitoramento: `/api/investments/data-freshness/`**Entregáveis**:- ✅ DataFreshnessManager funcionando- ✅ Integração com providers- ✅ Dados sendo atualizados automaticamente- ✅ Sistema detecta dados desatualizados### Fase 5: Chat Contextual (Semana 9-10)**Objetivo**: Permitir que usuário pergunte sobre sua carteira.**Tarefas**:1. Criar PortfolioChatService   - Processar mensagens   - Construir contexto completo   - Gerar respostas para leigos2. Criar endpoint: POST/GET `/api/investments/portfolios/{id}/chat/`3. Criar componente PortfolioChat.tsx4. Integrar chat na interface principal**Entregáveis**:- ✅ PortfolioChatService funcionando- ✅ Endpoint de chat funcionando- ✅ Interface de chat funcionando- ✅ Respostas em linguagem para leigos### Fase 6: Interface Nova - Substituição Completa (Semana 11-14)**Objetivo**: Substituir interface atual por interface simples e direta.**Tarefas**:1. Criar SmartInvestmentsPage.tsx   - Input de valor   - Exibição de recomendações   - Confirmação2. Criar componentes:   - SmartRecommendationForm   - RecommendationResult   - StrategyCard   - ConfirmationDialog3. Criar UserPreferences.tsx   - Interface de preferências4. Criar StrategyPerformance.tsx   - Exibição de performance5. Criar StrategyValidation.tsx   - Exibição de validação6. Atualizar rotas em App.tsx   - Substituir InvestmentsDashboard por SmartInvestmentsPage7. Manter compatibilidade com interface antiga (deprecar gradualmente)**Entregáveis**:- ✅ Interface nova funcionando- ✅ Substituição de /investments- ✅ Todos os componentes criados- ✅ Interface antiga deprecada (mas ainda funcional)### Fase 7: Endpoints e Integração (Semana 15-16)**Objetivo**: Criar todos os endpoints necessários.**Tarefas**:1. Criar endpoints em PortfolioViewSet:   - POST `/smart-recommendation/`   - POST/GET `/chat/`   - GET/PUT `/preferences/`   - POST `/validate-strategy/`   - GET `/strategy-performance/`   - GET `/context/`2. Criar StrategyTemplateViewSet   - GET `/strategy-templates/`3. Criar serializers para novos modelos4. Testar todos os endpoints**Entregáveis**:- ✅ Todos os endpoints criados- ✅ Serializers criados- ✅ Endpoints testados### Fase 8: Refinamento e Testes (Semana 17-18)**Objetivo**: Polir e garantir qualidade.**Tarefas**:1. Criar testes para todos os serviços2. Otimizar performance (cache, queries)3. Ajustes de UX baseados em testes4. Documentação completa5. Deploy**Entregáveis**:- ✅ Testes completos- ✅ Performance otimizada- ✅ Documentação atualizada- ✅ Sistema em produção---## 📝 TEMPLATES INICIAIS### Template 1: Dividendos Defensivosn{  "name": "Dividendos Defensivos",  "slug": "dividendos-defensivos",  "description": "Foco em dividendos consistentes de setores defensivos e perenes, com DY entre 6-8% e fundamentos sólidos.",  "category": "dividendos",  "base_criteria": {    "dividend_yield_min": 0.06,    "dividend_yield_max": 0.10,    "pe_ratio_max": 15.0,    "price_to_book_max": 2.0,    "allowed_sectors": ["financeiro", "energia", "utilities", "consumo", "telecomunicações"],    "excluded_sectors": ["mineração", "armas", "defesa"],    "min_diversification": 0.70,    "max_concentration_per_asset": 0.15,    "max_concentration_per_sector": 0.35,    "min_dividend_history_months": 12  },  "adaptation_logic": "Ajustar DY mínimo baseado em média de mercado atual. Se Selic < 10%, reduzir DY mínimo em 1pp. Se volatilidade alta, aumentar filtros de qualidade. Priorizar ativos com histórico consistente de dividendos."}### Template 2: Value Investing{  "name": "Value Investing",  "slug": "value-investing",  "description": "Foco em empresas subvalorizadas com fundamentos sólidos, P/L e P/VP baixos.",  "category": "value",  "base_criteria": {    "pe_ratio_max": 12.0,    "price_to_book_max": 1.5,    "dividend_yield_min": 0.04,    "allowed_sectors": ["financeiro", "energia", "utilities", "consumo"],    "excluded_sectors": ["mineração", "armas", "defesa"],    "min_diversification": 0.75,    "max_concentration_per_asset": 0.12  },  "adaptation_logic": "Ajustar P/L máximo baseado em média do mercado. Em mercados caros, ser mais seletivo. Priorizar empresas com baixo P/VP e DY positivo."}### Template 3: Crescimento Balanceado{  "name": "Crescimento Balanceado",  "slug": "crescimento-balanceado",  "description": "Mix de dividendos e crescimento, balanceando renda passiva com valorização.",  "category": "hibrida",  "base_criteria": {    "dividend_yield_min": 0.05,    "pe_ratio_max": 18.0,    "price_to_book_max": 2.5,    "allowed_sectors": ["financeiro", "energia", "utilities", "consumo", "telecomunicações"],    "excluded_sectors": ["mineração", "armas", "defesa"],    "min_diversification": 0.70,    "max_concentration_per_asset": 0.15  },  "adaptation_logic": "Balancear entre dividendos e crescimento baseado em ciclo de mercado. Em mercados de alta, focar mais em crescimento. Em mercados de baixa, focar mais em dividendos."}### Template 4: Renda Passivason{  "name": "Renda Passiva",  "slug": "renda-passiva",  "description": "Foco total em dividendos mensais consistentes para gerar renda passiva.",  "category": "dividendos",  "base_criteria": {    "dividend_yield_min": 0.07,    "pe_ratio_max": 12.0,    "allowed_sectors": ["financeiro", "energia", "utilities"],    "excluded_sectors": ["mineração", "armas", "defesa"],    "min_diversification": 0.65,    "max_concentration_per_asset": 0.20,    "min_dividend_history_months": 24,    "min_regularity_score": 0.8  },  "adaptation_logic": "Priorizar ativos com histórico longo e consistente de dividendos. Ajustar DY mínimo baseado em Selic. Em juros baixos, aceitar DY menor."}### Template 5: Conservador{  "name": "Conservador",  "slug": "conservador",  "description": "Máxima segurança, baixa volatilidade, foco em preservação de capital.",  "category": "dividendos",  "base_criteria": {    "dividend_yield_min": 0.05,    "pe_ratio_max": 10.0,    "price_to_book_max": 1.2,    "allowed_sectors": ["utilities", "energia"],    "excluded_sectors": ["mineração", "armas", "defesa", "financeiro"],    "min_diversification": 0.80,    "max_concentration_per_asset": 0.10,    "max_concentration_per_sector": 0.25,    "min_dividend_history_months": 36  },  "adaptation_logic": "Máxima segurança. Priorizar apenas setores mais defensivos (utilities, energia regulada). Aceitar DY menor em troca de segurança."}---## 🔄 ESTRATÉGIA DE MIGRAÇÃO### Compatibilidade com Sistema Atual**Fase de Transição**:1. Manter endpoints antigos funcionando2. Nova interface disponível em `/investments` (substitui antiga)3. Interface antiga disponível em `/investments/legacy` (deprecada)4. Migração gradual: usuários podem usar ambas5. Após 1 mês: remover interface antiga**Compatibilidade de Dados**:- Model `Strategy` antigo continua funcionando- Sistema detecta se tem estratégia antiga ou nova- Se tem estratégia antiga, migra automaticamente para template mais próximo- Se não tem estratégia, usa template recomendado pela IA---## ✅ CHECKLIST DE VALIDAÇÃOAntes de considerar completo:### Funcionalidades Core- [ ] Usuário pode pedir recomendação sem configurar nada- [ ] IA faz toda análise automaticamente- [ ] Recomendações são justificadas claramente- [ ] Interface é simples e direta (substitui /investments atual)### Preferências- [ ] Usuário pode definir preferências (ex: não investir em armas)- [ ] Preferências são respeitadas em todas as recomendações- [ ] Preferências podem ser editadas a qualquer momento- [ ] IA explica quando recomendação foi ajustada por preferências### Validação- [ ] Estratégias são validadas antes de aplicar- [ ] Estratégias são revalidadas periodicamente- [ ] IA alerta quando estratégia precisa de ajustes- [ ] Histórico de validações é mantido### Performance- [ ] Cada estratégia tem nota de performance visível- [ ] Nota é atualizada automaticamente- [ ] Interface mostra nota de forma clara (⭐⭐⭐⭐☆)- [ ] Comparação com IBOV está disponível### Sistema Vivo- [ ] Dados de mercado são atualizados automaticamente- [ ] Sistema detecta dados desatualizados- [ ] Cache inteligente funciona corretamente- [ ] Background jobs estão rodando### Chat- [ ] Chat funciona na carteira- [ ] Chat tem acesso a contexto completo- [ ] Respostas são em linguagem para leigos- [ ] Histórico de conversas é mantido### APIs- [ ] BRAPI integrado e funcionando- [ ] BCB API integrada e funcionando- [ ] SectorMapper funcionando- [ ] Limitações de APIs são aceitas e documentadas---## 📦 DEPENDÊNCIAS### Python- Django 5.x (já instalado)- Celery (para background jobs) - **NOVO**- Redis (para cache e filas) - **NOVO**- requests (já instalado)### Frontend- React (já instalado)- TypeScript (já instalado)- TanStack Query (já instalado)### Infraestrutura- Redis (para cache e Celery)- Celery worker (para background jobs)---## 🎯 PRÓXIMOS PASSOS IMEDIATOS1. **Revisar e aprovar este planejamento**2. **Definir templates iniciais** (quais estratégias começar)3. **Decidir sobre background jobs** (Celery ou cron simples)4. **Priorizar fases** (pode começar com Fase 1 + 2 para MVP)5. **Criar issues/tasks no projeto**---**Status**: 📋 Planejamento Completo  **Próxima Ação**: Revisar, aprovar e começar Fase 1
5. StrategyPerformance
Arquivo: backend/apps/investments/models.py
class StrategyPerformance(WorkspaceModel):    """Performance histórica de uma estratégia."""        strategy_template = models.ForeignKey(        StrategyTemplate,        on_delete=models.CASCADE,        related_name="performance_records"    )        portfolio = models.ForeignKey(        Portfolio,        on_delete=models.CASCADE,        related_name="strategy_performances"    )        # Período    period_start = models.DateField()    period_end = models.DateField()        # Métricas    total_return = models.DecimalField(        max_digits=10,         decimal_places=2    )  # Retorno total no período (%)        dividend_yield_realized = models.DecimalField(        max_digits=5,         decimal_places=2    )  # DY realizado (dividendos recebidos / valor investido)        recommendations_followed = models.IntegerField(default=0)    recommendations_total = models.IntegerField(default=0)    adherence_rate = models.DecimalField(        max_digits=5,         decimal_places=2    )  # recommendations_followed / recommendations_total        # Score calculado (0-100, depois convertido para 0-5 estrelas)    performance_score = models.DecimalField(        max_digits=5,         decimal_places=2    )    # Fórmula: (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2) * 100        # Comparação com benchmark    vs_ibovespa = models.DecimalField(        max_digits=10,         decimal_places=2    )  # Diferença percentual vs IBOV        # Metadados    calculated_at = models.DateTimeField(auto_now_add=True)        class Meta:        verbose_name = "Performance de Estratégia"        verbose_name_plural = "Performances de Estratégias"        ordering = ["-period_end"]        indexes = [            models.Index(fields=["strategy_template", "period_end"]),            models.Index(fields=["portfolio", "period_end"]),        ]
6. PortfolioChat
Arquivo: backend/apps/investments/models.py
class PortfolioChat(WorkspaceModel):    """Mensagens do chat na carteira."""        portfolio = models.ForeignKey(        Portfolio,        on_delete=models.CASCADE,        related_name="chat_messages"    )        # Mensagem    message = models.TextField()    is_from_user = models.BooleanField(default=True)        # Contexto usado pela IA    context_snapshot = models.JSONField(default=dict)    # Snapshot do contexto no momento da mensagem:    # {    #   "portfolio_value": 10000.00,    #   "strategy": {...},    #   "market_context": {...},    #   "profile": {...}    # }        # Resposta da IA    ai_response = models.TextField(blank=True)    ai_confidence = models.DecimalField(        max_digits=5,         decimal_places=2,         null=True    )  # Confiança da resposta (0-1)        # Metadados    created_at = models.DateTimeField(auto_now_add=True)        class Meta:        verbose_name = "Mensagem do Chat"        verbose_name_plural = "Mensagens do Chat"        ordering = ["created_at"]        indexes = [            models.Index(fields=["portfolio", "created_at"]),        ]
7. DataFreshness
Arquivo: backend/apps/investments/models.py
class DataFreshness(WorkspaceModel):    """Controle de atualização de dados."""        data_type = models.CharField(max_length=50)    # "quote", "fundamental", "dividend_history", "market_context"        ticker = models.CharField(        max_length=20,         null=True,         blank=True    )  # Null se for dados gerais (ex: IBOV, Selic)        last_updated = models.DateTimeField()    next_update_due = models.DateTimeField()        # Status    is_fresh = models.BooleanField(default=True)    freshness_score = models.DecimalField(        max_digits=5,         decimal_places=2,         default=1.0    )  # 1.0 = totalmente atualizado, 0.0 = desatualizado        # Metadados    update_frequency_minutes = models.IntegerField(default=5)    # Frequência de atualização em minutos        class Meta:        verbose_name = "Controle de Atualização"        verbose_name_plural = "Controles de Atualização"        unique_together = [("workspace", "data_type", "ticker")]        indexes = [            models.Index(fields=["data_type", "last_updated"]),            models.Index(fields=["is_fresh", "next_update_due"]),        ]
8. SectorMapping
Arquivo: backend/apps/investments/models.py
class SectorMapping(WorkspaceModel):    """Mapeamento de tickers para setores.        Tabela de referência para mapear ticker → setor.    Pode ser populada manualmente ou via importação.    """        ticker = models.CharField(        max_length=20,        unique=True,        db_index=True    )        sector = models.CharField(max_length=100)    # Exemplos: "financeiro", "energia", "utilities", "consumo",     # "telecomunicações", "mineração", "armas", "defesa"        subsector = models.CharField(        max_length=100,        blank=True,        null=True    )  # Opcional: "bancos", "seguros", "transmissão", etc.        company_name = models.CharField(        max_length=255,        blank=True,        null=True    )  # Nome da empresa (opcional)        is_active = models.BooleanField(default=True)        class Meta:        verbose_name = "Mapeamento de Setor"        verbose_name_plural = "Mapeamentos de Setores"        indexes = [            models.Index(fields=["sector", "is_active"]),            models.Index(fields=["ticker"]),        ]        def __str__(self) -> str:        return f"{self.ticker} → {self.sector}"
🔧 SERVIÇOS E LÓGICA
1. ContextAnalyzer
Arquivo: backend/apps/investments/services/context_analyzer.py (NOVO)
Responsabilidades:
Analisar carteira atual (alocação, diversificação, performance)
Analisar histórico de transações (padrões de comportamento)
Analisar histórico de recomendações (aderência, resultados)
Analisar contexto de mercado (Selic, IBOV, volatilidade, yields médios)
Inferir perfil do investidor usando IA
Recomendar estratégia adequada
Métodos principais:
class ContextAnalyzer:    def analyze_user_context(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa contexto completo do usuário.                Returns:            {                "profile": {...},  # Perfil inferido                "current_strategy": {...},  # Estratégia atual (se houver)                "recommended_strategy": {...},  # Estratégia recomendada                "market_context": {...},  # Contexto de mercado                "portfolio_health": {...},  # Saúde da carteira            }        """        def _analyze_portfolio(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa carteira atual."""        # Calcula: valor total, alocação por ativo, diversificação,        # concentração, DY médio, etc.        def _analyze_transactions(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa histórico de transações."""        # Padrões: frequência, valores, tipos de ativos,        # período de retenção, etc.        def _analyze_recommendations(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa histórico de recomendações."""        # Taxa de aderência, performance das recomendações seguidas,        # padrões de ajustes do usuário, etc.        def _analyze_market_context(        self    ) -> Dict[str, Any]:        """Analisa contexto de mercado atual."""        # Selic, IBOV, volatilidade, yields médios do mercado,        # tendências, etc.        def _infer_profile_with_ai(        self,        portfolio_analysis: Dict[str, Any],        transaction_history: Dict[str, Any],        recommendation_history: Dict[str, Any],        market_context: Dict[str, Any]    ) -> Dict[str, Any]:        """Usa IA para inferir perfil do investidor."""        # Prompt para IA analisar e inferir:        # - Tolerância a risco        # - Horizonte de investimento        # - Objetivo principal        # - Nível de experiência        # - Padrões de comportamento        def _recommend_strategy(        self,        inferred_profile: Dict[str, Any],        portfolio_analysis: Dict[str, Any],        market_context: Dict[str, Any]    ) -> Dict[str, Any]:        """Recomenda estratégia adequada baseado em contexto."""        # Busca templates disponíveis        # Usa IA para escolher melhor template        # Adapta critérios baseado em contexto
2. SmartInvestmentAdvisor
Arquivo: backend/apps/investments/services/smart_investment_advisor.py (NOVO)
Responsabilidades:
Gerar recomendações sem exigir configuração do usuário
Selecionar e adaptar estratégia baseado em contexto
Gerar alocações dinamicamente (não usar TARGET_ALLOCATION fixo)
Respeitar preferências do usuário
Validar recomendações antes de retornar
Métodos principais:
class SmartInvestmentAdvisor:    def generate_recommendation(        self,        portfolio: Portfolio,        amount: Decimal,        user_preference: Optional[str] = None  # "mais conservador", "mais agressivo"    ) -> Dict[str, Any]:        """Gera recomendação inteligente baseada em contexto."""        # 1. Analisa contexto completo        # 2. Seleciona/adapta estratégia        # 3. Busca dados de mercado atualizados        # 4. Gera alocações dinamicamente        # 5. Valida e ajusta        # 6. Retorna recomendação completa        def _select_and_adapt_strategy(        self,        context: Dict[str, Any],        user_preference: Optional[str]    ) -> Dict[str, Any]:        """Seleciona e adapta estratégia baseado em contexto."""        # Busca templates adequados        # Usa IA para escolher melhor template        # Adapta critérios baseado em:        # - Contexto de mercado atual        # - Perfil do investidor        # - Estado da carteira        # - Preferências do usuário        def _generate_dynamic_allocations(        self,        context: Dict[str, Any],        strategy: Dict[str, Any],        market_data: Dict[str, Any],        amount: Decimal    ) -> List[Dict[str, Any]]:        """Gera alocações dinamicamente baseado em oportunidades atuais."""        # NÃO usa TARGET_ALLOCATION fixo        # Analisa oportunidades de mercado ATUAIS        # Considera diversificação adequada        # Respeita critérios da estratégia        # Usa IA para gerar alocações inteligentes        def _validate_and_adjust(        self,        allocations: List[Dict[str, Any]],        context: Dict[str, Any],        market_data: Dict[str, Any],        amount: Decimal    ) -> List[Dict[str, Any]]:        """Valida e ajusta alocações."""        # Verifica se respeitam critérios        # Verifica diversificação        # Verifica preferências do usuário        # Ajusta se necessário        def _apply_user_preferences(        self,        allocations: List[Dict[str, Any]],        preferences: UserPreferences    ) -> List[Dict[str, Any]]:        """Aplica preferências do usuário nas alocações."""        # Remove setores excluídos        # Remove tickers excluídos        # Ajusta concentração se necessário
3. StrategyValidator
Arquivo: backend/apps/investments/services/strategy_validator.py (NOVO)
Responsabilidades:
Validar estratégia antes de aplicar
Revalidar estratégias periodicamente
Detectar quando estratégia precisa de ajustes
Sugerir melhorias
Métodos principais:
class StrategyValidator:    def validate_strategy(        self,        strategy_template: StrategyTemplate,        portfolio: Portfolio,        market_context: Dict[str, Any]    ) -> Dict[str, Any]:        """Valida estratégia antes de aplicar."""        # Verifica se critérios fazem sentido agora        # Verifica condições de mercado        # Identifica problemas        # Sugere ajustes        def revalidate_all_strategies(self):        """Revalida todas as estratégias ativas."""        # Background job: roda diariamente        def _check_criteria_validity(        self,        criteria: Dict[str, Any],        market_context: Dict[str, Any]    ) -> bool:        """Verifica se critérios são válidos no contexto atual."""        # Ex: DY mínimo de 8% faz sentido se média de mercado é 6-7%?        def _check_market_conditions(        self,        strategy_template: StrategyTemplate,        market_context: Dict[str, Any]    ) -> bool:        """Verifica se condições de mercado são adequadas."""        # Ex: Estratégia de dividendos faz sentido com Selic em queda?        def _suggest_adjustments(        self,        strategy_template: StrategyTemplate,        market_context: Dict[str, Any]    ) -> List[Dict[str, Any]]:        """Sugere ajustes na estratégia."""        # Ex: "Reduzir DY mínimo de 8% para 6% (média de mercado atual)"
4. PerformanceCalculator
Arquivo: backend/apps/investments/services/performance_calculator.py (NOVO)
Responsabilidades:
Calcular performance histórica de estratégias
Atualizar notas automaticamente
Comparar com benchmarks
Gerar relatórios
Métodos principais:
class PerformanceCalculator:    def calculate_strategy_performance(        self,        strategy_template: StrategyTemplate,        portfolio: Portfolio,        period_start: date,        period_end: date    ) -> Dict[str, Any]:        """Calcula performance histórica."""        # Calcula: total_return, dividend_yield_realized, adherence_rate        # Compara com IBOV        # Calcula score (0-100)        # Cria registro StrategyPerformance        def update_all_performance_scores(self):        """Atualiza scores de todas as estratégias."""        # Background job: roda semanalmente        # Atualiza StrategyTemplate.performance_score        def _calculate_total_return(        self,        portfolio: Portfolio,        period_start: date,        period_end: date    ) -> Decimal:        """Calcula retorno total no período."""        # (valor_final - valor_inicial) / valor_inicial        def _calculate_dividend_yield_realized(        self,        portfolio: Portfolio,        period_start: date,        period_end: date    ) -> Decimal:        """Calcula DY realizado."""        # dividendos_recebidos / valor_investido        def _calculate_performance_score(        self,        total_return: Decimal,        dividend_yield_realized: Decimal,        adherence_rate: Decimal    ) -> Decimal:        """Calcula score de performance (0-100)."""        # score = (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2)        # return score * 100
5. DataFreshnessManager
Arquivo: backend/apps/investments/services/data_freshness_manager.py (NOVO)
Responsabilidades:
Controlar atualização de dados
Detectar dados desatualizados
Agendar atualizações
Garantir que dados estão sempre frescos
Métodos principais:
class DataFreshnessManager:    def check_data_freshness(        self,        data_type: str,        ticker: Optional[str] = None    ) -> bool:        """Verifica se dados estão atualizados."""        # Consulta DataFreshness        # Verifica se is_fresh e next_update_due        def update_data_if_needed(        self,        data_type: str,        ticker: Optional[str] = None    ):        """Atualiza dados se necessário."""        # Se não está fresh, força atualização        # Atualiza DataFreshness após buscar        def schedule_updates(self):        """Agenda atualizações."""        # Background job: verifica e agenda atualizações        def _calculate_freshness_score(        self,        last_updated: datetime,        update_frequency_minutes: int    ) -> Decimal:        """Calcula score de atualização (0-1)."""        # Quanto mais próximo de next_update_due, menor o score
6. PortfolioChatService
Arquivo: backend/apps/investments/services/portfolio_chat_service.py (NOVO)
Responsabilidades:
Processar mensagens do chat
Construir contexto completo para IA
Gerar respostas em linguagem para leigos
Manter histórico de conversas
Métodos principais:
class PortfolioChatService:    def send_message(        self,        portfolio: Portfolio,        message: str    ) -> Dict[str, Any]:        """Processa mensagem do chat."""        # 1. Constrói contexto completo        # 2. Envia para IA com prompt especializado        # 3. Simplifica resposta para leigo        # 4. Salva mensagem e resposta        # 5. Retorna resposta        def _build_complete_context(        self,        portfolio: Portfolio    ) -> Dict[str, Any]:        """Constrói contexto completo para IA."""        # Inclui:        # - Carteira atual (ativos, alocação, valor total)        # - Estratégia ativa (template, critérios, nota)        # - Histórico de recomendações (últimas 10)        # - Performance da estratégia        # - Dados de mercado atualizados        # - Perfil do investidor        # - Preferências do usuário        # - Histórico de transações (últimas 20)        # - Dividendos recebidos (últimos 12 meses)        def _generate_ai_response(        self,        message: str,        context: Dict[str, Any]    ) -> str:        """Gera resposta da IA."""        # Prompt especializado:        # "Você é um consultor de investimentos. Responda em linguagem        # simples para leigos. Use o contexto completo da carteira..."        def _simplify_for_layperson(        self,        response: str    ) -> str:        """Simplifica resposta para leigos."""        # Remove jargão técnico        # Explica termos complexos        # Usa analogias quando necessário
7. BCBProvider
Arquivo: backend/apps/investments/services/bcb_provider.py (NOVO)
Responsabilidades:
Buscar dados do Banco Central do Brasil
Selic, IPCA, índices macroeconômicos
Métodos principais:
class BCBProvider:    BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs"        def get_selic_rate(self) -> Decimal:        """Busca taxa Selic atual."""        # Código da série: 432        def get_ipca(self) -> Decimal:        """Busca IPCA atual."""        # Código da série: 433        def get_market_indices(self) -> Dict[str, Any]:        """Busca índices de mercado."""        # IBOV, IBrX, etc.
8. SectorMapper
Arquivo: backend/apps/investments/services/sector_mapper.py (NOVO)
Responsabilidades:
Mapear ticker → setor
Buscar todos os tickers de um setor
Validar setores
Métodos principais:
class SectorMapper:    def get_sector(        self,        ticker: str    ) -> Optional[str]:        """Retorna setor de um ticker."""        # Busca em SectorMapping        def get_all_tickers_by_sector(        self,        sector: str    ) -> List[str]:        """Retorna todos os tickers de um setor."""        def is_sector_allowed(        self,        sector: str,        allowed_sectors: List[str]    ) -> bool:        """Verifica se setor é permitido."""
📡 APIS E LIMITAÇÕES
APIs Disponíveis
1. BRAPI (já integrado)
URL: https://brapi.dev/api
O que oferece:
✅ Cotações em tempo real
✅ P/L, P/VP, DY, EPS
✅ Histórico de dividendos (últimos 12 meses)
✅ Market cap, volume
O que NÃO oferece:
❌ ROE (Return on Equity)
❌ Payout ratio
❌ Dívida líquida / EBITDA
❌ Setor da empresa
❌ Histórico de preços (série temporal)
❌ Dados de balanço completos
2. BCB API (Banco Central)
URL: https://api.bcb.gov.br/dados/serie/bcdata.sgs
O que oferece:
✅ Selic (taxa de juros)
✅ IPCA (inflação)
✅ Dados macroeconômicos
✅ Histórico completo
Status: Gratuito, oficial, confiável
3. SectorMapping (próprio)
Tipo: Model Django + dados manuais
O que oferece:
✅ Mapeamento ticker → setor
✅ Lista de setores permitidos/excluídos
Implementação: Tabela no banco populada manualmente com ~100 principais tickers da B3
Limitações Aceitas
Importante: Aceitamos que não temos acesso a:
ROE, payout ratio, dívida/EBITDA via APIs gratuitas
Dados de balanço completos
Estratégia:
Trabalhar com dados disponíveis (BRAPI + BCB)
Usar IA para inferir qualidade quando necessário
Focar em métricas disponíveis: DY, P/L, P/VP, histórico de dividendos
Futuro: Integrar globaldatafinance (Python) para dados da CVM quando necessário
🔄 FLUXOS PRINCIPAIS
Fluxo 1: Usuário Pede Recomendação
BCB API
BRAPI
OpenAI
StrategyValidator
SmartAdvisor
ContextAnalyzer
Backend API
SmartInvestmentsPage
Usuário
BCB API
BRAPI
OpenAI
StrategyValidator
SmartAdvisor
ContextAnalyzer
Backend API
SmartInvestmentsPage
Usuário
"Tenho R$200, onde invisto?"
POST /smart-recommendation/ {amount: 200}
analyze_user_context()
Busca cotações atualizadas
Busca Selic, IBOV
Analisa carteira, transações, recomendações
Infere perfil do investidor
Contexto completo
generate_recommendation()
_select_and_adapt_strategy()
Busca dados de mercado (candidatos)
_generate_dynamic_allocations()
validate_strategy()
_apply_user_preferences()
Gera recomendações finais
Recomendação completa
{recommendations: [...], strategy: {...}, reasoning: "..."}
Exibe recomendações com justificativa
Fluxo 2: Validação Periódica
Database
BRAPI
BCB API
StrategyTemplate
StrategyValidator
Background Job
Database
BRAPI
BCB API
StrategyTemplate
StrategyValidator
Background Job
alt
[Precisa ajustes]
[Válida]
loop
[Para cada estratégia]
Busca estratégias ativas
validate_strategy()
Busca contexto macro atualizado
Busca yields médios do mercado
Valida critérios
Verifica condições de mercado
_suggest_adjustments()
Salva StrategyValidation (status: "needs_review")
Salva StrategyValidation (status: "valid")
Fluxo 3: Cálculo de Performance
Database
DividendReceived
Transaction
Portfolio
PerformanceCalculator
Background Job
Database
DividendReceived
Transaction
Portfolio
PerformanceCalculator
Background Job
loop
[Para cada portfolio]
update_all_performance_scores()
Busca portfolios com estratégias ativas
calculate_strategy_performance()
Calcula total_return
Calcula dividend_yield_realized
Calcula adherence_rate
Calcula performance_score
Cria StrategyPerformance
Atualiza StrategyTemplate.performance_score
Fluxo 4: Chat na Carteira
Database
OpenAI
ContextAnalyzer
PortfolioChatService
Backend API
PortfolioChat
Usuário
Database
OpenAI
ContextAnalyzer
PortfolioChatService
Backend API
PortfolioChat
Usuário
"Por que você recomendou TAEE11?"
POST /chat/ {message: "..."}
send_message()
_build_complete_context()
Busca carteira, estratégia, histórico, mercado
Contexto completo
_generate_ai_response()
Resposta técnica
_simplify_for_layperson()
Salva PortfolioChat
Resposta simplificada
{response: "...", confidence: 0.95}
Exibe resposta em linguagem simples
📊 ENDPOINTS E INTEGRAÇÃO
Novos Endpoints
1. Recomendação Inteligente
POST /api/investments/portfolios/{id}/smart-recommendation/
Body:
{  "amount": 200.00,  "user_preference": "mais conservador"  // opcional}
Response:
{  "recommendation": {    "total_amount": 200.00,    "allocations": [      {        "ticker": "TAEE11",        "quantity": 5,        "unit_price": 35.50,        "amount": 177.50,        "reason": "Oportunidade atual, DY 7.9%, contrato ANEEL de 30 anos"      }    ],    "remaining_balance": 22.50,    "reasoning": "Com base na sua carteira atual de R$X e perfil conservador..."  },  "strategy_used": {    "id": 1,    "name": "Dividendos Defensivos",    "performance_score": 4.5,    "category": "dividendos"  },  "context_analyzed": {    "profile": {...},    "market_context": {...}  }}
2. Chat na Carteira
POST /api/investments/portfolios/{id}/chat/
Body:
{  "message": "Por que você recomendou TAEE11?"}
Response:
{  "response": "Recomendei TAEE11 porque ela tem um contrato de 30 anos com a ANEEL que garante receita inflacionada. Isso significa que mesmo em crises, ela continua pagando dividendos. Além disso, o DY atual de 7.9% está acima da média do mercado (6-7%), o que é uma boa oportunidade.",  "confidence": 0.95,  "message_id": "123"}
GET /api/investments/portfolios/{id}/chat/
Response:
{  "messages": [    {      "id": "123",      "message": "Por que você recomendou TAEE11?",      "is_from_user": true,      "ai_response": "...",      "created_at": "2025-01-XX..."    }  ]}
3. Preferências do Usuário
GET /api/investments/portfolios/{id}/preferences/
Response:
{  "excluded_sectors": ["armas", "defesa"],  "preferred_sectors": [],  "additional_criteria": "Não topo investir em setores destrutivos",  "restrictions": {    "max_concentration_per_asset": 0.15  }}
PUT /api/investments/portfolios/{id}/preferences/
Body:
{  "excluded_sectors": ["armas", "defesa", "mineração"],  "additional_criteria": "Não topo investir em armas ou setores destrutivos"}
4. Templates de Estratégias
GET /api/investments/strategy-templates/
Response:
{  "templates": [    {      "id": 1,      "name": "Dividendos Defensivos",      "description": "Foco em dividendos consistentes de setores defensivos",      "category": "dividendos",      "performance_score": 4.5,      "is_active": true    }  ]}
5. Validação de Estratégia
POST /api/investments/portfolios/{id}/validate-strategy/
Response:
{  "status": "valid",  "issues": [],  "warnings": [],  "suggested_adjustments": {}}
6. Performance de Estratégia
GET /api/investments/portfolios/{id}/strategy-performance/
Response:
{  "current_score": 4.5,  "score_display": "⭐⭐⭐⭐☆",  "historical_performance": [    {      "period_start": "2024-01-01",      "period_end": "2024-12-31",      "total_return": 12.5,      "dividend_yield_realized": 7.2,      "vs_ibovespa": 2.3    }  ],  "vs_ibovespa": 2.3}
7. Contexto Analisado (Debug/Transparência)
GET /api/investments/portfolios/{id}/context/
Response:
{  "profile": {    "risk_tolerance": "conservador",    "investment_horizon": "longo",    "primary_goal": "renda_passiva"  },  "portfolio_health": {    "total_value": 10000.00,    "diversification_score": 0.75,    "average_dividend_yield": 7.5  },  "market_context": {    "selic": 8.75,    "ibov": 145000,    "average_dividend_yield_market": 6.8  },  "recommended_strategy": {    "id": 1,    "name": "Dividendos Defensivos"  }}
🎨 INTERFACE DO USUÁRIO
Nova Página Principal
Arquivo: frontend/src/features/investments/pages/SmartInvestmentsPage.tsx (NOVO)
Substitui: InvestmentsDashboard.tsx
Interface:
┌─────────────────────────────────────────┐│  Investimentos                          │├─────────────────────────────────────────┤│                                          ││  Quanto você quer investir?             ││  ┌─────────────────────────────────┐   ││  │ R$ [200.00]                     │   ││  └─────────────────────────────────┘   ││                                          ││  [Onde devo investir?]                  ││                                          ││  ┌─────────────────────────────────┐   ││  │ ⭐⭐⭐⭐☆ Dividendos Defensivos  │   ││  │                                 │   ││  │ ✅ Compre 5 ações de TAEE11     │   ││  │    R$ 35,50 cada (R$ 177,50)    │   ││  │    Oportunidade atual, DY 7.9%  │   ││  │                                 │   ││  │ ✅ Compre 2 ações de ITUB4      │   ││  │    R$ 32,10 cada (R$ 64,20)     │   ││  │    Diversificação financeiro   │   ││  │                                 │   ││  │ 💰 Saldo restante: R$ 22,50    │   ││  │                                 │   ││  │ Justificativa:                  │   ││  │ Com base na sua carteira...     │   ││  │                                 │   ││  │ [Confirmar] [Ajustar]            │   ││  └─────────────────────────────────┘   ││                                          ││  ┌─────────────────────────────────┐   ││  │ 💬 Chat                         │   ││  │ ┌─────────────────────────────┐ │   ││  │ │ Por que TAEE11?             │ │   ││  │ └─────────────────────────────┘ │   ││  │ [Enviar]                        │   ││  └─────────────────────────────────┘   ││                                          ││  [⚙️ Preferências] [📊 Performance]     │└─────────────────────────────────────────┘
Componentes:
SmartRecommendationForm: Input de valor + botão
RecommendationResult: Exibição de recomendações
StrategyCard: Card com estratégia e nota
ConfirmationDialog: Diálogo de confirmação
PortfolioChat: Chat na carteira
UserPreferences: Modal de preferências
StrategyPerformance: Modal de performance
Chat na Carteira
Arquivo: frontend/src/features/investments/components/PortfolioChat.tsx (NOVO)
Interface:
┌─────────────────────────────────────────┐│  Chat sobre sua carteira                │├─────────────────────────────────────────┤│                                          ││  Você: Por que TAEE11?                   ││                                          ││  IA: Recomendei TAEE11 porque ela...    ││                                          ││  Você: E ITUB4?                          ││                                          ││  IA: ITUB4 é uma boa opção para...      ││                                          ││  ┌─────────────────────────────────┐   ││  │ Digite sua pergunta...          │   ││  └─────────────────────────────────┘   ││  [Enviar]                                │└─────────────────────────────────────────┘
Preferências
Arquivo: frontend/src/features/investments/components/UserPreferences.tsx (NOVO)
Interface:
┌─────────────────────────────────────────┐│  Preferências de Investimento            │├─────────────────────────────────────────┤│                                          ││  Setores que não quero investir:        ││  ☑ Armas                                ││  ☑ Defesa                                ││  ☑ Mineração                             ││  ☐ Tabaco                                ││                                          ││  Dicas para a IA:                        ││  ┌─────────────────────────────────┐   ││  │ Não topo investir em setores     │   ││  │ destrutivos                      │   ││  └─────────────────────────────────┘   ││                                          ││  [Salvar]                                │└─────────────────────────────────────────┘
🔄 BACKGROUND JOBS
Jobs Necessários
1. Atualização de Dados de Mercado
Frequência: A cada 5 minutos (horário de mercado: 10h-17h)
Responsabilidade:
Atualizar cotações de ativos na carteira
Atualizar dados fundamentalistas
Atualizar histórico de dividendos (se necessário)
Atualizar Selic, IBOV
Arquivo: backend/apps/investments/tasks.py
@periodic_task(run_every=crontab(minute='*/5', hour='10-17'))def update_market_data():    """Atualiza dados de mercado a cada 5 minutos."""    # Verifica DataFreshness    # Atualiza se necessário    # Atualiza DataFreshness após atualizar
2. Revalidação de Estratégias
Frequência: Diariamente (após fechamento do mercado: 18h)
Responsabilidade:
Validar todas as estratégias ativas
Detectar quando precisa de ajustes
Gerar alertas
@periodic_task(run_every=crontab(hour=18, minute=0))def revalidate_strategies():    """Revalida todas as estratégias ativas."""    # Para cada StrategyTemplate ativo    # Valida critérios    # Salva StrategyValidation
3. Cálculo de Performance
Frequência: Semanalmente (domingo, 20h)
Responsabilidade:
Calcular performance de todas as estratégias
Atualizar notas
Comparar com benchmarks
@periodic_task(run_every=crontab(day_of_week=0, hour=20, minute=0))def calculate_performance():    """Calcula performance semanalmente."""    # Para cada estratégia com histórico    # Calcula métricas    # Atualiza StrategyTemplate.performance_score
4. Análise de Perfil
Frequência: Semanalmente (domingo, 21h) ou quando houver novas transações
Responsabilidade:
Re-analisar perfil do investidor
Atualizar InvestorProfile
@periodic_task(run_every=crontab(day_of_week=0, hour=21, minute=0))def analyze_profiles():    """Re-analisa perfis dos investidores."""    # Para cada portfolio    # Analisa contexto    # Atualiza InvestorProfile
5. Limpeza de Cache
Frequência: Diariamente (02h)
Responsabilidade:
Limpar cache antigo
Manter dados frescos
@periodic_task(run_every=crontab(hour=2, minute=0))def cleanup_cache():    """Limpa cache antigo."""    # Remove cache expirado    # Otimiza DataFreshness
🚀 PLANO DE IMPLEMENTAÇÃO
Fase 1: Fundação - Modelos e APIs (Semana 1-2)
Objetivo: Criar base de dados e integrações com APIs.
Tarefas:
Criar modelos: StrategyTemplate, InvestorProfile, UserPreferences, StrategyValidation, StrategyPerformance, PortfolioChat, DataFreshness, SectorMapping
Criar migrations para todos os modelos
Criar BCBProvider (integração com API do Banco Central)
Criar SectorMapper (service + popular tabela inicial com ~100 tickers)
Popular templates iniciais (5 estratégias)
Popular SectorMapping com principais tickers da B3
Entregáveis:
✅ Todos os modelos criados
✅ Migrations aplicadas
✅ BCBProvider funcionando
✅ SectorMapper funcionando
✅ 5 templates iniciais no banco
✅ ~100 tickers mapeados por setor
Fase 2: Serviços Core - Análise e Advisor (Semana 3-4)
Objetivo: Criar lógica de análise e geração de recomendações.
Tarefas:
Criar ContextAnalyzer
Analisar carteira, transações, recomendações
Analisar contexto de mercado
Inferir perfil usando IA
Recomendar estratégia
Criar SmartInvestmentAdvisor
Selecionar e adaptar estratégia
Gerar alocações dinamicamente
Aplicar preferências do usuário
Validar recomendações
Atualizar prompt da IA em openai_service.py
Tornar mais proativo
Incluir análise de contexto
Gerar alocações dinamicamente
Entregáveis:
✅ ContextAnalyzer funcionando
✅ SmartInvestmentAdvisor funcionando
✅ Prompt da IA atualizado
✅ Testes unitários básicos
Fase 3: Validação e Performance (Semana 5-6)
Objetivo: Garantir qualidade e rastreabilidade.
Tarefas:
Criar StrategyValidator
Validar estratégias
Revalidar periodicamente
Sugerir ajustes
Criar PerformanceCalculator
Calcular performance histórica
Atualizar notas automaticamente
Comparar com benchmarks
Configurar background jobs (Celery ou cron)
Atualização de dados
Revalidação de estratégias
Cálculo de performance
Análise de perfil
Entregáveis:
✅ StrategyValidator funcionando
✅ PerformanceCalculator funcionando
✅ Background jobs configurados
✅ Notas de performance sendo calculadas
Fase 4: Sistema Vivo - Atualização Automática (Semana 7-8)
Objetivo: Garantir que dados estão sempre atualizados.
Tarefas:
Criar DataFreshnessManager
Controlar atualização de dados
Detectar dados desatualizados
Agendar atualizações
Integrar DataFreshnessManager com BrapiProvider
Verificar freshness antes de usar cache
Atualizar automaticamente se necessário
Integrar DataFreshnessManager com BCBProvider
Criar endpoint de monitoramento: /api/investments/data-freshness/
Entregáveis:
✅ DataFreshnessManager funcionando
✅ Integração com providers
✅ Dados sendo atualizados automaticamente
✅ Sistema detecta dados desatualizados
Fase 5: Chat Contextual (Semana 9-10)
Objetivo: Permitir que usuário pergunte sobre sua carteira.
Tarefas:
Criar PortfolioChatService
Processar mensagens
Construir contexto completo
Gerar respostas para leigos
Criar endpoint: POST/GET /api/investments/portfolios/{id}/chat/
Criar componente PortfolioChat.tsx
Integrar chat na interface principal
Entregáveis:
✅ PortfolioChatService funcionando
✅ Endpoint de chat funcionando
✅ Interface de chat funcionando
✅ Respostas em linguagem para leigos
Fase 6: Interface Nova - Substituição Completa (Semana 11-14)
Objetivo: Substituir interface atual por interface simples e direta.
Tarefas:
Criar SmartInvestmentsPage.tsx
Input de valor
Exibição de recomendações
Confirmação
Criar componentes:
SmartRecommendationForm
RecommendationResult
StrategyCard
ConfirmationDialog
Criar UserPreferences.tsx
Interface de preferências
Criar StrategyPerformance.tsx
Exibição de performance
Criar StrategyValidation.tsx
Exibição de validação
Atualizar rotas em App.tsx
Substituir InvestmentsDashboard por SmartInvestmentsPage
Manter compatibilidade com interface antiga (deprecar gradualmente)
Entregáveis:
✅ Interface nova funcionando
✅ Substituição de /investments
✅ Todos os componentes criados
✅ Interface antiga deprecada (mas ainda funcional)
Fase 7: Endpoints e Integração (Semana 15-16)
Objetivo: Criar todos os endpoints necessários.
Tarefas:
Criar endpoints em PortfolioViewSet:
POST /smart-recommendation/
POST/GET /chat/
GET/PUT /preferences/
POST /validate-strategy/
GET /strategy-performance/
GET /context/
Criar StrategyTemplateViewSet
GET /strategy-templates/
Criar serializers para novos modelos
Testar todos os endpoints
Entregáveis:
✅ Todos os endpoints criados
✅ Serializers criados
✅ Endpoints testados
Fase 8: Refinamento e Testes (Semana 17-18)
Objetivo: Polir e garantir qualidade.
Tarefas:
Criar testes para todos os serviços
Otimizar performance (cache, queries)
Ajustes de UX baseados em testes
Documentação completa
Deploy
Entregáveis:
✅ Testes completos
✅ Performance otimizada
✅ Documentação atualizada
✅ Sistema em produção
📝 TEMPLATES INICIAIS
Template 1: Dividendos Defensivos
{  "name": "Dividendos Defensivos",  "slug": "dividendos-defensivos",  "description": "Foco em dividendos consistentes de setores defensivos e perenes, com DY entre 6-8% e fundamentos sólidos.",  "category": "dividendos",  "base_criteria": {    "dividend_yield_min": 0.06,    "dividend_yield_max": 0.10,    "pe_ratio_max": 15.0,    "price_to_book_max": 2.0,    "allowed_sectors": ["financeiro", "energia", "utilities", "consumo", "telecomunicações"],    "excluded_sectors": ["mineração", "armas", "defesa"],    "min_diversification": 0.70,    "max_concentration_per_asset": 0.15,    "max_concentration_per_sector": 0.35,    "min_dividend_history_months": 12  },  "adaptation_logic": "Ajustar DY mínimo baseado em média de mercado atual. Se Selic < 10%, reduzir DY mínimo em 1pp. Se volatilidade alta, aumentar filtros de qualidade. Priorizar ativos com histórico consistente de dividendos."}
Template 2: Value Investing
{  "name": "Value Investing",  "slug": "value-investing",  "description": "Foco em empresas subvalorizadas com fundamentos sólidos, P/L e P/VP baixos.",  "category": "value",  "base_criteria": {    "pe_ratio_max": 12.0,    "price_to_book_max": 1.5,    "dividend_yield_min": 0.04,    "allowed_sectors": ["financeiro", "energia", "utilities", "consumo"],    "excluded_sectors": ["mineração", "armas", "defesa"],    "min_diversification": 0.75,    "max_concentration_per_asset": 0.12  },  "adaptation_logic": "Ajustar P/L máximo baseado em média do mercado. Em mercados caros, ser mais seletivo. Priorizar empresas com baixo P/VP e DY positivo."}
Template 3: Crescimento Balanceado
{  "name": "Crescimento Balanceado",  "slug": "crescimento-balanceado",  "description": "Mix de dividendos e crescimento, balanceando renda passiva com valorização.",  "category": "hibrida",  "base_criteria": {    "dividend_yield_min": 0.05,    "pe_ratio_max": 18.0,    "price_to_book_max": 2.5,    "allowed_sectors": ["financeiro", "energia", "utilities", "consumo", "telecomunicações"],    "excluded_sectors": ["mineração", "armas", "defesa"],    "min_diversification": 0.70,    "max_concentration_per_asset": 0.15  },  "adaptation_logic": "Balancear entre dividendos e crescimento baseado em ciclo de mercado. Em mercados de alta, focar mais em crescimento. Em mercados de baixa, focar mais em dividendos."}
Template 4: Renda Passiva
{  "name": "Renda Passiva",  "slug": "renda-passiva",  "description": "Foco total em dividendos mensais consistentes para gerar renda passiva.",  "category": "dividendos",  "base_criteria": {    "dividend_yield_min": 0.07,    "pe_ratio_max": 12.0,    "allowed_sectors": ["financeiro", "energia", "utilities"],    "excluded_sectors": ["mineração", "armas", "defesa"],    "min_diversification": 0.65,    "max_concentration_per_asset": 0.20,    "min_dividend_history_months": 24,    "min_regularity_score": 0.8  },  "adaptation_logic": "Priorizar ativos com histórico longo e consistente de dividendos. Ajustar DY mínimo baseado em Selic. Em juros baixos, aceitar DY menor."}
Template 5: Conservador
{  "name": "Conservador",  "slug": "conservador",  "description": "Máxima segurança, baixa volatilidade, foco em preservação de capital.",  "category": "dividendos",  "base_criteria": {    "dividend_yield_min": 0.05,    "pe_ratio_max": 10.0,    "price_to_book_max": 1.2,    "allowed_sectors": ["utilities", "energia"],    "excluded_sectors": ["mineração", "armas", "defesa", "financeiro"],    "min_diversification": 0.80,    "max_concentration_per_asset": 0.10,    "max_concentration_per_sector": 0.25,    "min_dividend_history_months": 36  },  "adaptation_logic": "Máxima segurança. Priorizar apenas setores mais defensivos (utilities, energia regulada). Aceitar DY menor em troca de segurança."}
🔄 ESTRATÉGIA DE MIGRAÇÃO
Compatibilidade com Sistema Atual
Fase de Transição:
Manter endpoints antigos funcionando
Nova interface disponível em /investments (substitui antiga)
Interface antiga disponível em /investments/legacy (deprecada)
Migração gradual: usuários podem usar ambas
Após 1 mês: remover interface antiga
Compatibilidade de Dados:
Model Strategy antigo continua funcionando
Sistema detecta se tem estratégia antiga ou nova
Se tem estratégia antiga, migra automaticamente para template mais próximo
Se não tem estratégia, usa template recomendado pela IA
✅ CHECKLIST DE VALIDAÇÃO
Antes de considerar completo:
Funcionalidades Core
[ ] Usuário pode pedir recomendação sem configurar nada
[ ] IA faz toda análise automaticamente
[ ] Recomendações são justificadas claramente
[ ] Interface é simples e direta (substitui /investments atual)
Preferências
[ ] Usuário pode definir preferências (ex: não investir em armas)
[ ] Preferências são respeitadas em todas as recomendações
[ ] Preferências podem ser editadas a qualquer momento
[ ] IA explica quando recomendação foi ajustada por preferências
Validação
[ ] Estratégias são validadas antes de aplicar
[ ] Estratégias são revalidadas periodicamente
[ ] IA alerta quando estratégia precisa de ajustes
[ ] Histórico de validações é mantido
Performance
[ ] Cada estratégia tem nota de performance visível
[ ] Nota é atualizada automaticamente
[ ] Interface mostra nota de forma clara (⭐⭐⭐⭐☆)
[ ] Comparação com IBOV está disponível
Sistema Vivo
[ ] Dados de mercado são atualizados automaticamente
[ ] Sistema detecta dados desatualizados
[ ] Cache inteligente funciona corretamente
[ ] Background jobs estão rodando
Chat
[ ] Chat funciona na carteira
[ ] Chat tem acesso a contexto completo
[ ] Respostas são em linguagem para leigos
[ ] Histórico de conversas é mantido
APIs
[ ] BRAPI integrado e funcionando
[ ] BCB API integrada e funcionando
[ ] SectorMapper funcionando
[ ] Limitações de APIs são aceitas e documentadas
📦 DEPENDÊNCIAS
Python
Django 5.x (já instalado)
Celery (para background jobs) - NOVO
Redis (para cache e filas) - NOVO
requests (já instalado)
Frontend
React (já instalado)
TypeScript (já instalado)
TanStack Query (já instalado)
Infraestrutura
Redis (para cache e Celery)
Celery worker (para background jobs)
🎯 PRÓXIMOS PASSOS IMEDIATOS
Revisar e aprovar este planejamento
Definir templates iniciais (quais estratégias começar)
Decidir sobre background jobs (Celery ou cron simples)
Priorizar fases (pode começar com Fase 1 + 2 para MVP)
Criar issues/tasks no projeto
Status: 📋 Planejamento Completo
Próxima Ação: Revisar, aprovar e começar Fase 1
Salve este conteúdo em `docs/PLANEJAMENTO_COMPLETO_SISTEMA_INTELIGENTE.md`. O documento cobre:1. ✅ Todos os 5 requisitos funcionais2. ✅ Todos os 8 modelos necessários (incluindo SectorMapping)3. ✅ Todos os 8 serviços4. ✅ Limitações de APIs e como lidar5. ✅ Estratégia de migração da interface antiga6. ✅ Templates iniciais com exemplos JSON7. ✅ Fluxos completos com diagramas8. ✅ Endpoints detalhados9. ✅ Background jobs10. ✅ Interface nova substituindo /investmentsQuer que eu ajuste algo ou começar a implementação?
Precisamos criar o .md de planejamento porém eu quero que você crie em 3 arquivos .md de etapas e não em um só.

Dividindo o planejamento em 3 arquivos por etapas. Criando os arquivos:
Dividindo o planejamento em 3 arquivos por etapas. Como estou em modo ask, não posso criar arquivos. Segue o conteúdo dos 3 arquivos para você criar:
Arquivo 1: docs/ETAPA_1_FUNDACAO_E_CORE.md
# ETAPA 1: FUNDAÇÃO E CORE - Sistema Inteligente de Investimentos> **Fases**: 1-2  > **Duração**: Semana 1-4  > **Objetivo**: Criar base de dados, APIs e serviços core de análise---

## 🎯 VISÃO GERAL DO PROJETO### Problema AtualSistema exige muito do usuário (definir estratégia, alocações, critérios) e pouco da IA.### Solução PropostaIA como cérebro proativo que:- Tem estratégias próprias pré-cadastradas (templates)- Analisa contexto completo do usuário automaticamente- Gera recomendações inteligentes sem exigir configuração- Valida e revalida estratégias continuamente- Mostra performance histórica de cada estratégia- Mantém dados sempre atualizados- Oferece chat contextual na carteira### Fluxo Ideal
Usuário: "Tenho R$200, onde invisto?"
↓
Sistema: Analisa contexto completo
↓
Sistema: Escolhe estratégia adequada
↓
Sistema: Gera alocações dinamicamente
↓
Sistema: Retorna recomendação com justificativa
↓
Usuário: Confirma ou ajusta
---## 📋 REQUISITOS FUNCIONAIS (Resumo)### RF1: Dicas/Preferências do Usuário ✅- Usuário pode definir preferências (ex: "Não investir em armas")- Preferências são respeitadas em todas as recomendações### RF2: Validação e Revalidação ✅- Estratégias validadas antes de aplicar- Revalidadas periodicamente### RF3: Nota/Performance ✅- Cada estratégia tem nota automática (⭐⭐⭐⭐☆)- Atualizada continuamente### RF4: Sistema Vivo ✅- Dados atualizados automaticamente- Sistema detecta dados desatualizados### RF5: Chat Contextual ✅- Chat na carteira com contexto completo- Respostas para leigos---## 🏗️ FASE 1: FUNDAÇÃO - MODELOS E APIs (Semana 1-2)### 1.1 Novos Modelos Django**Arquivo**: `backend/apps/investments/models.py`#### StrategyTemplateclass StrategyTemplate(WorkspaceModel):    """Template de estratégia pré-cadastrada pela IA."""        name = models.CharField(max_length=255)    slug = models.SlugField(unique=True)    description = models.TextField()    category = models.CharField(max_length=50)  # "dividendos", "value", "growth", "balanced"        base_criteria = models.JSONField(default=dict)    # Exemplo:    # {    #   "dividend_yield_min": 0.06,    #   "dividend_yield_max": 0.10,    #   "pe_ratio_max": 15.0,    #   "price_to_book_max": 2.0,    #   "allowed_sectors": ["financeiro", "energia", "utilities"],    #   "excluded_sectors": ["mineração", "armas"],    #   "min_diversification": 0.70,    #   "max_concentration_per_asset": 0.15,    #   "max_concentration_per_sector": 0.35    # }        adaptation_logic = models.TextField()    # Instruções para IA adaptar critérios baseado em contexto        performance_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)    is_active = models.BooleanField(default=True)    is_system_template = models.BooleanField(default=True)    priority = models.IntegerField(default=0)        last_validated = models.DateTimeField(null=True, blank=True)    validation_status = models.CharField(max_length=20, default="pending")#### InvestorProfileclass InvestorProfile(WorkspaceModel):    """Perfil do investidor inferido pela IA."""        portfolio = models.OneToOneField(Portfolio, on_delete=models.CASCADE, related_name="profile")        risk_tolerance = models.CharField(max_length=20)  # "conservador", "moderado", "arrojado"    investment_horizon = models.CharField(max_length=20)  # "curto", "médio", "longo"    primary_goal = models.CharField(max_length=50)  # "renda_passiva", "crescimento", "preservação"    experience_level = models.CharField(max_length=20, default="iniciante")        total_invested = models.DecimalField(max_digits=15, decimal_places=2, default=0)    average_dividend_yield = models.DecimalField(max_digits=5, decimal_places=2, default=0)    diversification_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)    concentration_risk = models.DecimalField(max_digits=5, decimal_places=2, default=0)        adherence_to_recommendations = models.DecimalField(max_digits=5, decimal_places=2, default=0)    average_holding_period = models.IntegerField(default=0)        last_analyzed = models.DateTimeField(auto_now=True)    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)    analysis_data = models.JSONField(default=dict)#### UserPreferencesclass UserPreferences(WorkspaceModel):    """Preferências do usuário (dicas para IA)."""        portfolio = models.OneToOneField(Portfolio, on_delete=models.CASCADE, related_name="preferences")        excluded_sectors = models.JSONField(default=list)  # ["armas", "defesa", "mineração"]    preferred_sectors = models.JSONField(default=list)    additional_criteria = models.TextField(blank=True)  # "Não topo investir em setores destrutivos"    restrictions = models.JSONField(default=dict)  # {"max_concentration_per_asset": 0.15}        last_updated = models.DateTimeField(auto_now=True)#### SectorMappinghonclass SectorMapping(WorkspaceModel):    """Mapeamento de tickers para setores."""        ticker = models.CharField(max_length=20, unique=True, db_index=True)    sector = models.CharField(max_length=100)    subsector = models.CharField(max_length=100, blank=True, null=True)    company_name = models.CharField(max_length=255, blank=True, null=True)    is_active = models.BooleanField(default=True)**Nota**: Modelos StrategyValidation, StrategyPerformance, PortfolioChat e DataFreshness serão criados nas próximas etapas.### 1.2 MigrationsCriar migrations para todos os modelos com índices apropriados.### 1.3 Providers de API#### BCBProvider**Arquivo**: `backend/apps/investments/services/bcb_provider.py` (NOVO)class BCBProvider:    """Provider para dados do Banco Central do Brasil."""        BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs"        def get_selic_rate(self) -> Decimal:        """Busca taxa Selic atual."""        # Código da série: 432        def get_ipca(self) -> Decimal:        """Busca IPCA atual."""        # Código da série: 433        def get_market_indices(self) -> Dict[str, Any]:        """Busca índices de mercado."""#### SectorMapper**Arquivo**: `backend/apps/investments/services/sector_mapper.py` (NOVO)onclass SectorMapper:    """Mapeamento de tickers para setores."""        def get_sector(self, ticker: str) -> Optional[str]:        """Retorna setor de um ticker."""        # Busca em SectorMapping        def get_all_tickers_by_sector(self, sector: str) -> List[str]:        """Retorna todos os tickers de um setor."""        def is_sector_allowed(        self,        sector: str,        allowed_sectors: List[str]    ) -> bool:        """Verifica se setor é permitido."""### 1.4 Templates Iniciais**Arquivo**: `backend/apps/investments/fixtures/strategy_templates.json` (NOVO)Criar 5 templates iniciais:1. **Dividendos Defensivos**: DY 6-8%, setores defensivos2. **Value Investing**: P/L < 15, P/VP < 1.53. **Crescimento Balanceado**: Mix de dividendos e crescimento4. **Renda Passiva**: Foco total em dividendos mensais5. **Conservador**: Máxima segurança, baixa volatilidade### 1.5 Popular SectorMappingCriar script ou fixture para popular ~100 principais tickers da B3 mapeados por setor.**Tarefas Fase 1**:- [ ] Criar todos os modelos- [ ] Criar migrations- [ ] Criar BCBProvider- [ ] Criar SectorMapper- [ ] Popular templates iniciais- [ ] Popular SectorMapping---## 🔧 FASE 2: SERVIÇOS CORE - ANÁLISE E ADVISOR (Semana 3-4)### 2.1 ContextAnalyzer**Arquivo**: `backend/apps/investments/services/context_analyzer.py` (NOVO)**Responsabilidades**:- Analisar carteira atual- Analisar histórico de transações- Analisar histórico de recomendações- Analisar contexto de mercado- Inferir perfil do investidor usando IA- Recomendar estratégia adequada**Métodos principais**:class ContextAnalyzer:    def analyze_user_context(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa contexto completo do usuário.                Returns:            {                "profile": {...},  # Perfil inferido                "current_strategy": {...},  # Estratégia atual                "recommended_strategy": {...},  # Estratégia recomendada                "market_context": {...},  # Contexto de mercado                "portfolio_health": {...},  # Saúde da carteira            }        """        def _analyze_portfolio(self, portfolio: Portfolio) -> Dict[str, Any]:        """Analisa carteira atual."""        # Calcula: valor total, alocação, diversificação, concentração, DY médio        def _analyze_transactions(self, portfolio: Portfolio) -> Dict[str, Any]:        """Analisa histórico de transações."""        # Padrões: frequência, valores, tipos, período de retenção        def _analyze_recommendations(self, portfolio: Portfolio) -> Dict[str, Any]:        """Analisa histórico de recomendações."""        # Taxa de aderência, performance, padrões de ajustes        def _analyze_market_context(self) -> Dict[str, Any]:        """Analisa contexto de mercado atual."""        # Selic, IBOV, volatilidade, yields médios        def _infer_profile_with_ai(self, ...) -> Dict[str, Any]:        """Usa IA para inferir perfil do investidor."""        # Prompt para IA analisar e inferir perfil        def _recommend_strategy(self, ...) -> Dict[str, Any]:        """Recomenda estratégia adequada."""        # Busca templates, usa IA para escolher, adapta critérios### 2.2 SmartInvestmentAdvisor**Arquivo**: `backend/apps/investments/services/smart_investment_advisor.py` (NOVO)**Responsabilidades**:- Gerar recomendações sem exigir configuração- Selecionar e adaptar estratégia- Gerar alocações dinamicamente (não usar TARGET_ALLOCATION fixo)- Respeitar preferências do usuário- Validar recomendações**Métodos principais**:class SmartInvestmentAdvisor:    def generate_recommendation(        self,        portfolio: Portfolio,        amount: Decimal,        user_preference: Optional[str] = None    ) -> Dict[str, Any]:        """Gera recomendação inteligente."""        # 1. Analisa contexto completo        # 2. Seleciona/adapta estratégia        # 3. Busca dados de mercado atualizados        # 4. Gera alocações dinamicamente        # 5. Valida e ajusta        # 6. Retorna recomendação completa        def _select_and_adapt_strategy(self, ...) -> Dict[str, Any]:        """Seleciona e adapta estratégia."""        # Busca templates, usa IA, adapta critérios        def _generate_dynamic_allocations(self, ...) -> List[Dict[str, Any]]:        """Gera alocações dinamicamente."""        # NÃO usa TARGET_ALLOCATION fixo        # Analisa oportunidades atuais        # Usa IA para gerar alocações        def _validate_and_adjust(self, ...) -> List[Dict[str, Any]]:        """Valida e ajusta alocações."""        def _apply_user_preferences(self, ...) -> List[Dict[str, Any]]:        """Aplica preferências do usuário."""### 2.3 Atualizar Prompt da IA**Arquivo**: `backend/apps/investments/services/openai_service.py`Atualizar `system_prompt` para:- Analisar contexto completo- Escolher estratégia adequada- Adaptar critérios baseado em mercado atual- Gerar alocações dinamicamente- Explicar raciocínio em linguagem simples**Tarefas Fase 2**:- [ ] Criar ContextAnalyzer- [ ] Criar SmartInvestmentAdvisor- [ ] Atualizar prompt da IA- [ ] Testes unitários básicos- [ ] Integração com APIs (BRAPI, BCB, SectorMapper)---## 📡 APIS E LIMITAÇÕES### APIs Disponíveis#### BRAPI (já integrado)- ✅ Cotações, P/L, P/VP, DY, EPS- ✅ Histórico de dividendos- ❌ ROE, payout ratio, dívida/EBITDA (não disponível)#### BCB API (NOVO)- ✅ Selic, IPCA- ✅ Dados macroeconômicos- ✅ Histórico completo#### SectorMapping (próprio)- ✅ Mapeamento ticker → setor- ✅ Tabela no banco populada manualmente### Limitações Aceitas**Importante**: Aceitamos que não temos:- ROE, payout ratio, dívida/EBITDA via APIs gratuitas**Estratégia**:- Trabalhar com dados disponíveis (BRAPI + BCB)- Usar IA para inferir qualidade quando necessário- Focar em métricas disponíveis: DY, P/L, P/VP, histórico de dividendos---## ✅ CHECKLIST ETAPA 1- [ ] Todos os modelos criados (StrategyTemplate, InvestorProfile, UserPreferences, SectorMapping)- [ ] Migrations aplicadas- [ ] BCBProvider funcionando- [ ] SectorMapper funcionando- [ ] 5 templates iniciais no banco- [ ] ~100 tickers mapeados por setor- [ ] ContextAnalyzer funcionando- [ ] SmartInvestmentAdvisor funcionando- [ ] Prompt da IA atualizado- [ ] Testes básicos passando
python
class StrategyTemplate(WorkspaceModel):
"""Template de estratégia pré-cadastrada pela IA."""
name = models.CharField(max_length=255)
slug = models.SlugField(unique=True)
description = models.TextField()
category = models.CharField(max_length=50) # "dividendos", "value", "growth", "balanced"
base_criteria = models.JSONField(default=dict)
# Exemplo:
# {
# "dividend_yield_min": 0.06,
# "dividend_yield_max": 0.10,
# "pe_ratio_max": 15.0,
# "price_to_book_max": 2.0,
# "allowed_sectors": ["financeiro", "energia", "utilities"],
# "excluded_sectors": ["mineração", "armas"],
# "min_diversification": 0.70,
# "max_concentration_per_asset": 0.15,
# "max_concentration_per_sector": 0.35
# }
adaptation_logic = models.TextField()
# Instruções para IA adaptar critérios baseado em contexto
performance_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
is_active = models.BooleanField(default=True)
is_system_template = models.BooleanField(default=True)
priority = models.IntegerField(default=0)
last_validated = models.DateTimeField(null=True, blank=True)
validation_status = models.CharField(max_length=20, default="pending")
# ETAPA 2: QUALIDADE E SISTEMA VIVO - Sistema Inteligente de Investimentos> **Fases**: 3-5  > **Duração**: Semana 5-10  > **Objetivo**: Garantir qualidade, rastreabilidade e dados sempre atualizados---## 🔧 FASE 3: VALIDAÇÃO E PERFORMANCE (Semana 5-6)### 3.1 Modelos Adicionais#### StrategyValidation**Arquivo**: `backend/apps/investments/models.py`class StrategyValidation(WorkspaceModel):    """Registro de validação de estratégia."""        strategy_template = models.ForeignKey(StrategyTemplate, ...)    portfolio = models.ForeignKey(Portfolio, ...)        validation_status = models.CharField(max_length=20)    # "valid", "needs_review", "invalid", "warning"        validation_result = models.JSONField(default=dict)    # {    #   "criteria_valid": true,    #   "market_conditions_ok": true,    #   "issues": [],    #   "warnings": ["DY mínimo muito alto para mercado atual"]    # }        suggested_adjustments = models.JSONField(default=dict)    # {    #   "dividend_yield_min": {    #     "current": 0.08,    #     "suggested": 0.06,    #     "reason": "Média de mercado atual é 6-7%"    #   }    # }        validated_at = models.DateTimeField(auto_now_add=True)    validated_by = models.CharField(max_length=50, default="ai")#### StrategyPerformance**Arquivo**: `backend/apps/investments/models.py`class StrategyPerformance(WorkspaceModel):    """Performance histórica de uma estratégia."""        strategy_template = models.ForeignKey(StrategyTemplate, ...)    portfolio = models.ForeignKey(Portfolio, ...)        period_start = models.DateField()    period_end = models.DateField()        total_return = models.DecimalField(max_digits=10, decimal_places=2)    dividend_yield_realized = models.DecimalField(max_digits=5, decimal_places=2)    recommendations_followed = models.IntegerField(default=0)    recommendations_total = models.IntegerField(default=0)    adherence_rate = models.DecimalField(max_digits=5, decimal_places=2)        performance_score = models.DecimalField(max_digits=5, decimal_places=2)    # Fórmula: (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2) * 100        vs_ibovespa = models.DecimalField(max_digits=10, decimal_places=2)        calculated_at = models.DateTimeField(auto_now_add=True)### 3.2 StrategyValidator**Arquivo**: `backend/apps/investments/services/strategy_validator.py` (NOVO)**Responsabilidades**:- Validar estratégia antes de aplicar- Revalidar estratégias periodicamente- Detectar quando precisa de ajustes- Sugerir melhorias**Métodos principais**:class StrategyValidator:    def validate_strategy(        self,        strategy_template: StrategyTemplate,        portfolio: Portfolio,        market_context: Dict[str, Any]    ) -> Dict[str, Any]:        """Valida estratégia antes de aplicar."""        # Verifica se critérios fazem sentido agora        # Verifica condições de mercado        # Identifica problemas        # Sugere ajustes        def revalidate_all_strategies(self):        """Revalida todas as estratégias ativas."""        # Background job: roda diariamente        def _check_criteria_validity(self, ...) -> bool:        """Verifica se critérios são válidos."""        def _check_market_conditions(self, ...) -> bool:        """Verifica se condições de mercado são adequadas."""        def _suggest_adjustments(self, ...) -> List[Dict[str, Any]]:        """Sugere ajustes na estratégia."""### 3.3 PerformanceCalculator**Arquivo**: `backend/apps/investments/services/performance_calculator.py` (NOVO)**Responsabilidades**:- Calcular performance histórica- Atualizar notas automaticamente- Comparar com benchmarks**Métodos principais**:class PerformanceCalculator:    def calculate_strategy_performance(        self,        strategy_template: StrategyTemplate,        portfolio: Portfolio,        period_start: date,        period_end: date    ) -> Dict[str, Any]:        """Calcula performance histórica."""        # Calcula: total_return, dividend_yield_realized, adherence_rate        # Compara com IBOV        # Calcula score (0-100)        # Cria registro StrategyPerformance        def update_all_performance_scores(self):        """Atualiza scores de todas as estratégias."""        # Background job: roda semanalmente        # Atualiza StrategyTemplate.performance_score        def _calculate_total_return(self, ...) -> Decimal:        """Calcula retorno total no período."""        def _calculate_dividend_yield_realized(self, ...) -> Decimal:        """Calcula DY realizado."""        def _calculate_performance_score(self, ...) -> Decimal:        """Calcula score de performance (0-100)."""        # score = (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2)        # return score * 100### 3.4 Background Jobs - Parte 1**Arquivo**: `backend/apps/investments/tasks.py` (NOVO - Celery)**Jobs necessários**:@periodic_task(run_every=crontab(day_of_week=0, hour=20, minute=0))def calculate_performance():    """Calcula performance semanalmente."""    # Para cada estratégia com histórico    # Calcula métricas    # Atualiza StrategyTemplate.performance_score@periodic_task(run_every=crontab(hour=18, minute=0))def revalidate_strategies():    """Revalida todas as estratégias ativas."""    # Para cada StrategyTemplate ativo    # Valida critérios    # Salva StrategyValidation@periodic_task(run_every=crontab(day_of_week=0, hour=21, minute=0))def analyze_profiles():    """Re-analisa perfis dos investidores."""    # Para cada portfolio    # Analisa contexto    # Atualiza InvestorProfile**Tarefas Fase 3**:- [ ] Criar StrategyValidation model- [ ] Criar StrategyPerformance model- [ ] Criar StrategyValidator- [ ] Criar PerformanceCalculator- [ ] Configurar Celery- [ ] Criar background jobs- [ ] Testes---## 🔄 FASE 4: SISTEMA VIVO - ATUALIZAÇÃO AUTOMÁTICA (Semana 7-8)### 4.1 DataFreshness Model**Arquivo**: `backend/apps/investments/models.py`class DataFreshness(WorkspaceModel):    """Controle de atualização de dados."""        data_type = models.CharField(max_length=50)    # "quote", "fundamental", "dividend_history", "market_context"        ticker = models.CharField(max_length=20, null=True, blank=True)    # Null se for dados gerais (ex: IBOV, Selic)        last_updated = models.DateTimeField()    next_update_due = models.DateTimeField()        is_fresh = models.BooleanField(default=True)    freshness_score = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)    # 1.0 = totalmente atualizado, 0.0 = desatualizado        update_frequency_minutes = models.IntegerField(default=5)### 4.2 DataFreshnessManager**Arquivo**: `backend/apps/investments/services/data_freshness_manager.py` (NOVO)**Responsabilidades**:- Controlar atualização de dados- Detectar dados desatualizados- Agendar atualizações- Garantir que dados estão sempre frescos**Métodos principais**:honclass DataFreshnessManager:    def check_data_freshness(        self,        data_type: str,        ticker: Optional[str] = None    ) -> bool:        """Verifica se dados estão atualizados."""        # Consulta DataFreshness        # Verifica se is_fresh e next_update_due        def update_data_if_needed(        self,        data_type: str,        ticker: Optional[str] = None    ):        """Atualiza dados se necessário."""        # Se não está fresh, força atualização        # Atualiza DataFreshness após buscar        def schedule_updates(self):        """Agenda atualizações."""        # Background job: verifica e agenda atualizações        def _calculate_freshness_score(self, ...) -> Decimal:        """Calcula score de atualização (0-1)."""### 4.3 Integração com ProvidersAtualizar `BrapiProvider` e `BCBProvider` para:- Verificar `DataFreshness` antes de usar cache- Atualizar automaticamente se dados estiverem desatualizados- Registrar atualizações em `DataFreshness`### 4.4 Background Jobs - Parte 2@periodic_task(run_every=crontab(minute='*/5', hour='10-17'))def update_market_data():    """Atualiza dados de mercado a cada 5 minutos."""    # Verifica DataFreshness    # Atualiza se necessário    # Atualiza DataFreshness após atualizar@periodic_task(run_every=crontab(hour=2, minute=0))def cleanup_cache():    """Limpa cache antigo."""    # Remove cache expirado    # Otimiza DataFreshness**Tarefas Fase 4**:- [ ] Criar DataFreshness model- [ ] Criar DataFreshnessManager- [ ] Integrar com BrapiProvider- [ ] Integrar com BCBProvider- [ ] Criar background jobs de atualização- [ ] Criar endpoint de monitoramento- [ ] Testes---## 💬 FASE 5: CHAT CONTEXTUAL (Semana 9-10)### 5.1 PortfolioChat Model**Arquivo**: `backend/apps/investments/models.py`class PortfolioChat(WorkspaceModel):    """Mensagens do chat na carteira."""        portfolio = models.ForeignKey(Portfolio, ...)        message = models.TextField()    is_from_user = models.BooleanField(default=True)        context_snapshot = models.JSONField(default=dict)    # Snapshot do contexto no momento da mensagem        ai_response = models.TextField(blank=True)    ai_confidence = models.DecimalField(max_digits=5, decimal_places=2, null=True)        created_at = models.DateTimeField(auto_now_add=True)### 5.2 PortfolioChatService**Arquivo**: `backend/apps/investments/services/portfolio_chat_service.py` (NOVO)**Responsabilidades**:- Processar mensagens do chat- Construir contexto completo para IA- Gerar respostas em linguagem para leigos- Manter histórico de conversas**Métodos principais**:onclass PortfolioChatService:    def send_message(        self,        portfolio: Portfolio,        message: str    ) -> Dict[str, Any]:        """Processa mensagem do chat."""        # 1. Constrói contexto completo        # 2. Envia para IA com prompt especializado        # 3. Simplifica resposta para leigo        # 4. Salva mensagem e resposta        # 5. Retorna resposta        def _build_complete_context(        self,        portfolio: Portfolio    ) -> Dict[str, Any]:        """Constrói contexto completo para IA."""        # Inclui:        # - Carteira atual        # - Estratégia ativa        # - Histórico de recomendações        # - Performance da estratégia        # - Dados de mercado        # - Perfil do investidor        # - Preferências do usuário        # - Histórico de transações        # - Dividendos recebidos        def _generate_ai_response(self, ...) -> str:        """Gera resposta da IA."""        # Prompt especializado para leigos        def _simplify_for_layperson(self, response: str) -> str:        """Simplifica resposta para leigos."""        # Remove jargão técnico        # Explica termos complexos### 5.3 Endpoint de Chat**Arquivo**: `backend/apps/investments/viewsets.py`Adicionar action em `PortfolioViewSet`:thon@action(detail=True, methods=["post"], url_path="chat")def chat(self, request: "Request", pk: str = None) -> Response:    """Chat contextual na carteira."""    portfolio = self.get_object()    message = request.data.get("message")        chat_service = PortfolioChatService()    result = chat_service.send_message(portfolio, message)        return Response(result)**Tarefas Fase 5**:- [ ] Criar PortfolioChat model- [ ] Criar PortfolioChatService- [ ] Criar endpoint POST/GET /chat/- [ ] Testes---## ✅ CHECKLIST ETAPA 2- [ ] StrategyValidation model criado- [ ] StrategyPerformance model criado- [ ] DataFreshness model criado- [ ] PortfolioChat model criado- [ ] StrategyValidator funcionando- [ ] PerformanceCalculator funcionando- [ ] DataFreshnessManager funcionando- [ ] PortfolioChatService funcionando- [ ] Background jobs configurados e rodando- [ ] Notas de performance sendo calculadas- [ ] Estratégias sendo validadas periodicamente- [ ] Dados sendo atualizados automaticamente- [ ] Chat funcionando com contexto completo
UserPreferences
# ETAPA 3: INTERFACE E FINALIZAÇÃO - Sistema Inteligente de Investimentos> **Fases**: 6-8  > **Duração**: Semana 11-18  > **Objetivo**: Criar interface nova, endpoints e finalizar sistema---

## 🎨 FASE 6: INTERFACE NOVA - SUBSTITUIÇÃO COMPLETA (Semana 11-14)### 6.1 Nova Página Principal**Arquivo**: `frontend/src/features/investments/pages/SmartInvestmentsPage.tsx` (NOVO)**Substitui**: `InvestmentsDashboard.tsx`**Interface**:
SectorMapping
**Componentes principais**:#### SmartRecommendationForm**Arquivo**: `frontend/src/features/investments/components/SmartRecommendationForm.tsx` (NOVO)ypescriptinterface SmartRecommendationFormProps {  portfolioId: string;  onRecommendation: (recommendation: any) => void;}export function SmartRecommendationForm({ portfolioId, onRecommendation }: SmartRecommendationFormProps) {  const [amount, setAmount] = useState<string>("");  const [loading, setLoading] = useState(false);    const handleSubmit = async () => {    // POST /api/investments/portfolios/{id}/smart-recommendation/    // { amount: parseFloat(amount) }  };    return (    <div>      <Input        type="number"        placeholder="Quanto você quer investir?"        value={amount}        onChange={(e) => setAmount(e.target.value)}      />      <Button onClick={handleSubmit} disabled={loading}>        Onde devo investir?      </Button>    </div>  );}#### RecommendationResult**Arquivo**: `frontend/src/features/investments/components/RecommendationResult.tsx` (NOVO)ptinterface RecommendationResultProps {  recommendation: any;  strategy: any;  onConfirm: () => void;  onAdjust: () => void;}export function RecommendationResult({ recommendation, strategy, onConfirm, onAdjust }: RecommendationResultProps) {  return (    <Card>      <StrategyCard strategy={strategy} />      <div>        {recommendation.allocations.map((allocation: any) => (          <AllocationItem key={allocation.ticker} allocation={allocation} />        ))}      </div>      <div>{recommendation.reasoning}</div>      <div>        <Button onClick={onConfirm}>Confirmar</Button>        <Button onClick={onAdjust} variant="outline">Ajustar</Button>      </div>    </Card>  );}#### StrategyCard**Arquivo**: `frontend/src/features/investments/components/StrategyCard.tsx` (NOVO)interface StrategyCardProps {  strategy: {    name: string;    performance_score: number;    category: string;  };}export function StrategyCard({ strategy }: StrategyCardProps) {  const stars = Math.round(strategy.performance_score);  const starDisplay = "⭐".repeat(stars) + "☆".repeat(5 - stars);    return (    <Card>      <div>        <span>{starDisplay}</span>        <h3>{strategy.name}</h3>        <p>{strategy.category}</p>      </div>    </Card>  );}### 6.2 Chat na Carteira**Arquivo**: `frontend/src/features/investments/components/PortfolioChat.tsx` (NOVO)tinterface PortfolioChatProps {  portfolioId: string;}export function PortfolioChat({ portfolioId }: PortfolioChatProps) {  const [messages, setMessages] = useState<any[]>([]);  const [input, setInput] = useState("");  const [loading, setLoading] = useState(false);    const sendMessage = async () => {    // POST /api/investments/portfolios/{id}/chat/    // { message: input }  };    return (    <div>      <div>        {messages.map((msg) => (          <MessageItem key={msg.id} message={msg} />        ))}      </div>      <div>        <Input          value={input}          onChange={(e) => setInput(e.target.value)}          placeholder="Digite sua pergunta..."        />        <Button onClick={sendMessage} disabled={loading}>          Enviar        </Button>      </div>    </div>  );}### 6.3 Preferências do Usuário**Arquivo**: `frontend/src/features/investments/components/UserPreferences.tsx` (NOVO)interface UserPreferencesProps {  portfolioId: string;}export function UserPreferences({ portfolioId }: UserPreferencesProps) {  const [excludedSectors, setExcludedSectors] = useState<string[]>([]);  const [additionalCriteria, setAdditionalCriteria] = useState("");    const savePreferences = async () => {    // PUT /api/investments/portfolios/{id}/preferences/    // {    //   excluded_sectors: excludedSectors,    //   additional_criteria: additionalCriteria    // }  };    return (    <Modal>      <h2>Preferências de Investimento</h2>      <div>        <h3>Setores que não quero investir:</h3>        {SECTORS.map((sector) => (          <Checkbox            key={sector}            checked={excludedSectors.includes(sector)}            onChange={(checked) => {              if (checked) {                setExcludedSectors([...excludedSectors, sector]);              } else {                setExcludedSectors(excludedSectors.filter(s => s !== sector));              }            }}          >            {sector}          </Checkbox>        ))}      </div>      <div>        <h3>Dicas para a IA:</h3>        <Textarea          value={additionalCriteria}          onChange={(e) => setAdditionalCriteria(e.target.value)}          placeholder="Ex: Não topo investir em setores destrutivos"        />      </div>      <Button onClick={savePreferences}>Salvar</Button>    </Modal>  );}### 6.4 Performance de Estratégia**Arquivo**: `frontend/src/features/investments/components/StrategyPerformance.tsx` (NOVO)interface StrategyPerformanceProps {  portfolioId: string;}export function StrategyPerformance({ portfolioId }: StrategyPerformanceProps) {  const { data: performance } = useQuery({    queryKey: ["strategy-performance", portfolioId],    queryFn: () => fetch(`/api/investments/portfolios/${portfolioId}/strategy-performance/`).then(r => r.json())  });    const stars = Math.round(performance?.current_score || 0);  const starDisplay = "⭐".repeat(stars) + "☆".repeat(5 - stars);    return (    <Modal>      <h2>Performance da Estratégia</h2>      <div>        <div>Nota: {starDisplay}</div>        <div>Retorno Total: {performance?.total_return}%</div>        <div>DY Realizado: {performance?.dividend_yield_realized}%</div>        <div>vs IBOV: {performance?.vs_ibovespa}%</div>      </div>      <Chart data={performance?.historical_performance} />    </Modal>  );}### 6.5 Validação de Estratégia**Arquivo**: `frontend/src/features/investments/components/StrategyValidation.tsx` (NOVO)interface StrategyValidationProps {  portfolioId: string;}export function StrategyValidation({ portfolioId }: StrategyValidationProps) {  const { data: validation } = useQuery({    queryKey: ["strategy-validation", portfolioId],    queryFn: () => fetch(`/api/investments/portfolios/${portfolioId}/validate-strategy/`, {      method: "POST"    }).then(r => r.json())  });    return (    <Card>      <div>        {validation?.status === "valid" && <span>✅ Estratégia válida</span>}        {validation?.status === "needs_review" && <span>⚠️ Precisa revisão</span>}        {validation?.status === "invalid" && <span>❌ Estratégia inválida</span>}      </div>      {validation?.issues.length > 0 && (        <div>          <h3>Problemas encontrados:</h3>          <ul>            {validation.issues.map((issue: string, i: number) => (              <li key={i}>{issue}</li>            ))}          </ul>        </div>      )}      {validation?.suggested_adjustments && (        <div>          <h3>Sugestões de ajustes:</h3>          {/* Exibir ajustes sugeridos */}        </div>      )}    </Card>  );}### 6.6 Atualizar Rotas**Arquivo**: `frontend/src/App.tsx`ipt// Substituirimport InvestmentsDashboard from "./features/investments/pages/InvestmentsDashboard";// Porimport SmartInvestmentsPage from "./features/investments/pages/SmartInvestmentsPage";// Atualizar rota<Route  path="/investments"  element={    <ProtectedRoute>      <SmartInvestmentsPage />    </ProtectedRoute>  }/>**Tarefas Fase 6**:- [ ] Criar SmartInvestmentsPage.tsx- [ ] Criar SmartRecommendationForm.tsx- [ ] Criar RecommendationResult.tsx- [ ] Criar StrategyCard.tsx- [ ] Criar PortfolioChat.tsx- [ ] Criar UserPreferences.tsx- [ ] Criar StrategyPerformance.tsx- [ ] Criar StrategyValidation.tsx- [ ] Atualizar rotas- [ ] Testes de UX---## 📊 FASE 7: ENDPOINTS E INTEGRAÇÃO (Semana 15-16)### 7.1 Novos Endpoints**Arquivo**: `backend/apps/investments/viewsets.py`#### Endpoint 1: Recomendação Inteligentethon@action(detail=True, methods=["post"], url_path="smart-recommendation")def smart_recommendation(self, request: "Request", pk: str = None) -> Response:    """Gera recomendação inteligente."""    portfolio = self.get_object()    amount = Decimal(str(request.data.get("amount", 0)))    user_preference = request.data.get("user_preference")        advisor = SmartInvestmentAdvisor()    recommendation = advisor.generate_recommendation(        portfolio, amount, user_preference    )        return Response(recommendation)#### Endpoint 2: Chat@action(detail=True, methods=["post", "get"], url_path="chat")def chat(self, request: "Request", pk: str = None) -> Response:    """Chat contextual na carteira."""    portfolio = self.get_object()        if request.method == "POST":        message = request.data.get("message")        chat_service = PortfolioChatService()        result = chat_service.send_message(portfolio, message)        return Response(result)        # GET: retorna histórico    messages = PortfolioChat.objects.filter(portfolio=portfolio).order_by("created_at")    return Response({"messages": [serialize_message(m) for m in messages]})#### Endpoint 3: Preferênciasn@action(detail=True, methods=["get", "put"], url_path="preferences")def preferences(self, request: "Request", pk: str = None) -> Response:    """Preferências do usuário."""    portfolio = self.get_object()    preferences, created = UserPreferences.objects.get_or_create(portfolio=portfolio)        if request.method == "PUT":        serializer = UserPreferencesSerializer(preferences, data=request.data)        serializer.is_valid(raise_exception=True)        serializer.save()        return Response(serializer.data)        serializer = UserPreferencesSerializer(preferences)    return Response(serializer.data)#### Endpoint 4: Validaçãothon@action(detail=True, methods=["post"], url_path="validate-strategy")def validate_strategy(self, request: "Request", pk: str = None) -> Response:    """Valida estratégia atual."""    portfolio = self.get_object()    strategy_template = portfolio.strategy.strategy_template  # Assumindo relação        validator = StrategyValidator()    result = validator.validate_strategy(        strategy_template, portfolio, market_context={}    )        return Response(result)#### Endpoint 5: Performanceython@action(detail=True, methods=["get"], url_path="strategy-performance")def strategy_performance(self, request: "Request", pk: str = None) -> Response:    """Performance da estratégia."""    portfolio = self.get_object()    strategy_template = portfolio.strategy.strategy_template        performance = StrategyPerformance.objects.filter(        portfolio=portfolio,        strategy_template=strategy_template    ).order_by("-period_end").first()        serializer = StrategyPerformanceSerializer(performance)    return Response(serializer.data)#### Endpoint 6: Contextothon@action(detail=True, methods=["get"], url_path="context")def context(self, request: "Request", pk: str = None) -> Response:    """Contexto completo analisado (debug/transparência)."""    portfolio = self.get_object()        analyzer = ContextAnalyzer()    context = analyzer.analyze_user_context(portfolio)        return Response(context)### 7.2 ViewSets Adicionais#### StrategyTemplateViewSetclass StrategyTemplateViewSet(WorkspaceViewSet):    """ViewSet para templates de estratégias."""        queryset = StrategyTemplate.objects.filter(is_active=True)    serializer_class = StrategyTemplateSerializer        def get_queryset(self):        queryset = super().get_queryset()        category = self.request.query_params.get("category")        if category:            queryset = queryset.filter(category=category)        return queryset.order_by("-performance_score", "priority")### 7.3 Serializers**Arquivo**: `backend/apps/investments/serializers.py`Adicionar serializers:- `StrategyTemplateSerializer`- `InvestorProfileSerializer`- `UserPreferencesSerializer`- `PortfolioChatSerializer`- `StrategyPerformanceSerializer`- `StrategyValidationSerializer`**Tarefas Fase 7**:- [ ] Criar todos os endpoints- [ ] Criar StrategyTemplateViewSet- [ ] Criar todos os serializers- [ ] Testar todos os endpoints- [ ] Documentar endpoints---## ✅ FASE 8: REFINAMENTO E TESTES (Semana 17-18)### 8.1 Testes**Arquivos**: `backend/apps/investments/tests/`Criar testes para:- `test_context_analyzer.py`- `test_smart_investment_advisor.py`- `test_strategy_validator.py`- `test_performance_calculator.py`- `test_portfolio_chat_service.py`- `test_data_freshness_manager.py`- `test_bcb_provider.py`- `test_sector_mapper.py`### 8.2 Otimizações- Cache agressivo para dados de mercado- Otimizar queries de histórico- Lazy loading de dados pesados- Debounce em inputs do frontend- Paginação em listas grandes### 8.3 Ajustes de UX- Melhorar feedback visual- Adicionar loading states- Melhorar mensagens de erro- Adicionar tooltips explicativos- Testes de usabilidade### 8.4 Documentação- Atualizar `ANALYSIS.md` do módulo- Documentar todos os novos endpoints- Criar guia de uso da nova interface- Documentar limitações de APIs- Criar README para desenvolvedores**Tarefas Fase 8**:- [ ] Criar testes completos- [ ] Otimizar performance- [ ] Ajustes de UX- [ ] Documentação completa- [ ] Deploy---## 🔄 ESTRATÉGIA DE MIGRAÇÃO### Compatibilidade com Sistema Atual**Fase de Transição**:1. Manter endpoints antigos funcionando2. Nova interface disponível em `/investments` (substitui antiga)3. Interface antiga disponível em `/investments/legacy` (deprecada)4. Migração gradual: usuários podem usar ambas5. Após 1 mês: remover interface antiga**Compatibilidade de Dados**:- Model `Strategy` antigo continua funcionando- Sistema detecta se tem estratégia antiga ou nova- Se tem estratégia antiga, migra automaticamente para template mais próximo- Se não tem estratégia, usa template recomendado pela IA---## ✅ CHECKLIST FINAL### Funcionalidades Core- [ ] Usuário pode pedir recomendação sem configurar nada- [ ] IA faz toda análise automaticamente- [ ] Recomendações são justificadas claramente- [ ] Interface é simples e direta (substitui /investments atual)### Preferências- [ ] Usuário pode definir preferências- [ ] Preferências são respeitadas- [ ] Preferências podem ser editadas- [ ] IA explica quando ajustou por preferências### Validação- [ ] Estratégias são validadas antes de aplicar- [ ] Estratégias são revalidadas periodicamente- [ ] IA alerta quando precisa de ajustes- [ ] Histórico de validações é mantido### Performance- [ ] Cada estratégia tem nota visível- [ ] Nota é atualizada automaticamente- [ ] Interface mostra nota claramente (⭐⭐⭐⭐☆)- [ ] Comparação com IBOV disponível### Sistema Vivo- [ ] Dados são atualizados automaticamente- [ ] Sistema detecta dados desatualizados- [ ] Cache inteligente funciona- [ ] Background jobs rodando### Chat- [ ] Chat funciona na carteira- [ ] Chat tem contexto completo- [ ] Respostas são para leigos- [ ] Histórico mantido### APIs- [ ] BRAPI integrado- [ ] BCB API integrada- [ ] SectorMapper funcionando- [ ] Limitações aceitas e documentadas---## 📦 DEPENDÊNCIAS### Python- Django 5.x (já instalado)- Celery (para background jobs) - **NOVO**- Redis (para cache e filas) - **NOVO**- requests (já instalado)### Frontend- React (já instalado)- TypeScript (já instalado)- TanStack Query (já instalado)### Infraestrutura- Redis (para cache e Celery)- Celery worker (para background jobs)---## 🎯 PRÓXIMOS PASSOS1. Revisar e aprovar planejamento2. Começar Fase 1 (Modelos e APIs)3. Configurar Celery + Redis4. Popular templates iniciais5. Popular SectorMapping**Status**: 📋 Planejamento Completo em 3 Etapas  **Próxima Ação**: Começar Etapa 1
Nota: Modelos StrategyValidation, StrategyPerformance, PortfolioChat e DataFreshness serão criados nas próximas etapas.
1.2 Migrations
Criar migrations para todos os modelos com índices apropriados.
1.3 Providers de API
BCBProvider
Arquivo: backend/apps/investments/services/bcb_provider.py (NOVO)
class BCBProvider:    """Provider para dados do Banco Central do Brasil."""        BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs"        def get_selic_rate(self) -> Decimal:        """Busca taxa Selic atual."""        # Código da série: 432        def get_ipca(self) -> Decimal:        """Busca IPCA atual."""        # Código da série: 433        def get_market_indices(self) -> Dict[str, Any]:        """Busca índices de mercado."""
SectorMapper
Arquivo: backend/apps/investments/services/sector_mapper.py (NOVO)
class SectorMapper:    """Mapeamento de tickers para setores."""        def get_sector(self, ticker: str) -> Optional[str]:        """Retorna setor de um ticker."""        # Busca em SectorMapping        def get_all_tickers_by_sector(self, sector: str) -> List[str]:        """Retorna todos os tickers de um setor."""        def is_sector_allowed(        self,        sector: str,        allowed_sectors: List[str]    ) -> bool:        """Verifica se setor é permitido."""
1.4 Templates Iniciais
Arquivo: backend/apps/investments/fixtures/strategy_templates.json (NOVO)
Criar 5 templates iniciais:
Dividendos Defensivos: DY 6-8%, setores defensivos
Value Investing: P/L < 15, P/VP < 1.5
Crescimento Balanceado: Mix de dividendos e crescimento
Renda Passiva: Foco total em dividendos mensais
Conservador: Máxima segurança, baixa volatilidade
1.5 Popular SectorMapping
Criar script ou fixture para popular ~100 principais tickers da B3 mapeados por setor.
Tarefas Fase 1:
[ ] Criar todos os modelos
[ ] Criar migrations
[ ] Criar BCBProvider
[ ] Criar SectorMapper
[ ] Popular templates iniciais
[ ] Popular SectorMapping
🔧 FASE 2: SERVIÇOS CORE - ANÁLISE E ADVISOR (Semana 3-4)
2.1 ContextAnalyzer
Arquivo: backend/apps/investments/services/context_analyzer.py (NOVO)
Responsabilidades:
Analisar carteira atual
Analisar histórico de transações
Analisar histórico de recomendações
Analisar contexto de mercado
Inferir perfil do investidor usando IA
Recomendar estratégia adequada
Métodos principais:
class ContextAnalyzer:    def analyze_user_context(        self,         portfolio: Portfolio    ) -> Dict[str, Any]:        """Analisa contexto completo do usuário.                Returns:            {                "profile": {...},  # Perfil inferido                "current_strategy": {...},  # Estratégia atual                "recommended_strategy": {...},  # Estratégia recomendada                "market_context": {...},  # Contexto de mercado                "portfolio_health": {...},  # Saúde da carteira            }        """        def _analyze_portfolio(self, portfolio: Portfolio) -> Dict[str, Any]:        """Analisa carteira atual."""        # Calcula: valor total, alocação, diversificação, concentração, DY médio        def _analyze_transactions(self, portfolio: Portfolio) -> Dict[str, Any]:        """Analisa histórico de transações."""        # Padrões: frequência, valores, tipos, período de retenção        def _analyze_recommendations(self, portfolio: Portfolio) -> Dict[str, Any]:        """Analisa histórico de recomendações."""        # Taxa de aderência, performance, padrões de ajustes        def _analyze_market_context(self) -> Dict[str, Any]:        """Analisa contexto de mercado atual."""        # Selic, IBOV, volatilidade, yields médios        def _infer_profile_with_ai(self, ...) -> Dict[str, Any]:        """Usa IA para inferir perfil do investidor."""        # Prompt para IA analisar e inferir perfil        def _recommend_strategy(self, ...) -> Dict[str, Any]:        """Recomenda estratégia adequada."""        # Busca templates, usa IA para escolher, adapta critérios
2.2 SmartInvestmentAdvisor
Arquivo: backend/apps/investments/services/smart_investment_advisor.py (NOVO)
Responsabilidades:
Gerar recomendações sem exigir configuração
Selecionar e adaptar estratégia
Gerar alocações dinamicamente (não usar TARGET_ALLOCATION fixo)
Respeitar preferências do usuário
Validar recomendações
Métodos principais:
class SmartInvestmentAdvisor:    def generate_recommendation(        self,        portfolio: Portfolio,        amount: Decimal,        user_preference: Optional[str] = None    ) -> Dict[str, Any]:        """Gera recomendação inteligente."""        # 1. Analisa contexto completo        # 2. Seleciona/adapta estratégia        # 3. Busca dados de mercado atualizados        # 4. Gera alocações dinamicamente        # 5. Valida e ajusta        # 6. Retorna recomendação completa        def _select_and_adapt_strategy(self, ...) -> Dict[str, Any]:        """Seleciona e adapta estratégia."""        # Busca templates, usa IA, adapta critérios        def _generate_dynamic_allocations(self, ...) -> List[Dict[str, Any]]:        """Gera alocações dinamicamente."""        # NÃO usa TARGET_ALLOCATION fixo        # Analisa oportunidades atuais        # Usa IA para gerar alocações        def _validate_and_adjust(self, ...) -> List[Dict[str, Any]]:        """Valida e ajusta alocações."""        def _apply_user_preferences(self, ...) -> List[Dict[str, Any]]:        """Aplica preferências do usuário."""
2.3 Atualizar Prompt da IA
Arquivo: backend/apps/investments/services/openai_service.py
Atualizar system_prompt para:
Analisar contexto completo
Escolher estratégia adequada
Adaptar critérios baseado em mercado atual
Gerar alocações dinamicamente
Explicar raciocínio em linguagem simples
Tarefas Fase 2:
[ ] Criar ContextAnalyzer
[ ] Criar SmartInvestmentAdvisor
[ ] Atualizar prompt da IA
[ ] Testes unitários básicos
[ ] Integração com APIs (BRAPI, BCB, SectorMapper)
📡 APIS E LIMITAÇÕES
APIs Disponíveis
BRAPI (já integrado)
✅ Cotações, P/L, P/VP, DY, EPS
✅ Histórico de dividendos
❌ ROE, payout ratio, dívida/EBITDA (não disponível)
BCB API (NOVO)
✅ Selic, IPCA
✅ Dados macroeconômicos
✅ Histórico completo
SectorMapping (próprio)
✅ Mapeamento ticker → setor
✅ Tabela no banco populada manualmente
Limitações Aceitas
Importante: Aceitamos que não temos:
ROE, payout ratio, dívida/EBITDA via APIs gratuitas
Estratégia:
Trabalhar com dados disponíveis (BRAPI + BCB)
Usar IA para inferir qualidade quando necessário
Focar em métricas disponíveis: DY, P/L, P/VP, histórico de dividendos
✅ CHECKLIST ETAPA 1
[ ] Todos os modelos criados (StrategyTemplate, InvestorProfile, UserPreferences, SectorMapping)
[ ] Migrations aplicadas
[ ] BCBProvider funcionando
[ ] SectorMapper funcionando
[ ] 5 templates iniciais no banco
[ ] ~100 tickers mapeados por setor
[ ] ContextAnalyzer funcionando
[ ] SmartInvestmentAdvisor funcionando
[ ] Prompt da IA atualizado
[ ] Testes básicos passando

## 🔧 FASE 3: VALIDAÇÃO E PERFORMANCE (Semana 5-6)### 3.1 Modelos Adicionais#### StrategyValidation**Arquivo**: `backend/apps/investments/models.py`class StrategyValidation(WorkspaceModel):    """Registro de validação de estratégia."""        strategy_template = models.ForeignKey(StrategyTemplate, ...)    portfolio = models.ForeignKey(Portfolio, ...)        validation_status = models.CharField(max_length=20)    # "valid", "needs_review", "invalid", "warning"        validation_result = models.JSONField(default=dict)    # {    #   "criteria_valid": true,    #   "market_conditions_ok": true,    #   "issues": [],    #   "warnings": ["DY mínimo muito alto para mercado atual"]    # }        suggested_adjustments = models.JSONField(default=dict)    # {    #   "dividend_yield_min": {    #     "current": 0.08,    #     "suggested": 0.06,    #     "reason": "Média de mercado atual é 6-7%"    #   }    # }        validated_at = models.DateTimeField(auto_now_add=True)    validated_by = models.CharField(max_length=50, default="ai")```#### StrategyPerformance**Arquivo**: `backend/apps/investments/models.py`class StrategyPerformance(WorkspaceModel):    """Performance histórica de uma estratégia."""        strategy_template = models.ForeignKey(StrategyTemplate, ...)    portfolio = models.ForeignKey(Portfolio, ...)        period_start = models.DateField()    period_end = models.DateField()        total_return = models.DecimalField(max_digits=10, decimal_places=2)    dividend_yield_realized = models.DecimalField(max_digits=5, decimal_places=2)    recommendations_followed = models.IntegerField(default=0)    recommendations_total = models.IntegerField(default=0)    adherence_rate = models.DecimalField(max_digits=5, decimal_places=2)        performance_score = models.DecimalField(max_digits=5, decimal_places=2)    # Fórmula: (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2) * 100        vs_ibovespa = models.DecimalField(max_digits=10, decimal_places=2)        calculated_at = models.DateTimeField(auto_now_add=True)
3.2 StrategyValidator
Arquivo: backend/apps/investments/services/strategy_validator.py (NOVO)
Responsabilidades:
Validar estratégia antes de aplicar
Revalidar estratégias periodicamente
Detectar quando precisa de ajustes
Sugerir melhorias
Métodos principais:
class StrategyValidator:    def validate_strategy(        self,        strategy_template: StrategyTemplate,        portfolio: Portfolio,        market_context: Dict[str, Any]    ) -> Dict[str, Any]:        """Valida estratégia antes de aplicar."""        # Verifica se critérios fazem sentido agora        # Verifica condições de mercado        # Identifica problemas        # Sugere ajustes        def revalidate_all_strategies(self):        """Revalida todas as estratégias ativas."""        # Background job: roda diariamente        def _check_criteria_validity(self, ...) -> bool:        """Verifica se critérios são válidos."""        def _check_market_conditions(self, ...) -> bool:        """Verifica se condições de mercado são adequadas."""        def _suggest_adjustments(self, ...) -> List[Dict[str, Any]]:        """Sugere ajustes na estratégia."""
3.3 PerformanceCalculator
Arquivo: backend/apps/investments/services/performance_calculator.py (NOVO)
Responsabilidades:
Calcular performance histórica
Atualizar notas automaticamente
Comparar com benchmarks
Métodos principais:
class PerformanceCalculator:    def calculate_strategy_performance(        self,        strategy_template: StrategyTemplate,        portfolio: Portfolio,        period_start: date,        period_end: date    ) -> Dict[str, Any]:        """Calcula performance histórica."""        # Calcula: total_return, dividend_yield_realized, adherence_rate        # Compara com IBOV        # Calcula score (0-100)        # Cria registro StrategyPerformance        def update_all_performance_scores(self):        """Atualiza scores de todas as estratégias."""        # Background job: roda semanalmente        # Atualiza StrategyTemplate.performance_score        def _calculate_total_return(self, ...) -> Decimal:        """Calcula retorno total no período."""        def _calculate_dividend_yield_realized(self, ...) -> Decimal:        """Calcula DY realizado."""        def _calculate_performance_score(self, ...) -> Decimal:        """Calcula score de performance (0-100)."""        # score = (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2)        # return score * 100
3.4 Background Jobs - Parte 1
Arquivo: backend/apps/investments/tasks.py (NOVO - Celery)
Jobs necessários:
@periodic_task(run_every=crontab(day_of_week=0, hour=20, minute=0))def calculate_performance():    """Calcula performance semanalmente."""    # Para cada estratégia com histórico    # Calcula métricas    # Atualiza StrategyTemplate.performance_score@periodic_task(run_every=crontab(hour=18, minute=0))def revalidate_strategies():    """Revalida todas as estratégias ativas."""    # Para cada StrategyTemplate ativo    # Valida critérios    # Salva StrategyValidation@periodic_task(run_every=crontab(day_of_week=0, hour=21, minute=0))def analyze_profiles():    """Re-analisa perfis dos investidores."""    # Para cada portfolio    # Analisa contexto    # Atualiza InvestorProfile
Tarefas Fase 3:
[ ] Criar StrategyValidation model
[ ] Criar StrategyPerformance model
[ ] Criar StrategyValidator
[ ] Criar PerformanceCalculator
[ ] Configurar Celery
[ ] Criar background jobs
[ ] Testes
🔄 FASE 4: SISTEMA VIVO - ATUALIZAÇÃO AUTOMÁTICA (Semana 7-8)
4.1 DataFreshness Model
Arquivo: backend/apps/investments/models.py
class DataFreshness(WorkspaceModel):    """Controle de atualização de dados."""        data_type = models.CharField(max_length=50)    # "quote", "fundamental", "dividend_history", "market_context"        ticker = models.CharField(max_length=20, null=True, blank=True)    # Null se for dados gerais (ex: IBOV, Selic)        last_updated = models.DateTimeField()    next_update_due = models.DateTimeField()        is_fresh = models.BooleanField(default=True)    freshness_score = models.DecimalField(max_digits=5, decimal_places=2, default=1.0)    # 1.0 = totalmente atualizado, 0.0 = desatualizado        update_frequency_minutes = models.IntegerField(default=5)
4.2 DataFreshnessManager
Arquivo: backend/apps/investments/services/data_freshness_manager.py (NOVO)
Responsabilidades:
Controlar atualização de dados
Detectar dados desatualizados
Agendar atualizações
Garantir que dados estão sempre frescos
Métodos principais:
class DataFreshnessManager:    def check_data_freshness(        self,        data_type: str,        ticker: Optional[str] = None    ) -> bool:        """Verifica se dados estão atualizados."""        # Consulta DataFreshness        # Verifica se is_fresh e next_update_due        def update_data_if_needed(        self,        data_type: str,        ticker: Optional[str] = None    ):        """Atualiza dados se necessário."""        # Se não está fresh, força atualização        # Atualiza DataFreshness após buscar        def schedule_updates(self):        """Agenda atualizações."""        # Background job: verifica e agenda atualizações        def _calculate_freshness_score(self, ...) -> Decimal:        """Calcula score de atualização (0-1)."""
4.3 Integração com Providers
Atualizar BrapiProvider e BCBProvider para:
Verificar DataFreshness antes de usar cache
Atualizar automaticamente se dados estiverem desatualizados
Registrar atualizações em DataFreshness
4.4 Background Jobs - Parte 2
@periodic_task(run_every=crontab(minute='*/5', hour='10-17'))def update_market_data():    """Atualiza dados de mercado a cada 5 minutos."""    # Verifica DataFreshness    # Atualiza se necessário    # Atualiza DataFreshness após atualizar@periodic_task(run_every=crontab(hour=2, minute=0))def cleanup_cache():    """Limpa cache antigo."""    # Remove cache expirado    # Otimiza DataFreshness
Tarefas Fase 4:
[ ] Criar DataFreshness model
[ ] Criar DataFreshnessManager
[ ] Integrar com BrapiProvider
[ ] Integrar com BCBProvider
[ ] Criar background jobs de atualização
[ ] Criar endpoint de monitoramento
[ ] Testes
💬 FASE 5: CHAT CONTEXTUAL (Semana 9-10)
5.1 PortfolioChat Model
Arquivo: backend/apps/investments/models.py
class PortfolioChat(WorkspaceModel):    """Mensagens do chat na carteira."""        portfolio = models.ForeignKey(Portfolio, ...)        message = models.TextField()    is_from_user = models.BooleanField(default=True)        context_snapshot = models.JSONField(default=dict)    # Snapshot do contexto no momento da mensagem        ai_response = models.TextField(blank=True)    ai_confidence = models.DecimalField(max_digits=5, decimal_places=2, null=True)        created_at = models.DateTimeField(auto_now_add=True)
5.2 PortfolioChatService
Arquivo: backend/apps/investments/services/portfolio_chat_service.py (NOVO)
Responsabilidades:
Processar mensagens do chat
Construir contexto completo para IA
Gerar respostas em linguagem para leigos
Manter histórico de conversas
Métodos principais:
class PortfolioChatService:    def send_message(        self,        portfolio: Portfolio,        message: str    ) -> Dict[str, Any]:        """Processa mensagem do chat."""        # 1. Constrói contexto completo        # 2. Envia para IA com prompt especializado        # 3. Simplifica resposta para leigo        # 4. Salva mensagem e resposta        # 5. Retorna resposta        def _build_complete_context(        self,        portfolio: Portfolio    ) -> Dict[str, Any]:        """Constrói contexto completo para IA."""        # Inclui:        # - Carteira atual        # - Estratégia ativa        # - Histórico de recomendações        # - Performance da estratégia        # - Dados de mercado        # - Perfil do investidor        # - Preferências do usuário        # - Histórico de transações        # - Dividendos recebidos        def _generate_ai_response(self, ...) -> str:        """Gera resposta da IA."""        # Prompt especializado para leigos        def _simplify_for_layperson(self, response: str) -> str:        """Simplifica resposta para leigos."""        # Remove jargão técnico        # Explica termos complexos
5.3 Endpoint de Chat
Arquivo: backend/apps/investments/viewsets.py
Adicionar action em PortfolioViewSet:
@action(detail=True, methods=["post"], url_path="chat")def chat(self, request: "Request", pk: str = None) -> Response:    """Chat contextual na carteira."""    portfolio = self.get_object()    message = request.data.get("message")        chat_service = PortfolioChatService()    result = chat_service.send_message(portfolio, message)        return Response(result)
Tarefas Fase 5:
[ ] Criar PortfolioChat model
[ ] Criar PortfolioChatService
[ ] Criar endpoint POST/GET /chat/
[ ] Testes
✅ CHECKLIST ETAPA 2
[ ] StrategyValidation model criado
[ ] StrategyPerformance model criado
[ ] DataFreshness model criado
[ ] PortfolioChat model criado
[ ] StrategyValidator funcionando
[ ] PerformanceCalculator funcionando
[ ] DataFreshnessManager funcionando
[ ] PortfolioChatService funcionando
[ ] Background jobs configurados e rodando
[ ] Notas de performance sendo calculadas
[ ] Estratégias sendo validadas periodicamente
[ ] Dados sendo atualizados automaticamente
[ ] Chat funcionando com contexto completo

## 🎨 FASE 6: INTERFACE NOVA - SUBSTITUIÇÃO COMPLETA (Semana 11-14)### 6.1 Nova Página Principal**Arquivo**: `frontend/src/features/investments/pages/SmartInvestmentsPage.tsx` (NOVO)**Substitui**: `InvestmentsDashboard.tsx`**Interface**:
┌─────────────────────────────────────────┐
│ Investimentos │
├─────────────────────────────────────────┤
│ │
│ Quanto você quer investir? │
│ ┌─────────────────────────────────┐ │
│ │ R$ [200.00] │ │
│ └─────────────────────────────────┘ │
│ │
│ [Onde devo investir?] │
│ │
│ ┌─────────────────────────────────┐ │
│ │ ⭐⭐⭐⭐☆ Dividendos Defensivos │ │
│ │ │ │
│ │ ✅ Compre 5 ações de TAEE11 │ │
│ │ R$ 35,50 cada (R$ 177,50) │ │
│ │ Oportunidade atual, DY 7.9% │ │
│ │ │ │
│ │ ✅ Compre 2 ações de ITUB4 │ │
│ │ R$ 32,10 cada (R$ 64,20) │ │
│ │ Diversificação financeiro │ │
│ │ │ │
│ │ 💰 Saldo restante: R$ 22,50 │ │
│ │ │ │
│ │ Justificativa: │ │
│ │ Com base na sua carteira... │ │
│ │ │ │
│ │ [Confirmar] [Ajustar] │ │
│ └─────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────┐ │
│ │ 💬 Chat │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Por que TAEE11? │ │ │
│ │ └─────────────────────────────┘ │ │
│ │ [Enviar] │ │
│ └─────────────────────────────────┘ │
│ │
│ [⚙️ Preferências] [📊 Performance] │
└─────────────────────────────────────────┘
**Componentes principais**:#### SmartRecommendationForm**Arquivo**: `frontend/src/features/investments/components/SmartRecommendationForm.tsx` (NOVO)ypescriptinterface SmartRecommendationFormProps {  portfolioId: string;  onRecommendation: (recommendation: any) => void;}export function SmartRecommendationForm({ portfolioId, onRecommendation }: SmartRecommendationFormProps) {  const [amount, setAmount] = useState<string>("");  const [loading, setLoading] = useState(false);    const handleSubmit = async () => {    // POST /api/investments/portfolios/{id}/smart-recommendation/    // { amount: parseFloat(amount) }  };    return (    <div>      <Input        type="number"        placeholder="Quanto você quer investir?"        value={amount}        onChange={(e) => setAmount(e.target.value)}      />      <Button onClick={handleSubmit} disabled={loading}>        Onde devo investir?      </Button>    </div>  );}
RecommendationResult
Arquivo: frontend/src/features/investments/components/RecommendationResult.tsx (NOVO)
interface RecommendationResultProps {  recommendation: any;  strategy: any;  onConfirm: () => void;  onAdjust: () => void;}export function RecommendationResult({ recommendation, strategy, onConfirm, onAdjust }: RecommendationResultProps) {  return (    <Card>      <StrategyCard strategy={strategy} />      <div>        {recommendation.allocations.map((allocation: any) => (          <AllocationItem key={allocation.ticker} allocation={allocation} />        ))}      </div>      <div>{recommendation.reasoning}</div>      <div>        <Button onClick={onConfirm}>Confirmar</Button>        <Button onClick={onAdjust} variant="outline">Ajustar</Button>      </div>    </Card>  );}
StrategyCard
Arquivo: frontend/src/features/investments/components/StrategyCard.tsx (NOVO)
interface StrategyCardProps {  strategy: {    name: string;    performance_score: number;    category: string;  };}export function StrategyCard({ strategy }: StrategyCardProps) {  const stars = Math.round(strategy.performance_score);  const starDisplay = "⭐".repeat(stars) + "☆".repeat(5 - stars);    return (    <Card>      <div>        <span>{starDisplay}</span>        <h3>{strategy.name}</h3>        <p>{strategy.category}</p>      </div>    </Card>  );}
6.2 Chat na Carteira
Arquivo: frontend/src/features/investments/components/PortfolioChat.tsx (NOVO)
interface PortfolioChatProps {  portfolioId: string;}export function PortfolioChat({ portfolioId }: PortfolioChatProps) {  const [messages, setMessages] = useState<any[]>([]);  const [input, setInput] = useState("");  const [loading, setLoading] = useState(false);    const sendMessage = async () => {    // POST /api/investments/portfolios/{id}/chat/    // { message: input }  };    return (    <div>      <div>        {messages.map((msg) => (          <MessageItem key={msg.id} message={msg} />        ))}      </div>      <div>        <Input          value={input}          onChange={(e) => setInput(e.target.value)}          placeholder="Digite sua pergunta..."        />        <Button onClick={sendMessage} disabled={loading}>          Enviar        </Button>      </div>    </div>  );}
6.3 Preferências do Usuário
Arquivo: frontend/src/features/investments/components/UserPreferences.tsx (NOVO)
interface UserPreferencesProps {  portfolioId: string;}export function UserPreferences({ portfolioId }: UserPreferencesProps) {  const [excludedSectors, setExcludedSectors] = useState<string[]>([]);  const [additionalCriteria, setAdditionalCriteria] = useState("");    const savePreferences = async () => {    // PUT /api/investments/portfolios/{id}/preferences/    // {    //   excluded_sectors: excludedSectors,    //   additional_criteria: additionalCriteria    // }  };    return (    <Modal>      <h2>Preferências de Investimento</h2>      <div>        <h3>Setores que não quero investir:</h3>        {SECTORS.map((sector) => (          <Checkbox            key={sector}            checked={excludedSectors.includes(sector)}            onChange={(checked) => {              if (checked) {                setExcludedSectors([...excludedSectors, sector]);              } else {                setExcludedSectors(excludedSectors.filter(s => s !== sector));              }            }}          >            {sector}          </Checkbox>        ))}      </div>      <div>        <h3>Dicas para a IA:</h3>        <Textarea          value={additionalCriteria}          onChange={(e) => setAdditionalCriteria(e.target.value)}          placeholder="Ex: Não topo investir em setores destrutivos"        />      </div>      <Button onClick={savePreferences}>Salvar</Button>    </Modal>  );}
6.4 Performance de Estratégia
Arquivo: frontend/src/features/investments/components/StrategyPerformance.tsx (NOVO)
interface StrategyPerformanceProps {  portfolioId: string;}export function StrategyPerformance({ portfolioId }: StrategyPerformanceProps) {  const { data: performance } = useQuery({    queryKey: ["strategy-performance", portfolioId],    queryFn: () => fetch(`/api/investments/portfolios/${portfolioId}/strategy-performance/`).then(r => r.json())  });    const stars = Math.round(performance?.current_score || 0);  const starDisplay = "⭐".repeat(stars) + "☆".repeat(5 - stars);    return (    <Modal>      <h2>Performance da Estratégia</h2>      <div>        <div>Nota: {starDisplay}</div>        <div>Retorno Total: {performance?.total_return}%</div>        <div>DY Realizado: {performance?.dividend_yield_realized}%</div>        <div>vs IBOV: {performance?.vs_ibovespa}%</div>      </div>      <Chart data={performance?.historical_performance} />    </Modal>  );}
6.5 Validação de Estratégia
Arquivo: frontend/src/features/investments/components/StrategyValidation.tsx (NOVO)
interface StrategyValidationProps {  portfolioId: string;}export function StrategyValidation({ portfolioId }: StrategyValidationProps) {  const { data: validation } = useQuery({    queryKey: ["strategy-validation", portfolioId],    queryFn: () => fetch(`/api/investments/portfolios/${portfolioId}/validate-strategy/`, {      method: "POST"    }).then(r => r.json())  });    return (    <Card>      <div>        {validation?.status === "valid" && <span>✅ Estratégia válida</span>}        {validation?.status === "needs_review" && <span>⚠️ Precisa revisão</span>}        {validation?.status === "invalid" && <span>❌ Estratégia inválida</span>}      </div>      {validation?.issues.length > 0 && (        <div>          <h3>Problemas encontrados:</h3>          <ul>            {validation.issues.map((issue: string, i: number) => (              <li key={i}>{issue}</li>            ))}          </ul>        </div>      )}      {validation?.suggested_adjustments && (        <div>          <h3>Sugestões de ajustes:</h3>          {/* Exibir ajustes sugeridos */}        </div>      )}    </Card>  );}
6.6 Atualizar Rotas
Arquivo: frontend/src/App.tsx
// Substituirimport InvestmentsDashboard from "./features/investments/pages/InvestmentsDashboard";// Porimport SmartInvestmentsPage from "./features/investments/pages/SmartInvestmentsPage";// Atualizar rota<Route  path="/investments"  element={    <ProtectedRoute>      <SmartInvestmentsPage />    </ProtectedRoute>  }/>
Tarefas Fase 6:
[ ] Criar SmartInvestmentsPage.tsx
[ ] Criar SmartRecommendationForm.tsx
[ ] Criar RecommendationResult.tsx
[ ] Criar StrategyCard.tsx
[ ] Criar PortfolioChat.tsx
[ ] Criar UserPreferences.tsx
[ ] Criar StrategyPerformance.tsx
[ ] Criar StrategyValidation.tsx
[ ] Atualizar rotas
[ ] Testes de UX
📊 FASE 7: ENDPOINTS E INTEGRAÇÃO (Semana 15-16)
7.1 Novos Endpoints
Arquivo: backend/apps/investments/viewsets.py
Endpoint 1: Recomendação Inteligente
@action(detail=True, methods=["post"], url_path="smart-recommendation")def smart_recommendation(self, request: "Request", pk: str = None) -> Response:    """Gera recomendação inteligente."""    portfolio = self.get_object()    amount = Decimal(str(request.data.get("amount", 0)))    user_preference = request.data.get("user_preference")        advisor = SmartInvestmentAdvisor()    recommendation = advisor.generate_recommendation(        portfolio, amount, user_preference    )        return Response(recommendation)
Endpoint 2: Chat
@action(detail=True, methods=["post", "get"], url_path="chat")def chat(self, request: "Request", pk: str = None) -> Response:    """Chat contextual na carteira."""    portfolio = self.get_object()        if request.method == "POST":        message = request.data.get("message")        chat_service = PortfolioChatService()        result = chat_service.send_message(portfolio, message)        return Response(result)        # GET: retorna histórico    messages = PortfolioChat.objects.filter(portfolio=portfolio).order_by("created_at")    return Response({"messages": [serialize_message(m) for m in messages]})
Endpoint 3: Preferências
@action(detail=True, methods=["get", "put"], url_path="preferences")def preferences(self, request: "Request", pk: str = None) -> Response:    """Preferências do usuário."""    portfolio = self.get_object()    preferences, created = UserPreferences.objects.get_or_create(portfolio=portfolio)        if request.method == "PUT":        serializer = UserPreferencesSerializer(preferences, data=request.data)        serializer.is_valid(raise_exception=True)        serializer.save()        return Response(serializer.data)        serializer = UserPreferencesSerializer(preferences)    return Response(serializer.data)
Endpoint 4: Validação
@action(detail=True, methods=["post"], url_path="validate-strategy")def validate_strategy(self, request: "Request", pk: str = None) -> Response:    """Valida estratégia atual."""    portfolio = self.get_object()    strategy_template = portfolio.strategy.strategy_template  # Assumindo relação        validator = StrategyValidator()    result = validator.validate_strategy(        strategy_template, portfolio, market_context={}    )        return Response(result)
Endpoint 5: Performance
@action(detail=True, methods=["get"], url_path="strategy-performance")def strategy_performance(self, request: "Request", pk: str = None) -> Response:    """Performance da estratégia."""    portfolio = self.get_object()    strategy_template = portfolio.strategy.strategy_template        performance = StrategyPerformance.objects.filter(        portfolio=portfolio,        strategy_template=strategy_template    ).order_by("-period_end").first()        serializer = StrategyPerformanceSerializer(performance)    return Response(serializer.data)
Endpoint 6: Contexto
@action(detail=True, methods=["get"], url_path="context")def context(self, request: "Request", pk: str = None) -> Response:    """Contexto completo analisado (debug/transparência)."""    portfolio = self.get_object()        analyzer = ContextAnalyzer()    context = analyzer.analyze_user_context(portfolio)        return Response(context)
7.2 ViewSets Adicionais
StrategyTemplateViewSet
class StrategyTemplateViewSet(WorkspaceViewSet):    """ViewSet para templates de estratégias."""        queryset = StrategyTemplate.objects.filter(is_active=True)    serializer_class = StrategyTemplateSerializer        def get_queryset(self):        queryset = super().get_queryset()        category = self.request.query_params.get("category")        if category:            queryset = queryset.filter(category=category)        return queryset.order_by("-performance_score", "priority")
7.3 Serializers
Arquivo: backend/apps/investments/serializers.py
Adicionar serializers:
StrategyTemplateSerializer
InvestorProfileSerializer
UserPreferencesSerializer
PortfolioChatSerializer
StrategyPerformanceSerializer
StrategyValidationSerializer
Tarefas Fase 7:
[ ] Criar todos os endpoints
[ ] Criar StrategyTemplateViewSet
[ ] Criar todos os serializers
[ ] Testar todos os endpoints
[ ] Documentar endpoints
✅ FASE 8: REFINAMENTO E TESTES (Semana 17-18)
8.1 Testes
Arquivos: backend/apps/investments/tests/
Criar testes para:
test_context_analyzer.py
test_smart_investment_advisor.py
test_strategy_validator.py
test_performance_calculator.py
test_portfolio_chat_service.py
test_data_freshness_manager.py
test_bcb_provider.py
test_sector_mapper.py
8.2 Otimizações
Cache agressivo para dados de mercado
Otimizar queries de histórico
Lazy loading de dados pesados
Debounce em inputs do frontend
Paginação em listas grandes
8.3 Ajustes de UX
Melhorar feedback visual
Adicionar loading states
Melhorar mensagens de erro
Adicionar tooltips explicativos
Testes de usabilidade
8.4 Documentação
Atualizar ANALYSIS.md do módulo
Documentar todos os novos endpoints
Criar guia de uso da nova interface
Documentar limitações de APIs
Criar README para desenvolvedores
Tarefas Fase 8:
[ ] Criar testes completos
[ ] Otimizar performance
[ ] Ajustes de UX
[ ] Documentação completa
[ ] Deploy
🔄 ESTRATÉGIA DE MIGRAÇÃO
Compatibilidade com Sistema Atual
Fase de Transição:
Manter endpoints antigos funcionando
Nova interface disponível em /investments (substitui antiga)
Interface antiga disponível em /investments/legacy (deprecada)
Migração gradual: usuários podem usar ambas
Após 1 mês: remover interface antiga
Compatibilidade de Dados:
Model Strategy antigo continua funcionando
Sistema detecta se tem estratégia antiga ou nova
Se tem estratégia antiga, migra automaticamente para template mais próximo
Se não tem estratégia, usa template recomendado pela IA
✅ CHECKLIST FINAL
Funcionalidades Core
[ ] Usuário pode pedir recomendação sem configurar nada
[ ] IA faz toda análise automaticamente
[ ] Recomendações são justificadas claramente
[ ] Interface é simples e direta (substitui /investments atual)
Preferências
[ ] Usuário pode definir preferências
[ ] Preferências são respeitadas
[ ] Preferências podem ser editadas
[ ] IA explica quando ajustou por preferências
Validação
[ ] Estratégias são validadas antes de aplicar
[ ] Estratégias são revalidadas periodicamente
[ ] IA alerta quando precisa de ajustes
[ ] Histórico de validações é mantido
Performance
[ ] Cada estratégia tem nota visível
[ ] Nota é atualizada automaticamente
[ ] Interface mostra nota claramente (⭐⭐⭐⭐☆)
[ ] Comparação com IBOV disponível
Sistema Vivo
[ ] Dados são atualizados automaticamente
[ ] Sistema detecta dados desatualizados
[ ] Cache inteligente funciona
[ ] Background jobs rodando
Chat
[ ] Chat funciona na carteira
[ ] Chat tem contexto completo
[ ] Respostas são para leigos
[ ] Histórico mantido
APIs
[ ] BRAPI integrado
[ ] BCB API integrada
[ ] SectorMapper funcionando
[ ] Limitações aceitas e documentadas
📦 DEPENDÊNCIAS
Python
Django 5.x (já instalado)
Celery (para background jobs) - NOVO
Redis (para cache e filas) - NOVO
requests (já instalado)
Frontend
React (já instalado)
TypeScript (já instalado)
TanStack Query (já instalado)
Infraestrutura
Redis (para cache e Celery)
Celery worker (para background jobs)
🎯 PRÓXIMOS PASSOS
Revisar e aprovar planejamento
Começar Fase 1 (Modelos e APIs)
Configurar Celery + Redis
Popular templates iniciais
Popular SectorMapping
Status: 📋 Planejamento Completo em 3 Etapas
Próxima Ação: Começar Etapa 1

