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


class Strategy(WorkspaceModel):
    """Estratégia de investimento do usuário.

    Armazena o texto livre do usuário e as regras parseadas.
    """

    STRATEGY_TYPE_CHOICES = [
        ("dividendos", _("Dividendos")),
        ("value", _("Value Investing")),
        ("growth", _("Growth")),
        ("hibrida", _("Híbrida")),
    ]

    portfolio = models.OneToOneField(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="strategy",
        verbose_name=_("Carteira"),
    )
    raw_text = models.TextField(
        verbose_name=_("Estratégia (Texto Livre)"),
        help_text=_("Descreva como você gosta de investir"),
    )
    parsed_rules = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Regras Estruturadas"),
        help_text=_("Regras parseadas do texto (preenchido automaticamente)"),
    )
    strategy_type = models.CharField(
        max_length=20,
        choices=STRATEGY_TYPE_CHOICES,
        blank=True,
        null=True,
        verbose_name=_("Tipo de Estratégia"),
        help_text=_("Identificado automaticamente pelo parser"),
    )

    class Meta:
        verbose_name = _("Estratégia")
        verbose_name_plural = _("Estratégias")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "strategy_type"]),
        ]

    def __str__(self) -> str:
        """Representação string da estratégia."""
        strategy_type = self.get_strategy_type_display() if self.strategy_type else _("Não identificada")
        return f"{strategy_type} - {self.portfolio}"


class PortfolioSnapshot(WorkspaceModel):
    """Snapshot do patrimônio em um momento específico.

    Usado para histórico e evolução do patrimônio.
    """

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="snapshots",
        verbose_name=_("Carteira"),
    )
    total_value = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name=_("Valor Total"),
        help_text=_("Valor total da carteira no momento do snapshot"),
    )
    assets_data = models.JSONField(
        default=dict,
        verbose_name=_("Dados dos Ativos"),
        help_text=_("Snapshot dos ativos no momento (ticker, quantidade, preço)"),
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Observações"),
        help_text=_("Notas opcionais sobre o snapshot"),
    )

    class Meta:
        verbose_name = _("Snapshot de Carteira")
        verbose_name_plural = _("Snapshots de Carteira")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["portfolio", "created_at"]),
            models.Index(fields=["workspace", "created_at"]),
        ]

    def __str__(self) -> str:
        """Representação string do snapshot."""
        portfolio_name = self.portfolio.name or self.portfolio.get_portfolio_type_display()
        return f"Snapshot {portfolio_name} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class DividendHistory(WorkspaceModel):
    """Histórico de dividendos de um ticker.

    Persiste dados de dividendos para evitar requisições redundantes à BRAPI.
    Atualizado periodicamente (não em tempo real).
    """

    ticker = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name=_("Ticker"),
        help_text=_("Código do ativo (ex: TAEE11, PETR4)"),
    )
    dividends_data = models.JSONField(
        default=list,
        verbose_name=_("Dados de Dividendos"),
        help_text=_("Lista de dividendos pagos (últimos 12 meses)"),
    )
    total_last_12_months = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        default=Decimal("0"),
        verbose_name=_("Total Últimos 12 Meses"),
        help_text=_("Soma dos dividendos dos últimos 12 meses"),
    )
    average_monthly = models.DecimalField(
        max_digits=15,
        decimal_places=4,
        default=Decimal("0"),
        verbose_name=_("Média Mensal"),
        help_text=_("Média mensal de dividendos"),
    )
    regularity_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        verbose_name=_("Score de Regularidade"),
        help_text=_("Score de 0-1 indicando regularidade dos pagamentos"),
    )
    last_updated = models.DateTimeField(
        auto_now=True,
        verbose_name=_("Última Atualização"),
        help_text=_("Data da última atualização dos dados"),
    )

    class Meta:
        verbose_name = _("Histórico de Dividendos")
        verbose_name_plural = _("Históricos de Dividendos")
        unique_together = [("workspace", "ticker")]
        indexes = [
            models.Index(fields=["ticker", "last_updated"]),
            models.Index(fields=["workspace", "ticker"]),
        ]

    def __str__(self) -> str:
        """Representação string do histórico."""
        return f"{self.ticker} - {self.total_last_12_months} (últimos 12 meses)"


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


class Recommendation(WorkspaceModel):
    """Recomendação de investimento gerada pelo sistema.

    Salva todas as recomendações para análise futura de performance
    e melhoria do algoritmo.
    """

    portfolio = models.ForeignKey(
        Portfolio,
        on_delete=models.CASCADE,
        related_name="recommendations",
        verbose_name=_("Carteira"),
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name=_("Valor Solicitado"),
        help_text=_("Valor que o usuário queria investir"),
    )
    recommendation_data = models.JSONField(
        default=dict,
        verbose_name=_("Dados da Recomendação"),
        help_text=_("JSON completo da recomendação retornada"),
    )
    was_followed = models.BooleanField(
        default=False,
        verbose_name=_("Foi Seguida"),
        help_text=_("Se o usuário seguiu esta recomendação"),
    )
    executed_data = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        verbose_name=_("Dados Executados"),
        help_text=_("O que foi realmente executado (se diferente da recomendação)"),
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Observações"),
        help_text=_("Motivo de não seguir, ajustes feitos, etc."),
    )

    # Contexto de mercado no momento
    market_context = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Contexto de Mercado"),
        help_text=_("IBOV, volatilidade, dados fundamentalistas no momento"),
    )

    class Meta:
        verbose_name = _("Recomendação")
        verbose_name_plural = _("Recomendações")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["portfolio", "created_at"]),
            models.Index(fields=["portfolio", "was_followed"]),
            models.Index(fields=["workspace", "created_at"]),
        ]

    def __str__(self) -> str:
        """Representação string da recomendação."""
        return f"Recomendação {self.portfolio} - R${self.amount} ({self.created_at.strftime('%Y-%m-%d')})"


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


class MarketPriceHistory(WorkspaceModel):
    """Histórico de preços de mercado de um ativo.

    Série temporal de preços para análise de evolução.
    """

    ticker = models.CharField(
        max_length=20,
        db_index=True,
        verbose_name=_("Ticker"),
    )
    price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        verbose_name=_("Preço"),
    )
    change_percent = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        verbose_name=_("Variação Percentual"),
    )
    volume = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Volume"),
    )
    market_cap = models.BigIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Market Cap"),
    )

    class Meta:
        verbose_name = _("Histórico de Preço")
        verbose_name_plural = _("Históricos de Preços")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["ticker", "created_at"]),
            models.Index(fields=["workspace", "ticker", "created_at"]),
        ]
        # Nota: Permitimos múltiplos registros por dia para histórico mais granular

    def __str__(self) -> str:
        """Representação string do histórico."""
        return f"{self.ticker} - R${self.price} ({self.created_at.strftime('%Y-%m-%d')})"
