"""Cliente para buscar erros do GlitchTip/Sentry via API REST."""

import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import requests
from django.conf import settings


def parse_dsn(dsn: str) -> Dict[str, Optional[str]]:
    """Extrai informações do DSN do Sentry/GlitchTip.

    Formato do DSN: https://public_key@host/project_id
    Exemplo: https://abc123@app.glitchtip.com/14243

    Returns:
        Dict com 'base_url', 'project_id', 'public_key'
    """
    if not dsn:
        return {
            "base_url": None,
            "project_id": None,
            "public_key": None,
        }

    # Regex para extrair componentes do DSN
    # Formato: protocol://public_key@host/project_id
    pattern = r"^(?P<protocol>https?://)(?P<public_key>[^@]+)@(?P<host>[^/]+)/(?P<project_id>\d+)$"
    match = re.match(pattern, dsn)

    if not match:
        return {
            "base_url": None,
            "project_id": None,
            "public_key": None,
        }

    protocol = match.group("protocol")
    host = match.group("host")
    project_id = match.group("project_id")
    public_key = match.group("public_key")

    # Construir URL base da API
    base_url = f"{protocol}{host}"

    return {
        "base_url": base_url,
        "project_id": project_id,
        "public_key": public_key,
    }


def get_glitchtip_errors(
    limit: int = 50,
    query: Optional[str] = None,
    stats_period: str = "24h",
) -> Dict[str, Any]:
    """Busca erros do GlitchTip/Sentry via API REST.

    Args:
        limit: Número máximo de erros a retornar (padrão: 50)
        query: Query string para filtrar erros (opcional)
        stats_period: Período para estatísticas (padrão: "24h")

    Returns:
        Dict com lista de erros e metadados

    Raises:
        ValueError: Se DSN não estiver configurado ou inválido
        requests.RequestException: Se houver erro na requisição
    """
    use_sentry = getattr(settings, "USE_SENTRY", False)
    sentry_dsn = getattr(settings, "SENTRY_DSN", "")
    sentry_api_token = getattr(settings, "SENTRY_API_TOKEN", None)

    if not use_sentry or not sentry_dsn:
        raise ValueError("GlitchTip/Sentry não está configurado. Configure USE_SENTRY=true e SENTRY_DSN.")

    # Extrair informações do DSN
    dsn_info = parse_dsn(sentry_dsn)

    if not dsn_info["base_url"] or not dsn_info["project_id"]:
        raise ValueError(f"DSN inválido: {sentry_dsn}")

    base_url = dsn_info["base_url"]
    project_id = dsn_info["project_id"]

    # Primeiro, buscar projetos para obter organization slug e project slug
    # A API do Sentry/GlitchTip precisa desses slugs, não apenas o project ID
    projects_url = f"{base_url}/api/0/projects/"

    # Headers de autenticação
    headers = {
        "Content-Type": "application/json",
    }

    # Tentar autenticação
    if sentry_api_token:
        # Token de API (recomendado)
        headers["Authorization"] = f"Bearer {sentry_api_token}"
    elif dsn_info["public_key"]:
        # Tentar usar DSN como autenticação básica (alguns casos funcionam)
        # Formato: Basic base64(public_key:secret_key)
        # Mas geralmente o DSN público não tem secret, então vamos tentar só public_key
        import base64
        auth_string = f"{dsn_info['public_key']}:"
        auth_bytes = auth_string.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
        headers["Authorization"] = f"Basic {auth_b64}"
    else:
        raise ValueError("Token de API não configurado. Configure SENTRY_API_TOKEN no .env")

    # Parâmetros da requisição
    # Não usar project=project_id pois pode não funcionar sem org/project slug
    params: Dict[str, Any] = {
        "statsPeriod": stats_period,
        "per_page": limit,
    }

    if query:
        params["query"] = query

    try:
        # Primeiro, buscar projetos para obter organization slug e project slug
        projects_response = requests.get(projects_url, headers=headers, timeout=10)
        projects_response.raise_for_status()

        projects = projects_response.json()

        # Encontrar o projeto que corresponde ao project_id do DSN
        project = None
        for p in projects:
            if str(p.get("id")) == str(project_id):
                project = p
                break

        if not project:
            raise ValueError(f"Projeto com ID {project_id} não encontrado. Projetos disponíveis: {[p.get('id') for p in projects]}")

        org_slug = project.get("organization", {}).get("slug")
        project_slug = project.get("slug")

        if not org_slug or not project_slug:
            raise ValueError(f"Não foi possível obter organization slug ou project slug do projeto {project_id}")

        # Agora buscar issues usando os slugs corretos
        api_url = f"{base_url}/api/0/projects/{org_slug}/{project_slug}/issues/"

        response = requests.get(
            api_url,
            headers=headers,
            params=params,
            timeout=10,
        )

        response.raise_for_status()

        # Verificar se a resposta é JSON válido
        if not response.text.strip():
            raise ValueError("Resposta vazia da API do GlitchTip")

        try:
            issues = response.json()
        except ValueError as e:
            raise ValueError(f"Resposta não é JSON válido: {response.text[:200]}") from e

        # Formatar resposta
        return {
            "count": len(issues),
            "results": issues,
            "base_url": base_url,
            "project_id": project_id,
            "organization_slug": org_slug,
            "project_slug": project_slug,
        }

    except requests.exceptions.RequestException as e:
        # Se erro de autenticação, sugerir token de API
        if hasattr(e, "response") and e.response is not None and e.response.status_code in (401, 403):
            raise ValueError(
                "Erro de autenticação. Configure SENTRY_API_TOKEN no .env com um token válido. "
                "Crie o token em: Perfil > Tokens de Autenticação no GlitchTip."
            ) from e
        raise


def get_glitchtip_issue_details(issue_id: str) -> Dict[str, Any]:
    """Busca detalhes de um erro específico do GlitchTip/Sentry.

    Args:
        issue_id: ID do erro (issue)

    Returns:
        Dict com detalhes do erro

    Raises:
        ValueError: Se DSN não estiver configurado ou inválido
        requests.RequestException: Se houver erro na requisição
    """
    use_sentry = getattr(settings, "USE_SENTRY", False)
    sentry_dsn = getattr(settings, "SENTRY_DSN", "")
    sentry_api_token = getattr(settings, "SENTRY_API_TOKEN", None)

    if not use_sentry or not sentry_dsn:
        raise ValueError("GlitchTip/Sentry não está configurado.")

    dsn_info = parse_dsn(sentry_dsn)

    if not dsn_info["base_url"]:
        raise ValueError(f"DSN inválido: {sentry_dsn}")

    base_url = dsn_info["base_url"]
    api_url = f"{base_url}/api/0/issues/{issue_id}/"

    headers = {
        "Content-Type": "application/json",
    }

    if sentry_api_token:
        headers["Authorization"] = f"Bearer {sentry_api_token}"
    elif dsn_info["public_key"]:
        import base64
        auth_string = f"{dsn_info['public_key']}:"
        auth_bytes = auth_string.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
        headers["Authorization"] = f"Basic {auth_b64}"
    else:
        raise ValueError("Token de API não configurado.")

    try:
        response = requests.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        if hasattr(e.response, "status_code") and e.response.status_code in (401, 403):
            raise ValueError(
                "Erro de autenticação. Configure SENTRY_API_TOKEN no .env."
            ) from e
        raise


def resolve_glitchtip_issue(issue_id: str) -> Dict[str, Any]:
    """Marca um issue do GlitchTip/Sentry como resolvido.

    Args:
        issue_id: ID do erro (issue) no GlitchTip/Sentry

    Returns:
        Dict com resultado da operação

    Raises:
        ValueError: Se DSN não estiver configurado ou inválido
        requests.RequestException: Se houver erro na requisição
    """
    use_sentry = getattr(settings, "USE_SENTRY", False)
    sentry_dsn = getattr(settings, "SENTRY_DSN", "")
    sentry_api_token = getattr(settings, "SENTRY_API_TOKEN", None)

    if not use_sentry or not sentry_dsn:
        raise ValueError("GlitchTip/Sentry não está configurado.")

    dsn_info = parse_dsn(sentry_dsn)

    if not dsn_info["base_url"]:
        raise ValueError(f"DSN inválido: {sentry_dsn}")

    base_url = dsn_info["base_url"]
    api_url = f"{base_url}/api/0/issues/{issue_id}/"

    headers = {
        "Content-Type": "application/json",
    }

    if sentry_api_token:
        headers["Authorization"] = f"Bearer {sentry_api_token}"
    elif dsn_info["public_key"]:
        import base64
        auth_string = f"{dsn_info['public_key']}:"
        auth_bytes = auth_string.encode("utf-8")
        auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")
        headers["Authorization"] = f"Basic {auth_b64}"
    else:
        raise ValueError("Token de API não configurado.")

    # Dados para marcar como resolvido
    data = {
        "status": "resolved",
    }

    try:
        response = requests.put(api_url, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        if hasattr(e, "response") and e.response is not None and e.response.status_code in (401, 403):
            raise ValueError(
                "Erro de autenticação. Configure SENTRY_API_TOKEN no .env."
            ) from e
        raise

