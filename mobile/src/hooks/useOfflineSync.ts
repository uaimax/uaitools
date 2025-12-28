/**
 * Hook para gerenciar sincronização offline
 */

import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processSyncQueue, queueSyncItem, SyncItemType } from '@/services/sync/queue';
import { getUnsyncedNotes } from '@/services/storage/database';

interface UseOfflineSyncReturn {
  isOnline: boolean;
  pendingCount: number;
  sync: () => Promise<void>;
  queueItem: (type: SyncItemType, payload: any) => Promise<void>;
}

export function useOfflineSync(): UseOfflineSyncReturn {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Verifica status inicial
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    // Listener de mudanças de rede
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? false;
      setIsOnline(online);

      if (online) {
        // Sync automático quando voltar online
        sync();
      }
    });

    // Atualiza contador periodicamente
    const interval = setInterval(async () => {
      const unsynced = await getUnsyncedNotes();
      setPendingCount(unsynced.length);
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const sync = useCallback(async () => {
    if (!isOnline) return;

    try {
      await processSyncQueue();
      const unsynced = await getUnsyncedNotes();
      setPendingCount(unsynced.length);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }
  }, [isOnline]);

  const queueItem = useCallback(async (type: SyncItemType, payload: any) => {
    await queueSyncItem(type, payload);
    const unsynced = await getUnsyncedNotes();
    setPendingCount(unsynced.length);
  }, []);

  return {
    isOnline,
    pendingCount,
    sync,
    queueItem,
  };
}

