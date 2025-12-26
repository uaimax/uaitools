"""Django Admin configuration for investments app."""

from django.contrib import admin

from apps.investments.models import (
    Asset,
    DividendHistory,
    DividendReceived,
    MarketPriceHistory,
    Portfolio,
    PortfolioSnapshot,
    Recommendation,
    Strategy,
    Transaction,
)


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    """Admin para Portfolio."""

    list_display = ["name", "portfolio_type", "workspace", "created_at"]
    list_filter = ["portfolio_type", "created_at"]
    search_fields = ["name", "workspace__name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    """Admin para Asset."""

    list_display = ["ticker", "quantity", "average_price", "portfolio", "workspace"]
    list_filter = ["portfolio", "created_at"]
    search_fields = ["ticker", "portfolio__name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Strategy)
class StrategyAdmin(admin.ModelAdmin):
    """Admin para Strategy."""

    list_display = ["portfolio", "strategy_type", "workspace", "created_at"]
    list_filter = ["strategy_type", "created_at"]
    search_fields = ["raw_text", "portfolio__name"]
    readonly_fields = ["created_at", "updated_at", "parsed_rules"]


@admin.register(PortfolioSnapshot)
class PortfolioSnapshotAdmin(admin.ModelAdmin):
    """Admin para PortfolioSnapshot."""

    list_display = ["portfolio", "total_value", "created_at", "workspace"]
    list_filter = ["workspace", "created_at"]
    search_fields = ["portfolio__name", "notes"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(DividendHistory)
class DividendHistoryAdmin(admin.ModelAdmin):
    """Admin para DividendHistory."""

    list_display = ["ticker", "total_last_12_months", "average_monthly", "regularity_score", "last_updated", "workspace"]
    list_filter = ["workspace", "last_updated"]
    search_fields = ["ticker"]
    readonly_fields = ["created_at", "updated_at", "last_updated"]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Admin para Transaction."""

    list_display = ["ticker", "transaction_type", "quantity", "unit_price", "total_amount", "portfolio", "created_at", "workspace"]
    list_filter = ["transaction_type", "portfolio", "created_at", "workspace"]
    search_fields = ["ticker", "notes", "recommendation_id"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    """Admin para Recommendation."""

    list_display = ["portfolio", "amount", "was_followed", "created_at", "workspace"]
    list_filter = ["was_followed", "portfolio", "created_at", "workspace"]
    search_fields = ["notes", "portfolio__name"]
    readonly_fields = ["created_at", "updated_at", "recommendation_data", "market_context"]
    date_hierarchy = "created_at"


@admin.register(DividendReceived)
class DividendReceivedAdmin(admin.ModelAdmin):
    """Admin para DividendReceived."""

    list_display = ["ticker", "payment_date", "total_net", "total_gross", "tax_withheld", "portfolio", "workspace"]
    list_filter = ["portfolio", "payment_date", "workspace"]
    search_fields = ["ticker", "notes"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "payment_date"


@admin.register(MarketPriceHistory)
class MarketPriceHistoryAdmin(admin.ModelAdmin):
    """Admin para MarketPriceHistory."""

    list_display = ["ticker", "price", "change_percent", "created_at", "workspace"]
    list_filter = ["workspace", "created_at"]
    search_fields = ["ticker"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"

