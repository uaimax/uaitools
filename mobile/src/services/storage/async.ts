/**
 * Serviço de armazenamento assíncrono (preferências)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/config';

/**
 * Salva workspace ID
 */
export async function saveWorkspaceId(workspaceId: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.workspaceId, workspaceId);
}

/**
 * Recupera workspace ID
 */
export async function getWorkspaceId(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEYS.workspaceId);
}

/**
 * Remove workspace ID
 */
export async function clearWorkspaceId(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.workspaceId);
}

/**
 * Marca onboarding como completo
 */
export async function setOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.onboardingComplete, 'true');
}

/**
 * Verifica se onboarding foi completo
 */
export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.onboardingComplete);
  return value === 'true';
}

