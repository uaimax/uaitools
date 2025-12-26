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
        strategy_text: str,
        strategy_rules: Dict[str, Any],
        portfolio_data: Dict[str, Any],
        market_data: Dict[str, Any],
        amount: Decimal,
        question: str = "Onde devo investir este valor?",
    ) -> Dict[str, Any]:
        """Gera recomendação de investimento usando OpenAI.

        Args:
            strategy_text: Texto da estratégia do usuário
            strategy_rules: Regras parseadas da estratégia
            portfolio_data: Dados da carteira atual
            market_data: Dados de mercado (cotações, fundamentalistas)
            amount: Valor a ser investido
            question: Pergunta do usuário

        Returns:
            Dicionário com recomendação estruturada
        """
        if not self.is_available():
            return {
                "error": "OpenAI não está disponível. Verifique OPENAI_KEY no .env",
                "fallback": True,
            }

        try:
            # Construir contexto estruturado para a IA
            context = {
                "strategy": {
                    "text": strategy_text,
                    "type": strategy_rules.get("strategy_type", "dividendos"),
                    "criteria": strategy_rules.get("criteria", {}),
                },
                "portfolio": portfolio_data,
                "market": market_data,
                "amount": float(amount),
                "question": question,
            }

            # Prompt completo baseado no exemplo do Gemini, com exemplos de output
            system_prompt = """Você é um agente de investimento autônomo responsável por operar um micro web app de renda passiva por dividendos. O usuário informa um valor que deseja investir (ex: "Quero investir R$X"), e seu papel é responder com o que fazer agora, respeitando a estratégia pré-definida, o estado atual da carteira e os dados de mercado.

---
🎯 Objetivo:
Gerar instruções diretas de execução para alocação inteligente de capital, com foco em dividendos mensais consistentes, sem violar nenhum critério estratégico.

---
📐 Regras da estratégia:
- Apenas ações da B3
- Setores defensivos, perenes, excluindo mineração e armas
- Dividend Yield mínimo desejado: 8%
- Preço teto de entrada = dividendo / 0.08
- Só comprar ações:
  - com cotação ≤ preço-teto
  - e que estejam abaixo da alocação máxima (target %)
- Priorizar ações que:
  1. Estão abaixo do teto
  2. Estão subalocadas

---
🧠 Lógica de decisão:
1. Receba o valor de aporte (R$X)
2. Calcule o valor total da carteira atual somando o valor de cada ativo (quantidade * cotação).
3. Calcule a alocação percentual atual de cada ativo na carteira.
4. Filtre ações com preço atual (cotação) ≤ preço-teto. O preço-teto é calculado como (dividendo / 0.08).
5. Dentro desse filtro, selecione as ações cuja alocação percentual atual está abaixo da alocação-alvo.
6. Distribua o valor do aporte (R$X) proporcionalmente entre essas ações elegíveis, priorizando as que estão mais distantes de sua alocação-alvo.
7. Calcule quantas unidades inteiras comprar de cada ação selecionada, sem exceder o aporte.
8. Retorne instruções diretas: o que comprar, quantas unidades, o preço, o custo total por ativo.
9. Calcule e mostre o saldo restante do aporte.
10. Se nenhuma ação cumpre os critérios, responda EXATAMENTE com a frase: "🔴 Nenhuma ação recomendada para compra agora. Aguarde recuo ou mantenha em caixa."

---
🧼 Regras de output:
- Nunca explique a estratégia no output.
- Use emojis para clareza visual: ✅ para compra imediata, 🔴 para não fazer nada, 💰 para saldo restante.
- Nunca ultrapasse a alocação máxima definida por ativo com este aporte.
- Mostrar saldo restante se sobrar capital.
- Não sugerir reinvestimento em ações acima do preço-teto.
- O output deve ser apenas a lista de ações a tomar ou a mensagem de "nenhuma ação recomendada". Sem introduções ou conclusões.

---
💬 Exemplo de output ideal (quando há ações válidas):
✅ Compre 5 ações de BBDC4 por R$16,25 cada (R$81,25)
✅ Compre 2 ações de BBSE3 por R$36,78 cada (R$73,56)
💰 Saldo restante: R$45,19

---
💬 Exemplo de output ideal (quando nenhuma ação se enquadra):
🔴 Nenhuma ação recomendada para compra agora. Aguarde recuo ou mantenha em caixa.

---
Formato de resposta esperado (JSON):
{
  "recommendation": {
    "total_amount": 0.0,
    "allocations": [
      {
        "ticker": "TAEE11",
        "quantity": 10,
        "unit_price": 35.50,
        "amount": 355.00,
        "reason": "Explicação do porquê desta recomendação"
      }
    ],
    "remaining_balance": 0.0,
    "reasoning": "Explicação geral da recomendação",
    "message": "Mensagem opcional para o usuário (se nenhuma ação recomendada, use: 🔴 Nenhuma ação recomendada para compra agora. Aguarde recuo ou mantenha em caixa.)"
  }
}"""

            # Preparar alocação-alvo para incluir no prompt
            from apps.investments.services.constants import TARGET_ALLOCATION

            user_prompt = f"""Analise a seguinte situação de investimento:

---
📦 Estado atual da carteira do usuário:
{json.dumps(portfolio_data, indent=2, ensure_ascii=False)}

---
📊 Alocação-alvo da carteira (%):
{json.dumps(TARGET_ALLOCATION, indent=2, ensure_ascii=False)}

---
📈 Dados de mercado:
{json.dumps(market_data, indent=2, ensure_ascii=False)}

---
📐 Regras da estratégia:
**Estratégia do Usuário (texto livre):**
{strategy_text}

**Regras Identificadas (estruturadas):**
{json.dumps(strategy_rules.get('criteria', {}), indent=2, ensure_ascii=False)}

---
**Valor Disponível para Investir:**
R$ {amount:,.2f}

**Pergunta do Usuário:**
{question}

---
Com base em um aporte de R$ {amount:,.2f}, quais são as instruções de compra?

Forneça uma recomendação estruturada em JSON seguindo o formato especificado. Seja objetivo, baseado em dados e alinhado com a estratégia do usuário. Se nenhuma ação cumpre os critérios, retorne message: "🔴 Nenhuma ação recomendada para compra agora. Aguarde recuo ou mantenha em caixa."."""

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

