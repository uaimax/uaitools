"""Gerador de recomendações de investimento baseado em estratégia."""

from decimal import Decimal
from typing import Any, Dict, List, Optional

from apps.investments.models import Asset, Portfolio, Strategy
from apps.investments.services.brapi_provider import BrapiProvider
from apps.investments.services.openai_service import OpenAIService
from apps.investments.services.constants import (
    TARGET_ALLOCATION,
    DEFAULT_STRATEGY_RULES,
    DEFAULT_PARSED_RULES,
    ALLOWED_SECTORS,
)


class InvestmentAdvisor:
    """Gerador de recomendações de investimento."""

    def __init__(self) -> None:
        """Inicializa o advisor."""
        self.brapi = BrapiProvider()
        self.openai = OpenAIService()

    def _get_strategy_criteria(self, portfolio: Portfolio) -> Dict[str, Any]:
        """Obtém critérios da estratégia, usando padrão se não houver estratégia definida.

        Returns:
            Dicionário com critérios da estratégia (incluindo strategy_type)
        """
        if hasattr(portfolio, "strategy") and portfolio.strategy:
            strategy = portfolio.strategy
            parsed_rules = strategy.parsed_rules or {}
            criteria = parsed_rules.get("criteria", {})
            strategy_type = parsed_rules.get("strategy_type", "dividendos")

            # Se não tem critérios definidos, usar padrão
            if not criteria:
                criteria = DEFAULT_STRATEGY_RULES.copy()
            else:
                # Mesclar com padrão, mantendo critérios customizados
                default_criteria = DEFAULT_STRATEGY_RULES.copy()
                default_criteria.update(criteria)
                criteria = default_criteria

            # Adicionar strategy_type aos critérios para facilitar acesso
            criteria["strategy_type"] = strategy_type
        else:
            # Usar estratégia padrão completa
            criteria = DEFAULT_STRATEGY_RULES.get("criteria", {}).copy()
            criteria["strategy_type"] = "dividendos"

        return criteria

    def evaluate_portfolio_status(
        self, portfolio: Portfolio
    ) -> Dict[str, Any]:
        """Avalia status da carteira e gera alertas.

        Args:
            portfolio: Carteira a ser avaliada

        Returns:
            Dicionário com:
            - status: "ok" ou "attention"
            - alerts: lista de alertas
        """
        criteria = self._get_strategy_criteria(portfolio)

        alerts = []
        assets = portfolio.assets.all()

        # Avaliar cada ativo
        for asset in assets:
            asset_alerts = self._evaluate_asset(asset, criteria)
            if asset_alerts:
                alerts.extend(asset_alerts)

        status = "ok" if len(alerts) == 0 else "attention"

        return {
            "status": status,
            "alerts": alerts,
            "total_alerts": len(alerts),
        }

    def _evaluate_asset(
        self, asset: Asset, criteria: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Avalia um ativo contra os critérios da estratégia."""
        alerts = []

        # Buscar dados atualizados
        fundamental_data = self.brapi.get_fundamental_data(asset.ticker)

        if not fundamental_data:
            # Se não conseguir dados, não gera alerta (pode ser problema temporário)
            return alerts

        # Verificar DY mínimo
        if "dividend_yield_min" in criteria:
            dy_min = criteria["dividend_yield_min"]
            dy_current = fundamental_data.get("dividend_yield")
            if dy_current and dy_current < dy_min:
                alerts.append({
                    "ticker": asset.ticker,
                    "type": "dividend_yield",
                    "message": f"DY atual ({dy_current:.2%}) está abaixo do mínimo ({dy_min:.2%})",
                    "current": dy_current,
                    "required": dy_min,
                })

        # Verificar P/L máximo
        if "pe_ratio_max" in criteria:
            pl_max = criteria["pe_ratio_max"]
            pl_current = fundamental_data.get("pe_ratio")
            if pl_current and pl_current > pl_max:
                alerts.append({
                    "ticker": asset.ticker,
                    "type": "pe_ratio",
                    "message": f"P/L atual ({pl_current:.2f}) está acima do máximo ({pl_max:.2f})",
                    "current": pl_current,
                    "required": pl_max,
                })

        # Verificar P/VP máximo
        if "price_to_book_max" in criteria:
            pvp_max = criteria["price_to_book_max"]
            pvp_current = fundamental_data.get("price_to_book")
            if pvp_current and pvp_current > pvp_max:
                alerts.append({
                    "ticker": asset.ticker,
                    "type": "price_to_book",
                    "message": f"P/VP atual ({pvp_current:.2f}) está acima do máximo ({pvp_max:.2f})",
                    "current": pvp_current,
                    "required": pvp_max,
                })

        return alerts

    def generate_investment_recommendation(
        self, portfolio: Portfolio, amount: Decimal, use_ai: bool = True
    ) -> Dict[str, Any]:
        """Gera recomendação de onde investir um valor seguindo a estratégia padrão.

        Args:
            portfolio: Carteira do usuário
            amount: Valor a ser investido
            use_ai: Se True, tenta usar OpenAI. Se False ou OpenAI indisponível, usa lógica determinística.

        Returns:
            Dicionário com recomendação estruturada
        """
        # Tentar usar OpenAI se disponível
        if use_ai and self.openai.is_available():
            try:
                return self._generate_with_openai(portfolio, amount)
            except Exception as e:
                # Se falhar, usar fallback determinístico
                print(f"Erro ao usar OpenAI, usando fallback: {e}")

        # Fallback: lógica determinística
        return self._generate_deterministic_recommendation(portfolio, amount)

    def _generate_with_openai(
        self, portfolio: Portfolio, amount: Decimal
    ) -> Dict[str, Any]:
        """Gera recomendação usando OpenAI."""
        # Obter estratégia
        strategy = getattr(portfolio, "strategy", None)
        strategy_text = strategy.raw_text if strategy else "Foco em dividendos acima de 8%"
        if strategy and strategy.parsed_rules:
            strategy_rules = strategy.parsed_rules
        else:
            strategy_rules = DEFAULT_PARSED_RULES

        # Preparar dados da carteira
        portfolio_data = {
            "total_value": float(portfolio.get_total_invested()),
            "assets": [
                {
                    "ticker": asset.ticker,
                    "quantity": float(asset.quantity),
                    "average_price": float(asset.average_price),
                    "total_invested": float(asset.get_total_invested()),
                }
                for asset in portfolio.assets.all()
            ],
        }

        # Buscar dados de mercado para todos os ativos (da carteira + candidatos)
        market_data = {}

        # 1. Ativos já na carteira
        for asset in portfolio.assets.all():
            quote = self.brapi.get_quote(asset.ticker)
            fundamental = self.brapi.get_fundamental_data(asset.ticker)
            dividend_history = self.brapi.get_dividend_history(
                asset.ticker, use_cache=True, workspace=portfolio.workspace
            )

            if quote or fundamental or dividend_history:
                market_data[asset.ticker] = {
                    "quote": {
                        "price": float(quote.get("price", asset.average_price)) if quote else float(asset.average_price),
                        "change_percent": float(quote.get("change_percent", 0)) if quote else 0,
                    } if quote else None,
                    "fundamental": {
                        "pe_ratio": fundamental.get("pe_ratio") if fundamental else None,
                        "price_to_book": fundamental.get("price_to_book") if fundamental else None,
                        "dividend_yield": float(fundamental.get("dividend_yield") or 0) if fundamental and fundamental.get("dividend_yield") is not None else None,
                    } if fundamental else None,
                    "dividend_history": dividend_history if dividend_history else None,
                }

        # 2. Novos candidatos de TARGET_ALLOCATION (não na carteira)
        portfolio_tickers = {asset.ticker for asset in portfolio.assets.all()}
        for sector, assets in TARGET_ALLOCATION.items():
            if isinstance(assets, dict):
                for ticker in assets.keys():
                    if ticker not in portfolio_tickers and ticker not in market_data:
                        # Buscar dados do novo candidato
                        quote = self.brapi.get_quote(ticker)
                        fundamental = self.brapi.get_fundamental_data(ticker)
                        dividend_history = self.brapi.get_dividend_history(
                            ticker, use_cache=True, workspace=portfolio.workspace
                        )

                        if quote or fundamental or dividend_history:
                            market_data[ticker] = {
                                "quote": {
                                    "price": float(quote.get("price", 0)) if quote else None,
                                    "change_percent": float(quote.get("change_percent", 0)) if quote else 0,
                                } if quote else None,
                                "fundamental": {
                                    "pe_ratio": fundamental.get("pe_ratio") if fundamental else None,
                                    "price_to_book": fundamental.get("price_to_book") if fundamental else None,
                                    "dividend_yield": float(fundamental.get("dividend_yield") or 0) if fundamental and fundamental.get("dividend_yield") is not None else None,
                                } if fundamental else None,
                                "dividend_history": dividend_history if dividend_history else None,
                            }

        # Chamar OpenAI
        ai_result = self.openai.generate_investment_recommendation(
            strategy_text=strategy_text,
            strategy_rules=strategy_rules,
            portfolio_data=portfolio_data,
            market_data=market_data,
            amount=amount,
            question="Onde devo investir este valor?",
        )

        # Se OpenAI retornou erro, usar fallback
        if ai_result.get("fallback") or ai_result.get("error"):
            return self._generate_deterministic_recommendation(portfolio, amount)

        # Validar e corrigir cálculos da resposta da OpenAI
        recommendation = ai_result.get("recommendation", {})
        allocations = recommendation.get("allocations", [])

        if allocations:
            # Recalcular total_amount baseado nas alocações reais
            total_allocated = Decimal("0")
            for allocation in allocations:
                quantity = Decimal(str(allocation.get("quantity", 0)))
                unit_price = Decimal(str(allocation.get("unit_price", 0)))
                actual_amount = quantity * unit_price
                allocation["amount"] = float(actual_amount)  # Corrigir amount se necessário
                total_allocated += actual_amount

            # Garantir que não exceda o aporte disponível
            if total_allocated > amount:
                # Reduzir proporcionalmente se exceder
                scale_factor = amount / total_allocated
                total_allocated = Decimal("0")
                valid_allocations = []

                for allocation in allocations:
                    original_amount = Decimal(str(allocation["amount"]))
                    scaled_amount = original_amount * scale_factor
                    # Ajustar quantidade para não exceder
                    unit_price = Decimal(str(allocation["unit_price"]))
                    new_quantity = int(scaled_amount / unit_price)
                    if new_quantity > 0:
                        actual_amount = unit_price * Decimal(str(new_quantity))
                        allocation["quantity"] = new_quantity
                        allocation["amount"] = float(actual_amount)
                        total_allocated += actual_amount
                        valid_allocations.append(allocation)

                allocations = valid_allocations

            # Atualizar valores na resposta
            recommendation["total_amount"] = float(total_allocated)
            recommendation["remaining_balance"] = float(amount - total_allocated)
            recommendation["allocations"] = allocations

        # Retornar resultado da OpenAI (validado e corrigido)
        return ai_result

    def _generate_deterministic_recommendation(
        self, portfolio: Portfolio, amount: Decimal
    ) -> Dict[str, Any]:
        """Gera recomendação usando lógica determinística (fallback)."""
        criteria = self._get_strategy_criteria(portfolio)
        strategy_type = criteria.get("strategy_type", "dividendos")
        dy_min = criteria.get("dividend_yield_min", 0.08)
        price_ceiling_multiplier = criteria.get("price_ceiling_multiplier", 0.08)

        # 1. Calcular valor total da carteira atual
        current_assets = portfolio.assets.all()
        portfolio_total_value = Decimal("0")
        asset_values = {}  # {ticker: (quantity, price, total_value)}

        for asset in current_assets:
            quote = self.brapi.get_quote(asset.ticker)
            if quote:
                price = quote.get("price", Decimal(str(asset.average_price)))
                quantity = Decimal(str(asset.quantity))
                total_value = price * quantity
                portfolio_total_value += total_value
                asset_values[asset.ticker] = {
                    "quantity": quantity,
                    "price": price,
                    "total_value": total_value,
                    "average_price": Decimal(str(asset.average_price)),
                }

        # 2. Calcular alocação percentual atual de cada ativo
        current_allocations = {}
        for ticker, data in asset_values.items():
            if portfolio_total_value > 0:
                current_allocations[ticker] = float(
                    (data["total_value"] / portfolio_total_value) * 100
                )
            else:
                current_allocations[ticker] = 0.0

        # 3. Buscar candidatos elegíveis (preço ≤ preço-teto e abaixo da alocação-alvo)
        eligible_assets = []
        remaining_amount = amount
        debug_info = []  # Para logging

        # Coletar todos os tickers candidatos (da carteira + TARGET_ALLOCATION)
        candidate_tickers = set(asset_values.keys())  # Ativos já na carteira

        # Adicionar todos os tickers de TARGET_ALLOCATION que não estão na carteira
        for sector, assets in TARGET_ALLOCATION.items():
            if isinstance(assets, dict):
                for ticker in assets.keys():
                    candidate_tickers.add(ticker)

        debug_info.append(f"Total de candidatos: {len(candidate_tickers)}")

        # Verificar todos os candidatos (da carteira e novos)
        for ticker in candidate_tickers:
            # Se já está na carteira, usar dados existentes
            if ticker in asset_values:
                data = asset_values[ticker]
                current_price = data["price"]
                current_allocation = current_allocations.get(ticker, 0.0)
            else:
                # Novo ativo: buscar cotação atual
                quote = self.brapi.get_quote(ticker)
                if not quote:
                    continue
                current_price = quote.get("price")
                if not current_price or current_price <= 0:
                    continue
                current_price = Decimal(str(current_price))
                # Para novos ativos, alocação atual é 0
                current_allocation = 0.0

            # Buscar dados fundamentalistas
            fundamental_data = self.brapi.get_fundamental_data(ticker)
            if not fundamental_data:
                debug_info.append(f"{ticker}: Sem dados fundamentalistas")
                continue

            # Tentar usar histórico de dividendos para cálculo mais preciso
            dividend_history = self.brapi.get_dividend_history(
                ticker, use_cache=True, workspace=portfolio.workspace
            )

            price_ceiling = None
            effective_dy = None

            # Priorizar média histórica de dividendos se disponível
            if dividend_history and dividend_history.get("average_monthly"):
                # Calcular dividendo anual baseado na média mensal
                annual_dividend = Decimal(str(dividend_history["average_monthly"])) * Decimal("12")
                # Preço-teto = dividendo anual / multiplicador
                if annual_dividend > 0 and price_ceiling_multiplier > 0:
                    price_ceiling = annual_dividend / Decimal(str(price_ceiling_multiplier))
                    # Validar DY mínimo usando histórico
                    dy_from_history = annual_dividend / current_price if current_price > 0 else Decimal("0")
                    if dy_from_history < dy_min:
                        debug_info.append(f"{ticker}: DY histórico {float(dy_from_history)*100:.2f}% < mínimo {dy_min*100:.2f}%")
                        continue
                    effective_dy = float(dy_from_history)
            else:
                # Fallback: usar DY atual
                dividend_yield = fundamental_data.get("dividend_yield")
                if not dividend_yield or dividend_yield < dy_min:
                    debug_info.append(f"{ticker}: DY atual {dividend_yield*100 if dividend_yield else 0:.2f}% < mínimo {dy_min*100:.2f}%")
                    continue
                effective_dy = dividend_yield
                # Preço-teto = (preço * DY) / multiplicador
                # Adicionar margem de tolerância de 10% para não ser muito restritivo (aumentado de 5% para 10%)
                price_ceiling = current_price * Decimal(str(dividend_yield)) / Decimal(str(price_ceiling_multiplier))
                # Aplicar margem de tolerância: permitir até 10% acima do teto
                price_ceiling = price_ceiling * Decimal("1.10")

            if not price_ceiling or price_ceiling <= 0:
                continue

            # Verificar se está abaixo do preço-teto (com margem de tolerância já aplicada)
            if current_price > price_ceiling:
                debug_info.append(f"{ticker}: Preço R${float(current_price):.2f} > teto R${float(price_ceiling):.2f}")
                continue

            # Verificar alocação-alvo
            target_allocation = self._get_target_allocation(ticker)

            if current_allocation >= target_allocation:
                debug_info.append(f"{ticker}: Alocação {current_allocation:.2f}% >= alvo {target_allocation:.2f}%")
                continue

            # Ativo elegível!
            debug_info.append(f"{ticker}: ✅ ELEGÍVEL - Preço R${float(current_price):.2f}, Teto R${float(price_ceiling):.2f}, DY {effective_dy*100:.2f}%, Alocação {current_allocation:.2f}% < {target_allocation:.2f}%")

            if current_allocation < target_allocation:
                # effective_dy já foi calculado acima
                eligible_assets.append({
                    "ticker": ticker,
                    "current_price": float(current_price),
                    "price_ceiling": float(price_ceiling),
                    "current_allocation": current_allocation,
                    "target_allocation": target_allocation,
                    "allocation_gap": target_allocation - current_allocation,
                    "dividend_yield": effective_dy or 0,
                    "regularity_score": dividend_history.get("regularity_score") if dividend_history else None,
                })

        # 4. Ordenar por gap de alocação (maior gap primeiro)
        eligible_assets.sort(key=lambda x: x["allocation_gap"], reverse=True)

        # Log de debug (apenas se não houver elegíveis)
        if not eligible_assets:
            print(f"[DEBUG] Nenhum ativo elegível encontrado. Candidatos verificados: {len(candidate_tickers)}")
            for info in debug_info[:20]:  # Limitar a 20 para não poluir
                print(f"[DEBUG] {info}")

        # 5. Distribuir aporte proporcionalmente
        recommendations = []
        total_allocated = Decimal("0")

        for asset in eligible_assets:
            if remaining_amount <= 0:
                break

            # Calcular quanto alocar baseado no gap
            gap_percentage = asset["allocation_gap"] / sum(
                a["allocation_gap"] for a in eligible_assets
            )
            allocation_amount = amount * Decimal(str(gap_percentage))
            allocation_amount = min(allocation_amount, remaining_amount)

            # Calcular quantidade de ações (inteiras)
            price = Decimal(str(asset["current_price"]))
            quantity = int(allocation_amount / price)

            if quantity > 0:
                total_cost = price * Decimal(str(quantity))
                if total_cost <= remaining_amount:
                    recommendations.append({
                        "ticker": asset["ticker"],
                        "quantity": quantity,
                        "unit_price": float(price),
                        "amount": float(total_cost),
                        "reason": f"Alocação atual {asset['current_allocation']:.1f}% abaixo do alvo {asset['target_allocation']:.1f}%",
                    })
                    total_allocated += total_cost
                    remaining_amount -= total_cost

        # 6. Formatar resposta (já incluímos novos ativos candidatos acima)
        if not recommendations:
            # Se não há recomendações mas há ativos elegíveis, tentar modo flexível
            if eligible_assets:
                # Há ativos elegíveis mas não foram alocados (pode ser problema de distribuição)
                # Tentar alocar pelo menos 1 ação de cada elegível
                flexible_recommendations = []
                remaining = amount

                for asset in eligible_assets[:5]:  # Limitar a 5 ativos
                    if remaining <= 0:
                        break
                    price = Decimal(str(asset["current_price"]))
                    # Comprar pelo menos 1 ação se possível
                    if price <= remaining:
                        quantity = 1
                        total_cost = price * Decimal(str(quantity))
                        flexible_recommendations.append({
                            "ticker": asset["ticker"],
                            "quantity": quantity,
                            "unit_price": float(price),
                            "amount": float(total_cost),
                            "reason": f"Alocação atual {asset['current_allocation']:.1f}% abaixo do alvo {asset['target_allocation']:.1f}%",
                        })
                        remaining -= total_cost

                if flexible_recommendations:
                    total_allocated = sum(Decimal(str(r["amount"])) for r in flexible_recommendations)
                    return {
                        "recommendation": {
                            "total_amount": float(total_allocated),
                            "allocations": flexible_recommendations,
                            "remaining_balance": float(remaining),
                            "strategy_type": strategy_type,
                            "reasoning": f"Recomendação flexível: {len(flexible_recommendations)} ativo(s) elegível(eis) encontrado(s).",
                        },
                    }

            return {
                "recommendation": {
                    "total_amount": 0.0,
                    "allocations": [],
                    "remaining_balance": float(amount),
                    "message": "🔴 Nenhuma ação recomendada para compra agora. Aguarde recuo ou mantenha em caixa.",
                    "reasoning": f"Nenhuma ação atende aos critérios de preço-teto e alocação máxima com dividend yield acima de {dy_min*100:.1f}%.",
                },
            }

        return {
            "recommendation": {
                "total_amount": float(total_allocated),
                "allocations": recommendations,
                "remaining_balance": float(remaining_amount),
                "strategy_type": strategy_type,
                "reasoning": self._generate_reasoning(strategy_type, criteria),
            },
        }

    def _get_target_allocation(self, ticker: str) -> float:
        """Obtém alocação-alvo para um ticker."""
        # Buscar em todos os setores
        for sector, assets in TARGET_ALLOCATION.items():
            if isinstance(assets, dict) and ticker in assets:
                return assets[ticker]
        # Se não encontrado, usar máximo por ativo
        return TARGET_ALLOCATION.get("max_per_asset", 20.0)

    def _asset_passes_criteria(
        self, fundamental_data: Dict[str, Any], criteria: Dict[str, Any]
    ) -> bool:
        """Verifica se um ativo passa nos critérios."""
        # DY mínimo
        if "dividend_yield_min" in criteria:
            dy = fundamental_data.get("dividend_yield")
            if not dy or dy < criteria["dividend_yield_min"]:
                return False

        # P/L máximo
        if "pe_ratio_max" in criteria:
            pl = fundamental_data.get("pe_ratio")
            if pl and pl > criteria["pe_ratio_max"]:
                return False

        # P/VP máximo
        if "price_to_book_max" in criteria:
            pvp = fundamental_data.get("price_to_book")
            if pvp and pvp > criteria["price_to_book_max"]:
                return False

        return True

    def _generate_reasoning(
        self, strategy_type: str, criteria: Dict[str, Any]
    ) -> str:
        """Gera texto de justificativa da recomendação."""
        if strategy_type == "dividendos":
            dy_min = criteria.get("dividend_yield_min", 0)
            return f"Foco em dividendos com DY mínimo de {dy_min:.2%}. Recomendações priorizam ativos com histórico de distribuição consistente."
        elif strategy_type == "value":
            return "Foco em value investing. Recomendações priorizam ativos com P/L e P/VP baixos, indicando potencial de valorização."
        elif strategy_type == "growth":
            return "Foco em crescimento. Recomendações priorizam empresas com potencial de expansão de receita e lucro."
        else:
            return "Estratégia híbrida balanceando dividendos, valor e crescimento conforme seus critérios definidos."

