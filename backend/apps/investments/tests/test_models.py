"""Tests for investments models."""

from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User, Workspace
from apps.investments.models import (
    Asset,
    DividendReceived,
    Portfolio,
    Transaction,
)


class PortfolioModelTest(TestCase):
    """Testes para modelo Portfolio."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
        )

    def test_create_portfolio(self) -> None:
        """Testa criação de portfolio."""
        portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
            name="Minha Carteira",
        )
        self.assertEqual(portfolio.workspace, self.workspace)
        self.assertEqual(portfolio.portfolio_type, "acoes_br")
        self.assertEqual(portfolio.name, "Minha Carteira")

    def test_portfolio_str(self) -> None:
        """Testa representação string."""
        portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
            name="Minha Carteira",
        )
        self.assertIn("Minha Carteira", str(portfolio))
        self.assertIn(self.workspace.name, str(portfolio))

    def test_get_total_invested_empty(self) -> None:
        """Testa cálculo de total investido em carteira vazia."""
        portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )
        self.assertEqual(portfolio.get_total_invested(), Decimal("0"))

    def test_get_total_invested_with_assets(self) -> None:
        """Testa cálculo de total investido com ativos."""
        portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )
        Asset.objects.create(
            workspace=self.workspace,
            portfolio=portfolio,
            ticker="TAEE11",
            quantity=Decimal("100"),
            average_price=Decimal("35.50"),
        )
        Asset.objects.create(
            workspace=self.workspace,
            portfolio=portfolio,
            ticker="PETR4",
            quantity=Decimal("50"),
            average_price=Decimal("28.00"),
        )
        expected = Decimal("100") * Decimal("35.50") + Decimal("50") * Decimal("28.00")
        self.assertEqual(portfolio.get_total_invested(), expected)


class AssetModelTest(TestCase):
    """Testes para modelo Asset."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )

    def test_create_asset(self) -> None:
        """Testa criação de ativo."""
        asset = Asset.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            ticker="TAEE11",
            quantity=Decimal("100"),
            average_price=Decimal("35.50"),
        )
        self.assertEqual(asset.ticker, "TAEE11")
        self.assertEqual(asset.quantity, Decimal("100"))
        self.assertEqual(asset.average_price, Decimal("35.50"))

    def test_asset_str(self) -> None:
        """Testa representação string."""
        asset = Asset.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            ticker="TAEE11",
            quantity=Decimal("100"),
            average_price=Decimal("35.50"),
        )
        # Verifica que contém o ticker e o nome/tipo da carteira
        self.assertIn("TAEE11", str(asset))
        self.assertIn("Ações Brasileiras", str(asset))

    def test_get_total_invested(self) -> None:
        """Testa cálculo de total investido no ativo."""
        asset = Asset.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            ticker="TAEE11",
            quantity=Decimal("100"),
            average_price=Decimal("35.50"),
        )
        expected = Decimal("100") * Decimal("35.50")
        self.assertEqual(asset.get_total_invested(), expected)


# StrategyModelTest removido - modelo Strategy foi removido
# PortfolioSnapshotModelTest removido - modelo PortfolioSnapshot foi removido


class TransactionModelTest(TestCase):
    """Testes para Transaction."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )
        self.asset = Asset.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            ticker="TAEE11",
            quantity=Decimal("100"),
            average_price=Decimal("35.50"),
        )

    def test_create_transaction_buy(self) -> None:
        """Testa criação de transação de compra."""
        transaction = Transaction.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            asset=self.asset,
            ticker="TAEE11",
            transaction_type="buy",
            quantity=Decimal("50"),
            unit_price=Decimal("36.00"),
            total_amount=Decimal("1800.00"),
            new_average_price=Decimal("35.75"),
            new_quantity=Decimal("150"),
        )
        self.assertEqual(transaction.transaction_type, "buy")
        self.assertEqual(transaction.quantity, Decimal("50"))
        self.assertEqual(transaction.total_amount, Decimal("1800.00"))

    def test_create_transaction_sell(self) -> None:
        """Testa criação de transação de venda."""
        transaction = Transaction.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            asset=self.asset,
            ticker="TAEE11",
            transaction_type="sell",
            quantity=Decimal("30"),
            unit_price=Decimal("37.00"),
            total_amount=Decimal("1110.00"),
            new_average_price=Decimal("35.50"),
            new_quantity=Decimal("70"),
        )
        self.assertEqual(transaction.transaction_type, "sell")
        self.assertEqual(transaction.quantity, Decimal("30"))

    def test_transaction_str(self) -> None:
        """Testa representação string."""
        transaction = Transaction.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            asset=self.asset,
            ticker="TAEE11",
            transaction_type="buy",
            quantity=Decimal("50"),
            unit_price=Decimal("36.00"),
            total_amount=Decimal("1800.00"),
        )
        self.assertIn("Compra", str(transaction))
        self.assertIn("TAEE11", str(transaction))


# RecommendationModelTest removido - modelo Recommendation foi removido


class DividendReceivedModelTest(TestCase):
    """Testes para DividendReceived."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )
        self.asset = Asset.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            ticker="TAEE11",
            quantity=Decimal("100"),
            average_price=Decimal("35.50"),
        )

    def test_create_dividend_received(self) -> None:
        """Testa criação de dividendo recebido."""
        from datetime import date

        dividend = DividendReceived.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            asset=self.asset,
            ticker="TAEE11",
            payment_date=date(2025, 12, 15),
            base_date=date(2025, 11, 15),
            quantity_owned=Decimal("100"),
            dividend_per_share=Decimal("0.50"),
            total_gross=Decimal("50.00"),
            tax_withheld=Decimal("7.50"),
            total_net=Decimal("42.50"),
        )
        self.assertEqual(dividend.ticker, "TAEE11")
        self.assertEqual(dividend.total_net, Decimal("42.50"))
        self.assertEqual(dividend.total_gross - dividend.tax_withheld, dividend.total_net)

    def test_dividend_received_str(self) -> None:
        """Testa representação string."""
        from datetime import date

        dividend = DividendReceived.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            asset=self.asset,
            ticker="TAEE11",
            payment_date=date(2025, 12, 15),
            quantity_owned=Decimal("100"),
            dividend_per_share=Decimal("0.50"),
            total_gross=Decimal("50.00"),
            tax_withheld=Decimal("7.50"),
            total_net=Decimal("42.50"),
        )
        self.assertIn("TAEE11", str(dividend))
        self.assertIn("42.50", str(dividend))


# MarketPriceHistoryModelTest removido - modelo MarketPriceHistory foi removido

