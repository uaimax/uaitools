/**
 * Hook para gerenciar gravação de áudio
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  startRecording,
  stopRecording,
  cancelRecording,
  getRecordingStatus,
  requestPermissions,
} from '@/services/audio/recorder';
import { haptic } from '@/utils/haptics';

export type RecordingState = 'idle' | 'recording' | 'processing';

interface UseRecordingReturn {
  state: RecordingState;
  duration: number;
  start: () => Promise<void>;
  stop: () => Promise<string | null>;
  cancel: () => Promise<void>;
}

export function useRecording(): UseRecordingReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Atualiza duração enquanto grava
  useEffect(() => {
    if (state === 'recording') {
      intervalRef.current = setInterval(async () => {
        const status = await getRecordingStatus();
        if (status?.durationMillis) {
          setDuration(Math.floor(status.durationMillis / 1000));
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setDuration(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state]);

  const start = useCallback(async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        throw new Error('Permissão de microfone negada');
      }

      haptic.heavy();
      await startRecording();
      setState('recording');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      throw error;
    }
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    try {
      setState('processing');
      haptic.medium();
      const uri = await stopRecording();
      setState('idle');
      return uri;
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
      setState('idle');
      return null;
    }
  }, []);

  const cancel = useCallback(async () => {
    try {
      haptic.light();
      await cancelRecording();
      setState('idle');
    } catch (error) {
      console.error('Erro ao cancelar gravação:', error);
      setState('idle');
    }
  }, []);

  return {
    state,
    duration,
    start,
    stop,
    cancel,
  };
}

