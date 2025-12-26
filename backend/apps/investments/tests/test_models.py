"""Tests for investments models."""

from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User, Workspace
from apps.investments.models import (
    Asset,
    DividendReceived,
    MarketPriceHistory,
    Portfolio,
    PortfolioSnapshot,
    Recommendation,
    Strategy,
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


class StrategyModelTest(TestCase):
    """Testes para modelo Strategy."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )

    def test_create_strategy(self) -> None:
        """Testa criação de estratégia."""
        strategy = Strategy.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            raw_text="Foco em dividendos acima de 6%",
        )
        self.assertEqual(strategy.portfolio, self.portfolio)
        self.assertEqual(strategy.raw_text, "Foco em dividendos acima de 6%")

    def test_strategy_str(self) -> None:
        """Testa representação string."""
        strategy = Strategy.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            raw_text="Foco em dividendos",
            strategy_type="dividendos",
        )
        self.assertIn("Dividendos", str(strategy))
        self.assertIn(str(self.portfolio), str(strategy))


class PortfolioSnapshotModelTest(TestCase):
    """Testes para PortfolioSnapshot."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
            name="Test Portfolio",
        )

    def test_create_snapshot(self) -> None:
        """Testa criação de snapshot."""
        snapshot = PortfolioSnapshot.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            total_value=Decimal("10000.00"),
            assets_data={"assets": [{"ticker": "TAEE11", "quantity": "100", "price": "35.00"}]},
            notes="Test snapshot",
        )
        self.assertIsInstance(snapshot, PortfolioSnapshot)
        self.assertEqual(snapshot.total_value, Decimal("10000.00"))
        self.assertEqual(snapshot.portfolio, self.portfolio)

    def test_snapshot_str(self) -> None:
        """Testa representação string."""
        snapshot = PortfolioSnapshot.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            total_value=Decimal("10000.00"),
            assets_data={},
        )
        self.assertIn("Snapshot", str(snapshot))
        self.assertIn("Test Portfolio", str(snapshot))


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


class RecommendationModelTest(TestCase):
    """Testes para Recommendation."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )

    def test_create_recommendation(self) -> None:
        """Testa criação de recomendação."""
        recommendation = Recommendation.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            amount=Decimal("2000.00"),
            recommendation_data={"recommendation": {"total_amount": 2000.0, "allocations": []}},
            was_followed=False,
            market_context={"timestamp": "2025-12-26T10:00:00Z"},
        )
        self.assertEqual(recommendation.amount, Decimal("2000.00"))
        self.assertFalse(recommendation.was_followed)

    def test_recommendation_str(self) -> None:
        """Testa representação string."""
        recommendation = Recommendation.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            amount=Decimal("2000.00"),
            recommendation_data={},
        )
        self.assertIn("Recomendação", str(recommendation))
        self.assertIn("2000", str(recommendation))


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


class MarketPriceHistoryModelTest(TestCase):
    """Testes para MarketPriceHistory."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")

    def test_create_market_price_history(self) -> None:
        """Testa criação de histórico de preço."""
        price_history = MarketPriceHistory.objects.create(
            workspace=self.workspace,
            ticker="TAEE11",
            price=Decimal("35.50"),
            change_percent=Decimal("1.25"),
            volume=1000000,
            market_cap=5000000000,
        )
        self.assertEqual(price_history.ticker, "TAEE11")
        self.assertEqual(price_history.price, Decimal("35.50"))
        self.assertEqual(price_history.change_percent, Decimal("1.25"))

    def test_market_price_history_str(self) -> None:
        """Testa representação string."""
        price_history = MarketPriceHistory.objects.create(
            workspace=self.workspace,
            ticker="TAEE11",
            price=Decimal("35.50"),
        )
        self.assertIn("TAEE11", str(price_history))
        self.assertIn("35.50", str(price_history))

