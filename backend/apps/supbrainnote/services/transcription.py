"""Serviço para transcrição de áudio usando Whisper (OpenAI)."""

import os
from typing import Any, Dict

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


class TranscriptionService:
    """Serviço para transcrição de áudio usando Whisper API (OpenAI)."""

    def __init__(self) -> None:
        """Inicializa o serviço de transcrição."""
        self.api_key = os.getenv("OPENAI_API_KEY")
        if OPENAI_AVAILABLE and self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None

    def is_available(self) -> bool:
        """Verifica se o serviço está disponível."""
        return OPENAI_AVAILABLE and self.client is not None

    def transcribe(
        self, audio_file_path: str, language: str = "pt"
    ) -> Dict[str, Any]:
        """Transcreve áudio usando Whisper API.

        Args:
            audio_file_path: Caminho do arquivo de áudio
            language: Idioma do áudio (padrão: pt)

        Returns:
            Dicionário com:
            {
                "text": "transcrição completa",
                "language": "pt",
                "duration": 45.2,
            }

        Raises:
            ValueError: Se serviço não está disponível
            Exception: Se erro ao transcrever
        """
        if not self.is_available():
            raise ValueError(
                "OpenAI não está disponível. Verifique OPENAI_API_KEY no .env"
            )

        try:
            with open(audio_file_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                )

            # Extrair duração (se disponível) ou estimar
            # Nota: Whisper não retorna duração diretamente, precisamos calcular
            # Por enquanto, retornamos None e calculamos depois
            return {
                "text": transcript.text,
                "language": language,
                "duration": None,  # Será calculado depois
            }
        except Exception as e:
            raise Exception(f"Erro ao transcrever áudio: {str(e)}") from e

