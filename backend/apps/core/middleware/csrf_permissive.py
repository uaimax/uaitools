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

    def process_request(self, request):
        """Adiciona origem dinamicamente ao CSRF_TRUSTED_ORIGINS em modo permissivo."""
        # Se está em modo permissivo, adicionar origem do request dinamicamente
        if "*" in settings.ALLOWED_HOSTS and not settings.CSRF_TRUSTED_ORIGINS:
            origin = request.META.get("HTTP_ORIGIN")
            referer = request.META.get("HTTP_REFERER", "")

            logger.info(f"[CSRF Permissivo] process_request - Origin: {origin}, Referer: {referer}")

            # Extrair origem do referer se não houver origin header
            if not origin and referer:
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(referer)
                    if parsed.scheme and parsed.netloc:
                        origin = f"{parsed.scheme}://{parsed.netloc}"
                        logger.info(f"[CSRF Permissivo] Origem extraída do referer: {origin}")
                except Exception as e:
                    logger.warning(f"[CSRF Permissivo] Erro ao extrair origem do referer: {e}")

            # Se temos uma origem HTTPS, adicionar temporariamente ao CSRF_TRUSTED_ORIGINS
            if origin and origin.startswith("https://"):
                # Remover trailing slash se existir
                origin = origin.rstrip("/")

                # Adicionar temporariamente à lista (apenas para este request)
                # Criar nova lista para não modificar a original (thread-safe)
                current_origins = list(settings.CSRF_TRUSTED_ORIGINS)
                if origin not in current_origins:
                    current_origins.append(origin)
                    # Modificar settings (isso é thread-local em Django)
                    settings.CSRF_TRUSTED_ORIGINS = current_origins
                    logger.info(f"[CSRF Permissivo] ✅ Origem adicionada dinamicamente: {origin}")
                    logger.info(f"[CSRF Permissivo] CSRF_TRUSTED_ORIGINS agora: {settings.CSRF_TRUSTED_ORIGINS}")

        # Chamar método padrão
        return super().process_request(request)

    def _origin_verified(self, request):
        """Verifica se a origem é confiável.

        Se ALLOWED_HOSTS=* e CSRF_TRUSTED_ORIGINS está vazio,
        permite qualquer origem HTTPS.
        """
        # Se CSRF_TRUSTED_ORIGINS está configurado normalmente, usar verificação padrão
        if settings.CSRF_TRUSTED_ORIGINS and len(settings.CSRF_TRUSTED_ORIGINS) > 0:
            # Verificar se não é apenas placeholder
            if settings.CSRF_TRUSTED_ORIGINS != ["https://"]:
                # Modo normal: usar verificação padrão do Django
                return super()._origin_verified(request)

        # Modo permissivo temporário: se ALLOWED_HOSTS=*, permitir qualquer origem HTTPS
        if "*" in settings.ALLOWED_HOSTS:
            origin = request.META.get("HTTP_ORIGIN")
            referer = request.META.get("HTTP_REFERER", "")

            logger.info(f"[CSRF Permissivo] Verificando origem - Origin: {origin}, Referer: {referer}")

            if origin:
                # Permitir qualquer origem HTTPS
                if origin.startswith("https://"):
                    logger.info(f"[CSRF Permissivo] ✅ Origem HTTPS permitida: {origin}")
                    return True
                else:
                    logger.warning(f"[CSRF Permissivo] ⚠️  Origem não HTTPS rejeitada: {origin}")
                    return False

            # Se não há origem, verificar referer
            if referer and referer.startswith("https://"):
                logger.info(f"[CSRF Permissivo] ✅ Referer HTTPS permitido: {referer}")
                return True

            # Se não há origem nem referer (ex: mesma origem), permitir
            logger.info(f"[CSRF Permissivo] ✅ Sem origem/referer - permitindo (mesma origem)")
            return True

        # Se não é modo permissivo, usar verificação padrão
        return super()._origin_verified(request)
