"""Models para o módulo de investimentos."""

from decimal import Decimal

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator

from apps.core.models import WorkspaceModel


class Portfolio(WorkspaceModel):
    """Carteira de investimentos do usuário."""

    PORTFOLIO_TYPE_CHOICES = [
        ("acoes_br", _("Ações Brasileiras")),
    ]

    portfolio_type = models.CharField(
        max_length=20,
        choices=PORTFOLIO_TYPE_CHOICES,
        default="acoes_br",
        verbose_name=_("Tipo de Carteira"),
    )
    name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Nome"),
        help_text=_("Nome opcional para identificar a carteira"),
    )

    class Meta:
        verbose_name = _("Carteira")
        verbose_name_plural = _("Carteiras")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "portfolio_type"]),
            models.Index(fields=["workspace", "created_at"]),
        ]
        # Removida constraint única: permite múltiplas carteiras do mesmo tipo no mesmo workspace

    def __str__(self) -> str:
        """Representação string da carteira."""
        return f"{self.name or self.get_portfolio_type_display()} - {self.workspace.name}"

    def get_total_invested(self) -> Decimal:
        """Calcula total investido na carteira."""
        return sum(asset.get_total_invested() for asset in self.assets.all())


class Asset(WorkspaceModel):
    """Ativo na carteira de investimentos."""

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="assets",
        verbose_name=_("Carteira"),
    )
    ticker = models.CharField(
        max_length=20,
        verbose_name=_("Ticker"),
        help_text=_("Código do ativo (ex: TAEE11, PETR4)"),
    )
    quantity = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        validators=[MinValueValidator(Decimal("0.0001"))],
        verbose_name=_("Quantidade"),
    )
    average_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name=_("Preço Médio"),
        help_text=_("Preço médio de compra do ativo"),
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Observações"),
    )

    class Meta:
        verbose_name = _("Ativo")
        verbose_name_plural = _("Ativos")
        unique_together = [("portfolio", "ticker")]
        indexes = [
            models.Index(fields=["portfolio", "ticker"]),
            models.Index(fields=["workspace", "ticker"]),
        ]

    def __str__(self) -> str:
        """Representação string do ativo."""
        return f"{self.ticker} ({self.portfolio.name or self.portfolio.get_portfolio_type_display()})"

    def get_total_invested(self) -> Decimal:
        """Calcula total investido no ativo."""
        return self.quantity * self.average_price


class Transaction(WorkspaceModel):
    """Transação de compra/venda de ativo.

    Rastreia cada movimentação individual, permitindo
    reconstruir histórico completo e calcular performance real.
    """

    TRANSACTION_TYPE_CHOICES = [
        ("buy", _("Compra")),
        ("sell", _("Venda")),
    ]

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="transactions",
        verbose_name=_("Carteira"),
    )
    asset = models.ForeignKey(
        Asset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
        verbose_name=_("Ativo"),
        help_text=_("Null se foi venda total (ativo deletado)"),
    )
    ticker = models.CharField(
        max_length=20,
        verbose_name=_("Ticker"),
        help_text=_("Código do ativo (ex: TAEE11, PETR4)"),
    )
    transaction_type = models.CharField(
        max_length=4,
        choices=TRANSACTION_TYPE_CHOICES,
        verbose_name=_("Tipo de Transação"),
    )
    quantity = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        validators=[MinValueValidator(Decimal("0.0001"))],
        verbose_name=_("Quantidade"),
    )
    unit_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name=_("Preço Unitário"),
        help_text=_("Preço da transação"),
    )
    market_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_("Preço de Mercado"),
        help_text=_("Preço de mercado no momento da transação"),
    )
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name=_("Valor Total"),
        help_text=_("quantity * unit_price"),
    )
    transaction_cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("Custo da Transação"),
        help_text=_("Corretagem, taxas, etc."),
    )
    recommendation_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name=_("ID da Recomendação"),
        help_text=_("ID da recomendação que gerou esta transação (se aplicável)"),
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Observações"),
        help_text=_("Motivo, contexto, notas sobre a transação"),
    )

    # Campos calculados (após transação)
    new_average_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_("Novo Preço Médio"),
        help_text=_("Preço médio após esta transação"),
    )
    new_quantity = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name=_("Nova Quantidade"),
        help_text=_("Quantidade após esta transação"),
    )

    class Meta:
        verbose_name = _("Transação")
        verbose_name_plural = _("Transações")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["portfolio", "created_at"]),
            models.Index(fields=["portfolio", "ticker"]),
            models.Index(fields=["ticker", "transaction_type"]),
            models.Index(fields=["recommendation_id"]),
            models.Index(fields=["workspace", "created_at"]),
        ]

    def __str__(self) -> str:
        """Representação string da transação."""
        return f"{self.get_transaction_type_display()} {self.quantity} {self.ticker} @ {self.unit_price}"


class DividendReceived(WorkspaceModel):
    """Dividendo recebido pelo usuário.

    Rastreia dividendos realmente recebidos, não apenas
    histórico de mercado.
    """

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="dividends_received",
        verbose_name=_("Carteira"),
    )
    asset = models.ForeignKey(
        Asset,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dividends_received",
        verbose_name=_("Ativo"),
    )
    ticker = models.CharField(
        max_length=20,
        verbose_name=_("Ticker"),
    )
    payment_date = models.DateField(
        verbose_name=_("Data de Pagamento"),
        help_text=_("Data em que o dividendo foi creditado"),
    )
    base_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Data Base"),
        help_text=_("Data base do dividendo"),
    )
    quantity_owned = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name=_("Quantidade Possuída"),
        help_text=_("Quantidade de ações possuídas na data base"),
    )
    dividend_per_share = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        verbose_name=_("Dividendo por Ação"),
    )
    total_gross = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name=_("Total Bruto"),
        help_text=_("quantity_owned * dividend_per_share"),
    )
    tax_withheld = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("Imposto Retido"),
        help_text=_("IR retido na fonte"),
    )
    total_net = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name=_("Total Líquido"),
        help_text=_("total_gross - tax_withheld"),
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Observações"),
    )

    class Meta:
        verbose_name = _("Dividendo Recebido")
        verbose_name_plural = _("Dividendos Recebidos")
        ordering = ["-payment_date", "-created_at"]
        indexes = [
            models.Index(fields=["portfolio", "payment_date"]),
            models.Index(fields=["ticker", "payment_date"]),
            models.Index(fields=["workspace", "payment_date"]),
        ]

    def __str__(self) -> str:
        """Representação string do dividendo."""
        return f"{self.ticker} - R${self.total_net} ({self.payment_date})"


# ============================================================================
# NOVOS MODELOS DO SISTEMA INTELIGENTE
# ============================================================================


class StrategyTemplate(WorkspaceModel):
    """Template de estratégia de investimento gerenciado pela IA."""

    VALIDATION_STATUS_CHOICES = [
        ("valid", _("Válida")),
        ("needs_review", _("Precisa Revisão")),
        ("invalid", _("Inválida")),
        ("pending", _("Pendente")),
    ]

    name = models.CharField(
        max_length=255,
        verbose_name=_("Nome"),
        help_text=_("Nome da estratégia (ex: 'Dividendos Defensivos')"),
    )
    slug = models.SlugField(
        max_length=255,
        verbose_name=_("Slug"),
        help_text=_("Identificador único da estratégia"),
    )
    description = models.TextField(
        verbose_name=_("Descrição"),
        help_text=_("Descrição detalhada da estratégia"),
    )
    category = models.CharField(
        max_length=50,
        verbose_name=_("Categoria"),
        help_text=_("Categoria da estratégia: 'dividendos', 'value', 'growth', 'balanced'"),
    )
    base_criteria = models.JSONField(
        default=dict,
        verbose_name=_("Critérios Base"),
        help_text=_("Critérios base da estratégia em formato JSON"),
    )
    adaptation_logic = models.TextField(
        blank=True,
        verbose_name=_("Lógica de Adaptação"),
        help_text=_("Instruções para IA adaptar critérios baseado em contexto"),
    )
    performance_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("Score de Performance"),
        help_text=_("Score de 0-5 estrelas (convertido de 0-100)"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Ativo"),
        help_text=_("Se a estratégia está ativa"),
    )
    is_system_template = models.BooleanField(
        default=True,
        verbose_name=_("Template do Sistema"),
        help_text=_("Se é template do sistema ou customizado"),
    )
    priority = models.IntegerField(
        default=0,
        verbose_name=_("Prioridade"),
        help_text=_("Ordem de prioridade (maior = mais prioritário)"),
    )
    created_by_ai = models.BooleanField(
        default=True,
        verbose_name=_("Criado por IA"),
    )
    last_validated = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Última Validação"),
    )
    validation_status = models.CharField(
        max_length=20,
        choices=VALIDATION_STATUS_CHOICES,
        default="pending",
        verbose_name=_("Status de Validação"),
    )

    class Meta:
        verbose_name = _("Template de Estratégia")
        verbose_name_plural = _("Templates de Estratégias")
        ordering = ["-performance_score", "priority"]
        unique_together = [("workspace", "slug")]

    def __str__(self) -> str:
        """Representação string do template."""
        return f"{self.name} ({self.workspace.name})"


class InvestorProfile(WorkspaceModel):
    """Perfil do investidor inferido pela IA."""

    RISK_TOLERANCE_CHOICES = [
        ("conservador", _("Conservador")),
        ("moderado", _("Moderado")),
        ("arrojado", _("Arrojado")),
    ]

    INVESTMENT_HORIZON_CHOICES = [
        ("curto", _("Curto Prazo")),
        ("medio", _("Médio Prazo")),
        ("longo", _("Longo Prazo")),
    ]

    PRIMARY_GOAL_CHOICES = [
        ("renda_passiva", _("Renda Passiva")),
        ("crescimento", _("Crescimento")),
        ("preservacao", _("Preservação")),
    ]

    EXPERIENCE_LEVEL_CHOICES = [
        ("iniciante", _("Iniciante")),
        ("intermediario", _("Intermediário")),
        ("avancado", _("Avançado")),
    ]

    portfolio = models.OneToOneField(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="profile",
        verbose_name=_("Carteira"),
    )
    risk_tolerance = models.CharField(
        max_length=20,
        choices=RISK_TOLERANCE_CHOICES,
        verbose_name=_("Tolerância a Risco"),
    )
    investment_horizon = models.CharField(
        max_length=20,
        choices=INVESTMENT_HORIZON_CHOICES,
        verbose_name=_("Horizonte de Investimento"),
    )
    primary_goal = models.CharField(
        max_length=50,
        choices=PRIMARY_GOAL_CHOICES,
        verbose_name=_("Objetivo Principal"),
    )
    experience_level = models.CharField(
        max_length=20,
        choices=EXPERIENCE_LEVEL_CHOICES,
        default="iniciante",
        verbose_name=_("Nível de Experiência"),
    )
    total_invested = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("Total Investido"),
    )
    average_dividend_yield = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("DY Médio"),
    )
    diversification_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("Score de Diversificação"),
        help_text=_("0-1 (quanto mais diversificado, maior)"),
    )
    concentration_risk = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("Risco de Concentração"),
        help_text=_("0-1 (quanto mais concentrado, maior risco)"),
    )
    adherence_to_recommendations = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("Aderência a Recomendações"),
        help_text=_("% de recomendações seguidas (0-1)"),
    )
    average_holding_period = models.IntegerField(
        default=0,
        verbose_name=_("Período Médio de Retenção"),
        help_text=_("Dias médios de retenção"),
    )
    last_analyzed = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Última Análise"),
    )
    confidence_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("Score de Confiança"),
        help_text=_("Confiança na inferência (0-1)"),
    )
    analysis_data = models.JSONField(
        default=dict,
        verbose_name=_("Dados de Análise"),
        help_text=_("Histórico de análises, padrões identificados, etc."),
    )

    class Meta:
        verbose_name = _("Perfil do Investidor")
        verbose_name_plural = _("Perfis de Investidores")

    def __str__(self) -> str:
        """Representação string do perfil."""
        return f"{self.portfolio} - {self.get_risk_tolerance_display()}"


class UserPreferences(WorkspaceModel):
    """Preferências do usuário para personalizar recomendações."""

    portfolio = models.OneToOneField(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="preferences",
        verbose_name=_("Carteira"),
    )
    excluded_sectors = models.JSONField(
        default=list,
        verbose_name=_("Setores Excluídos"),
        help_text=_("Lista de setores que o usuário não quer investir"),
    )
    preferred_sectors = models.JSONField(
        default=list,
        verbose_name=_("Setores Preferidos"),
        help_text=_("Lista de setores preferidos pelo usuário"),
    )
    additional_criteria = models.TextField(
        blank=True,
        verbose_name=_("Critérios Adicionais"),
        help_text=_("Critérios adicionais em texto livre"),
    )
    restrictions = models.JSONField(
        default=dict,
        verbose_name=_("Restrições"),
        help_text=_("Restrições específicas (ex: max_concentration_per_asset)"),
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Última Atualização"),
    )

    class Meta:
        verbose_name = _("Preferências do Usuário")
        verbose_name_plural = _("Preferências dos Usuários")

    def __str__(self) -> str:
        """Representação string das preferências."""
        return f"{self.portfolio} - Preferências"


class StrategyValidation(WorkspaceModel):
    """Validação de estratégia para uma carteira específica."""

    VALIDATION_STATUS_CHOICES = [
        ("valid", _("Válida")),
        ("needs_review", _("Precisa Revisão")),
        ("invalid", _("Inválida")),
        ("warning", _("Aviso")),
    ]

    VALIDATED_BY_CHOICES = [
        ("ai", _("IA")),
        ("user", _("Usuário")),
    ]

    strategy_template = models.ForeignKey(
        StrategyTemplate,
        on_delete=models.CASCADE,
        related_name="validations",
        verbose_name=_("Template de Estratégia"),
    )
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="strategy_validations",
        verbose_name=_("Carteira"),
    )
    validation_status = models.CharField(
        max_length=20,
        choices=VALIDATION_STATUS_CHOICES,
        verbose_name=_("Status de Validação"),
    )
    validation_result = models.JSONField(
        default=dict,
        verbose_name=_("Resultado da Validação"),
        help_text=_("Detalhes da validação (criteria_valid, market_conditions_ok, issues, warnings)"),
    )
    suggested_adjustments = models.JSONField(
        default=dict,
        verbose_name=_("Ajustes Sugeridos"),
        help_text=_("Ajustes sugeridos pela IA"),
    )
    validated_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Data de Validação"),
    )
    validated_by = models.CharField(
        max_length=50,
        choices=VALIDATED_BY_CHOICES,
        default="ai",
        verbose_name=_("Validado Por"),
    )

    class Meta:
        verbose_name = _("Validação de Estratégia")
        verbose_name_plural = _("Validações de Estratégias")
        ordering = ["-validated_at"]

    def __str__(self) -> str:
        """Representação string da validação."""
        return f"{self.strategy_template.name} - {self.portfolio} ({self.get_validation_status_display()})"


class StrategyPerformance(WorkspaceModel):
    """Performance histórica de uma estratégia aplicada a uma carteira."""

    strategy_template = models.ForeignKey(
        StrategyTemplate,
        on_delete=models.CASCADE,
        related_name="performance_records",
        verbose_name=_("Template de Estratégia"),
    )
    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="strategy_performances",
        verbose_name=_("Carteira"),
    )
    period_start = models.DateField(
        verbose_name=_("Início do Período"),
    )
    period_end = models.DateField(
        verbose_name=_("Fim do Período"),
    )
    total_return = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_("Retorno Total"),
        help_text=_("Retorno total no período (%)"),
    )
    dividend_yield_realized = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name=_("DY Realizado"),
        help_text=_("DY realizado (dividendos recebidos / valor investido)"),
    )
    recommendations_followed = models.IntegerField(
        default=0,
        verbose_name=_("Recomendações Seguidas"),
    )
    recommendations_total = models.IntegerField(
        default=0,
        verbose_name=_("Total de Recomendações"),
    )
    adherence_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name=_("Taxa de Aderência"),
        help_text=_("recommendations_followed / recommendations_total"),
    )
    performance_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name=_("Score de Performance"),
        help_text=_("Score calculado: (total_return * 0.4) + (dividend_yield_realized * 0.4) + (adherence_rate * 0.2) * 100"),
    )
    vs_ibovespa = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_("vs IBOV"),
        help_text=_("Diferença percentual vs IBOV"),
    )
    calculated_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Calculado Em"),
    )

    class Meta:
        verbose_name = _("Performance de Estratégia")
        verbose_name_plural = _("Performances de Estratégias")
        ordering = ["-period_end"]

    def __str__(self) -> str:
        """Representação string da performance."""
        return f"{self.strategy_template.name} - {self.portfolio} ({self.period_start} a {self.period_end})"


class PortfolioChat(WorkspaceModel):
    """Mensagens do chat contextual com IA sobre a carteira."""

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="chat_messages",
        verbose_name=_("Carteira"),
    )
    message = models.TextField(
        verbose_name=_("Mensagem"),
    )
    is_from_user = models.BooleanField(
        default=True,
        verbose_name=_("Do Usuário"),
        help_text=_("Se a mensagem é do usuário ou da IA"),
    )
    context_snapshot = models.JSONField(
        default=dict,
        verbose_name=_("Snapshot do Contexto"),
        help_text=_("Snapshot do contexto no momento da mensagem"),
    )
    ai_response = models.TextField(
        blank=True,
        verbose_name=_("Resposta da IA"),
    )
    ai_confidence = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_("Confiança da IA"),
        help_text=_("Confiança da resposta (0-1)"),
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Criado Em"),
    )

    class Meta:
        verbose_name = _("Mensagem do Chat")
        verbose_name_plural = _("Mensagens do Chat")
        ordering = ["created_at"]

    def __str__(self) -> str:
        """Representação string da mensagem."""
        sender = "Usuário" if self.is_from_user else "IA"
        return f"{self.portfolio} - {sender} ({self.created_at})"


class DataFreshness(WorkspaceModel):
    """Controle de atualização de dados de mercado."""

    DATA_TYPE_CHOICES = [
        ("quote", _("Cotação")),
        ("fundamental", _("Fundamentalista")),
        ("dividend_history", _("Histórico de Dividendos")),
        ("market_context", _("Contexto de Mercado")),
    ]

    data_type = models.CharField(
        max_length=50,
        choices=DATA_TYPE_CHOICES,
        verbose_name=_("Tipo de Dado"),
    )
    ticker = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        verbose_name=_("Ticker"),
        help_text=_("Null se for dados gerais (ex: IBOV, Selic)"),
    )
    last_updated = models.DateTimeField(
        verbose_name=_("Última Atualização"),
    )
    next_update_due = models.DateTimeField(
        verbose_name=_("Próxima Atualização Devida"),
    )
    is_fresh = models.BooleanField(
        default=True,
        verbose_name=_("Está Atualizado"),
    )
    freshness_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("1.0"),
        verbose_name=_("Score de Atualização"),
        help_text=_("1.0 = totalmente atualizado, 0.0 = desatualizado"),
    )
    update_frequency_minutes = models.IntegerField(
        default=5,
        verbose_name=_("Frequência de Atualização (minutos)"),
    )

    class Meta:
        verbose_name = _("Controle de Atualização")
        verbose_name_plural = _("Controles de Atualização")

    def __str__(self) -> str:
        """Representação string do controle."""
        ticker_str = f" - {self.ticker}" if self.ticker else ""
        return f"{self.get_data_type_display()}{ticker_str} ({self.workspace.name})"


class SectorMapping(WorkspaceModel):
    """Mapeamento de ticker para setor/subsector."""

    ticker = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name=_("Ticker"),
    )
    sector = models.CharField(
        max_length=100,
        verbose_name=_("Setor"),
        help_text=_("Setor da empresa (ex: 'financeiro', 'energia', 'utilities')"),
    )
    subsector = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name=_("Subsetor"),
        help_text=_("Subsetor opcional (ex: 'bancos', 'seguros', 'transmissão')"),
    )
    company_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        verbose_name=_("Nome da Empresa"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Ativo"),
    )

    class Meta:
        verbose_name = _("Mapeamento de Setor")
        verbose_name_plural = _("Mapeamentos de Setores")
        unique_together = [("workspace", "ticker")]

    def __str__(self) -> str:
        """Representação string do mapeamento."""
        return f"{self.ticker} - {self.sector} ({self.workspace.name})"
