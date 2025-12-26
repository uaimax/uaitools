"""Django Admin configuration for investments app."""

from django.contrib import admin

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


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Admin para Transaction."""

    list_display = ["ticker", "transaction_type", "quantity", "unit_price", "total_amount", "portfolio", "created_at", "workspace"]
    list_filter = ["transaction_type", "portfolio", "created_at", "workspace"]
    search_fields = ["ticker", "notes", "recommendation_id"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "created_at"


@admin.register(DividendReceived)
class DividendReceivedAdmin(admin.ModelAdmin):
    """Admin para DividendReceived."""

    list_display = ["ticker", "payment_date", "total_net", "total_gross", "tax_withheld", "portfolio", "workspace"]
    list_filter = ["portfolio", "payment_date", "workspace"]
    search_fields = ["ticker", "notes"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "payment_date"


# Novos modelos do sistema inteligente
@admin.register(StrategyTemplate)
class StrategyTemplateAdmin(admin.ModelAdmin):
    """Admin para StrategyTemplate."""

    list_display = ["name", "category", "performance_score", "is_active", "validation_status", "created_at"]
    list_filter = ["category", "is_active", "validation_status", "is_system_template", "created_at"]
    search_fields = ["name", "description", "slug"]
    readonly_fields = ["created_at", "updated_at", "last_validated"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(InvestorProfile)
class InvestorProfileAdmin(admin.ModelAdmin):
    """Admin para InvestorProfile."""

    list_display = ["portfolio", "risk_tolerance", "investment_horizon", "primary_goal", "confidence_score", "last_analyzed"]
    list_filter = ["risk_tolerance", "investment_horizon", "primary_goal", "experience_level", "last_analyzed"]
    search_fields = ["portfolio__name"]
    readonly_fields = ["created_at", "updated_at", "last_analyzed"]


@admin.register(UserPreferences)
class UserPreferencesAdmin(admin.ModelAdmin):
    """Admin para UserPreferences."""

    list_display = ["portfolio", "last_updated", "workspace"]
    list_filter = ["workspace", "last_updated"]
    search_fields = ["portfolio__name", "additional_criteria"]
    readonly_fields = ["created_at", "updated_at", "last_updated"]


@admin.register(StrategyValidation)
class StrategyValidationAdmin(admin.ModelAdmin):
    """Admin para StrategyValidation."""

    list_display = ["strategy_template", "portfolio", "validation_status", "validated_by", "validated_at"]
    list_filter = ["validation_status", "validated_by", "validated_at"]
    search_fields = ["strategy_template__name", "portfolio__name"]
    readonly_fields = ["created_at", "updated_at", "validated_at"]


@admin.register(StrategyPerformance)
class StrategyPerformanceAdmin(admin.ModelAdmin):
    """Admin para StrategyPerformance."""

    list_display = ["strategy_template", "portfolio", "period_start", "period_end", "performance_score", "vs_ibovespa", "calculated_at"]
    list_filter = ["strategy_template", "portfolio", "calculated_at"]
    search_fields = ["strategy_template__name", "portfolio__name"]
    readonly_fields = ["created_at", "updated_at", "calculated_at"]
    date_hierarchy = "calculated_at"


@admin.register(PortfolioChat)
class PortfolioChatAdmin(admin.ModelAdmin):
    """Admin para PortfolioChat."""

    list_display = ["portfolio", "is_from_user", "created_at", "workspace"]
    list_filter = ["is_from_user", "workspace", "created_at"]
    search_fields = ["message", "ai_response", "portfolio__name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(DataFreshness)
class DataFreshnessAdmin(admin.ModelAdmin):
    """Admin para DataFreshness."""

    list_display = ["data_type", "ticker", "is_fresh", "freshness_score", "last_updated", "next_update_due", "workspace"]
    list_filter = ["data_type", "is_fresh", "workspace", "last_updated"]
    search_fields = ["ticker"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(SectorMapping)
class SectorMappingAdmin(admin.ModelAdmin):
    """Admin para SectorMapping."""

    list_display = ["ticker", "sector", "subsector", "company_name", "is_active", "workspace"]
    list_filter = ["sector", "is_active", "workspace"]
    search_fields = ["ticker", "sector", "subsector", "company_name"]
    readonly_fields = ["created_at", "updated_at"]

