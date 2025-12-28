"""Celery tasks for supbrainnote app."""

import json
import logging
import os
import shutil
import tempfile
from typing import Any, Dict

from celery import shared_task

from apps.supbrainnote.models import Box, Note
from apps.supbrainnote.services.classification import ClassificationService
from apps.supbrainnote.services.transcription import TranscriptionService

logger = logging.getLogger("apps")

# Debug logging
DEBUG_LOG_PATH = "/home/uaimax/projects/uaitools/.cursor/debug.log"

def _debug_log(location: str, message: str, data: dict, hypothesis_id: str = "A"):
    """Log debug information."""
    try:
        log_entry = {
            "id": f"log_{os.getpid()}_{id(data)}",
            "timestamp": int(os.times().elapsed * 1000) if hasattr(os.times(), 'elapsed') else 0,
            "location": location,
            "message": message,
            "data": data,
            "sessionId": "debug-session",
            "runId": "run1",
            "hypothesisId": hypothesis_id,
        }
        with open(DEBUG_LOG_PATH, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass  # Ignorar erros de logging


@shared_task
def transcribe_audio(note_id: str) -> Dict[str, Any]:
    """Transcreve áudio de uma anotação.

    Args:
        note_id: ID da anotação (UUID como string)

    Returns:
        {
            "status": "completed" ou "failed",
            "transcript": "texto transcrito",
            "duration": 45.2,
            "error": "mensagem de erro" (se falhou),
        }
    """
    try:
        # Validar e normalizar ID
        if not note_id:
            logger.error("ID de anotação não fornecido")
            return {
                "status": "failed",
                "error": "ID de anotação não fornecido",
            }

        # Converter para string e limpar
        note_id_str = str(note_id).strip()

        # UUIDs têm 36 caracteres (com hífens) ou 32 (sem hífens)
        # Validar formato básico de UUID
        if len(note_id_str) < 32:
            logger.error(f"ID de anotação inválido (muito curto para UUID): {note_id_str} (tipo: {type(note_id)})")
            return {
                "status": "failed",
                "error": "ID de anotação inválido (formato UUID esperado)",
            }

        # Buscar anotação
        note = Note.objects.get(id=note_id_str)

        # Atualizar status
        note.processing_status = "processing"
        note.save(update_fields=["processing_status"])

        # Verificar se arquivo existe
        if not note.audio_file or not note.audio_file.name:
            raise ValueError("Arquivo de áudio não encontrado")

        # #region agent log
        _debug_log(
            "tasks.py:62",
            "Verificando storage do audio_file",
            {
                "note_id": str(note.id),
                "audio_file_name": note.audio_file.name if note.audio_file else None,
                "storage_type": type(note.audio_file.storage).__name__ if hasattr(note.audio_file, 'storage') else "N/A",
                "storage_is_string": isinstance(note.audio_file.storage, str) if hasattr(note.audio_file, 'storage') else False,
            },
            "A",
        )
        # #endregion

        # Caminho completo do arquivo
        # Para R2/S3, não podemos usar .path diretamente, precisamos baixar o arquivo temporariamente
        temp_file_path = None

        # Verificar se o storage suporta .path antes de tentar acessar
        # Isso evita o erro 'str' object has no attribute 'path'
        storage = note.audio_file.storage
        storage_supports_path = False

        # Verificar se storage é uma instância válida (não string) e se tem método path
        if hasattr(storage, 'path') and callable(getattr(storage, 'path', None)):
            try:
                # Tentar acessar path do storage para verificar se funciona
                test_path = storage.path('test')
                storage_supports_path = True
            except (AttributeError, NotImplementedError, TypeError):
                # Storage não suporta path (ex: S3/R2)
                storage_supports_path = False

        try:
            # #region agent log
            _debug_log(
                "tasks.py:105",
                "Verificando suporte a .path",
                {
                    "note_id": str(note.id),
                    "storage_type": type(storage).__name__,
                    "storage_supports_path": storage_supports_path,
                    "storage_is_string": isinstance(storage, str),
                },
                "B",
            )
            # #endregion

            # Tentar usar .path apenas se o storage suportar
            if storage_supports_path and not isinstance(storage, str):
                audio_path = note.audio_file.path
                # #region agent log
                _debug_log("tasks.py:118", "audio_file.path obtido com sucesso", {"audio_path": audio_path, "note_id": str(note.id)}, "B")
                # #endregion
            else:
                # Forçar exceção para ir para o bloco de download
                raise AttributeError("Storage não suporta .path")
        except (AttributeError, NotImplementedError, ValueError, TypeError) as e:
            # #region agent log
            _debug_log(
                "tasks.py:76",
                "Erro ao acessar audio_file.path, tentando download",
                {
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "note_id": str(note.id),
                },
                "C",
            )
            # #endregion
            # Se o storage não suporta .path (como S3/R2), baixar arquivo temporariamente
            # Isso também trata o caso onde storage é uma string (erro de configuração)
            try:
                # Criar arquivo temporário
                file_ext = os.path.splitext(note.audio_file.name)[1] if note.audio_file.name else ".webm"
                if not file_ext:
                    file_ext = ".webm"
                # #region agent log
                _debug_log("tasks.py:87", "Criando arquivo temporário", {"file_ext": file_ext, "note_id": str(note.id)}, "C")
                # #endregion
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
                temp_file_path = temp_file.name
                temp_file.close()

                # Baixar arquivo do storage para arquivo temporário
                # #region agent log
                _debug_log("tasks.py:94", "Iniciando download do arquivo", {"temp_path": temp_file_path, "note_id": str(note.id)}, "C")
                # #endregion
                with note.audio_file.open('rb') as source:
                    with open(temp_file_path, 'wb') as dest:
                        shutil.copyfileobj(source, dest)

                audio_path = temp_file_path
                # #region agent log
                _debug_log("tasks.py:100", "Download concluído", {"audio_path": audio_path, "note_id": str(note.id)}, "C")
                # #endregion
            except Exception as download_error:
                # #region agent log
                _debug_log(
                    "tasks.py:103",
                    "Erro ao baixar arquivo",
                    {
                        "error_type": type(download_error).__name__,
                        "error_message": str(download_error),
                        "note_id": str(note.id),
                    },
                    "D",
                )
                # #endregion
                if temp_file_path and os.path.exists(temp_file_path):
                    try:
                        os.unlink(temp_file_path)
                    except Exception:
                        pass
                raise ValueError(f"Erro ao baixar arquivo do storage: {str(download_error)}")

        # Transcrever
        transcription_service = TranscriptionService()
        if not transcription_service.is_available():
            # Limpar arquivo temporário se foi criado
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception:
                    pass
            raise ValueError("Serviço de transcrição não disponível")

        try:
            # #region agent log
            _debug_log(
                "tasks.py:186",
                "Chamando transcription_service.transcribe",
                {
                    "audio_path": audio_path,
                    "audio_path_exists": os.path.exists(audio_path) if audio_path else False,
                    "audio_path_size": os.path.getsize(audio_path) if audio_path and os.path.exists(audio_path) else 0,
                    "note_id": str(note.id),
                },
                "E",
            )
            # #endregion
            result = transcription_service.transcribe(audio_path, language="pt")

            # Validar se a transcrição não está vazia
            transcript_text = result.get("text", "").strip()
            if not transcript_text:
                logger.warning(f"Transcrição vazia para anotação {note_id}")
                # #region agent log
                _debug_log(
                    "tasks.py:201",
                    "Transcrição vazia retornada",
                    {
                        "note_id": str(note.id),
                        "result_keys": list(result.keys()),
                        "result_full": result,
                    },
                    "F",
                )
                # #endregion
                # Se a transcrição está vazia, marcar como falha
                raise ValueError("Transcrição retornada está vazia")

            # #region agent log
            _debug_log(
                "tasks.py:215",
                "Transcrição concluída",
                {
                    "note_id": str(note.id),
                    "transcript_text": transcript_text[:100] + "..." if len(transcript_text) > 100 else transcript_text,
                    "transcript_length": len(transcript_text),
                    "has_duration": "duration" in result,
                    "result_keys": list(result.keys()),
                },
                "E",
            )
            # #endregion
        finally:
            # Limpar arquivo temporário se foi criado
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception:
                    pass  # Ignorar erros ao deletar arquivo temporário

        # Atualizar anotação
        note.transcript = transcript_text  # Usar a variável validada
        note.duration_seconds = result.get("duration")  # Pode ser None
        note.processing_status = "completed"
        note.save(update_fields=["transcript", "duration_seconds", "processing_status"])
        # #region agent log
        _debug_log(
            "tasks.py:222",
            "Nota atualizada com sucesso",
            {
                "note_id": str(note.id),
                "status": "completed",
                "transcript_saved": note.transcript,
                "transcript_length_saved": len(note.transcript) if note.transcript else 0,
            },
            "E",
        )
        # #endregion

        # Disparar classificação automaticamente
        classify_note.delay(note_id)

        return {
            "status": "completed",
            "transcript": transcript_text,  # Usar a variável validada
            "duration": result.get("duration"),
        }

    except Note.DoesNotExist:
        logger.error(f"Anotação {note_id} não encontrada")
        return {
            "status": "failed",
            "error": "Anotação não encontrada",
        }
    except Exception as e:
        logger.error(f"Erro ao transcrever áudio {note_id}: {str(e)}", exc_info=True)

        # Atualizar status para failed
        try:
            note = Note.objects.get(id=note_id)
            note.processing_status = "failed"
            note.metadata = note.metadata or {}
            note.metadata["error"] = str(e)
            note.save(update_fields=["processing_status", "metadata"])
        except Note.DoesNotExist:
            pass

        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task
def classify_note(note_id: str) -> Dict[str, Any]:
    """Classifica anotação em uma caixinha.

    Args:
        note_id: ID da anotação (UUID como string)

    Returns:
        {
            "status": "completed",
            "box_id": "uuid-da-caixinha" ou None,
            "confidence": 0.85,
        }
    """
    try:
        # Buscar anotação
        note = Note.objects.get(id=note_id)

        # Verificar se tem transcrição
        if not note.transcript:
            logger.warning(f"Anotação {note_id} não tem transcrição ainda")
            # Aguardar um pouco e tentar novamente
            # Por enquanto, vamos retornar erro
            return {
                "status": "failed",
                "error": "Transcrição não disponível",
            }

        # Buscar caixinhas do workspace
        boxes = Box.objects.filter(workspace=note.workspace, deleted_at__isnull=True)
        available_boxes = [
            {
                "id": str(box.id),
                "name": box.name,
                "description": box.description or "",
            }
            for box in boxes
        ]

        # Classificar
        classification_service = ClassificationService()
        if not classification_service.is_available():
            logger.warning("Serviço de classificação não disponível")
            # Se não disponível, vai para inbox
            note.box = None
            note.ai_confidence = 0.0
            note.save(update_fields=["box", "ai_confidence"])
            return {
                "status": "completed",
                "box_id": None,
                "confidence": 0.0,
            }

        result = classification_service.classify(
            note.transcript, available_boxes, str(note.workspace.id)
        )

        # Atualizar anotação
        box_id = result.get("box_id")
        if box_id:
            try:
                box = Box.objects.get(id=box_id, workspace=note.workspace)
                note.box = box
            except Box.DoesNotExist:
                logger.warning(f"Caixinha {box_id} não encontrada")
                note.box = None
        else:
            note.box = None

        note.ai_confidence = result.get("confidence", 0.0)
        note.save(update_fields=["box", "ai_confidence"])

        return {
            "status": "completed",
            "box_id": box_id,
            "confidence": result.get("confidence", 0.0),
        }

    except Note.DoesNotExist:
        logger.error(f"Anotação {note_id} não encontrada")
        return {
            "status": "failed",
            "error": "Anotação não encontrada",
        }
    except Exception as e:
        logger.error(f"Erro ao classificar anotação {note_id}: {str(e)}", exc_info=True)
        return {
            "status": "failed",
            "error": str(e),
        }


@shared_task
def cleanup_expired_audios() -> Dict[str, Any]:
    """Remove arquivos de áudio expirados (após 7 dias).

    Returns:
        {
            "status": "completed",
            "deleted_count": 5,
            "errors": [],
        }
    """
    from django.utils import timezone
    from datetime import timedelta

    deleted_count = 0
    errors = []

    try:
        # Buscar anotações com áudio criado há mais de 7 dias
        expiration_date = timezone.now() - timedelta(days=7)
        expired_notes = Note.objects.filter(
            created_at__lt=expiration_date,
            audio_file__isnull=False,
        )

        for note in expired_notes:
            try:
                # Deletar arquivo do storage
                if note.audio_file:
                    note.audio_file.delete(save=False)

                # Limpar referência no model
                note.audio_file = None
                note.save(update_fields=["audio_file"])

                deleted_count += 1
                logger.info(f"Áudio expirado deletado: {note.id}")
            except Exception as e:
                error_msg = f"Erro ao deletar áudio {note.id}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        return {
            "status": "completed",
            "deleted_count": deleted_count,
            "errors": errors,
        }

    except Exception as e:
        logger.error(f"Erro ao limpar áudios expirados: {str(e)}", exc_info=True)
        return {
            "status": "failed",
            "error": str(e),
            "deleted_count": deleted_count,
            "errors": errors,
        }


