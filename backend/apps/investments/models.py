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


# Modelos antigos removidos: Strategy, PortfolioSnapshot, DividendHistory
# Serão substituídos pelos novos modelos do sistema inteligente


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


# Modelo Recommendation antigo removido
# Será substituído pelo novo sistema de recomendações inteligentes


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


# Modelo MarketPriceHistory removido
# Dados de preços serão gerenciados pelo DataFreshnessManager
