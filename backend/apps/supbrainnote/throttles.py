"""Throttles customizados para SupBrainNote."""

from apps.core.throttles import WorkspaceRateThrottle


class SupBrainNoteUploadThrottle(WorkspaceRateThrottle):
    """Throttle para uploads de áudio.

    Limite: 10 uploads/hora por workspace.
    """

    scope = "supbrainnote_upload"

    def get_rate(self) -> str:
        """Limite: 10 uploads/hora por workspace."""
        return "10/hour"


class SupBrainNoteQueryThrottle(WorkspaceRateThrottle):
    """Throttle para consultas com IA.

    Limite: 50 consultas/hora por workspace.
    """

    scope = "supbrainnote_query"

    def get_rate(self) -> str:
        """Limite: 50 consultas/hora por workspace."""
        return "50/hour"

