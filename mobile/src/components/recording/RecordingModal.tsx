/**
 * RecordingModal - Modal específico para gravação de notas
 * Diferente do AskBrainModal (que é para perguntas)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Mic, StopCircle } from 'lucide-react-native';
import { colors, typography, spacing } from '@/theme';
import { Waveform } from './Waveform';

interface RecordingModalProps {
  visible: boolean;
  duration: number;
  onCancel: () => void;
  onStop: () => void;
  isProcessing?: boolean;
}

export const RecordingModal: React.FC<RecordingModalProps> = ({
  visible,
  duration,
  onCancel,
  onStop,
  isProcessing = false,
}) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay}>
          {/* Close button */}
          {!isProcessing && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onCancel}
            >
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}

          <View style={styles.content}>
            {/* Ícone microfone */}
            <View style={styles.micIconContainer}>
              <Mic size={48} color={colors.primary.default} />
            </View>

            {/* Título */}
            <Text style={styles.title}>Gravando nota...</Text>

            {isProcessing ? (
              <>
                <ActivityIndicator
                  size="large"
                  color={colors.primary.default}
                  style={styles.spinner}
                />
                <Text style={styles.processingText}>Processando...</Text>
              </>
            ) : (
              <>
                {/* Timer */}
                <Text style={styles.duration}>{formatDuration(duration)}</Text>

                {/* Waveform */}
                <View style={styles.waveformContainer}>
                  <Waveform />
                </View>

                {/* Stop button */}
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={onStop}
                  activeOpacity={0.9}
                >
                  <StopCircle size={40} color={colors.text.primary} />
                </TouchableOpacity>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: spacing[2],
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing[4],
  },
  micIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary.default}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    ...typography.headline6,
    color: colors.text.primary,
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  duration: {
    ...typography.headline4,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: spacing[4],
  },
  waveformContainer: {
    width: '80%',
    height: 60,
    marginBottom: spacing[6],
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.semantic.error || colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  actions: {
    marginTop: spacing[4],
  },
  cancelButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  spinner: {
    marginBottom: spacing[4],
  },
  processingText: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
  },
});

