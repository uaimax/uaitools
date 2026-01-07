"""Autenticação customizada para APIs REST."""

from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Autenticação de sessão que NÃO verifica CSRF.

    Usado para APIs REST que usam JWT como autenticação principal.
    A verificação de CSRF é desnecessária para APIs REST porque:
    1. APIs usam tokens (JWT) no header Authorization
    2. Tokens não são enviados automaticamente pelo browser (diferente de cookies)
    3. Isso protege naturalmente contra CSRF

    Referência: https://www.django-rest-framework.org/api-guide/authentication/#sessionauthentication
    """

    def enforce_csrf(self, request):
        """Pula verificação de CSRF para APIs REST."""
        # Não faz nada - pula verificação de CSRF
        return


