"""Serviço para integração com OpenAI para recomendações de investimento."""

import os
import json
from typing import Any, Dict, Optional
from decimal import Decimal

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


class OpenAIService:
    """Serviço para gerar recomendações de investimento usando OpenAI."""

    def __init__(self) -> None:
        """Inicializa o serviço OpenAI."""
        self.api_key = os.getenv("OPENAI_KEY") or os.getenv("OPENAI_API_KEY")
        if OPENAI_AVAILABLE and self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def is_available(self) -> bool:
        """Verifica se o serviço está disponível."""
        return OPENAI_AVAILABLE and self.client is not None

    def generate_investment_recommendation(
        self,
        context: Dict[str, Any],
        strategy: Dict[str, Any],
        market_data: Dict[str, Any],
        amount: Decimal,
        user_preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Gera recomendação de investimento usando OpenAI (modo proativo).

        Args:
            context: Contexto completo analisado (profile, portfolio_health, market_context)
            strategy: Estratégia selecionada e adaptada (com adapted_criteria)
            market_data: Dados de mercado (cotações, fundamentalistas) de candidatos
            amount: Valor a ser investido
            user_preferences: Preferências do usuário (excluded_sectors, etc.)

        Returns:
            Dicionário com recomendação estruturada
        """
        if not self.is_available():
            return {
                "error": "OpenAI não está disponível. Verifique OPENAI_KEY no .env",
                "fallback": True,
            }

        try:
            # Extrair informações do contexto
            profile = context.get("profile", {})
            portfolio_health = context.get("portfolio_health", {})
            market_context = context.get("market_context", {})
            current_allocations = {a["ticker"]: a["allocation_pct"] for a in portfolio_health.get("allocations", [])}

            # Estratégia adaptada
            strategy_name = strategy.get("name", "Estratégia Personalizada")
            strategy_category = strategy.get("category", "dividendos")
            adapted_criteria = strategy.get("adapted_criteria", {})
            base_criteria = strategy.get("base_criteria", {})

            # Construir lista de candidatos elegíveis
            candidates = []
            for ticker, data in market_data.items():
                quote = data.get("quote", {})
                fundamental = data.get("fundamental", {})

                if not quote or not quote.get("price"):
                    continue

                price = quote.get("price", 0)
                if not price or price <= 0:
                    continue

                dy = fundamental.get("dividend_yield") if fundamental else None
                pe_ratio = fundamental.get("pe_ratio") if fundamental else None
                pb_ratio = fundamental.get("price_to_book") if fundamental else None

                current_allocation = current_allocations.get(ticker, 0)

                candidates.append({
                    "ticker": ticker,
                    "price": float(price) if price else 0.0,
                    "dividend_yield": float(dy) if dy is not None and dy != 0 else None,
                    "pe_ratio": float(pe_ratio) if pe_ratio is not None and pe_ratio != 0 else None,
                    "price_to_book": float(pb_ratio) if pb_ratio is not None and pb_ratio != 0 else None,
                    "current_allocation_pct": float(current_allocation) if current_allocation else 0.0,
                })

            # Prompt proativo - IA como cérebro autônomo
            system_prompt = """Você é um assessor de investimentos inteligente e proativo. Seu papel é analisar o contexto completo do investidor (carteira, perfil, mercado) e gerar recomendações de alocação dinâmica baseadas em oportunidades reais de mercado, sem depender de alocações-alvo fixas.

🎯 PRINCÍPIO FUNDAMENTAL:
Você NÃO usa alocações-alvo fixas. Em vez disso, você:
1. Analisa oportunidades de mercado ATUAIS
2. Considera a carteira existente e diversificação
3. Gera alocações dinamicamente baseadas em:
   - Oportunidades de valor (preço justo, DY atrativo)
   - Necessidade de diversificação
   - Critérios da estratégia adaptada
   - Preferências do usuário

🧠 PROCESSO DE DECISÃO:
1. Analise os candidatos disponíveis e seus dados de mercado
2. Identifique oportunidades de valor (DY atrativo, P/L razoável, preço justo)
3. Considere a diversificação atual da carteira
4. Respeite os critérios da estratégia (DY mínimo, setores permitidos, etc.)
5. Respeite as preferências do usuário (setores excluídos, etc.)
6. Distribua o capital de forma inteligente, priorizando:
   - Maior oportunidade de valor
   - Melhor diversificação
   - Respeito aos critérios estratégicos

📐 REGRAS DA ESTRATÉGIA:
Você receberá critérios adaptados da estratégia. Respeite-os, mas seja flexível:
- DY mínimo/máximo desejado (se disponível nos dados)
- P/L máximo aceitável (se disponível nos dados)
- Setores permitidos/excluídos
- Diversificação mínima
- Concentração máxima por ativo/setor

⚠️ IMPORTANTE: Se os dados fundamentais (DY, P/L, P/VP) não estiverem disponíveis para um candidato:
- Ainda assim considere o candidato se ele estiver em setores permitidos
- Use critérios alternativos: preço atual, setor, histórico conhecido
- Seja mais flexível com critérios numéricos quando dados não estão disponíveis
- Priorize diversificação e setores defensivos quando dados fundamentais estão ausentes

💡 LÓGICA DE ALOCAÇÃO DINÂMICA:
- NÃO distribua baseado em alocações-alvo fixas
- DISTRIBUJA baseado em:
  * Oportunidade de valor atual (DY, P/L, preço)
  * Necessidade de diversificação (evitar concentração excessiva)
  * Critérios da estratégia
  * Preferências do usuário

🧼 REGRAS DE OUTPUT:
- Use emojis: ✅ para compra, 🔴 para nenhuma ação, 💰 para saldo
- Seja objetivo e direto
- Explique o "porquê" de cada recomendação
- Se nenhuma ação atende critérios, retorne mensagem clara

---
💬 Exemplo de output ideal (quando há ações válidas):
✅ Compre 5 ações de BBDC4 por R$16,25 cada (R$81,25) - DY 8.2%, oportunidade de valor
✅ Compre 2 ações de BBSE3 por R$36,78 cada (R$73,56) - Diversificação em setor financeiro
💰 Saldo restante: R$45,19

---
💬 Exemplo de output ideal (quando nenhuma ação se enquadra):
🔴 Nenhuma ação recomendada para compra agora. Aguarde recuo ou mantenha em caixa.

---
Formato de resposta esperado (JSON):
{{
  "recommendation": {{
    "total_amount": 0.0,
    "allocations": [
      {{
        "ticker": "TAEE11",
        "quantity": 10,
        "unit_price": 35.50,
        "amount": 355.00,
        "reason": "DY 7.9% acima da média, setor defensivo, contrato regulado de 30 anos"
      }}
    ],
    "remaining_balance": 0.0,
    "reasoning": "Explicação geral da recomendação baseada em contexto completo",
    "message": "Mensagem opcional para o usuário"
  }}
}}"""

            # Construir prompt do usuário com contexto completo
            user_prompt = f"""Analise o contexto completo e gere recomendações de investimento dinâmicas:

---
👤 PERFIL DO INVESTIDOR:
{json.dumps(profile, indent=2, ensure_ascii=False)}

---
📦 SAÚDE DA CARTEIRA ATUAL:
- Valor total investido: R$ {portfolio_health.get('total_invested', 0):,.2f}
- Total de ativos: {portfolio_health.get('total_assets', 0)}
- Score de diversificação: {portfolio_health.get('diversification_score', 0):.2f} (0-1, quanto maior melhor)
- Risco de concentração: {portfolio_health.get('concentration_risk', 0):.2f} (0-1, quanto menor melhor)
- DY médio atual: {(portfolio_health.get('average_dividend_yield') or 0)*100:.2f}%

Alocações atuais:
{json.dumps(portfolio_health.get('allocations', []), indent=2, ensure_ascii=False)}

---
📊 CONTEXTO DE MERCADO:
- Selic: {(market_context.get('selic') or 0)*100:.2f}% ao ano
- IBOV: {market_context.get('ibov', {}).get('price', 0):,.0f} ({market_context.get('ibov', {}).get('change_percent', 0):.2f}%)

---
🎯 ESTRATÉGIA SELECIONADA:
**Nome:** {strategy_name}
**Categoria:** {strategy_category}
**Critérios Adaptados:**
{json.dumps(adapted_criteria, indent=2, ensure_ascii=False)}

---
📈 CANDIDATOS DISPONÍVEIS:
{json.dumps(candidates, indent=2, ensure_ascii=False)}

---
🚫 PREFERÊNCIAS DO USUÁRIO:
{json.dumps(user_preferences or {}, indent=2, ensure_ascii=False)}

---
💰 VALOR DISPONÍVEL PARA INVESTIR:
R$ {amount:,.2f}

---
🎯 SUA TAREFA:
Analise os candidatos disponíveis e gere alocações dinâmicas baseadas em:
1. Oportunidades de valor (DY, P/L, preço justo - quando disponíveis)
2. Necessidade de diversificação (evitar concentração excessiva)
3. Critérios da estratégia adaptada (seja flexível quando dados fundamentais não estão disponíveis)
4. Preferências do usuário

⚠️ FLEXIBILIDADE COM DADOS AUSENTES:
- Se DY não está disponível, use outros critérios (setor, preço, diversificação)
- Se P/L não está disponível, foque em setores defensivos e diversificação
- Priorize ativos em setores permitidos mesmo sem dados fundamentais completos
- Seja mais permissivo quando dados fundamentais estão ausentes, mas ainda aplique critérios de setor e diversificação

NÃO use alocações-alvo fixas. Gere alocações baseadas em oportunidades reais de mercado.

Se nenhuma ação atende aos critérios (mesmo sendo flexível), retorne message explicando o motivo.

Forneça uma recomendação estruturada em JSON seguindo o formato especificado."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Modelo mais econômico e rápido
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,  # Mais determinístico
                response_format={"type": "json_object"},  # Forçar resposta JSON
                max_tokens=2000,
            )

            # Parsear resposta JSON
            content = response.choices[0].message.content
            if content:
                result = json.loads(content)
                # Adicionar metadados de debug
                result["_debug"] = {
                    "model_used": "gpt-4o-mini",
                    "candidates_sent": len(candidates),
                    "prompt_tokens": response.usage.prompt_tokens if hasattr(response, "usage") else None,
                    "completion_tokens": response.usage.completion_tokens if hasattr(response, "usage") else None,
                }
                return result
            else:
                return {
                    "error": "Resposta vazia da OpenAI",
                    "fallback": True,
                }

        except json.JSONDecodeError as e:
            return {
                "error": f"Erro ao parsear resposta JSON: {str(e)}",
                "fallback": True,
            }
        except Exception as e:
            return {
                "error": f"Erro ao chamar OpenAI: {str(e)}",
                "fallback": True,
            }

