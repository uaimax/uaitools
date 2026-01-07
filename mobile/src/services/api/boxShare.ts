/**
 * Serviço de API para compartilhamento de caixinhas
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/config';

export interface BoxShare {
  id: string;
  box: string;
  box_name: string;
  shared_with: string;
  shared_with_email: string;
  permission: 'read' | 'write';
  invited_by?: string;
  invited_by_email?: string;
  status: 'pending' | 'accepted';
  created_at: string;
  accepted_at?: string;
}

export interface BoxShareInvite {
  id: string;
  email: string;
  permission: 'read' | 'write';
  expires_at: string;
  created_at: string;
}

/**
 * Lista compartilhamentos de uma caixinha
 */
export async function getBoxShares(boxId: string): Promise<BoxShare[]> {
  const response = await apiClient.get<BoxShare[]>(
    `${API_ENDPOINTS.boxes}${boxId}/shares/`
  );
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Compartilha caixinha com usuário ou envia convite por email
 */
export async function shareBox(data: {
  boxId: string;
  user_id?: string;
  email?: string;
  permission?: 'read' | 'write';
}): Promise<BoxShare | { message: string; invite_id: string }> {
  const response = await apiClient.post(
    `${API_ENDPOINTS.boxes}${data.boxId}/share/`,
    {
      user_id: data.user_id,
      email: data.email,
      permission: data.permission || 'read',
    }
  );
  return response.data;
}

/**
 * Atualiza permissão de compartilhamento
 */
export async function updateSharePermission(
  boxId: string,
  shareId: string,
  permission: 'read' | 'write'
): Promise<BoxShare> {
  const response = await apiClient.patch<BoxShare>(
    `${API_ENDPOINTS.boxes}${boxId}/shares/${shareId}/`,
    { permission }
  );
  return response.data;
}

/**
 * Remove compartilhamento
 */
export async function removeShare(boxId: string, shareId: string): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.boxes}${boxId}/shares/${shareId}/`);
}

