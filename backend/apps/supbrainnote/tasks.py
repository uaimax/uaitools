"""Celery tasks for supbrainnote app."""

import logging
import os
from typing import Any, Dict

from celery import shared_task

from apps.supbrainnote.models import Box, Note
from apps.supbrainnote.services.classification import ClassificationService
from apps.supbrainnote.services.transcription import TranscriptionService

logger = logging.getLogger("apps")


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
        # Buscar anotação
        note = Note.objects.get(id=note_id)

        # Atualizar status
        note.processing_status = "processing"
        note.save(update_fields=["processing_status"])

        # Verificar se arquivo existe
        if not note.audio_file:
            raise ValueError("Arquivo de áudio não encontrado")

        # Caminho completo do arquivo
        audio_path = note.audio_file.path

        # Transcrever
        transcription_service = TranscriptionService()
        if not transcription_service.is_available():
            raise ValueError("Serviço de transcrição não disponível")

        result = transcription_service.transcribe(audio_path, language="pt")

        # Atualizar anotação
        note.transcript = result["text"]
        note.duration_seconds = result.get("duration")  # Pode ser None
        note.processing_status = "completed"
        note.save(update_fields=["transcript", "duration_seconds", "processing_status"])

        # Disparar classificação automaticamente
        classify_note.delay(note_id)

        return {
            "status": "completed",
            "transcript": result["text"],
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

