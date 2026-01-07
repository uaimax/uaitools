/**
 * Serviço de fila de sincronização offline
 */

import NetInfo from '@react-native-community/netinfo';
import {
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncItemStatus,
  removeSyncItem,
} from '../storage/database';
import { uploadAudio } from '../api/notes';

export type SyncItemType = 'note_upload' | 'note_update' | 'note_delete' | 'box_create';

export interface SyncItem {
  id: string;
  type: SyncItemType;
  payload: any;
  status: 'pending' | 'uploading' | 'failed';
  retryCount: number;
}

const RETRY_DELAYS = [1000, 5000, 30000, 60000, 300000]; // 1s, 5s, 30s, 1min, 5min

/**
 * Adiciona item à fila de sincronização
 */
export async function queueSyncItem(
  type: SyncItemType,
  payload: any
): Promise<void> {
  await addToSyncQueue(type, payload);
}

/**
 * Processa fila de sincronização
 */
export async function processSyncQueue(): Promise<void> {
  const isConnected = (await NetInfo.fetch()).isConnected;
  if (!isConnected) {
    return;
  }

  const pendingItems = await getPendingSyncItems();

  for (const item of pendingItems) {
    try {
      await updateSyncItemStatus(item.id, 'uploading');

      switch (item.type) {
        case 'note_upload':
          await uploadAudio(item.payload.audio_uri, item.payload.box_id);
          break;
        // Outros tipos serão implementados conforme necessário
        default:
          console.warn(`Tipo de sync não implementado: ${item.type}`);
      }

      await removeSyncItem(item.id);
    } catch (error: any) {
      const retryCount = item.retry_count || 0;
      const shouldRetry = retryCount < RETRY_DELAYS.length;

      if (shouldRetry) {
        await updateSyncItemStatus(
          item.id,
          'pending',
          error.message || 'Erro desconhecido'
        );
        // TODO: Agendar retry com delay
      } else {
        await updateSyncItemStatus(item.id, 'failed', error.message);
      }
    }
  }
}

/**
 * Inicia listener de rede para sync automático
 */
export function startNetworkListener(
  onSync: () => void
): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      onSync();
    }
  });

  return unsubscribe;
}


