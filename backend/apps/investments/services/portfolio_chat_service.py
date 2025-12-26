"""Serviço de chat contextual na carteira."""

from typing import Any, Dict, List

from apps.investments.models import Portfolio, PortfolioChat
from apps.investments.services.context_analyzer import ContextAnalyzer
from apps.investments.services.openai_service import OpenAIService


class PortfolioChatService:
    """Serviço de chat contextual."""

    def __init__(self) -> None:
        """Inicializa o serviço."""
        self.context_analyzer = ContextAnalyzer()
        self.openai = OpenAIService()

    def send_message(
        self,
        portfolio: Portfolio,
        message: str,
    ) -> PortfolioChat:
        """Envia mensagem e obtém resposta da IA.

        Args:
            portfolio: Carteira
            message: Mensagem do usuário

        Returns:
            PortfolioChat criado
        """
        # Analisar contexto atual
        context = self.context_analyzer.analyze_user_context(portfolio)

        # Criar mensagem do usuário
        user_message = PortfolioChat.objects.create(
            workspace=portfolio.workspace,
            portfolio=portfolio,
            message=message,
            is_from_user=True,
            context_snapshot=context,
        )

        # Gerar resposta da IA
        ai_response = self._generate_ai_response(message, context)

        # Criar mensagem da IA
        ai_message = PortfolioChat.objects.create(
            workspace=portfolio.workspace,
            portfolio=portfolio,
            message=ai_response.get("response", ""),
            is_from_user=False,
            context_snapshot=context,
            ai_response=ai_response.get("response", ""),
            ai_confidence=ai_response.get("confidence", 0.0),
        )

        return ai_message

    def get_history(
        self,
        portfolio: Portfolio,
        limit: int = 50,
    ) -> List[PortfolioChat]:
        """Obtém histórico de mensagens.

        Args:
            portfolio: Carteira
            limit: Limite de mensagens

        Returns:
            Lista de mensagens
        """
        return PortfolioChat.objects.filter(
            portfolio=portfolio,
        ).order_by("created_at")[:limit]

    def _generate_ai_response(
        self,
        message: str,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Gera resposta da IA.

        Returns:
            Dicionário com resposta e confiança
        """
        if not self.openai.is_available():
            return {
                "response": "Desculpe, o serviço de IA não está disponível no momento. Verifique se a chave OPENAI_KEY está configurada no arquivo .env do backend.",
                "confidence": 0.0,
            }

        # Preparar prompt contextual
        portfolio_summary = context.get("portfolio_health", {})
        profile = context.get("profile", {})
        market_context = context.get("market_context", {})

        prompt = f"""Você é um assistente de investimentos inteligente. Analise o contexto do usuário e responda de forma clara e útil.

CONTEXTO DA CARTEIRA:
- Total investido: R$ {portfolio_summary.get('total_invested', 0):,.2f}
- Número de ativos: {portfolio_summary.get('total_assets', 0)}
- Diversificação: {portfolio_summary.get('diversification_score', 0)*100:.1f}%
- Risco de concentração: {portfolio_summary.get('concentration_risk', 0)*100:.1f}%

PERFIL DO INVESTIDOR:
- Tolerância a risco: {profile.get('risk_tolerance', 'não definido')}
- Objetivo principal: {profile.get('primary_goal', 'não definido')}
- Horizonte de investimento: {profile.get('investment_horizon', 'não definido')}

CONTEXTO DE MERCADO:
- Selic: {market_context.get('selic', 'N/A')}%
- IPCA 12m: {market_context.get('ipca', 'N/A')}%

PERGUNTA DO USUÁRIO: {message}

Responda de forma clara, objetiva e útil, considerando o contexto fornecido. Se a pergunta for sobre recomendações específicas, seja cauteloso e sempre mencione que é apenas uma análise, não um conselho financeiro personalizado."""

        try:
            # Usar OpenAI para gerar resposta
            response = self.openai.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Você é um assistente de investimentos especializado em análise de carteiras brasileiras. Seja claro, objetivo e sempre mencione que suas respostas são análises, não conselhos financeiros personalizados.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                max_tokens=500,
            )

            ai_message = response.choices[0].message.content

            return {
                "response": ai_message or "Desculpe, não consegui gerar uma resposta no momento.",
                "confidence": 0.8,
            }
        except Exception as e:
            return {
                "response": f"Erro ao processar sua mensagem: {str(e)}. Verifique se a chave OPENAI_KEY está configurada corretamente no arquivo .env do backend.",
                "confidence": 0.0,
            }

