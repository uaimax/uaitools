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
    Portfolio,
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

    def test_smart_recommendation(self) -> None:
        """Testa endpoint de recomendação inteligente."""
        portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/v1/investments/portfolios/{portfolio.id}/smart-recommendation/",
            {"amount": "2000.00"},
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("recommendation", data)
        self.assertIn("strategy_used", data)

    def test_get_context(self) -> None:
        """Testa endpoint de contexto."""
        portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f"/api/v1/investments/portfolios/{portfolio.id}/context/",
            HTTP_X_WORKSPACE_ID=self.workspace.slug,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("profile", data)
        self.assertIn("market_context", data)


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


# StrategyViewSetTestCase removido - StrategyViewSet foi removido


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


# RecommendationViewSetTestCase removido - RecommendationViewSet foi removido


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


# MarketPriceHistoryViewSetTestCase removido - MarketPriceHistoryViewSet foi removido

