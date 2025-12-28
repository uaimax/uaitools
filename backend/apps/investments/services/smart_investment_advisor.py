"""Gerador de recomendações inteligentes de investimento."""

from decimal import Decimal
from typing import Any, Dict, List, Optional

from apps.investments.models import (
    Asset,
    Portfolio,
    StrategyTemplate,
    UserPreferences,
)
from apps.investments.services.market_data_provider import MarketDataProvider
from apps.investments.services.context_analyzer import ContextAnalyzer
from apps.investments.services.openai_service import OpenAIService
from apps.investments.services.sector_mapper import SectorMapper


class SmartInvestmentAdvisor:
    """Gerador de recomendações inteligentes."""

    def __init__(self) -> None:
        """Inicializa o advisor."""
        self.brapi = MarketDataProvider()
        self.context_analyzer = ContextAnalyzer()
        self.openai = OpenAIService()
        self.sector_mapper = SectorMapper()

    def generate_recommendation(
        self,
        portfolio: Portfolio,
        amount: Decimal,
        user_preference: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Gera recomendação inteligente baseada em contexto.

        Args:
            portfolio: Carteira do usuário
            amount: Valor a ser investido
            user_preference: Preferência do usuário (ex: "mais conservador", "mais agressivo")

        Returns:
            Dicionário com recomendação completa
        """
        # Armazenar portfolio para uso em métodos auxiliares
        self.portfolio = portfolio

        # 1. Analisa contexto completo
        context = self.context_analyzer.analyze_user_context(portfolio)

        # 2. Seleciona e adapta estratégia
        strategy = self._select_and_adapt_strategy(context, user_preference)

        # 3. Busca dados de mercado atualizados (candidatos)
        market_data = self._get_market_data_for_candidates(portfolio, strategy)

        # 4. Gera alocações dinamicamente usando IA
        allocations, allocation_debug = self._generate_dynamic_allocations(
            context,
            strategy,
            market_data,
            amount,
        )

        # 5. Valida e ajusta
        allocations = self._validate_and_adjust(
            allocations,
            context,
            market_data,
            amount,
        )

        # 6. Extrai reasoning da resposta da IA (se disponível)
        reasoning = self._extract_reasoning_from_ai_result(allocations, strategy, amount, allocation_debug)

        # 7. Preparar detalhes de debug para resposta
        debug_details = {
            "market_data_available": len(market_data),
            "allocation_debug": allocation_debug,
            "candidates_checked": list(market_data.keys()),
            "strategy_criteria": strategy.get("adapted_criteria", {}),
        }

        # 7. Calcula saldo restante
        total_allocated = sum(a.get("amount", 0) for a in allocations)
        remaining_balance = float(amount) - total_allocated

        return {
            "recommendation": {
                "total_amount": float(amount),
                "allocations": allocations,
                "remaining_balance": remaining_balance,
                "reasoning": reasoning,
            },
            "strategy_used": strategy,
            "context_analyzed": {
                "profile": context.get("profile"),
                "market_context": context.get("market_context"),
            },
            "debug_details": debug_details,
        }

    def _select_and_adapt_strategy(
        self,
        context: Dict[str, Any],
        user_preference: Optional[str],
    ) -> Dict[str, Any]:
        """Seleciona e adapta estratégia baseado em contexto.

        Returns:
            Dicionário com estratégia selecionada e adaptada
        """
        recommended_strategy = context.get("recommended_strategy")
        if not recommended_strategy:
            # Fallback: usar primeira estratégia disponível
            template = StrategyTemplate.objects.filter(is_active=True).first()
            if template:
                recommended_strategy = {
                    "id": template.id,
                    "name": template.name,
                    "slug": template.slug,
                    "category": template.category,
                    "performance_score": float(template.performance_score),
                }

        if not recommended_strategy:
            return None

        # Buscar template completo
        try:
            template = StrategyTemplate.objects.get(id=recommended_strategy["id"])
        except StrategyTemplate.DoesNotExist:
            return recommended_strategy

        # Adaptar critérios baseado em contexto e preferência do usuário
        adapted_criteria = template.base_criteria.copy()

        # Ajustes baseados em preferência do usuário
        if user_preference:
            if "conservador" in user_preference.lower():
                # Reduzir DY mínimo, aumentar diversificação
                if "dividend_yield_min" in adapted_criteria:
                    adapted_criteria["dividend_yield_min"] = max(0.05, adapted_criteria["dividend_yield_min"] - 0.01)
                if "min_diversification" in adapted_criteria:
                    adapted_criteria["min_diversification"] = min(0.85, adapted_criteria["min_diversification"] + 0.1)
            elif "agressivo" in user_preference.lower():
                # Aumentar DY mínimo, reduzir diversificação
                if "dividend_yield_min" in adapted_criteria:
                    adapted_criteria["dividend_yield_min"] = min(0.12, adapted_criteria["dividend_yield_min"] + 0.01)
                if "min_diversification" in adapted_criteria:
                    adapted_criteria["min_diversification"] = max(0.60, adapted_criteria["min_diversification"] - 0.1)

        # Ajustes baseados em contexto de mercado
        market_context = context.get("market_context", {})
        selic = market_context.get("selic")
        if selic and selic < 0.10:  # Selic < 10%
            # Reduzir DY mínimo em 1pp
            if "dividend_yield_min" in adapted_criteria:
                adapted_criteria["dividend_yield_min"] = max(0.05, adapted_criteria["dividend_yield_min"] - 0.01)

        return {
            **recommended_strategy,
            "adapted_criteria": adapted_criteria,
            "base_criteria": template.base_criteria,
            "adaptation_logic": template.adaptation_logic,
        }

    def _get_market_data_for_candidates(
        self,
        portfolio: Portfolio,
        strategy: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Busca dados de mercado para candidatos elegíveis.

        Returns:
            Dicionário com dados de mercado de candidatos
        """
        market_data = {}

        # Por enquanto, buscar apenas ativos já na carteira
        # Futuramente, buscar todos os ativos disponíveis na B3 que atendem critérios
        for asset in portfolio.assets.all():
            quote = self.brapi.get_quote(asset.ticker)
            fundamental = self.brapi.get_fundamental_data(asset.ticker)

            if quote and fundamental:
                market_data[asset.ticker] = {
                    "quote": quote,
                    "fundamental": fundamental,
                }

        return market_data

    def _generate_dynamic_allocations(
        self,
        context: Dict[str, Any],
        strategy: Dict[str, Any],
        market_data: Dict[str, Any],
        amount: Decimal,
    ) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Gera alocações dinamicamente usando IA proativa.

        Returns:
            Tupla (lista de alocações, detalhes de debug)
        """
        debug_info = {
            "ai_called": False,
            "ai_available": False,
            "candidates_analyzed": 0,
            "candidates_filtered": 0,
            "candidates_passed": 0,
            "rejection_reasons": {},
            "ai_response": None,
            "fallback_used": False,
        }

        if not strategy:
            debug_info["rejection_reasons"]["no_strategy"] = "Nenhuma estratégia selecionada"
            return [], debug_info

        # Buscar candidatos que atendem aos critérios básicos
        criteria = strategy.get("adapted_criteria", {})
        candidates_market_data, filter_debug = self._prepare_candidates_market_data(
            criteria, market_data, return_debug=True
        )

        debug_info.update(filter_debug)
        debug_info["candidates_passed"] = len(candidates_market_data)

        # Se não há candidatos que passaram nos filtros básicos, ainda podemos tentar a IA
        # com todos os dados disponíveis (ela pode ser mais flexível nos critérios)
        if not candidates_market_data:
            debug_info["rejection_reasons"]["no_candidates"] = "Nenhum candidato passou nos filtros básicos"
            # Mas ainda tentar IA se disponível (com todos os dados de mercado)
            if self.openai.is_available() and market_data:
                debug_info["ai_called"] = True
                debug_info["ai_available"] = True
                debug_info["using_all_market_data"] = True  # Flag para indicar que usamos todos os dados

                # Preparar preferências do usuário
                preferences = self._get_user_preferences(self.portfolio if hasattr(self, 'portfolio') else None)
                user_preferences = None
                if preferences:
                    user_preferences = {
                        "excluded_sectors": preferences.excluded_sectors or [],
                        "preferred_sectors": preferences.preferred_sectors or [],
                        "additional_criteria": preferences.additional_criteria or "",
                        "restrictions": preferences.restrictions or {},
                    }

                # Chamar IA com TODOS os dados de mercado (mesmo sem passar filtros básicos)
                ai_result = self.openai.generate_investment_recommendation(
                    context=context,
                    strategy=strategy,
                    market_data=market_data,  # Usar todos os dados, não apenas os filtrados
                    amount=amount,
                    user_preferences=user_preferences,
                )

                debug_info["ai_response"] = {
                    "has_error": bool(ai_result.get("error")),
                    "has_fallback": bool(ai_result.get("fallback")),
                    "has_recommendation": bool(ai_result.get("recommendation")),
                    "allocations_count": len(ai_result.get("recommendation", {}).get("allocations", [])),
                    "error": ai_result.get("error"),
                }

                if ai_result and not ai_result.get("error") and not ai_result.get("fallback"):
                    recommendation = ai_result.get("recommendation", {})
                    allocations = recommendation.get("allocations", [])
                    if allocations:
                        debug_info["ai_success"] = True
                        return allocations, debug_info
                    else:
                        debug_info["rejection_reasons"]["ai_no_allocations"] = recommendation.get(
                            "message", "IA não retornou alocações mesmo com todos os dados"
                        )

            return [], debug_info

        # Usar IA para gerar alocações dinamicamente
        debug_info["ai_available"] = self.openai.is_available()

        # Se não há candidatos que passaram nos filtros básicos, ainda assim podemos tentar a IA
        # com os dados disponíveis (ela pode ser mais flexível)
        if self.openai.is_available() and candidates_market_data:
            debug_info["ai_called"] = True

            # Preparar preferências do usuário
            preferences = self._get_user_preferences(self.portfolio if hasattr(self, 'portfolio') else None)
            user_preferences = None
            if preferences:
                user_preferences = {
                    "excluded_sectors": preferences.excluded_sectors or [],
                    "preferred_sectors": preferences.preferred_sectors or [],
                    "additional_criteria": preferences.additional_criteria or "",
                    "restrictions": preferences.restrictions or {},
                }

            # Chamar IA para gerar recomendações
            ai_result = self.openai.generate_investment_recommendation(
                context=context,
                strategy=strategy,
                market_data=candidates_market_data,
                amount=amount,
                user_preferences=user_preferences,
            )

            debug_info["ai_response"] = {
                "has_error": bool(ai_result.get("error")),
                "has_fallback": bool(ai_result.get("fallback")),
                "has_recommendation": bool(ai_result.get("recommendation")),
                "allocations_count": len(ai_result.get("recommendation", {}).get("allocations", [])),
                "error": ai_result.get("error"),
            }

            if ai_result and not ai_result.get("error") and not ai_result.get("fallback"):
                recommendation = ai_result.get("recommendation", {})
                allocations = recommendation.get("allocations", [])
                if allocations:
                    debug_info["ai_success"] = True
                    return allocations, debug_info
                else:
                    debug_info["rejection_reasons"]["ai_no_allocations"] = recommendation.get(
                        "message", "IA não retornou alocações"
                    )

        # Fallback: lógica simples se IA não disponível
        debug_info["fallback_used"] = True
        allocations = self._generate_simple_allocations(criteria, candidates_market_data, amount, context)
        if not allocations:
            debug_info["rejection_reasons"]["fallback_no_allocations"] = "Fallback também não gerou alocações"

        return allocations, debug_info

    def _prepare_candidates_market_data(
        self,
        criteria: Dict[str, Any],
        market_data: Dict[str, Any],
        return_debug: bool = False,
    ) -> Dict[str, Any] | tuple[Dict[str, Any], Dict[str, Any]]:
        """Prepara dados de mercado apenas para candidatos que atendem critérios básicos.

        Returns:
            Dicionário com dados de mercado filtrados (e debug se return_debug=True)
        """
        filtered = {}
        debug_info = {
            "candidates_analyzed": len(market_data),
            "rejection_details": {},
            "criteria_used": {
                "dy_min": criteria.get("dividend_yield_min", 0),
                "dy_max": criteria.get("dividend_yield_max", 1.0),
                "pe_max": criteria.get("pe_ratio_max", 999),
                "pb_max": criteria.get("price_to_book_max", 999),
                "allowed_sectors": criteria.get("allowed_sectors", []),
                "excluded_sectors": criteria.get("excluded_sectors", []),
            },
        }

        for ticker, data in market_data.items():
            quote = data.get("quote", {})
            fundamental = data.get("fundamental", {})
            rejection_reasons = []

            if not quote or not fundamental:
                rejection_reasons.append("Dados incompletos (sem quote ou fundamental)")
                debug_info["rejection_details"][ticker] = rejection_reasons
                continue

            price = quote.get("price", 0)
            if not price or price <= 0:
                rejection_reasons.append(f"Preço inválido: {price}")
                debug_info["rejection_details"][ticker] = rejection_reasons
                continue

            dy = fundamental.get("dividend_yield") if fundamental else None
            pe_ratio = fundamental.get("pe_ratio") if fundamental else None
            pb_ratio = fundamental.get("price_to_book") if fundamental else None

            # Verificar critérios básicos
            dy_min = criteria.get("dividend_yield_min", 0)
            dy_max = criteria.get("dividend_yield_max", 1.0)
            pe_max = criteria.get("pe_ratio_max", 999)
            pb_max = criteria.get("price_to_book_max", 999)

            # Verificar setores
            sector = self.sector_mapper.get_sector(ticker)
            allowed_sectors = criteria.get("allowed_sectors", [])
            excluded_sectors = criteria.get("excluded_sectors", [])

            if sector:
                if allowed_sectors and not self.sector_mapper.is_sector_allowed(sector, allowed_sectors):
                    rejection_reasons.append(f"Setor '{sector}' não está em allowed_sectors")
                if excluded_sectors and self.sector_mapper.is_sector_excluded(sector, excluded_sectors):
                    rejection_reasons.append(f"Setor '{sector}' está em excluded_sectors")
            else:
                rejection_reasons.append("Setor não mapeado")

            # Verificar critérios numéricos
            if dy is None:
                rejection_reasons.append("DY não disponível")
            elif dy < dy_min:
                rejection_reasons.append(f"DY {dy*100:.2f}% < mínimo {dy_min*100:.2f}%")
            elif dy > dy_max:
                rejection_reasons.append(f"DY {dy*100:.2f}% > máximo {dy_max*100:.2f}%")

            if pe_ratio is not None and pe_ratio > pe_max:
                rejection_reasons.append(f"P/L {pe_ratio:.2f} > máximo {pe_max:.2f}")

            if pb_ratio is not None and pb_ratio > pb_max:
                rejection_reasons.append(f"P/VP {pb_ratio:.2f} > máximo {pb_max:.2f}")

            if rejection_reasons:
                debug_info["rejection_details"][ticker] = {
                    "reasons": rejection_reasons,
                    "metrics": {
                        "dy": float(dy) if dy is not None else None,
                        "pe_ratio": float(pe_ratio) if pe_ratio is not None else None,
                        "pb_ratio": float(pb_ratio) if pb_ratio is not None else None,
                        "sector": sector,
                        "price": float(price),
                    },
                }
                continue

            # Passou nos filtros básicos, incluir
            filtered[ticker] = data

        debug_info["candidates_filtered"] = len(filtered)

        if return_debug:
            return filtered, debug_info
        return filtered

    def _generate_simple_allocations(
        self,
        criteria: Dict[str, Any],
        market_data: Dict[str, Any],
        amount: Decimal,
        context: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Gera alocações simples (fallback quando IA não disponível).

        Returns:
            Lista de alocações
        """
        allocations = []
        remaining = float(amount)
        max_concentration = criteria.get("max_concentration_per_asset", 0.15)
        max_allocation_value = float(amount) * max_concentration

        # Ordenar por DY (maior primeiro)
        candidates = []
        for ticker, data in market_data.items():
            quote = data.get("quote", {})
            fundamental = data.get("fundamental", {})
            if quote and fundamental:
                dy = fundamental.get("dividend_yield", 0)
                price = quote.get("price", 0)
                if price > 0:
                    candidates.append({
                        "ticker": ticker,
                        "price": price,
                        "dividend_yield": dy,
                    })

        candidates.sort(key=lambda x: x["dividend_yield"], reverse=True)

        for candidate in candidates:
            if remaining <= 0:
                break

            allocation_amount = min(remaining, max_allocation_value)
            quantity = int(allocation_amount / candidate["price"])

            if quantity > 0:
                actual_amount = quantity * candidate["price"]
                allocations.append({
                    "ticker": candidate["ticker"],
                    "quantity": quantity,
                    "unit_price": float(candidate["price"]),
                    "amount": actual_amount,
                    "reason": f"DY {candidate['dividend_yield']*100:.1f}%, oportunidade de valor",
                })
                remaining -= actual_amount

        return allocations

    def _find_candidates(
        self,
        criteria: Dict[str, Any],
        market_data: Dict[str, Any],
    ) -> List[Dict[str, Any]]:
        """Encontra candidatos que atendem aos critérios.

        Returns:
            Lista de candidatos
        """
        candidates = []

        # Por enquanto, usar apenas ativos já na carteira
        # Futuramente, buscar todos os ativos disponíveis na B3

        for ticker, data in market_data.items():
            quote = data.get("quote")
            fundamental = data.get("fundamental")

            if not quote or not fundamental:
                continue

            price = quote.get("price", 0)
            if not price or price <= 0:
                continue

            dy = fundamental.get("dividend_yield") if fundamental else None
            pe_ratio = fundamental.get("pe_ratio") if fundamental else None
            pb_ratio = fundamental.get("price_to_book") if fundamental else None

            # Verificar critérios
            dy_min = criteria.get("dividend_yield_min", 0)
            dy_max = criteria.get("dividend_yield_max", 1.0)
            pe_max = criteria.get("pe_ratio_max", 999)
            pb_max = criteria.get("price_to_book_max", 999)

            # Verificar setores
            sector = self.sector_mapper.get_sector(ticker)
            allowed_sectors = criteria.get("allowed_sectors", [])
            excluded_sectors = criteria.get("excluded_sectors", [])

            if sector:
                if allowed_sectors and not self.sector_mapper.is_sector_allowed(sector, allowed_sectors):
                    continue
                if excluded_sectors and self.sector_mapper.is_sector_excluded(sector, excluded_sectors):
                    continue

            # Verificar critérios numéricos
            if dy is None or dy < dy_min or dy > dy_max:
                continue
            if pe_ratio is not None and pe_ratio > pe_max:
                continue
            if pb_ratio is not None and pb_ratio > pb_max:
                continue

            # Calcular preço-teto (se aplicável)
            price_ceiling = None
            if dy and dy > 0:
                # Preço-teto = dividendo / DY mínimo
                dividend_per_share = price * dy
                price_ceiling = dividend_per_share / dy_min if dy_min > 0 else None

            if price_ceiling and price > price_ceiling:
                continue

            candidates.append({
                "ticker": ticker,
                "price": float(price),
                "dividend_yield": float(dy) if dy else 0.0,
                "pe_ratio": pe_ratio if pe_ratio else 999,
                "price_to_book": pb_ratio if pb_ratio else 999,
                "sector": sector or "desconhecido",
                "target_allocation": 0.10,  # Padrão, pode ser ajustado
                "reason": f"DY {dy*100:.1f}%, P/L {pe_ratio:.1f}, setor {sector}" if dy and pe_ratio and sector else f"Ticker {ticker}",
            })

        return candidates

    def _get_user_preferences(self, portfolio: Portfolio) -> Optional[UserPreferences]:
        """Obtém preferências do usuário.

        Returns:
            UserPreferences ou None
        """
        try:
            return portfolio.preferences
        except UserPreferences.DoesNotExist:
            return None

    def _apply_user_preferences(
        self,
        allocations: List[Dict[str, Any]],
        preferences: UserPreferences,
    ) -> List[Dict[str, Any]]:
        """Aplica preferências do usuário nas alocações.

        Returns:
            Lista de alocações filtrada
        """
        filtered = []

        excluded_sectors = preferences.excluded_sectors or []
        excluded_tickers = preferences.restrictions.get("excluded_tickers", []) if preferences.restrictions else []

        for allocation in allocations:
            ticker = allocation["ticker"]

            # Verificar tickers excluídos
            if ticker in excluded_tickers:
                continue

            # Verificar setores excluídos
            sector = self.sector_mapper.get_sector(ticker)
            if sector and excluded_sectors:
                if self.sector_mapper.is_sector_excluded(sector, excluded_sectors):
                    continue

            filtered.append(allocation)

        return filtered

    def _validate_and_adjust(
        self,
        allocations: List[Dict[str, Any]],
        context: Dict[str, Any],
        market_data: Dict[str, Any],
        amount: Decimal,
    ) -> List[Dict[str, Any]]:
        """Valida e ajusta alocações.

        Returns:
            Lista de alocações validada
        """
        # Por enquanto, retornar como está
        # Futuramente, adicionar validações mais complexas
        return allocations

    def _extract_reasoning_from_ai_result(
        self,
        allocations: List[Dict[str, Any]],
        strategy: Dict[str, Any],
        amount: Decimal,
        debug_info: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Extrai reasoning das alocações geradas com detalhes de debug.

        Returns:
            Justificativa em texto detalhada
        """
        if allocations:
            reasons = [a.get("reason", "") for a in allocations if a.get("reason")]
            if reasons:
                return " | ".join(reasons)
            return f"Recomendação baseada na estratégia '{strategy.get('name', '')}' com foco em {strategy.get('category', '')}."

        # Construir reasoning detalhado quando não há alocações
        reasoning_parts = ["Nenhuma ação recomendada no momento."]

        if debug_info:
            if debug_info.get("ai_called"):
                reasoning_parts.append("IA foi consultada e analisou os candidatos disponíveis.")
            else:
                reasoning_parts.append("IA não foi consultada (não disponível ou erro).")

            if debug_info.get("candidates_analyzed", 0) > 0:
                reasoning_parts.append(
                    f"Analisados {debug_info.get('candidates_analyzed', 0)} candidato(s)."
                )

            if debug_info.get("candidates_passed", 0) == 0:
                reasoning_parts.append("Nenhum candidato passou nos filtros da estratégia.")
                if debug_info.get("rejection_details"):
                    reasons_list = []
                    for ticker, details in list(debug_info.get("rejection_details", {}).items())[:3]:
                        if isinstance(details, dict) and "reasons" in details:
                            reasons_list.append(f"{ticker}: {', '.join(details['reasons'][:2])}")
                    if reasons_list:
                        reasoning_parts.append(f"Motivos: {'; '.join(reasons_list)}")
            else:
                reasoning_parts.append(
                    f"{debug_info.get('candidates_passed', 0)} candidato(s) passaram nos filtros, mas a IA não recomendou alocações."
                )

            if debug_info.get("rejection_reasons"):
                for key, value in debug_info.get("rejection_reasons", {}).items():
                    if key != "no_strategy":
                        reasoning_parts.append(f"{key}: {value}")

        reasoning_parts.append("Aguarde melhores oportunidades de mercado ou ajuste os critérios da estratégia.")

        return " ".join(reasoning_parts)

