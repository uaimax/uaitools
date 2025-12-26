"""URLs for investments app."""

from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.investments.viewsets import (
    AssetViewSet,
    DividendReceivedViewSet,
    PortfolioViewSet,
    QuoteViewSet,
    StrategyTemplateViewSet,
    TransactionViewSet,
)

app_name = "investments"

router = DefaultRouter()
router.register(r"portfolios", PortfolioViewSet, basename="portfolio")
router.register(r"assets", AssetViewSet, basename="asset")
router.register(r"transactions", TransactionViewSet, basename="transaction")
router.register(r"dividends-received", DividendReceivedViewSet, basename="dividend-received")
router.register(r"strategy-templates", StrategyTemplateViewSet, basename="strategy-template")

# Quotes precisa de rota customizada por causa do padrão de URL
urlpatterns = router.urls + [
    path("quotes/<str:ticker>/", QuoteViewSet.as_view({"get": "get_quote"}), name="quote-detail"),
    path("quotes/<str:ticker>/dividends/", QuoteViewSet.as_view({"get": "get_dividend_history"}), name="quote-dividends"),
]

