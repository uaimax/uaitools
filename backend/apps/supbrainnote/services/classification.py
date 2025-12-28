"""Serviço para classificação automática de anotações em caixinhas."""

import json
import os
from typing import Any, Dict, List

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


class ClassificationService:
    """Serviço para classificação automática de anotações em caixinhas usando LLM."""

    def __init__(self) -> None:
        """Inicializa o serviço de classificação."""
        # Aceita tanto OPENAI_API_KEY quanto OPENAI_KEY (compatibilidade)
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY") or os.getenv("ANTHROPIC_API_KEY")
        if OPENAI_AVAILABLE and self.api_key:
            self.client = OpenAI(api_key=self.api_key)
            self.provider = "openai"
        else:
            self.client = None
            self.provider = None

    def is_available(self) -> bool:
        """Verifica se o serviço está disponível."""
        return OPENAI_AVAILABLE and self.client is not None

    def classify(
        self, transcript: str, available_boxes: List[Dict[str, Any]], workspace_id: str
    ) -> Dict[str, Any]:
        """Classifica anotação em uma caixinha.

        Args:
            transcript: Texto transcrito
            available_boxes: Lista de caixinhas disponíveis
                [{"id": "uuid", "name": "Casa", "description": "..."}, ...]
            workspace_id: ID do workspace

        Returns:
            {
                "box_id": "uuid-da-caixinha" ou None,
                "confidence": 0.85,
                "reason": "Motivo da classificação",
            }
            Se confiança < 0.5, box_id será None (vai para inbox)

        Raises:
            ValueError: Se serviço não está disponível
            Exception: Se erro ao classificar
        """
        if not self.is_available():
            raise ValueError(
                "OpenAI não está disponível. Verifique OPENAI_API_KEY no .env"
            )

        if not available_boxes:
            # Se não há caixinhas, vai para inbox
            return {
                "box_id": None,
                "confidence": 0.0,
                "reason": "Nenhuma caixinha disponível",
            }

        try:
            # Construir prompt
            boxes_text = "\n".join(
                [
                    f"- {box['name']}: {box.get('description', 'Sem descrição')}"
                    for box in available_boxes
                ]
            )

            system_prompt = """Você é um assistente que organiza anotações em caixinhas (categorias).

Sua tarefa é analisar uma transcrição de áudio e decidir em qual caixinha ela deve ficar.

Regras:
1. Analise o conteúdo da transcrição
2. Escolha a caixinha mais apropriada baseado no assunto
3. Se não tiver certeza (confiança < 0.5), retorne "INBOX"
4. Retorne APENAS JSON no formato:
{
  "box_id": "uuid-da-caixinha" ou null,
  "confidence": 0.0-1.0,
  "reason": "Motivo da classificação"
}"""

            user_prompt = f"""Caixinhas disponíveis:
{boxes_text}

Transcrição do áudio:
"{transcript}"

Em qual caixinha esta anotação deve ficar?

Responda APENAS com JSON no formato especificado."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Modelo econômico
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,  # Mais determinístico
                response_format={"type": "json_object"},
                max_tokens=500,
            )

            content = response.choices[0].message.content
            if content:
                result = json.loads(content)

                # Validar resultado
                box_id = result.get("box_id")
                confidence = result.get("confidence", 0.0)

                # Se confiança < 0.5, vai para inbox
                if confidence < 0.5:
                    box_id = None

                # Validar se box_id existe na lista
                if box_id:
                    box_ids = [box["id"] for box in available_boxes]
                    if box_id not in box_ids:
                        # Box não encontrado, vai para inbox
                        box_id = None
                        confidence = 0.0

                return {
                    "box_id": box_id,
                    "confidence": float(confidence),
                    "reason": result.get("reason", "Classificação automática"),
                }
            else:
                # Resposta vazia, vai para inbox
                return {
                    "box_id": None,
                    "confidence": 0.0,
                    "reason": "Resposta vazia da IA",
                }

        except json.JSONDecodeError as e:
            # Erro ao parsear JSON, vai para inbox
            return {
                "box_id": None,
                "confidence": 0.0,
                "reason": f"Erro ao parsear resposta: {str(e)}",
            }
        except Exception as e:
            raise Exception(f"Erro ao classificar anotação: {str(e)}") from e


