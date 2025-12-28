"""Throttles customizados para SupBrainNote."""

import os
from apps.core.throttles import WorkspaceRateThrottle


class SupBrainNoteUploadThrottle(WorkspaceRateThrottle):
    """Throttle para uploads de áudio.

    Limite configurável via variável de ambiente SUPBRAINNOTE_UPLOAD_RATE.
    Padrão: 10 uploads/hora por workspace.
    Para desabilitar em desenvolvimento: SUPBRAINNOTE_UPLOAD_RATE=1000/hour
    """

    scope = "supbrainnote_upload"

    def get_rate(self) -> str:
        """Limite configurável via variável de ambiente."""
        # Permitir override via variável de ambiente
        rate = os.environ.get("SUPBRAINNOTE_UPLOAD_RATE", "10/hour")
        return rate


class SupBrainNoteQueryThrottle(WorkspaceRateThrottle):
    """Throttle para consultas com IA.

    Limite: 50 consultas/hora por workspace.
    """

    scope = "supbrainnote_query"

    def get_rate(self) -> str:
        """Limite: 50 consultas/hora por workspace."""
        return "50/hour"


