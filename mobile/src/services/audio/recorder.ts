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

  try {
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    // Remove arquivo se existir
    if (uri) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }

    recording = null;
  } catch (error) {
    console.error('Erro ao cancelar gravação:', error);
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


