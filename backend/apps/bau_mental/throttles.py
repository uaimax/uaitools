"""Throttles customizados para bau_mental."""

import os
from apps.core.throttles import WorkspaceRateThrottle


class BauMentalUploadThrottle(WorkspaceRateThrottle):
    """Throttle para uploads de áudio.

    Limite configurável via variável de ambiente BAU_MENTAL_UPLOAD_RATE.
    Padrão: 10 uploads/hora por workspace.
    Para desabilitar em desenvolvimento: BAU_MENTAL_UPLOAD_RATE=1000/hour
    """

    scope = "bau_mental_upload"

    def get_rate(self) -> str:
        """Limite configurável via variável de ambiente."""
        # Permitir override via variável de ambiente
        rate = os.environ.get("BAU_MENTAL_UPLOAD_RATE", "10/hour")
        return rate


class BauMentalQueryThrottle(WorkspaceRateThrottle):
    """Throttle para consultas com IA.

    Limite: 50 consultas/hora por workspace.
    """

    scope = "bau_mental_query"

    def get_rate(self) -> str:
        """Limite: 50 consultas/hora por workspace."""
        return "50/hour"


