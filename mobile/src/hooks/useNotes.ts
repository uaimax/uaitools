/**
 * Hook para gerenciar notas
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getNotes, NotesFilters } from '@/services/api/notes';
import { Note } from '@/types';
import { getErrorMessage } from '@/utils/errorHandler';

interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

const POLLING_INTERVAL = 4000; // 4 segundos
const MAX_POLLING_ATTEMPTS = 60; // Máximo 4 minutos (60 * 4s)

export function useNotes(filters?: NotesFilters): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef<Map<string, number>>(new Map());
  const notesRef = useRef<Note[]>([]);

  // Estabiliza o objeto de filtros para evitar re-renderizações infinitas
  const stableFilters = useMemo(() => filters, [
    filters?.box,
    filters?.inbox,
    filters?.status,
    filters?.search,
  ]);

  const loadNotes = useCallback(async () => {
    // Previne múltiplas requisições simultâneas
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      const data = await getNotes(stableFilters);
      setNotes(data);
      notesRef.current = data; // Atualizar ref também

      // #region agent log
      console.log('[useNotes] Notas carregadas', {
        count: data.length,
        pending: data.filter(n => n.processing_status === 'pending' || n.processing_status === 'processing').length,
      });
      // #endregion
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      console.error('Erro ao carregar notas:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [stableFilters]);

  // Verifica se há notas pendentes de processamento
  const hasPendingNotes = useCallback((currentNotes: Note[]): boolean => {
    return currentNotes.some(
      note => note.processing_status === 'pending' || note.processing_status === 'processing'
    );
  }, []);

  // Polling automático para notas pendentes
  const startPolling = useCallback(() => {
    // Limpar polling anterior se existir
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // #region agent log
    console.log('[useNotes] Iniciando polling para notas pendentes');
    // #endregion

    pollingIntervalRef.current = setInterval(async () => {
      // Usar ref para obter valor mais recente das notas
      const currentNotes = notesRef.current;

      // Verificar se ainda há notas pendentes
      if (!hasPendingNotes(currentNotes)) {
        // #region agent log
        console.log('[useNotes] Todas as notas foram processadas, parando polling');
        // #endregion
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        pollingAttemptsRef.current.clear();
        return;
      }

      // Verificar tentativas máximas para cada nota pendente
      const pendingNoteIds = currentNotes
        .filter(n => n.processing_status === 'pending' || n.processing_status === 'processing')
        .map(n => n.id);

      // Incrementar contador de tentativas
      pendingNoteIds.forEach(noteId => {
        const attempts = pollingAttemptsRef.current.get(noteId) || 0;
        pollingAttemptsRef.current.set(noteId, attempts + 1);

        if (attempts >= MAX_POLLING_ATTEMPTS) {
          // #region agent log
          console.warn(`[useNotes] Máximo de tentativas atingido para nota ${noteId}`);
          // #endregion
        }
      });

      // Parar polling se todas as notas atingiram o máximo
      const allMaxed = pendingNoteIds.length > 0 && pendingNoteIds.every(
        noteId => (pollingAttemptsRef.current.get(noteId) || 0) >= MAX_POLLING_ATTEMPTS
      );

      if (allMaxed) {
        // #region agent log
        console.log('[useNotes] Todas as notas atingiram máximo de tentativas, parando polling');
        // #endregion
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        pollingAttemptsRef.current.clear();
        return;
      }

      // Fazer refresh apenas se não estiver carregando
      if (!loadingRef.current) {
        // #region agent log
        console.log('[useNotes] Polling: atualizando notas pendentes', {
          pendingCount: pendingNoteIds.length,
        });
        // #endregion
        await loadNotes();
      }
    }, POLLING_INTERVAL);
  }, [hasPendingNotes, loadNotes]);

  // Iniciar polling quando há notas pendentes
  useEffect(() => {
    if (notes.length > 0 && hasPendingNotes(notes)) {
      startPolling();
    } else {
      // Parar polling se não há mais notas pendentes
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        pollingAttemptsRef.current.clear();
      }
    }

    // Cleanup ao desmontar
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      pollingAttemptsRef.current.clear();
    };
  }, [notes, hasPendingNotes, startPolling]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const refresh = useCallback(async () => {
    // Resetar contadores de tentativas ao fazer refresh manual
    pollingAttemptsRef.current.clear();
    await loadNotes();
  }, [loadNotes]);

  const loadMore = useCallback(async () => {
    // TODO: Implementar paginação quando backend suportar
    // Por enquanto, apenas recarrega
    await loadNotes();
  }, [loadNotes]);

  return {
    notes,
    loading,
    error,
    refresh,
    loadMore,
  };
}

