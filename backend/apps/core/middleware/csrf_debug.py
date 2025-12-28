"""Middleware de debug para CSRF - captura informações durante verificação."""

import json
import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("django")


class CsrfDebugMiddleware(MiddlewareMixin):
    """Middleware que adiciona logs detalhados sobre verificação CSRF."""

    def process_request(self, request):
        """Captura informações do request antes da verificação CSRF."""
        # #region agent log
        log_data = {
            "method": request.method,
            "path": request.path,
            "origin": request.headers.get("Origin", "N/A"),
            "referer": request.headers.get("Referer", "N/A"),
            "host": request.get_host(),
            "x_forwarded_proto": request.headers.get("X-Forwarded-Proto", "N/A"),
            "x_forwarded_for": request.headers.get("X-Forwarded-For", "N/A"),
        }
        with open("/home/uaimax/projects/uaitools/.cursor/debug.log", "a") as f:
            f.write(json.dumps({
                "location": "csrf_debug.py:process_request",
                "message": "Request recebido - antes CSRF",
                "data": log_data,
                "timestamp": __import__("time").time() * 1000,
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "A"
            }) + "\n")
        # #endregion

        # Importar settings aqui para garantir que está carregado
        from django.conf import settings
        # #region agent log
        log_data = {
            "csrf_trusted_origins": list(settings.CSRF_TRUSTED_ORIGINS),
            "csrf_trusted_origins_count": len(settings.CSRF_TRUSTED_ORIGINS),
            "csrf_trusted_origins_type": type(settings.CSRF_TRUSTED_ORIGINS).__name__,
        }
        with open("/home/uaimax/projects/uaitools/.cursor/debug.log", "a") as f:
            f.write(json.dumps({
                "location": "csrf_debug.py:process_request",
                "message": "CSRF_TRUSTED_ORIGINS no momento do request",
                "data": log_data,
                "timestamp": __import__("time").time() * 1000,
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "B"
            }) + "\n")
        # #endregion

        return None

    def process_response(self, request, response):
        """Captura informações após processamento CSRF."""
        if response.status_code == 403 and "CSRF" in str(response.content):
            # #region agent log
            from django.conf import settings
            origin = request.headers.get("Origin", "N/A")
            log_data = {
                "status_code": response.status_code,
                "origin_received": origin,
                "csrf_trusted_origins": list(settings.CSRF_TRUSTED_ORIGINS),
                "origin_in_list": origin in settings.CSRF_TRUSTED_ORIGINS,
                "origin_lower": origin.lower() if origin != "N/A" else "N/A",
                "trusted_origins_lower": [o.lower() for o in settings.CSRF_TRUSTED_ORIGINS],
                "origin_in_list_lower": origin.lower() in [o.lower() for o in settings.CSRF_TRUSTED_ORIGINS] if origin != "N/A" else False,
            }
            with open("/home/uaimax/projects/uaitools/.cursor/debug.log", "a") as f:
                f.write(json.dumps({
                    "location": "csrf_debug.py:process_response",
                    "message": "CSRF 403 detectado - análise",
                    "data": log_data,
                    "timestamp": __import__("time").time() * 1000,
                    "sessionId": "debug-session",
                    "runId": "run1",
                    "hypothesisId": "C"
                }) + "\n")
            # #endregion

        return response

