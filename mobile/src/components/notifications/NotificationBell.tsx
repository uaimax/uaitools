/**
 * Componente de sininho de notificações
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react-native';
import { Modal } from '@/components/common';
import { useNotifications } from '@/hooks/useNotifications';
import { colors, typography, spacing, elevation } from '@/theme';
import type { Notification } from '@/services/api/notifications';

interface NotificationBellProps {
  onNotificationPress?: (notification: Notification) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNotificationPress,
}) => {
  const [showModal, setShowModal] = useState(false);
  const { notifications, unreadCount, refreshing, refresh, markAsRead, markAllAsRead, deleteNotification, dismissBoxNotifications } = useNotifications();

  const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `há ${hours} hora${hours > 1 ? 's' : ''}`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `há ${days} dia${days > 1 ? 's' : ''}`;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => setShowModal(true)}
      >
        <Bell size={24} color={colors.text.secondary} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={showModal} onClose={() => setShowModal(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Notificações</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllAsRead}
              style={styles.markAllButton}
            >
              <CheckCheck size={16} color={colors.primary.default} />
              <Text style={styles.markAllText}>Marcar todas</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhuma notificação</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.read && styles.notificationItemUnread,
                ]}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatTimeAgo(notification.created_at)}
                  </Text>
                </View>
                <View style={styles.notificationActions}>
                  {!notification.read && (
                    <TouchableOpacity
                      onPress={() => markAsRead(notification.id)}
                      style={styles.actionButton}
                    >
                      <Check size={16} color={colors.primary.default} />
                    </TouchableOpacity>
                  )}
                  {notification.related_box && (
                    <TouchableOpacity
                      onPress={() => dismissBoxNotifications(notification.id)}
                      style={styles.actionButton}
                    >
                      <X size={16} color={colors.text.secondary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => deleteNotification(notification.id)}
                    style={styles.actionButton}
                  >
                    <Trash2 size={16} color={colors.semantic.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bellButton: {
    padding: spacing[2],
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.semantic.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  badgeText: {
    ...typography.captionSmall,
    color: colors.text.primary,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  modalTitle: {
    ...typography.title2,
    color: colors.text.primary,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  markAllText: {
    ...typography.caption,
    color: colors.primary.default,
  },
  scrollView: {
    maxHeight: 500,
  },
  emptyState: {
    padding: spacing[8],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing[3],
    marginBottom: spacing[2],
    backgroundColor: colors.bg.elevated,
    borderRadius: 8,
    ...elevation[1],
  },
  notificationItemUnread: {
    backgroundColor: `${colors.primary.default}20`,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.default,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  notificationTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary.default,
  },
  notificationMessage: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },
  notificationTime: {
    ...typography.captionSmall,
    color: colors.text.tertiary,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  actionButton: {
    padding: spacing[1],
  },
});

