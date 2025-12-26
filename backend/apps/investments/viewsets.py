"""ViewSets for investments app."""

from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import models
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import WorkspaceObjectPermission
from apps.core.viewsets import WorkspaceViewSet
from apps.investments.models import (
    Asset,
    DividendReceived,
    Portfolio,
    StrategyTemplate,
    Transaction,
)
from apps.investments.serializers import (
    AssetListSerializer,
    AssetSerializer,
    DividendReceivedListSerializer,
    DividendReceivedSerializer,
    PortfolioListSerializer,
    PortfolioSerializer,
    TransactionListSerializer,
    TransactionSerializer,
)
from apps.investments.services.brapi_provider import BrapiProvider

if TYPE_CHECKING:
    from rest_framework.request import Request


class PortfolioViewSet(WorkspaceViewSet):
    """ViewSet para Portfolio."""

    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.IsAuthenticated, WorkspaceObjectPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "portfolio_type"]
    ordering_fields = ["name", "portfolio_type", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self) -> models.QuerySet:
        """Retorna queryset filtrado por workspace do usuário.

        Para o módulo investments:
        - Sempre filtra pelo workspace do usuário (user.workspace)
        - Múltiplos usuários no mesmo workspace veem as mesmas carteiras
        - Super admins também veem apenas carteiras do seu workspace
        - Se usuário não tem workspace, retorna vazio (workspace será criado no perform_create)
        """
        queryset = super().get_queryset()

        # Sempre filtrar pelo workspace do usuário
        # Isso permite que múltiplos usuários no mesmo workspace vejam as mesmas carteiras
        if hasattr(self.request, "user") and self.request.user.is_authenticated:
            user = self.request.user
            # Usar workspace do usuário se disponível
            if hasattr(user, "workspace") and user.workspace:
                queryset = queryset.filter(workspace=user.workspace)
            else:
                # Se não tem workspace, retornar vazio (workspace será criado no perform_create)
                queryset = queryset.none()

        return queryset

    def get_serializer_class(self) -> type[PortfolioSerializer | PortfolioListSerializer]:
        """Retorna serializer apropriado."""
        if self.action == "list":
            return PortfolioListSerializer
        return PortfolioSerializer

    def create(self, request, *args, **kwargs):
        """Cria um novo portfolio.

        Permite múltiplas carteiras do mesmo tipo no mesmo workspace.
        """
        # Sempre criar nova carteira (não verificar se já existe)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        """Cria portfolio."""
        # Chamar perform_create do WorkspaceViewSet (define workspace)
        super().perform_create(serializer)

    @action(detail=True, methods=["post"], url_path="smart-recommendation")
    def smart_recommendation(self, request: "Request", pk: str = None) -> Response:
        """Gera recomendação inteligente baseada em contexto.

        Body:
            {
                "amount": 200.00,
                "user_preference": "mais conservador"  // opcional
            }
        """
        from apps.investments.services.smart_investment_advisor import SmartInvestmentAdvisor

        portfolio = self.get_object()
        amount = request.data.get("amount")
        user_preference = request.data.get("user_preference")

        if not amount:
            return Response(
                {"error": "Campo 'amount' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount_decimal = Decimal(str(amount))
            if amount_decimal <= 0:
                return Response(
                    {"error": "Valor deve ser maior que zero"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (ValueError, TypeError):
            return Response(
                {"error": "Valor inválido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        advisor = SmartInvestmentAdvisor()
        recommendation = advisor.generate_recommendation(
            portfolio,
            amount_decimal,
            user_preference,
        )

        return Response(recommendation)

    @action(detail=True, methods=["get"], url_path="context")
    def context(self, request: "Request", pk: str = None) -> Response:
        """Retorna contexto analisado da carteira."""
        from apps.investments.services.context_analyzer import ContextAnalyzer

        portfolio = self.get_object()
        analyzer = ContextAnalyzer()
        context = analyzer.analyze_user_context(portfolio)

        return Response(context)

    @action(detail=True, methods=["get", "put"], url_path="preferences")
    def preferences(self, request: "Request", pk: str = None) -> Response:
        """Obtém ou atualiza preferências do usuário."""
        from apps.investments.models import UserPreferences
        from apps.investments.serializers import UserPreferencesSerializer

        portfolio = self.get_object()

        if request.method == "GET":
            try:
                preferences = portfolio.preferences
                serializer = UserPreferencesSerializer(preferences)
                return Response(serializer.data)
            except UserPreferences.DoesNotExist:
                return Response({
                    "excluded_sectors": [],
                    "preferred_sectors": [],
                    "additional_criteria": "",
                    "restrictions": {},
                })

        # PUT - Criar ou atualizar
        try:
            preferences = portfolio.preferences
            serializer = UserPreferencesSerializer(preferences, data=request.data, partial=True)
        except UserPreferences.DoesNotExist:
            serializer = UserPreferencesSerializer(data={
                **request.data,
                "portfolio": portfolio.id,
            })

        if serializer.is_valid():
            serializer.save(workspace=portfolio.workspace, portfolio=portfolio)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="validate-strategy")
    def validate_strategy(self, request: "Request", pk: str = None) -> Response:
        """Valida estratégia para a carteira."""
        from apps.investments.models import StrategyTemplate
        from apps.investments.services.strategy_validator import StrategyValidator
        from apps.investments.serializers import StrategyValidationSerializer

        portfolio = self.get_object()
        strategy_template_id = request.data.get("strategy_template_id")

        if not strategy_template_id:
            return Response(
                {"error": "Campo 'strategy_template_id' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            strategy_template = StrategyTemplate.objects.get(
                id=strategy_template_id,
                workspace=portfolio.workspace,
            )
        except StrategyTemplate.DoesNotExist:
            return Response(
                {"error": "Template de estratégia não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        validator = StrategyValidator()
        validation = validator.validate_strategy(portfolio, strategy_template)

        serializer = StrategyValidationSerializer(validation)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="strategy-performance")
    def strategy_performance(self, request: "Request", pk: str = None) -> Response:
        """Obtém performance da estratégia."""
        from apps.investments.models import StrategyTemplate, StrategyPerformance
        from apps.investments.services.performance_calculator import PerformanceCalculator
        from apps.investments.serializers import StrategyPerformanceSerializer
        from datetime import date

        portfolio = self.get_object()
        strategy_template_id = request.query_params.get("strategy_template_id")

        if not strategy_template_id:
            return Response(
                {"error": "Parâmetro 'strategy_template_id' é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            strategy_template = StrategyTemplate.objects.get(
                id=strategy_template_id,
                workspace=portfolio.workspace,
            )
        except StrategyTemplate.DoesNotExist:
            return Response(
                {"error": "Template de estratégia não encontrado"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Buscar performance existente ou calcular nova
        period_start = request.query_params.get("period_start")
        period_end = request.query_params.get("period_end")

        if period_start and period_end:
            try:
                period_start_date = date.fromisoformat(period_start)
                period_end_date = date.fromisoformat(period_end)
            except ValueError:
                return Response(
                    {"error": "Datas inválidas. Use formato YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            period_start_date = None
            period_end_date = None

        calculator = PerformanceCalculator()
        performance = calculator.calculate_performance(
            portfolio,
            strategy_template,
            period_start_date,
            period_end_date,
        )

        serializer = StrategyPerformanceSerializer(performance)
        return Response(serializer.data)

    @action(detail=True, methods=["post", "get"], url_path="chat")
    def chat(self, request: "Request", pk: str = None) -> Response:
        """Chat contextual na carteira."""
        from apps.investments.services.portfolio_chat_service import PortfolioChatService
        from apps.investments.serializers import PortfolioChatSerializer

        portfolio = self.get_object()
        service = PortfolioChatService()

        if request.method == "POST":
            message = request.data.get("message")
            if not message:
                return Response(
                    {"error": "Campo 'message' é obrigatório"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            chat_message = service.send_message(portfolio, message)
            serializer = PortfolioChatSerializer(chat_message)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # GET - Histórico
        limit = int(request.query_params.get("limit", 50))
        history = service.get_history(portfolio, limit)
        serializer = PortfolioChatSerializer(history, many=True)
        return Response({"messages": serializer.data})


class AssetViewSet(WorkspaceViewSet):
    """ViewSet para Asset."""

    queryset = Asset.objects.all()
    serializer_class = AssetSerializer
    permission_classes = [permissions.IsAuthenticated, WorkspaceObjectPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["ticker", "notes"]
    ordering_fields = ["ticker", "quantity", "average_price", "created_at"]
    ordering = ["ticker"]

    def get_serializer_class(self) -> type[AssetSerializer | AssetListSerializer]:
        """Retorna serializer apropriado."""
        if self.action == "list":
            return AssetListSerializer
        return AssetSerializer

    def get_queryset(self) -> models.QuerySet[Asset]:
        """Filtra por portfolio se fornecido."""
        queryset = super().get_queryset()
        portfolio_id = self.request.query_params.get("portfolio")
        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)
        return queryset

    def create(self, request: "Request", *args, **kwargs) -> Response:
        """Cria ativo e registra transação de compra."""
        response = super().create(request, *args, **kwargs)
        if response.status_code == status.HTTP_201_CREATED:
            asset = Asset.objects.get(id=response.data["id"])
            self._create_transaction(asset, "buy", request)
        return response

    def update(self, request: "Request", *args, **kwargs) -> Response:
        """Atualiza ativo e registra transação se quantidade mudou."""
        asset = self.get_object()
        old_quantity = asset.quantity
        old_average_price = asset.average_price

        response = super().update(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            asset.refresh_from_db()
            quantity_diff = asset.quantity - old_quantity

            if quantity_diff > 0:
                # Compra - usar novo preço médio
                self._create_transaction(asset, "buy", request, quantity_diff, asset.average_price)
            elif quantity_diff < 0:
                # Venda parcial - usar preço médio antigo
                self._create_transaction(asset, "sell", request, abs(quantity_diff), old_average_price)

        return response

    def destroy(self, request: "Request", *args, **kwargs) -> Response:
        """Deleta ativo e registra transação de venda total."""
        asset = self.get_object()
        self._create_transaction(asset, "sell", request, asset.quantity, asset.average_price)
        return super().destroy(request, *args, **kwargs)

    def _create_transaction(
        self,
        asset: Asset,
        transaction_type: str,
        request: "Request",
        quantity: Decimal = None,
        unit_price: Decimal = None,
    ) -> None:
        """Cria transação automaticamente."""
        from apps.investments.models import Transaction
        from apps.investments.services.brapi_provider import BrapiProvider

        quantity = quantity or asset.quantity
        unit_price = unit_price or asset.average_price
        brapi = BrapiProvider()
        quote = brapi.get_quote(asset.ticker)
        market_price = Decimal(str(quote.get("price", unit_price))) if quote else None

        # Calcular novo preço médio e quantidade após transação
        new_average_price = None
        new_quantity = None

        if transaction_type == "buy":
            # Para compra: calcular novo preço médio ponderado
            if asset.quantity > 0:
                total_invested = (asset.quantity - quantity) * asset.average_price + quantity * unit_price
                new_quantity = asset.quantity
                new_average_price = total_invested / new_quantity if new_quantity > 0 else unit_price
            else:
                new_quantity = quantity
                new_average_price = unit_price
        elif transaction_type == "sell":
            # Para venda: quantidade diminui, preço médio permanece
            new_quantity = asset.quantity - quantity if asset.quantity >= quantity else Decimal("0")
            new_average_price = asset.average_price if new_quantity > 0 else None

        Transaction.objects.create(
            workspace=asset.workspace,
            portfolio=asset.portfolio,
            asset=asset if transaction_type == "buy" else None,  # Null se venda total
            ticker=asset.ticker,
            transaction_type=transaction_type,
            quantity=quantity,
            unit_price=unit_price,
            market_price=market_price,
            total_amount=quantity * unit_price,
            new_average_price=new_average_price,
            new_quantity=new_quantity,
            notes=request.data.get("notes", ""),
            recommendation_id=request.data.get("recommendation_id"),
        )


# StrategyViewSet removido - será substituído pelo novo sistema


class QuoteViewSet(viewsets.ViewSet):
    """ViewSet para buscar cotações de ativos."""

    permission_classes = [permissions.IsAuthenticated]

    def get_quote(self, request: "Request", ticker: str = None) -> Response:
        """Busca cotação de um ticker."""
        if not ticker:
            return Response(
                {"error": "Ticker é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        brapi = BrapiProvider()
        quote = brapi.get_quote(ticker)
        fundamental = brapi.get_fundamental_data(ticker)

        if not quote:
            return Response(
                {"error": f"Cotação não encontrada para {ticker}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Combinar dados de cotação e fundamentalistas
        # Converter Decimal para float para serialização JSON
        result = {
            "ticker": str(quote.get("ticker", ticker)),
            "price": float(quote.get("price", 0)),
            "change_percent": float(quote.get("change_percent", 0)),
            "market_cap": quote.get("market_cap"),
            "volume": quote.get("volume"),
        }

        if fundamental:
            result.update({
                "pe_ratio": fundamental.get("pe_ratio"),
                "price_to_book": fundamental.get("price_to_book"),
                "dividend_yield": fundamental.get("dividend_yield"),
            })

        return Response(result)

    @action(detail=False, methods=["get"], url_path="(?P<ticker>[^/.]+)/dividends")
    def get_dividend_history(self, request: "Request", ticker: str = None) -> Response:
        """Busca histórico de dividendos de um ticker.

        Usa cache e banco de dados para economizar requisições à BRAPI.
        """
        if not ticker:
            return Response(
                {"error": "Ticker é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        brapi = BrapiProvider()

        # Obter workspace do usuário (para salvar histórico)
        workspace = None
        if hasattr(request, "user") and request.user.is_authenticated:
            if hasattr(request.user, "workspace") and request.user.workspace:
                workspace = request.user.workspace
            elif hasattr(request, "workspace") and request.workspace:
                workspace = request.workspace

        history = brapi.get_dividend_history(ticker, use_cache=True, workspace=workspace)

        if not history:
            return Response(
                {"error": f"Histórico de dividendos não encontrado para {ticker}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(history)


class TransactionViewSet(WorkspaceViewSet):
    """ViewSet para Transaction."""

    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated, WorkspaceObjectPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["ticker", "notes"]
    ordering_fields = ["created_at", "ticker", "transaction_type"]
    ordering = ["-created_at"]

    def get_serializer_class(self) -> type[TransactionSerializer | TransactionListSerializer]:
        """Retorna serializer apropriado."""
        if self.action == "list":
            return TransactionListSerializer
        return TransactionSerializer

    def get_queryset(self) -> models.QuerySet[Transaction]:
        """Filtra por portfolio, ticker, tipo se fornecido."""
        queryset = super().get_queryset()
        portfolio_id = self.request.query_params.get("portfolio")
        ticker = self.request.query_params.get("ticker")
        transaction_type = self.request.query_params.get("transaction_type")

        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)
        if ticker:
            queryset = queryset.filter(ticker=ticker.upper())
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)

        return queryset


# RecommendationViewSet removido - será substituído pelo novo sistema


class DividendReceivedViewSet(WorkspaceViewSet):
    """ViewSet para DividendReceived."""

    queryset = DividendReceived.objects.all()
    serializer_class = DividendReceivedSerializer
    permission_classes = [permissions.IsAuthenticated, WorkspaceObjectPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["ticker", "notes"]
    ordering_fields = ["payment_date", "ticker", "total_net"]
    ordering = ["-payment_date", "-created_at"]

    def get_serializer_class(self) -> type[DividendReceivedSerializer | DividendReceivedListSerializer]:
        """Retorna serializer apropriado."""
        if self.action == "list":
            return DividendReceivedListSerializer
        return DividendReceivedSerializer

    def get_queryset(self) -> models.QuerySet[DividendReceived]:
        """Filtra por portfolio, ticker, período se fornecido."""
        queryset = super().get_queryset()
        portfolio_id = self.request.query_params.get("portfolio")
        ticker = self.request.query_params.get("ticker")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)
        if ticker:
            queryset = queryset.filter(ticker=ticker.upper())
        if date_from:
            queryset = queryset.filter(payment_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(payment_date__lte=date_to)

        return queryset


# MarketPriceHistoryViewSet removido - será substituído pelo novo sistema


# Novos ViewSets do sistema inteligente
class StrategyTemplateViewSet(WorkspaceViewSet):
    """ViewSet para StrategyTemplate."""

    queryset = StrategyTemplate.objects.all()
    serializer_class = None  # Será definido dinamicamente
    permission_classes = [permissions.IsAuthenticated, WorkspaceObjectPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "category"]
    ordering_fields = ["performance_score", "priority", "created_at"]
    ordering = ["-performance_score", "-priority"]

    def get_serializer_class(self):
        """Retorna serializer apropriado."""
        from apps.investments.serializers import StrategyTemplateSerializer
        return StrategyTemplateSerializer

    def get_queryset(self) -> models.QuerySet:
        """Filtra por workspace e status."""
        queryset = super().get_queryset()
        is_active = self.request.query_params.get("is_active")
        category = self.request.query_params.get("category")

        if is_active is not None:
            is_active_bool = is_active.lower() in ("true", "1", "yes")
            queryset = queryset.filter(is_active=is_active_bool)
        if category:
            queryset = queryset.filter(category=category)

        return queryset

    @action(detail=False, methods=["get"], url_path="list")
    def list_templates(self, request: "Request") -> Response:
        """Lista templates disponíveis (endpoint customizado)."""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({"templates": serializer.data})

