/**
 * Serviço de API para caixinhas
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/config';
import type { Box, CreateBoxRequest, UpdateBoxRequest } from '@/types';

/**
 * Lista todas as caixinhas
 */
export async function getBoxes(): Promise<Box[]> {
  const response = await apiClient.get<{ results?: Box[] } | Box[]>(API_ENDPOINTS.boxes);

  // DRF pode retornar paginado (com results) ou array direto
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Se for objeto paginado, retornar results
  if (response.data && typeof response.data === 'object' && 'results' in response.data) {
    return (response.data as { results: Box[] }).results || [];
  }

  // Fallback: retornar array vazio
  return [];
}

/**
 * Busca detalhes de uma caixinha
 */
export async function getBox(boxId: string): Promise<Box> {
  const response = await apiClient.get<Box>(`${API_ENDPOINTS.boxes}${boxId}/`);
  return response.data;
}

/**
 * Cria uma nova caixinha
 */
export async function createBox(data: CreateBoxRequest): Promise<Box> {
  const response = await apiClient.post<Box>(API_ENDPOINTS.boxes, data);
  return response.data;
}

/**
 * Atualiza uma caixinha
 */
export async function updateBox(
  boxId: string,
  data: UpdateBoxRequest
): Promise<Box> {
  const response = await apiClient.patch<Box>(`${API_ENDPOINTS.boxes}${boxId}/`, data);
  return response.data;
}

/**
 * Exclui uma caixinha
 */
export async function deleteBox(boxId: string): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.boxes}${boxId}/`);
}

