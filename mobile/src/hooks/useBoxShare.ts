/**
 * Hook para gerenciar compartilhamento de caixinhas
 */

import { useState, useCallback } from 'react';
import {
  getBoxShares,
  shareBox,
  updateSharePermission,
  removeShare,
  type BoxShare,
} from '@/services/api/boxShare';
import { useToast } from '@/context/ToastContext';

interface UseBoxShareReturn {
  shares: BoxShare[];
  loading: boolean;
  loadShares: (boxId: string) => Promise<void>;
  share: (data: {
    boxId: string;
    user_id?: string;
    email?: string;
    permission?: 'read' | 'write';
  }) => Promise<void>;
  updatePermission: (
    boxId: string,
    shareId: string,
    permission: 'read' | 'write'
  ) => Promise<void>;
  remove: (boxId: string, shareId: string) => Promise<void>;
}

export function useBoxShare(): UseBoxShareReturn {
  const { showToast } = useToast();
  const [shares, setShares] = useState<BoxShare[]>([]);
  const [loading, setLoading] = useState(false);

  const loadShares = useCallback(
    async (boxId: string) => {
      try {
        setLoading(true);
        const data = await getBoxShares(boxId);
        setShares(data);
      } catch (error: any) {
        console.error('Erro ao carregar compartilhamentos:', error);
        showToast('Erro ao carregar compartilhamentos', 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const handleShare = useCallback(
    async (data: {
      boxId: string;
      user_id?: string;
      email?: string;
      permission?: 'read' | 'write';
    }) => {
      try {
        await shareBox(data);
        await loadShares(data.boxId);
        showToast(
          data.email
            ? 'Convite enviado com sucesso!'
            : 'Caixinha compartilhada com sucesso!',
          'success'
        );
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          'Não foi possível compartilhar a caixinha.';
        showToast(errorMessage, 'error');
      }
    },
    [loadShares, showToast]
  );

  const handleUpdatePermission = useCallback(
    async (boxId: string, shareId: string, permission: 'read' | 'write') => {
      try {
        await updateSharePermission(boxId, shareId, permission);
        await loadShares(boxId);
        showToast('Permissão atualizada com sucesso!', 'success');
      } catch (error: any) {
        showToast('Não foi possível atualizar a permissão.', 'error');
      }
    },
    [loadShares, showToast]
  );

  const handleRemove = useCallback(
    async (boxId: string, shareId: string) => {
      try {
        await removeShare(boxId, shareId);
        await loadShares(boxId);
        showToast('Compartilhamento removido com sucesso!', 'success');
      } catch (error: any) {
        showToast('Não foi possível remover o compartilhamento.', 'error');
      }
    },
    [loadShares, showToast]
  );

  return {
    shares,
    loading,
    loadShares,
    share: handleShare,
    updatePermission: handleUpdatePermission,
    remove: handleRemove,
  };
}

