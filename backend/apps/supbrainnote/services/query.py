"""Serviço para consultas inteligentes com IA."""

import json
import os
from typing import Any, Dict, List

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


class QueryService:
    """Serviço para consultas inteligentes com IA."""

    def __init__(self) -> None:
        """Inicializa o serviço de consulta."""
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        if OPENAI_AVAILABLE and self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def is_available(self) -> bool:
        """Verifica se o serviço está disponível."""
        return OPENAI_AVAILABLE and self.client is not None

    def query(
        self, question: str, notes: List[Dict[str, Any]], workspace_id: str
    ) -> Dict[str, Any]:
        """Responde pergunta com base nas anotações.

        Args:
            question: Pergunta do usuário
            notes: Lista de anotações relevantes
                [{
                    "id": "uuid",
                    "transcript": "texto",
                    "created_at": "2025-01-27",
                    "box_name": "Casa",
                }, ...]
            workspace_id: ID do workspace

        Returns:
            {
                "answer": "Resposta da IA",
                "sources": [
                    {
                        "note_id": "uuid",
                        "excerpt": "trecho relevante",
                        "date": "2025-01-27",
                        "box_name": "Casa",
                    }
                ],
            }

        Raises:
            ValueError: Se serviço não está disponível
            Exception: Se erro ao consultar
        """
        if not self.is_available():
            raise ValueError(
                "OpenAI não está disponível. Verifique OPENAI_API_KEY no .env"
            )

        if not notes:
            return {
                "answer": "Não encontrei anotações relevantes para sua pergunta.",
                "sources": [],
            }

        try:
            # Construir contexto com anotações
            notes_text = "\n\n".join(
                [
                    f"📅 {note['created_at']} - {note.get('box_name', 'Inbox')}\n"
                    f"{note['transcript']}"
                    for note in notes
                ]
            )

            system_prompt = """Você é um assistente que responde perguntas baseado em anotações transcritas de áudios.

Sua tarefa é:
1. Analisar as anotações fornecidas
2. Responder a pergunta do usuário de forma clara e objetiva
3. Incluir referências às anotações usadas (data e caixinha)
4. Se não encontrar informação relevante, seja honesto

Formato da resposta:
- Resposta direta e objetiva
- Inclua datas e contextos quando relevante
- Use emojis para clareza visual (📅 para datas, 📦 para caixinhas)
- Seja conciso mas completo"""

            user_prompt = f"""Anotações disponíveis:

{notes_text}

---

Pergunta do usuário:
{question}

Responda com base nas anotações acima. Seja objetivo e inclua referências (data e caixinha) quando relevante."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.5,
                max_tokens=1000,
            )

            answer = response.choices[0].message.content or "Não foi possível gerar resposta."

            # Extrair fontes (anotações usadas)
            # Por enquanto, retornamos todas as anotações fornecidas como fontes
            # Futuramente, podemos melhorar para identificar quais foram realmente usadas
            sources = [
                {
                    "note_id": note["id"],
                    "excerpt": note["transcript"][:200] + "..."
                    if len(note["transcript"]) > 200
                    else note["transcript"],
                    "date": note["created_at"],
                    "box_name": note.get("box_name", "Inbox"),
                }
                for note in notes
            ]

            return {
                "answer": answer,
                "sources": sources,
            }

        except Exception as e:
            raise Exception(f"Erro ao consultar IA: {str(e)}") from e

