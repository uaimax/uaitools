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
    MarketPriceHistory,
    Portfolio,
    Recommendation,
    Strategy,
    Transaction,
)
from apps.investments.serializers import (
    AssetListSerializer,
    AssetSerializer,
    DividendReceivedListSerializer,
    DividendReceivedSerializer,
    MarketPriceHistorySerializer,
    PortfolioListSerializer,
    PortfolioSerializer,
    RecommendationListSerializer,
    RecommendationSerializer,
    StrategyListSerializer,
    StrategySerializer,
    TransactionListSerializer,
    TransactionSerializer,
)
from apps.investments.services.brapi_provider import BrapiProvider
from apps.investments.services.investment_advisor import InvestmentAdvisor

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
        """Cria portfolio e estratégia padrão automaticamente."""
        # Chamar perform_create do WorkspaceViewSet (define workspace)
        super().perform_create(serializer)

        # Obter o portfolio criado
        portfolio = serializer.instance

        # Garantir que a estratégia existe
        self._ensure_strategy(portfolio)

    def _ensure_strategy(self, portfolio: Portfolio) -> None:
        """Garante que o portfolio tem uma estratégia padrão."""
        if not portfolio:
            return

        from apps.investments.services.constants import DEFAULT_PARSED_RULES

        # Verificar se estratégia existe (usando try/except para evitar problemas com relacionamento)
        strategy_exists = False
        try:
            strategy_exists = hasattr(portfolio, "strategy") and portfolio.strategy is not None
        except Exception:
            # Se der erro ao acessar, verificar diretamente no banco
            strategy_exists = Strategy.objects.filter(portfolio=portfolio, deleted_at__isnull=True).exists()

        # Se não existe ou se existe mas está vazia, criar/atualizar
        if not strategy_exists:
            strategy, created = Strategy.objects.get_or_create(
                workspace=portfolio.workspace,
                portfolio=portfolio,
                defaults={
                    "raw_text": "Estratégia padrão: Foco em dividendos com DY mínimo de 8% e setores defensivos. Apenas ações da B3. Preço teto de entrada = dividendo / 0.08. Só comprar ações com cotação ≤ preço-teto e que estejam abaixo da alocação máxima.",
                    "parsed_rules": DEFAULT_PARSED_RULES,
                    "strategy_type": "dividendos",
                }
            )
            # Se já existia mas estava vazia, atualizar
            if not created and (not strategy.raw_text or not strategy.raw_text.strip()):
                strategy.raw_text = "Estratégia padrão: Foco em dividendos com DY mínimo de 8% e setores defensivos. Apenas ações da B3. Preço teto de entrada = dividendo / 0.08. Só comprar ações com cotação ≤ preço-teto e que estejam abaixo da alocação máxima."
                strategy.parsed_rules = DEFAULT_PARSED_RULES
                strategy.strategy_type = "dividendos"
                strategy.save(update_fields=["raw_text", "parsed_rules", "strategy_type"])

    @action(detail=True, methods=["get"], url_path="status")
    def status(self, request: "Request", pk: str = None) -> Response:
        """Retorna status da carteira (alertas)."""
        portfolio = self.get_object()
        # Garantir que tem estratégia antes de avaliar
        self._ensure_strategy(portfolio)
        advisor = InvestmentAdvisor()
        status_data = advisor.evaluate_portfolio_status(portfolio)
        return Response(status_data)

    @action(detail=True, methods=["post"], url_path="analyze")
    def analyze(self, request: "Request", pk: str = None) -> Response:
        """Gera recomendação de onde investir um valor e salva no histórico."""
        from django.utils import timezone

        portfolio = self.get_object()
        amount = request.data.get("amount")

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

        advisor = InvestmentAdvisor()
        recommendation = advisor.generate_investment_recommendation(
            portfolio, amount_decimal
        )

        # Salvar recomendação no histórico
        from apps.investments.models import Recommendation

        brapi = BrapiProvider()
        # Tentar buscar IBOV (índice de referência)
        ibov_quote = brapi.get_quote("^BVSP")
        market_context = {
            "timestamp": timezone.now().isoformat(),
            "ibov": {
                "price": float(ibov_quote.get("price", 0)) if ibov_quote else None,
                "change_percent": float(ibov_quote.get("change_percent", 0)) if ibov_quote else None,
            } if ibov_quote else None,
        }

        recommendation_obj = Recommendation.objects.create(
            workspace=portfolio.workspace,
            portfolio=portfolio,
            amount=amount_decimal,
            recommendation_data=recommendation,
            market_context=market_context,
        )

        # Adicionar ID da recomendação na resposta
        recommendation["recommendation_id"] = str(recommendation_obj.id)

        return Response(recommendation)

    @action(detail=True, methods=["post"], url_path="update-prices")
    def update_prices(self, request: "Request", pk: str = None) -> Response:
        """Atualiza preços de todos os ativos da carteira usando BRAPI e cria snapshot."""
        from django.utils import timezone
        from apps.investments.models import MarketPriceHistory, PortfolioSnapshot

        portfolio = self.get_object()
        brapi = BrapiProvider()
        updated_count = 0
        errors = []
        assets_data = []

        for asset in portfolio.assets.all():
            try:
                quote = brapi.get_quote(asset.ticker, use_cache=False)  # Sem cache para forçar atualização
                if quote and quote.get("price"):
                    old_price = asset.average_price
                    asset.average_price = quote["price"]
                    asset.save(update_fields=["average_price"])
                    updated_count += 1
                    assets_data.append({
                        "ticker": asset.ticker,
                        "quantity": str(asset.quantity),
                        "price": str(asset.average_price),
                        "old_price": str(old_price),
                    })

                    # Salvar histórico de preço (apenas uma vez por dia por ticker)
                    today = timezone.now().date()
                    price_history = MarketPriceHistory.objects.filter(
                        workspace=portfolio.workspace,
                        ticker=asset.ticker,
                        created_at__date=today,
                    ).first()

                    if price_history:
                        # Atualizar registro existente do dia
                        price_history.price = Decimal(str(quote.get("price", 0)))
                        price_history.change_percent = Decimal(str(quote.get("change_percent", 0))) if quote.get("change_percent") else None
                        price_history.volume = quote.get("volume")
                        price_history.market_cap = quote.get("market_cap")
                        price_history.save()
                    else:
                        # Criar novo registro
                        MarketPriceHistory.objects.create(
                            workspace=portfolio.workspace,
                            ticker=asset.ticker,
                            price=Decimal(str(quote.get("price", 0))),
                            change_percent=Decimal(str(quote.get("change_percent", 0))) if quote.get("change_percent") else None,
                            volume=quote.get("volume"),
                            market_cap=quote.get("market_cap"),
                        )
                else:
                    errors.append(f"Não foi possível obter cotação para {asset.ticker}")
            except Exception as e:
                errors.append(f"Erro ao atualizar {asset.ticker}: {str(e)}")

        # Criar snapshot do patrimônio após atualização
        if updated_count > 0:
            total_value = portfolio.get_total_invested()
            PortfolioSnapshot.objects.create(
                workspace=portfolio.workspace,
                portfolio=portfolio,
                total_value=total_value,
                assets_data={"assets": assets_data},
                notes=f"Atualização automática de preços - {updated_count} ativos atualizados",
            )

        return Response({
            "updated_count": updated_count,
            "total_assets": portfolio.assets.count(),
            "errors": errors if errors else None,
        })


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


class StrategyViewSet(WorkspaceViewSet):
    """ViewSet para Strategy."""

    queryset = Strategy.objects.all()
    serializer_class = StrategySerializer
    permission_classes = [permissions.IsAuthenticated, WorkspaceObjectPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["raw_text"]
    ordering_fields = ["strategy_type", "created_at"]
    ordering = ["-created_at"]

    def get_serializer_class(self) -> type[StrategySerializer | StrategyListSerializer]:
        """Retorna serializer apropriado."""
        if self.action == "list":
            return StrategyListSerializer
        return StrategySerializer

    def get_queryset(self) -> models.QuerySet[Strategy]:
        """Filtra por portfolio se fornecido."""
        queryset = super().get_queryset()
        portfolio_id = self.request.query_params.get("portfolio")
        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)
            # Se não encontrou estratégia, garantir que existe
            if not queryset.exists():
                try:
                    portfolio = Portfolio.objects.get(id=portfolio_id)
                    # Garantir que tem estratégia padrão
                    portfolio_viewset = PortfolioViewSet()
                    portfolio_viewset.request = self.request
                    portfolio_viewset._ensure_strategy(portfolio)
                    # Buscar novamente
                    queryset = super().get_queryset().filter(portfolio_id=portfolio_id)
                except Portfolio.DoesNotExist:
                    pass
        return queryset


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


class RecommendationViewSet(WorkspaceViewSet):
    """ViewSet para Recommendation."""

    queryset = Recommendation.objects.all()
    serializer_class = RecommendationSerializer
    permission_classes = [permissions.IsAuthenticated, WorkspaceObjectPermission]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["notes"]
    ordering_fields = ["created_at", "amount", "was_followed"]
    ordering = ["-created_at"]

    def get_serializer_class(self) -> type[RecommendationSerializer | RecommendationListSerializer]:
        """Retorna serializer apropriado."""
        if self.action == "list":
            return RecommendationListSerializer
        return RecommendationSerializer

    def get_queryset(self) -> models.QuerySet[Recommendation]:
        """Filtra por portfolio, was_followed se fornecido."""
        queryset = super().get_queryset()
        portfolio_id = self.request.query_params.get("portfolio")
        was_followed = self.request.query_params.get("was_followed")

        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)
        if was_followed is not None:
            was_followed_bool = was_followed.lower() in ("true", "1", "yes")
            queryset = queryset.filter(was_followed=was_followed_bool)

        return queryset


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


class MarketPriceHistoryViewSet(WorkspaceViewSet):
    """ViewSet para MarketPriceHistory (read-only)."""

    queryset = MarketPriceHistory.objects.all()
    serializer_class = MarketPriceHistorySerializer
    permission_classes = [permissions.IsAuthenticated, WorkspaceObjectPermission]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "price"]
    ordering = ["-created_at"]
    http_method_names = ["get", "head", "options"]  # Read-only

    def get_queryset(self) -> models.QuerySet[MarketPriceHistory]:
        """Filtra por ticker, período se fornecido."""
        queryset = super().get_queryset()
        ticker = self.request.query_params.get("ticker")
        date_from = self.request.query_params.get("date_from")
        date_to = self.request.query_params.get("date_to")

        if ticker:
            queryset = queryset.filter(ticker=ticker.upper())
        if date_from:
            queryset = queryset.filter(created_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__date__lte=date_to)

        return queryset

