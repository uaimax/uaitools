/**
 * Configurações da aplicação
 */

/**
 * Obtém URL base da API
 *
 * Em desenvolvimento: usa EXPO_PUBLIC_API_URL do .env ou localhost:8000
 * Em produção: usa EXPO_PUBLIC_API_URL do .env (obrigatório)
 *
 * Suporta:
 * - URL completa: https://api.seudominio.com
 * - URL com porta: http://192.168.1.100:8000
 * - URL relativa: /api (não recomendado para mobile)
 */
const getApiUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!envUrl) {
    // Sem variável de ambiente: usa localhost (apenas desenvolvimento)
    if (__DEV__) {
      // Em desenvolvimento, tenta detectar se está rodando no dispositivo físico
      // Se estiver, precisa usar IP local ao invés de localhost
      // Por enquanto, retorna localhost (funciona apenas em emulador)
      return 'http://localhost:8001';
    }
    // Em produção, se não tiver configurado, usa uma URL padrão
    // Isso evita crash, mas o app não funcionará até configurar corretamente
    console.warn(
      '[CONFIG] EXPO_PUBLIC_API_URL não configurada. Usando URL padrão. Configure no app.json ou eas.json'
    );
    // URL padrão - deve ser configurada via app.json ou eas.json
    return 'https://ut-be.app.webmaxdigital.com';
  }

  // Remove trailing slash
  return envUrl.replace(/\/$/, '');
};

export const API_BASE_URL = getApiUrl();

/**
 * Sentry/GlitchTip DSN para monitoramento de erros
 * Configurar via EXPO_PUBLIC_SENTRY_DSN no .env
 */
export const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

// #region agent log
if (typeof fetch !== 'undefined') {
  fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'config.ts:36',message:'API_BASE_URL initialized',data:{apiBaseUrl:getApiUrl(),envUrl:process.env.EXPO_PUBLIC_API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
}
// #endregion

export const API_ENDPOINTS = {
  // Auth
  login: '/api/v1/auth/login/',
  register: '/api/v1/auth/register/',
  profile: '/api/v1/auth/profile/',
  passwordResetRequest: '/api/v1/auth/password-reset-request/',
  passwordResetConfirm: '/api/v1/auth/password-reset-confirm/',

  // Notes
  notes: '/api/v1/bau-mental/notes/',
  noteUpload: '/api/v1/bau-mental/notes/upload/',
  noteRecord: '/api/v1/bau-mental/notes/record/',
  noteMove: (id: string) => `/api/v1/bau-mental/notes/${id}/move/`,

  // Boxes
  boxes: '/api/v1/bau-mental/boxes/',

  // Query
  query: '/api/v1/bau-mental/query/',

  // Notifications
  notifications: '/api/v1/notifications/',
} as const;

// Timeouts
export const TIMEOUTS = {
  api: 30000, // 30 segundos
  recording: 600, // 10 minutos máximo
  processing: 15000, // 15 segundos para processamento
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  authTokens: 'auth_tokens',
  workspaceId: 'workspace_id',
  onboardingComplete: 'onboarding_complete',
} as const;

