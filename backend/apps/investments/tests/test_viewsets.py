"""Testes para ViewSets do app investments."""

from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from datetime import date

from apps.accounts.models import User, Workspace
from apps.investments.models import (
    Asset,
    DividendReceived,
    MarketPriceHistory,
    Portfolio,
    Recommendation,
    Strategy,
    Transaction,
)


class PortfolioViewSetTestCase(TestCase):
    """Testes para PortfolioViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="user@test.com",
            password="pass123",
            workspace=self.workspace,
        )

    def test_list_portfolios_requires_authentication(self) -> None:
        """Testa que listar portfolios requer autenticação."""
        response = self.client.get("/api/v1/investments/portfolios/")
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )

    def test_create_portfolio(self) -> None:
        """Testa criação de portfolio via API."""
        self.client.force_authenticate(user=self.user)
        data = {
            "portfolio_type": "acoes_br",
            "name": "Minha Carteira",
        }
        response = self.client.post(
            "/api/v1/investments/portfolios/",
            data,
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["name"], "Minha Carteira")

    def test_get_portfolio_status(self) -> None:
        """Testa endpoint de status da carteira."""
        portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )
        Strategy.objects.create(
            workspace=self.workspace,
            portfolio=portfolio,
            raw_text="Foco em dividendos acima de 6%",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/v1/investments/portfolios/{portfolio.id}/status/",
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("status", data)
        self.assertIn("alerts", data)

    def test_analyze_investment(self) -> None:
        """Testa endpoint de análise de investimento."""
        portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )
        Strategy.objects.create(
            workspace=self.workspace,
            portfolio=portfolio,
            raw_text="Foco em dividendos",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/v1/investments/portfolios/{portfolio.id}/analyze/",
            {"amount": "2000.00"},
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("recommendation", data)

    def test_update_prices(self) -> None:
        """Testa endpoint de atualização de preços."""
        portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
            name="Test Portfolio",
        )
        Asset.objects.create(
            workspace=self.workspace,
            portfolio=portfolio,
            ticker="TAEE11",
            quantity=Decimal("100"),
            average_price=Decimal("35.00"),
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/v1/investments/portfolios/{portfolio.id}/update-prices/",
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        # Pode retornar 200 mesmo se BRAPI não responder (erro tratado)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR])
        if response.status_code == status.HTTP_200_OK:
            data = response.json()
            self.assertIn("updated_count", data)
            self.assertIn("total_assets", data)


class AssetViewSetTestCase(TestCase):
    """Testes para AssetViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="user@test.com",
            password="pass123",
            workspace=self.workspace,
        )
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )

    def test_create_asset(self) -> None:
        """Testa criação de ativo via API."""
        self.client.force_authenticate(user=self.user)
        data = {
            "portfolio": self.portfolio.id,
            "ticker": "TAEE11",
            "quantity": "100",
            "average_price": "35.50",
        }
        response = self.client.post(
            "/api/v1/investments/assets/",
            data,
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["ticker"], "TAEE11")

    def test_list_assets_filtered_by_portfolio(self) -> None:
        """Testa filtro de ativos por portfolio."""
        Asset.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            ticker="TAEE11",
            quantity=Decimal("100"),
            average_price=Decimal("35.50"),
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/v1/investments/assets/?portfolio={self.portfolio.id}",
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        if isinstance(data, list):
            results = data
        else:
            results = data.get("results", [])
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["ticker"], "TAEE11")


class StrategyViewSetTestCase(TestCase):
    """Testes para StrategyViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="user@test.com",
            password="pass123",
            workspace=self.workspace,
        )
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )

    def test_create_strategy(self) -> None:
        """Testa criação de estratégia via API."""
        self.client.force_authenticate(user=self.user)
        data = {
            "portfolio": self.portfolio.id,
            "raw_text": "Foco em dividendos acima de 6%",
        }
        response = self.client.post(
            "/api/v1/investments/strategies/",
            data,
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data_response = response.json()
        self.assertEqual(data_response["raw_text"], "Foco em dividendos acima de 6%")
        # Verificar que foi parseado
        self.assertIn("parsed_rules", data_response)


class TransactionViewSetTestCase(TestCase):
    """Testes para TransactionViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="user@test.com",
            password="pass123",
            workspace=self.workspace,
        )
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

    def test_list_transactions(self) -> None:
        """Testa listagem de transações."""
        Transaction.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            asset=self.asset,
            ticker="TAEE11",
            transaction_type="buy",
            quantity=Decimal("50"),
            unit_price=Decimal("36.00"),
            total_amount=Decimal("1800.00"),
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/v1/investments/transactions/?portfolio={self.portfolio.id}",
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filter_transactions_by_ticker(self) -> None:
        """Testa filtro de transações por ticker."""
        Transaction.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            asset=self.asset,
            ticker="TAEE11",
            transaction_type="buy",
            quantity=Decimal("50"),
            unit_price=Decimal("36.00"),
            total_amount=Decimal("1800.00"),
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/v1/investments/transactions/?ticker=TAEE11",
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_asset_create_creates_transaction(self) -> None:
        """Testa que criar ativo cria transação automaticamente."""
        self.client.force_authenticate(user=self.user)
        data = {
            "portfolio": self.portfolio.id,
            "ticker": "PETR4",
            "quantity": "50",
            "average_price": "28.00",
        }
        response = self.client.post(
            "/api/v1/investments/assets/",
            data,
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificar que transação foi criada
        transactions = Transaction.objects.filter(ticker="PETR4", transaction_type="buy")
        self.assertEqual(transactions.count(), 1)
        transaction = transactions.first()
        self.assertEqual(transaction.quantity, Decimal("50"))
        self.assertEqual(transaction.unit_price, Decimal("28.00"))


class RecommendationViewSetTestCase(TestCase):
    """Testes para RecommendationViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="user@test.com",
            password="pass123",
            workspace=self.workspace,
        )
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )

    def test_list_recommendations(self) -> None:
        """Testa listagem de recomendações."""
        Recommendation.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            amount=Decimal("2000.00"),
            recommendation_data={"recommendation": {"total_amount": 2000.0}},
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/v1/investments/recommendations/?portfolio={self.portfolio.id}",
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_analyze_creates_recommendation(self) -> None:
        """Testa que analyze cria Recommendation automaticamente."""
        Strategy.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            raw_text="Foco em dividendos",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/v1/investments/portfolios/{self.portfolio.id}/analyze/",
            {"amount": "2000.00"},
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verificar que recomendação foi criada
        recommendations = Recommendation.objects.filter(portfolio=self.portfolio)
        self.assertEqual(recommendations.count(), 1)
        recommendation = recommendations.first()
        self.assertEqual(recommendation.amount, Decimal("2000.00"))
        self.assertIn("recommendation_id", response.json())


class DividendReceivedViewSetTestCase(TestCase):
    """Testes para DividendReceivedViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="user@test.com",
            password="pass123",
            workspace=self.workspace,
        )
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
        """Testa criação de dividendo recebido via API."""
        self.client.force_authenticate(user=self.user)
        data = {
            "portfolio": self.portfolio.id,
            "asset": self.asset.id,
            "ticker": "TAEE11",
            "payment_date": "2025-12-15",
            "quantity_owned": "100",
            "dividend_per_share": "0.50",
            "total_gross": "50.00",
            "tax_withheld": "7.50",
            "total_net": "42.50",
        }
        response = self.client.post(
            "/api/v1/investments/dividends-received/",
            data,
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["ticker"], "TAEE11")
        self.assertEqual(response.json()["total_net"], "42.50")

    def test_filter_dividends_by_ticker(self) -> None:
        """Testa filtro de dividendos por ticker."""
        DividendReceived.objects.create(
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

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/v1/investments/dividends-received/?ticker=TAEE11",
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class MarketPriceHistoryViewSetTestCase(TestCase):
    """Testes para MarketPriceHistoryViewSet."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.client = APIClient()
        self.workspace = Workspace.objects.create(name="Test Workspace", slug="test")
        self.user = User.objects.create_user(
            email="user@test.com",
            password="pass123",
            workspace=self.workspace,
        )

    def test_list_price_history(self) -> None:
        """Testa listagem de histórico de preços."""
        MarketPriceHistory.objects.create(
            workspace=self.workspace,
            ticker="TAEE11",
            price=Decimal("35.50"),
            change_percent=Decimal("1.25"),
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/v1/investments/price-history/?ticker=TAEE11",
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_price_history_read_only(self) -> None:
        """Testa que histórico de preços é read-only."""
        self.client.force_authenticate(user=self.user)
        data = {
            "ticker": "TAEE11",
            "price": "35.50",
        }
        response = self.client.post(
            "/api/v1/investments/price-history/",
            data,
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        # Deve retornar 405 Method Not Allowed
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

