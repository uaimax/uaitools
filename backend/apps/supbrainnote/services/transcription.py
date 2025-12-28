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
        # Aceita tanto OPENAI_API_KEY quanto OPENAI_KEY (compatibilidade)
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")
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
            # #region agent log
            import json
            debug_log_path = "/home/uaimax/projects/uaitools/.cursor/debug.log"
            if os.path.exists(os.path.dirname(debug_log_path)):
                try:
                    log_entry = {
                        "id": f"log_transcribe_{os.getpid()}",
                        "timestamp": int(os.times().elapsed * 1000) if hasattr(os.times(), 'elapsed') else 0,
                        "location": "transcription.py:57",
                        "message": "Abrindo arquivo de áudio para transcrição",
                        "data": {
                            "audio_file_path": audio_file_path,
                            "file_exists": os.path.exists(audio_file_path),
                            "file_size": os.path.getsize(audio_file_path) if os.path.exists(audio_file_path) else 0,
                        },
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "F",
                    }
                    with open(debug_log_path, "a") as f:
                        f.write(json.dumps(log_entry) + "\n")
                except (OSError, IOError):
                    pass
            # #endregion

            with open(audio_file_path, "rb") as audio_file:
                # #region agent log
                if os.path.exists(os.path.dirname(debug_log_path)):
                    try:
                        log_entry = {
                            "id": f"log_transcribe_api_{os.getpid()}",
                            "timestamp": int(os.times().elapsed * 1000) if hasattr(os.times(), 'elapsed') else 0,
                            "location": "transcription.py:75",
                            "message": "Chamando API Whisper",
                            "data": {"model": "whisper-1", "language": language},
                            "sessionId": "debug-session",
                            "runId": "run1",
                            "hypothesisId": "F",
                        }
                        with open(debug_log_path, "a") as f:
                            f.write(json.dumps(log_entry) + "\n")
                    except (OSError, IOError):
                        pass
                # #endregion
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                )

            # #region agent log
            if os.path.exists(os.path.dirname(debug_log_path)):
                try:
                    log_entry = {
                        "id": f"log_transcribe_result_{os.getpid()}",
                        "timestamp": int(os.times().elapsed * 1000) if hasattr(os.times(), 'elapsed') else 0,
                        "location": "transcription.py:88",
                        "message": "Resposta da API Whisper recebida",
                        "data": {
                            "transcript_text": transcript.text if hasattr(transcript, 'text') else "N/A",
                            "transcript_length": len(transcript.text) if hasattr(transcript, 'text') else 0,
                            "transcript_type": type(transcript).__name__,
                            "has_text_attr": hasattr(transcript, 'text'),
                        },
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "F",
                    }
                    with open(debug_log_path, "a") as f:
                        f.write(json.dumps(log_entry) + "\n")
                except (OSError, IOError):
                    pass
            # #endregion

            # Extrair duração (se disponível) ou estimar
            # Nota: Whisper não retorna duração diretamente, precisamos calcular
            # Por enquanto, retornamos None e calculamos depois
            return {
                "text": transcript.text,
                "language": language,
                "duration": None,  # Será calculado depois
            }
        except Exception as e:
            # #region agent log
            if os.path.exists(os.path.dirname(debug_log_path)):
                try:
                    log_entry = {
                        "id": f"log_transcribe_error_{os.getpid()}",
                        "timestamp": int(os.times().elapsed * 1000) if hasattr(os.times(), 'elapsed') else 0,
                        "location": "transcription.py:105",
                        "message": "Erro ao transcrever",
                        "data": {
                            "error_type": type(e).__name__,
                            "error_message": str(e),
                        },
                        "sessionId": "debug-session",
                        "runId": "run1",
                        "hypothesisId": "F",
                    }
                    with open(debug_log_path, "a") as f:
                        f.write(json.dumps(log_entry) + "\n")
                except (OSError, IOError):
                    pass
            # #endregion
            raise Exception(f"Erro ao transcrever áudio: {str(e)}") from e


