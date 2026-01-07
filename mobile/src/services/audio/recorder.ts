/**
 * Serviço de gravação de áudio
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  uri: string | null;
}

let recording: Audio.Recording | null = null;

/**
 * Solicita permissões de áudio
 */
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissões:', error);
    return false;
  }
}

/**
 * Inicia gravação de áudio
 */
export async function startRecording(): Promise<void> {
  try {
    // Verificar se já há uma gravação em andamento
    if (recording) {
      // Tentar parar e limpar gravação anterior
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      } catch (e) {
        // Ignorar erros ao limpar gravação anterior
        console.warn('Erro ao limpar gravação anterior:', e);
      }
      recording = null;
    }

    // Configura modo de áudio
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Cria nova gravação
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    recording = newRecording;
  } catch (error) {
    console.error('Erro ao iniciar gravação:', error);
    // Limpar referência em caso de erro
    recording = null;
    throw error;
  }
}

/**
 * Para gravação e retorna URI do arquivo
 */
export async function stopRecording(): Promise<string> {
  if (!recording) {
    throw new Error('Nenhuma gravação em andamento');
  }

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    if (!uri) {
      throw new Error('URI do áudio não disponível');
    }

    recording = null;
    return uri;
  } catch (error) {
    console.error('Erro ao parar gravação:', error);
    throw error;
  }
}

/**
 * Cancela gravação atual
 */
export async function cancelRecording(): Promise<void> {
  if (!recording) {
    return;
  }

  const currentRecording = recording;
  recording = null; // Limpa referência imediatamente

  try {
    // Tentar obter URI antes de descarregar
    const uri = currentRecording.getURI();

    // Tentar parar e descarregar a gravação
    try {
      await currentRecording.stopAndUnloadAsync();
    } catch (e) {
      // Ignorar erros se a gravação já foi descarregada
    }

    // Remove arquivo se existir
    if (uri) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    // Silenciar erros de cancelamento - não é crítico
  }
}

/**
 * Obtém status atual da gravação
 */
export async function getRecordingStatus(): Promise<Audio.RecordingStatus | null> {
  if (!recording) {
    return null;
  }

  try {
    return await recording.getStatusAsync();
  } catch (error) {
    console.error('Erro ao obter status:', error);
    return null;
  }
}


