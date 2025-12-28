"""Serviço para classificação automática de anotações em caixinhas."""

import json
import os
import re
from typing import Any, Dict, List
from difflib import SequenceMatcher

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

    def _normalize_text(self, text: str) -> str:
        """Normaliza texto para comparação (remove acentos, lowercase, etc)."""
        # Remove acentos básicos (pode ser expandido)
        text = text.lower().strip()
        # Remove pontuação
        text = re.sub(r'[^\w\s]', '', text)
        return text

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade entre dois textos (0-1)."""
        norm1 = self._normalize_text(text1)
        norm2 = self._normalize_text(text2)
        return SequenceMatcher(None, norm1, norm2).ratio()

    def _detect_box_mention(
        self, transcript: str, available_boxes: List[Dict[str, Any]]
    ) -> Dict[str, Any] | None:
        """Detecta se alguma caixinha é mencionada diretamente na transcrição.

        Args:
            transcript: Texto transcrito
            available_boxes: Lista de caixinhas disponíveis

        Returns:
            {
                "box_id": "uuid",
                "confidence": 0.85,
                "reason": "Nome da caixinha mencionado na transcrição",
            } ou None se não encontrou
        """
        if not transcript or not available_boxes:
            return None

        transcript_lower = transcript.lower()
        transcript_normalized = self._normalize_text(transcript)

        # Primeiro, busca exata (case-insensitive)
        for box in available_boxes:
            box_name = box["name"]
            box_name_lower = box_name.lower()
            box_name_normalized = self._normalize_text(box_name)

            # Busca exata
            if box_name_lower in transcript_lower or box_name_normalized in transcript_normalized:
                return {
                    "box_id": box["id"],
                    "confidence": 0.95,
                    "reason": f"Nome da caixinha '{box_name}' mencionado diretamente na transcrição",
                }

        # Se não encontrou exato, tenta similaridade fonética
        best_match = None
        best_similarity = 0.0
        SIMILARITY_THRESHOLD = 0.75  # 75% de similaridade

        for box in available_boxes:
            box_name = box["name"]
            box_name_normalized = self._normalize_text(box_name)

            # Busca palavras similares na transcrição
            transcript_words = transcript_normalized.split()
            for word in transcript_words:
                similarity = self._calculate_similarity(word, box_name_normalized)
                if similarity > best_similarity:
                    best_similarity = similarity
                    if similarity >= SIMILARITY_THRESHOLD:
                        best_match = {
                            "box_id": box["id"],
                            "confidence": min(0.85, 0.5 + (similarity - SIMILARITY_THRESHOLD) * 0.7),
                            "reason": f"Possível menção da caixinha '{box_name}' na transcrição (similaridade: {similarity:.2f})",
                        }

        return best_match

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

        # PRIMEIRO: Tentar detectar menção direta de caixinha na transcrição
        direct_mention = self._detect_box_mention(transcript, available_boxes)
        if direct_mention and direct_mention.get("confidence", 0) >= 0.75:
            # Se encontrou menção com alta confiança, retorna direto
            return direct_mention

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

Regras IMPORTANTES:
1. Se o nome de uma caixinha for mencionado na transcrição (mesmo com variações de pronúncia/grafia),
   essa é a caixinha escolhida com alta confiança (>= 0.8)
2. Analise o conteúdo da transcrição para contexto
3. Escolha a caixinha mais apropriada baseado no assunto
4. Se não tiver certeza (confiança < 0.5), retorne "INBOX"
5. Retorne APENAS JSON no formato:
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


