"""Filtros e utilitários de logging para segurança."""

import logging

# Campos que contêm dados sensíveis e devem ser redigidos em logs
SENSITIVE_FIELDS = [
    "password",
    "password_confirm",
    "old_password",
    "new_password",
    "token",
    "secret",
    "api_key",
    "access_token",
    "refresh_token",
    "authorization",
    "auth",
    "credentials",
    "private_key",
    "secret_key",
    "api_secret",
    "client_secret",
]


class SensitiveDataFilter(logging.Filter):
    """Remove campos sensíveis de logs para prevenir vazamento de dados.

    Este filtro redige automaticamente campos que contêm dados sensíveis
    (senhas, tokens, chaves) antes que sejam escritos em logs.

    Uso:
        Adicionar ao LOGGING config em settings:

        'filters': {
            'sensitive_data': {
                '()': 'apps.core.logging.SensitiveDataFilter',
            },
        },

        E aplicar nos handlers:
        'handlers': {
            'console': {
                'filters': ['sensitive_data'],
                ...
            },
        },
    """

    def filter(self, record: logging.LogRecord) -> bool:
        """Filtra e redige dados sensíveis do log record."""
        # Redigir em extra (dados estruturados)
        if hasattr(record, "request_data") and isinstance(record.request_data, dict):
            for field in SENSITIVE_FIELDS:
                if field in record.request_data:
                    record.request_data[field] = "***REDACTED***"

        # Redigir em message (string formatada)
        if hasattr(record, "message") and isinstance(record.message, str):
            for field in SENSITIVE_FIELDS:
                # Buscar padrões como "password=xxx" ou "token=xxx"
                import re

                pattern = rf"\b{field}\s*[:=]\s*[^\s,}}]+"
                record.message = re.sub(pattern, f"{field}=***REDACTED***", record.message, flags=re.IGNORECASE)

        # Redigir em args (argumentos formatados)
        if hasattr(record, "args") and record.args:
            new_args = []
            for arg in record.args:
                if isinstance(arg, dict):
                    # Se arg é dict, redigir campos sensíveis
                    redacted_arg = arg.copy()
                    for field in SENSITIVE_FIELDS:
                        if field in redacted_arg:
                            redacted_arg[field] = "***REDACTED***"
                    new_args.append(redacted_arg)
                else:
                    new_args.append(arg)
            record.args = tuple(new_args)

        return True




