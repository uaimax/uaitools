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
        # Aceita tanto OPENAI_API_KEY quanto OPENAI_KEY (compatibilidade)
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY") or os.getenv("ANTHROPIC_API_KEY")
        if OPENAI_AVAILABLE and self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def is_available(self) -> bool:
        """Verifica se o serviço está disponível."""
        return OPENAI_AVAILABLE and self.client is not None

    def _estimar_tokens(self, texto: str) -> int:
        """Estima quantidade de tokens (1 token ≈ 4 caracteres em português)."""
        return len(texto) // 4

    def query(
        self, question: str, notes: List[Dict[str, Any]], workspace_id: str, box_id: str | None = None
    ) -> Dict[str, Any]:
        """Responde pergunta com base nas anotações.

        Implementa lógica de contexto completo vs reduzido conforme PRD:
        - Se total_tokens < 80000: manda todas as notas (ordem cronológica)
        - Se total_tokens >= 80000: contexto reduzido (resumo + recentes + full-text match)

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
            box_id: ID da caixinha (opcional, para contexto reduzido)

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
            # Estimar tokens totais
            total_tokens = sum(self._estimar_tokens(note.get('transcript', '')) for note in notes)
            LIMITE_SEGURO = 80000  # tokens

            # Ordenar notas por created_at (mais antiga primeiro) - ordem cronológica
            notes_sorted = sorted(notes, key=lambda n: n.get('created_at', ''))

            # Decidir contexto: completo ou reduzido
            if total_tokens < LIMITE_SEGURO:
                # CONTEXTO COMPLETO: manda todas as notas
                notes_to_use = notes_sorted
            else:
                # CONTEXTO REDUZIDO: resumo + recentes + top 10 por full-text match
                # Por enquanto, vamos usar apenas recentes + top 10
                # (resumo será implementado quando tiver cache de resumo)
                recentes = notes_sorted[-30:]  # Últimas 30 notas
                # Top 10 por full-text match já vem ordenado do viewset
                top_matches = notes_sorted[:10]
                
                # Combinar e remover duplicatas mantendo ordem
                seen_ids = set()
                notes_to_use = []
                for note in top_matches + recentes:
                    note_id = note.get('id')
                    if note_id and note_id not in seen_ids:
                        seen_ids.add(note_id)
                        notes_to_use.append(note)

            # Construir contexto com anotações (ordem cronológica)
            notes_text = "\n\n".join(
                [
                    f"📅 {note['created_at']} - {note.get('box_name', 'Inbox')}\n"
                    f"{note['transcript']}"
                    for note in notes_to_use
                ]
            )

            system_prompt = """Você é um assistente que responde perguntas baseado APENAS nas anotações transcritas fornecidas.

REGRAS CRÍTICAS:
1. Você SÓ pode responder com informações que estejam EXPLICITAMENTE nas anotações fornecidas
2. Se a informação não estiver nas anotações, você DEVE dizer claramente "Não encontrei essa informação nas minhas anotações" ou "Não tenho essa informação disponível"
3. NUNCA invente, suponha ou presuma informações que não estejam nas anotações
4. Se as anotações não contêm informação suficiente para responder, seja honesto sobre isso

Sua tarefa:
1. Analisar as anotações fornecidas
2. Responder APENAS com base no que está explicitamente nas anotações
3. Se não houver informação relevante, diga claramente que não encontrou
4. Incluir referências às anotações usadas (data e caixinha) quando houver informação

Formato da resposta:
- Resposta direta e objetiva
- Se não houver informação: "Não encontrei essa informação nas minhas anotações"
- Se houver informação: inclua datas e contextos quando relevante
- Use emojis para clareza visual (📅 para datas, 📦 para caixinhas)
- Seja conciso mas completo"""

            user_prompt = f"""Anotações disponíveis:

{notes_text}

---

Pergunta do usuário:
{question}

IMPORTANTE: Responda APENAS com base nas anotações fornecidas acima. Se a informação não estiver nas anotações, diga claramente "Não encontrei essa informação nas minhas anotações". NÃO invente ou presuma informações. Seja objetivo e inclua referências (data e caixinha) quando houver informação relevante."""

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


