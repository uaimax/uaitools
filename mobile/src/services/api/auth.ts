/**
 * Serviço de autenticação
 */

import { apiClient } from './client';
import { API_ENDPOINTS, API_BASE_URL } from '@/constants/config';
import type { LoginRequest, RegisterRequest, LoginResponse, User } from '@/types';

/**
 * Faz login com email e senha
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  // #region agent log
  console.log('[DEBUG] Login function entry', { endpoint: API_ENDPOINTS.login, email: credentials.email, API_BASE_URL });
  // #endregion

  // #region agent log - Testar conectividade primeiro
  const testUrl = `${API_BASE_URL}/api/v1/health/`;
  console.log('[DEBUG] Testing connectivity before login', { testUrl });
  try {
    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    console.log('[DEBUG] Connectivity test SUCCESS before login', { status: testResponse.status, ok: testResponse.ok });
  } catch (testError: any) {
    console.error('[DEBUG] Connectivity test FAILED before login', { error: testError.message, testUrl });
  }
  // #endregion

  try {
    const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.login, credentials);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth.ts:16',message:'Login success',data:{status:response.status,hasAccess:!!response.data.access,hasUser:!!response.data.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    return response.data;
  } catch (error: any) {
  // #region agent log
  const logData5 = {location:'auth.ts:23',message:'Login error caught',data:{status:error.response?.status,statusText:error.response?.statusText,data:error.response?.data,message:error.message,fullError:JSON.stringify(error.response?.data)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'};
  console.log('[DEBUG LOGIN ERROR]', JSON.stringify(logData5, null, 2));
  fetch('http://127.0.0.1:7243/ingest/8a2091d5-0f0b-4303-b859-a6756e62cd84',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData5)}).catch((e)=>console.error('[DEBUG FETCH ERROR]',e));
  // #endregion
    throw error;
  }
}

/**
 * Registra novo usuário
 */
export async function register(data: RegisterRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(API_ENDPOINTS.register, data);
  return response.data;
}

/**
 * Busca perfil do usuário atual
 */
export async function getProfile(): Promise<User> {
  const response = await apiClient.get<User>(API_ENDPOINTS.profile);
  return response.data;
}

/**
 * Solicita reset de senha
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.passwordResetRequest, { email });
}

/**
 * Confirma reset de senha
 */
export async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<void> {
  await apiClient.post(API_ENDPOINTS.passwordResetConfirm, {
    token,
    new_password: newPassword,
  });
}

