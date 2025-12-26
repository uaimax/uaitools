"""Traduções compartilhadas entre todos os apps.

Evita retraduzir termos comuns em múltiplos apps.
"""

from django.utils.translation import gettext_lazy as _

# Ações comuns (reutilizáveis)
COMMON_ACTIONS = {
    "save": _("Save"),
    "cancel": _("Cancel"),
    "delete": _("Delete"),
    "edit": _("Edit"),
    "create": _("Create"),
    "update": _("Update"),
    "search": _("Search"),
    "filter": _("Filter"),
    "export": _("Export"),
    "import": _("Import"),
    "close": _("Close"),
    "confirm": _("Confirm"),
    "back": _("Back"),
    "next": _("Next"),
    "previous": _("Previous"),
}

# Mensagens de erro comuns
COMMON_ERRORS = {
    "required": _("Field is required"),
    "invalid_email": _("Invalid email"),
    "invalid_phone": _("Invalid phone"),
    "min_length": _("Minimum length is %(min)s characters"),
    "max_length": _("Maximum length is %(max)s characters"),
    "not_found": _("Record not found"),
    "unauthorized": _("Unauthorized"),
    "forbidden": _("Access denied"),
    "server_error": _("Internal server error"),
    "network_error": _("Network error"),
    "unknown": _("An unknown error occurred"),
}

# Status comuns
COMMON_STATUS = {
    "active": _("Active"),
    "inactive": _("Inactive"),
    "pending": _("Pending"),
    "completed": _("Completed"),
    "cancelled": _("Cancelled"),
}



