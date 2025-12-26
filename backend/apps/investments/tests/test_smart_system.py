"""Testes básicos do sistema inteligente de investimentos."""

from decimal import Decimal

from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.accounts.models import Workspace
from apps.investments.models import (
    Portfolio,
    Asset,
    StrategyTemplate,
    InvestorProfile,
    UserPreferences,
    SectorMapping,
)
from apps.investments.services.context_analyzer import ContextAnalyzer
from apps.investments.services.smart_investment_advisor import SmartInvestmentAdvisor
from apps.investments.services.strategy_validator import StrategyValidator
from apps.investments.services.data_freshness_manager import DataFreshnessManager

User = get_user_model()


class SmartSystemTestCase(TestCase):
    """Testes básicos do sistema inteligente."""

    def setUp(self) -> None:
        """Configuração inicial."""
        self.workspace = Workspace.objects.create(name="Test Workspace")
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123",
            workspace=self.workspace,
        )
        self.portfolio = Portfolio.objects.create(
            workspace=self.workspace,
            portfolio_type="acoes_br",
            name="Test Portfolio",
        )

    def test_strategy_template_creation(self) -> None:
        """Testa criação de template de estratégia."""
        template = StrategyTemplate.objects.create(
            workspace=self.workspace,
            name="Test Strategy",
            slug="test-strategy",
            description="Test description",
            category="dividendos",
            base_criteria={"dividend_yield_min": 0.08},
            adaptation_logic="Test logic",
            is_active=True,
        )

        self.assertEqual(template.name, "Test Strategy")
        self.assertEqual(template.category, "dividendos")
        self.assertTrue(template.is_active)

    def test_portfolio_with_assets(self) -> None:
        """Testa criação de portfolio com ativos."""
        asset = Asset.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            ticker="TAEE11",
            quantity=Decimal("10"),
            average_price=Decimal("35.50"),
        )

        self.assertEqual(self.portfolio.assets.count(), 1)
        self.assertEqual(asset.ticker, "TAEE11")
        self.assertEqual(self.portfolio.get_total_invested(), Decimal("355.00"))

    def test_context_analyzer(self) -> None:
        """Testa análise de contexto."""
        # Criar alguns ativos
        Asset.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            ticker="TAEE11",
            quantity=Decimal("10"),
            average_price=Decimal("35.50"),
        )

        analyzer = ContextAnalyzer()
        context = analyzer.analyze_user_context(self.portfolio)

        self.assertIn("profile", context)
        self.assertIn("market_context", context)
        self.assertIn("portfolio_health", context)
        self.assertIn("recommended_strategy", context)

    def test_smart_advisor_basic(self) -> None:
        """Testa advisor básico."""
        # Criar template
        template = StrategyTemplate.objects.create(
            workspace=self.workspace,
            name="Test Strategy",
            slug="test-strategy",
            description="Test",
            category="dividendos",
            base_criteria={"dividend_yield_min": 0.08},
            is_active=True,
        )

        # Criar ativo
        Asset.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            ticker="TAEE11",
            quantity=Decimal("10"),
            average_price=Decimal("35.50"),
        )

        advisor = SmartInvestmentAdvisor()
        recommendation = advisor.generate_recommendation(
            self.portfolio,
            Decimal("200.00"),
        )

        self.assertIn("recommendation", recommendation)
        self.assertIn("strategy_used", recommendation)
        self.assertIn("context_analyzed", recommendation)

    def test_strategy_validator(self) -> None:
        """Testa validador de estratégia."""
        template = StrategyTemplate.objects.create(
            workspace=self.workspace,
            name="Test Strategy",
            slug="test-strategy",
            description="Test",
            category="dividendos",
            base_criteria={
                "min_diversification": 0.7,
                "max_concentration_per_asset": 0.15,
            },
            is_active=True,
        )

        validator = StrategyValidator()
        validation = validator.validate_strategy(self.portfolio, template)

        self.assertIsNotNone(validation)
        self.assertIn(validation.validation_status, ["valid", "needs_review", "invalid", "warning"])

    def test_data_freshness_manager(self) -> None:
        """Testa gerenciador de atualização."""
        manager = DataFreshnessManager()

        # Marcar como atualizado
        freshness = manager.mark_updated(
            self.workspace,
            "quote",
            "TAEE11",
        )

        self.assertIsNotNone(freshness)
        self.assertTrue(freshness.is_fresh)

        # Verificar se está atualizado
        is_fresh = manager.is_fresh(
            self.workspace,
            "quote",
            "TAEE11",
        )
        self.assertTrue(is_fresh)

    def test_user_preferences(self) -> None:
        """Testa preferências do usuário."""
        preferences = UserPreferences.objects.create(
            workspace=self.workspace,
            portfolio=self.portfolio,
            excluded_sectors=["mineração"],
            preferred_sectors=["financeiro"],
        )

        self.assertEqual(preferences.excluded_sectors, ["mineração"])
        self.assertEqual(preferences.preferred_sectors, ["financeiro"])

    def test_sector_mapping(self) -> None:
        """Testa mapeamento de setores."""
        mapping = SectorMapping.objects.create(
            workspace=self.workspace,
            ticker="TAEE11",
            sector="energia",
            subsector="elétricas",
            company_name="Taesa",
        )

        self.assertEqual(mapping.ticker, "TAEE11")
        self.assertEqual(mapping.sector, "energia")

