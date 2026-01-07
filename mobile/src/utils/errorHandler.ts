/**
 * Utilitários para tratamento de erros da API
 */

/**
 * Extrai mensagem de erro amigável para o usuário
 */
export function getErrorMessage(error: any): string {
  // Se já é uma string, retorna
  if (typeof error === 'string') {
    return error;
  }

  // Se tem mensagem normalizada do cliente API, usa ela
  if (error?.message && typeof error.message === 'string') {
    return error.message;
  }

  // Verifica se é erro de rede
  if (error?.isNetworkError) {
    return 'Erro de conexão. Verifique sua internet.';
  }

  // Verifica se é erro de backend indisponível
  if (error?.isBackendError) {
    return 'Servidor temporariamente indisponível. Tente novamente em instantes.';
  }

  // Verifica se é erro de servidor
  if (error?.isServerError) {
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  }

  // Verifica se é rate limit
  if (error?.isRateLimitError) {
    return 'Muitas requisições. Aguarde um momento e tente novamente.';
  }

  // Tenta extrair mensagem do response
  if (error?.response?.data) {
    const data = error.response.data;

    // Se é objeto com mensagem
    if (typeof data === 'object' && data.message) {
      return data.message;
    }

    // Se é objeto com error
    if (typeof data === 'object' && data.error) {
      return typeof data.error === 'string' ? data.error : 'Erro ao processar requisição';
    }

    // Se é array de erros (Django REST Framework)
    if (Array.isArray(data)) {
      return data.join(', ');
    }

    // Se é string (pode ser HTML de erro do NGINX)
    if (typeof data === 'string' && !data.includes('<!doctype html>')) {
      return data;
    }
  }

  // Mensagem padrão baseada no status
  if (error?.response?.status) {
    const status = error.response.status;
    if (status === 401) {
      return 'Sessão expirada. Faça login novamente.';
    }
    if (status === 403) {
      return 'Você não tem permissão para esta ação.';
    }
    if (status === 404) {
      return 'Recurso não encontrado.';
    }
    if (status === 500) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    if (status === 502 || status === 503) {
      return 'Servidor temporariamente indisponível. Tente novamente em instantes.';
    }
  }

  // Mensagem genérica
  return 'Erro ao processar requisição. Tente novamente.';
}

/**
 * Verifica se o erro é recuperável (pode tentar novamente)
 */
export function isRecoverableError(error: any): boolean {
  // Erros de rede são recuperáveis
  if (error?.isNetworkError) {
    return true;
  }

  // Erros de backend indisponível são recuperáveis
  if (error?.isBackendError) {
    return true;
  }

  // Erros 502/503 são recuperáveis
  if (error?.response?.status === 502 || error?.response?.status === 503) {
    return true;
  }

  // Rate limit é recuperável (após esperar)
  if (error?.isRateLimitError || error?.response?.status === 429) {
    return true;
  }

  // Timeout é recuperável
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return true;
  }

  return false;
}

