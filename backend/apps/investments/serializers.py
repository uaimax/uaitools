"""Serializers for investments app."""

from decimal import Decimal

from rest_framework import serializers

from apps.core.serializers import WorkspaceSerializer
from apps.investments.models import (
    Asset,
    DividendReceived,
    MarketPriceHistory,
    Portfolio,
    Recommendation,
    Strategy,
    Transaction,
)
from apps.investments.services.strategy_parser import StrategyParser
from apps.investments.services.constants import DEFAULT_STRATEGY_RULES


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


class StrategySerializer(WorkspaceSerializer):
    """Serializer para Strategy."""

    portfolio_name = serializers.CharField(source="portfolio.name", read_only=True)
    strategy_type_display = serializers.CharField(
        source="get_strategy_type_display", read_only=True
    )

    class Meta:
        model = Strategy
        fields = [
            "id",
            "workspace_id",
            "portfolio",
            "portfolio_name",
            "raw_text",
            "parsed_rules",
            "strategy_type",
            "strategy_type_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "parsed_rules",
            "strategy_type",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data: dict) -> Strategy:
        """Cria estratégia e parseia automaticamente."""
        strategy = super().create(validated_data)
        self._parse_strategy(strategy)
        return strategy

    def update(self, instance: Strategy, validated_data: dict) -> Strategy:
        """Atualiza estratégia e re-parseia se texto mudou."""
        strategy = super().update(instance, validated_data)
        if "raw_text" in validated_data:
            self._parse_strategy(strategy)
        return strategy

    def _parse_strategy(self, strategy: Strategy) -> None:
        """Parseia a estratégia e salva regras estruturadas.

        Se não houver critérios definidos, mescla com a estratégia padrão.
        """
        parser = StrategyParser()
        parsed = parser.parse(strategy.raw_text)

        # Se não há critérios definidos, usar estratégia padrão como base
        if not parsed.get("criteria"):
            parsed["criteria"] = DEFAULT_STRATEGY_RULES.copy()
        else:
            # Mesclar com padrão, mantendo critérios customizados
            default_criteria = DEFAULT_STRATEGY_RULES.copy()
            default_criteria.update(parsed["criteria"])
            parsed["criteria"] = default_criteria

        # Se não identificou tipo, usar padrão
        if not parsed.get("strategy_type"):
            parsed["strategy_type"] = DEFAULT_STRATEGY_RULES.get("strategy_type", "dividendos")

        strategy.parsed_rules = parsed
        strategy.strategy_type = parsed.get("strategy_type")
        strategy.save(update_fields=["parsed_rules", "strategy_type"])


class StrategyListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de estratégias."""

    strategy_type_display = serializers.CharField(
        source="get_strategy_type_display", read_only=True
    )

    class Meta:
        model = Strategy
        fields = [
            "id",
            "portfolio",
            "strategy_type",
            "strategy_type_display",
            "created_at",
        ]


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


class RecommendationSerializer(WorkspaceSerializer):
    """Serializer para Recommendation."""

    portfolio_name = serializers.CharField(source="portfolio.name", read_only=True)

    class Meta:
        model = Recommendation
        fields = [
            "id",
            "workspace_id",
            "portfolio",
            "portfolio_name",
            "amount",
            "recommendation_data",
            "was_followed",
            "executed_data",
            "notes",
            "market_context",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
        ]


class RecommendationListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listagem de recomendações."""

    class Meta:
        model = Recommendation
        fields = [
            "id",
            "portfolio",
            "amount",
            "was_followed",
            "created_at",
        ]


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


class MarketPriceHistorySerializer(WorkspaceSerializer):
    """Serializer para MarketPriceHistory."""

    class Meta:
        model = MarketPriceHistory
        fields = [
            "id",
            "workspace_id",
            "ticker",
            "price",
            "change_percent",
            "volume",
            "market_cap",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace_id",
            "created_at",
            "updated_at",
        ]

