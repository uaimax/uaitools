/**
 * Serviço de armazenamento seguro (tokens)
 */

import * as SecureStore from 'expo-secure-store';
import { AuthTokens } from '@/types';
import { STORAGE_KEYS } from '@/constants/config';

/**
 * Salva tokens de autenticação
 */
export async function saveAuthTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEYS.authTokens, JSON.stringify(tokens));
}

/**
 * Recupera tokens de autenticação
 */
export async function getAuthTokens(): Promise<AuthTokens | null> {
  try {
    const tokensJson = await SecureStore.getItemAsync(STORAGE_KEYS.authTokens);
    if (!tokensJson) return null;
    return JSON.parse(tokensJson) as AuthTokens;
  } catch (error) {
    console.error('Erro ao recuperar tokens:', error);
    return null;
  }
}

/**
 * Remove tokens de autenticação
 */
export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.authTokens);
}

/**
 * Verifica se tokens existem e são válidos
 */
export async function hasValidTokens(): Promise<boolean> {
  const tokens = await getAuthTokens();
  if (!tokens) return false;

  // Verifica se não expirou (com margem de 5 minutos)
  const now = Date.now();
  const expiresAt = tokens.expiresAt;
  const margin = 5 * 60 * 1000; // 5 minutos

  return expiresAt > now + margin;
}


