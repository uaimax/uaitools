/**
 * Hook para gerenciar notificações
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  dismissBoxNotifications,
  type Notification,
  type NotificationFilters,
} from '@/services/api/notifications';
import { useToast } from '@/context/ToastContext';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  dismissBoxNotifications: (id: string) => Promise<void>;
}

export function useNotifications(filters?: NotificationFilters): UseNotificationsReturn {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(filters);
      setNotifications(data);
    } catch (error: any) {
      console.error('Erro ao carregar notificações:', error);
      showToast('Erro ao carregar notificações', 'error');
    }
  }, [filters, showToast]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error: any) {
      console.error('Erro ao carregar contagem de não lidas:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadNotifications(), loadUnreadCount()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications, loadUnreadCount]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadNotifications(), loadUnreadCount()]);
      setLoading(false);
    };
    load();
  }, [loadNotifications, loadUnreadCount]);

  // Polling a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadUnreadCount();
      if (!refreshing) {
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications, loadUnreadCount, refreshing]);

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsRead(id);
        await refresh();
        showToast('Notificação marcada como lida', 'success');
      } catch (error: any) {
        showToast('Erro ao marcar como lida', 'error');
      }
    },
    [refresh, showToast]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead();
      await refresh();
      showToast('Todas as notificações foram marcadas como lidas', 'success');
    } catch (error: any) {
      showToast('Erro ao marcar todas como lidas', 'error');
    }
  }, [refresh, showToast]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteNotification(id);
        await refresh();
        showToast('Notificação removida', 'success');
      } catch (error: any) {
        showToast('Erro ao remover notificação', 'error');
      }
    },
    [refresh, showToast]
  );

  const handleDismissBox = useCallback(
    async (id: string) => {
      try {
        await dismissBoxNotifications(id);
        await refresh();
        showToast('Notificações desta caixinha foram desativadas', 'success');
      } catch (error: any) {
        showToast('Erro ao desativar notificações', 'error');
      }
    },
    [refresh, showToast]
  );

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refresh,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDelete,
    dismissBoxNotifications: handleDismissBox,
  };
}

