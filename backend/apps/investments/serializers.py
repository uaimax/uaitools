"""Serializers for investments app."""

from decimal import Decimal

from rest_framework import serializers

from apps.core.serializers import WorkspaceSerializer
from apps.investments.models import (
    Asset,
    DataFreshness,
    DividendReceived,
    InvestorProfile,
    Portfolio,
    PortfolioChat,
    SectorMapping,
    StrategyPerformance,
    StrategyTemplate,
    StrategyValidation,
    Transaction,
    UserPreferences,
)


class PortfolioSerializer(WorkspaceSerializer):
    """Serializer para Portfolio."""

    total_invested = serializers.SerializerMethodField()
    assets_count = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            "id",
            "workspace_id",
            "portfolio_type",
            "name",
            "total_invested",
            "assets_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace_id", "created_at", "updated_at"]

    def get_total_invested(self, obj: Portfolio) -> float:
        """Calcula total investido."""
        return float(obj.get_total_invested())

    def get_assets_count(self, obj: Portfolio) -> int:
        """Conta número de ativos."""
        return obj.assets.count()


class PortfolioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de portfolios."""

    total_invested = serializers.SerializerMethodField()
    workspace_name = serializers.CharField(source="workspace.name", read_only=True)

    class Meta:
        model = Portfolio
        fields = [
            "id",
            "portfolio_type",
            "name",
            "total_invested",
            "created_at",
            "workspace_name",
        ]

    def get_total_invested(self, obj: Portfolio) -> float:
        """Calcula total investido."""
        return float(obj.get_total_invested())


class AssetSerializer(WorkspaceSerializer):
    """Serializer para Asset."""

    total_invested = serializers.SerializerMethodField()
    portfolio_name = serializers.CharField(source="portfolio.name", read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id",
            "workspace_id",
            "portfolio",
            "portfolio_name",
            "ticker",
            "quantity",
            "average_price",
            "total_invested",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace_id", "created_at", "updated_at"]

    def get_total_invested(self, obj: Asset) -> float:
        """Calcula total investido no ativo."""
        return float(obj.get_total_invested())


class AssetListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de ativos."""

    class Meta:
        model = Asset
        fields = [
            "id",
            "ticker",
            "quantity",
            "average_price",
            "portfolio",
            "created_at",
        ]


# StrategySerializer removido - será substituído pelo novo sistema


class TransactionSerializer(WorkspaceSerializer):
    """Serializer para Transaction."""

    transaction_type_display = serializers.CharField(
        source="get_transaction_type_display", read_only=True
    )
    portfolio_name = serializers.CharField(source="portfolio.name", read_only=True)
    asset_ticker = serializers.CharField(source="asset.ticker", read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "workspace_id",
            "portfolio",
            "portfolio_name",
            "asset",
            "asset_ticker",
            "ticker",
            "transaction_type",
            "transaction_type_display",
            "quantity",
            "unit_price",
            "market_price",
            "total_amount",
            "transaction_cost",
            "recommendation_id",
            "notes",
            "new_average_price",
            "new_quantity",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "total_amount",
            "created_at",
            "updated_at",
        ]


class TransactionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de transações."""

    transaction_type_display = serializers.CharField(
        source="get_transaction_type_display", read_only=True
    )

    class Meta:
        model = Transaction
        fields = [
            "id",
            "portfolio",
            "ticker",
            "transaction_type",
            "transaction_type_display",
            "quantity",
            "unit_price",
            "total_amount",
            "created_at",
        ]


# RecommendationSerializer removido - será substituído pelo novo sistema


class DividendReceivedSerializer(WorkspaceSerializer):
    """Serializer para DividendReceived."""

    portfolio_name = serializers.CharField(source="portfolio.name", read_only=True)
    asset_ticker = serializers.CharField(source="asset.ticker", read_only=True, allow_null=True)

    class Meta:
        model = DividendReceived
        fields = [
            "id",
            "workspace_id",
            "portfolio",
            "portfolio_name",
            "asset",
            "asset_ticker",
            "ticker",
            "payment_date",
            "base_date",
            "quantity_owned",
            "dividend_per_share",
            "total_gross",
            "tax_withheld",
            "total_net",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
        ]


class DividendReceivedListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de dividendos recebidos."""

    class Meta:
        model = DividendReceived
        fields = [
            "id",
            "portfolio",
            "ticker",
            "payment_date",
            "total_net",
            "created_at",
        ]


# MarketPriceHistorySerializer removido - será substituído pelo novo sistema


# Novos serializers do sistema inteligente
class StrategyTemplateSerializer(WorkspaceSerializer):
    """Serializer para StrategyTemplate."""

    performance_score_display = serializers.SerializerMethodField()
    validation_status_display = serializers.CharField(
        source="get_validation_status_display", read_only=True
    )

    class Meta:
        model = StrategyTemplate
        fields = [
            "id",
            "workspace_id",
            "name",
            "slug",
            "description",
            "category",
            "base_criteria",
            "adaptation_logic",
            "performance_score",
            "performance_score_display",
            "is_active",
            "is_system_template",
            "priority",
            "validation_status",
            "validation_status_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
            "last_validated",
        ]

    def get_performance_score_display(self, obj: StrategyTemplate) -> str:
        """Converte score para exibição em estrelas."""
        score = float(obj.performance_score)
        stars = int(score)
        half_star = "☆" if score - stars >= 0.5 else ""
        return "⭐" * stars + half_star + "☆" * (5 - stars - (1 if half_star else 0))


class InvestorProfileSerializer(WorkspaceSerializer):
    """Serializer para InvestorProfile."""

    risk_tolerance_display = serializers.CharField(
        source="get_risk_tolerance_display", read_only=True
    )
    investment_horizon_display = serializers.CharField(
        source="get_investment_horizon_display", read_only=True
    )
    primary_goal_display = serializers.CharField(
        source="get_primary_goal_display", read_only=True
    )
    experience_level_display = serializers.CharField(
        source="get_experience_level_display", read_only=True
    )

    class Meta:
        model = InvestorProfile
        fields = [
            "id",
            "workspace_id",
            "portfolio",
            "risk_tolerance",
            "risk_tolerance_display",
            "investment_horizon",
            "investment_horizon_display",
            "primary_goal",
            "primary_goal_display",
            "experience_level",
            "experience_level_display",
            "total_invested",
            "average_dividend_yield",
            "diversification_score",
            "concentration_risk",
            "adherence_to_recommendations",
            "average_holding_period",
            "confidence_score",
            "last_analyzed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
            "last_analyzed",
        ]


class UserPreferencesSerializer(WorkspaceSerializer):
    """Serializer para UserPreferences."""

    class Meta:
        model = UserPreferences
        fields = [
            "id",
            "workspace_id",
            "portfolio",
            "excluded_sectors",
            "preferred_sectors",
            "additional_criteria",
            "restrictions",
            "last_updated",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
            "last_updated",
        ]


class StrategyValidationSerializer(WorkspaceSerializer):
    """Serializer para StrategyValidation."""

    validation_status_display = serializers.CharField(
        source="get_validation_status_display", read_only=True
    )
    validated_by_display = serializers.CharField(
        source="get_validated_by_display", read_only=True
    )

    class Meta:
        model = StrategyValidation
        fields = [
            "id",
            "workspace_id",
            "strategy_template",
            "portfolio",
            "validation_status",
            "validation_status_display",
            "validation_result",
            "suggested_adjustments",
            "validated_at",
            "validated_by",
            "validated_by_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
            "validated_at",
        ]


class StrategyPerformanceSerializer(WorkspaceSerializer):
    """Serializer para StrategyPerformance."""

    class Meta:
        model = StrategyPerformance
        fields = [
            "id",
            "workspace_id",
            "strategy_template",
            "portfolio",
            "period_start",
            "period_end",
            "total_return",
            "dividend_yield_realized",
            "recommendations_followed",
            "recommendations_total",
            "adherence_rate",
            "performance_score",
            "vs_ibovespa",
            "calculated_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
            "calculated_at",
        ]


class PortfolioChatSerializer(WorkspaceSerializer):
    """Serializer para PortfolioChat."""

    class Meta:
        model = PortfolioChat
        fields = [
            "id",
            "workspace_id",
            "portfolio",
            "message",
            "is_from_user",
            "context_snapshot",
            "ai_response",
            "ai_confidence",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
        ]


class DataFreshnessSerializer(WorkspaceSerializer):
    """Serializer para DataFreshness."""

    data_type_display = serializers.CharField(
        source="get_data_type_display", read_only=True
    )

    class Meta:
        model = DataFreshness
        fields = [
            "id",
            "workspace_id",
            "data_type",
            "data_type_display",
            "ticker",
            "last_updated",
            "next_update_due",
            "is_fresh",
            "freshness_score",
            "update_frequency_minutes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
        ]


class SectorMappingSerializer(WorkspaceSerializer):
    """Serializer para SectorMapping."""

    class Meta:
        model = SectorMapping
        fields = [
            "id",
            "workspace_id",
            "ticker",
            "sector",
            "subsector",
            "company_name",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
        ]

