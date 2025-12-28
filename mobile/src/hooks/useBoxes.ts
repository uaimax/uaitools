/**
 * Hook para gerenciar caixinhas
 */

import { useState, useCallback, useEffect } from 'react';
import { getBoxes, createBox, updateBox, deleteBox } from '@/services/api/boxes';
import { Box, CreateBoxRequest, UpdateBoxRequest } from '@/types';

interface UseBoxesReturn {
  boxes: Box[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (data: CreateBoxRequest) => Promise<Box>;
  update: (id: string, data: UpdateBoxRequest) => Promise<Box>;
  remove: (id: string) => Promise<void>;
}

export function useBoxes(): UseBoxesReturn {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBoxes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBoxes();
      setBoxes(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar caixinhas');
      console.error('Erro ao carregar caixinhas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoxes();
  }, [loadBoxes]);

  const refresh = useCallback(async () => {
    await loadBoxes();
  }, [loadBoxes]);

  const create = useCallback(async (data: CreateBoxRequest): Promise<Box> => {
    try {
      const newBox = await createBox(data);
      setBoxes((prev) => [...prev, newBox]);
      return newBox;
    } catch (err: any) {
      console.error('Erro ao criar caixinha:', err);
      throw err;
    }
  }, []);

  const update = useCallback(
    async (id: string, data: UpdateBoxRequest): Promise<Box> => {
      try {
        const updatedBox = await updateBox(id, data);
        setBoxes((prev) => prev.map((b) => (b.id === id ? updatedBox : b)));
        return updatedBox;
      } catch (err: any) {
        console.error('Erro ao atualizar caixinha:', err);
        throw err;
      }
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteBox(id);
      setBoxes((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      console.error('Erro ao excluir caixinha:', err);
      throw err;
    }
  }, []);

  return {
    boxes,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  };
}

