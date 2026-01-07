/**
 * Serviço de API para notificações
 */

import { apiClient } from './client';
import { API_ENDPOINTS } from '@/constants/config';

export interface Notification {
  id: string;
  type: 'box_shared' | 'note_created' | 'note_edited' | 'permission_changed' | 'removed_from_box';
  type_display: string;
  title: string;
  message: string;
  related_box?: string;
  related_box_name?: string;
  related_note?: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationFilters {
  unread?: boolean;
  type?: string;
}

/**
 * Lista notificações com filtros opcionais
 */
export async function getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
  const params = new URLSearchParams();

  if (filters?.unread) {
    params.append('unread', 'true');
  }
  if (filters?.type) {
    params.append('type', filters.type);
  }

  const response = await apiClient.get<{ results?: Notification[] } | Notification[]>(
    `${API_ENDPOINTS.notifications}${params.toString() ? `?${params.toString()}` : ''}`
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  if (response.data && typeof response.data === 'object' && 'results' in response.data) {
    return (response.data as { results: Notification[] }).results || [];
  }

  return [];
}

/**
 * Busca contagem de notificações não lidas
 */
export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications({ unread: true });
  return notifications.length;
}

/**
 * Marca notificação como lida
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
  const response = await apiClient.patch<Notification>(
    `${API_ENDPOINTS.notifications}${notificationId}/read/`
  );
  return response.data;
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllAsRead(): Promise<void> {
  await apiClient.post(`${API_ENDPOINTS.notifications}mark-all-read/`);
}

/**
 * Remove notificação
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete(`${API_ENDPOINTS.notifications}${notificationId}/`);
}

/**
 * Desativa notificações de uma caixinha
 */
export async function dismissBoxNotifications(notificationId: string): Promise<void> {
  await apiClient.post(`${API_ENDPOINTS.notifications}${notificationId}/dismiss-box/`);
}

