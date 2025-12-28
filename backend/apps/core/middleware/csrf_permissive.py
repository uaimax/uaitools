"""Middleware temporário para permitir CSRF quando ALLOWED_HOSTS=*.

⚠️ TEMPORÁRIO: Este middleware desabilita a verificação de origem CSRF
quando ALLOWED_HOSTS=* está configurado. Isso é menos seguro e deve ser
removido assim que CSRF_TRUSTED_ORIGINS for configurado adequadamente.
"""

import logging
from django.middleware.csrf import CsrfViewMiddleware
from django.conf import settings

logger = logging.getLogger("django")


class PermissiveCsrfMiddleware(CsrfViewMiddleware):
    """Middleware CSRF permissivo temporário.

    Quando ALLOWED_HOSTS=*, permite qualquer origem HTTPS.
    ⚠️ TEMPORÁRIO: Remover quando CSRF_TRUSTED_ORIGINS estiver configurado.
    """

    def _origin_verified(self, request):
        """Verifica se a origem é confiável.

        Se ALLOWED_HOSTS=* e CSRF_TRUSTED_ORIGINS está vazio ou contém apenas placeholder,
        permite qualquer origem HTTPS.
        """
        # Se CSRF_TRUSTED_ORIGINS está configurado normalmente, usar verificação padrão
        if settings.CSRF_TRUSTED_ORIGINS and settings.CSRF_TRUSTED_ORIGINS != ["https://"]:
            # Modo normal: usar verificação padrão do Django
            return super()._origin_verified(request)

        # Modo permissivo temporário: se ALLOWED_HOSTS=*, permitir qualquer origem HTTPS
        if "*" in settings.ALLOWED_HOSTS:
            origin = request.META.get("HTTP_ORIGIN")
            if origin:
                # Permitir qualquer origem HTTPS
                if origin.startswith("https://"):
                    logger.debug(f"[CSRF Permissivo] ✅ Origem permitida: {origin}")
                    return True
                else:
                    logger.warning(f"[CSRF Permissivo] ⚠️  Origem não HTTPS rejeitada: {origin}")
                    return False
            # Se não há origem (ex: mesma origem), permitir
            return True

        # Se não é modo permissivo, usar verificação padrão
        return super()._origin_verified(request)

