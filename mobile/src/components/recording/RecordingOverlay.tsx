/**
 * Componente RecordingOverlay - Overlay durante gravação
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import { colors, typography, spacing } from '@/theme';
import { Button } from '@/components/common';
import { Waveform } from './Waveform';

interface RecordingOverlayProps {
  visible: boolean;
  duration: number;
  onCancel: () => void;
  onSend: () => void;
  isUploading?: boolean;
}

export const RecordingOverlay: React.FC<RecordingOverlayProps> = ({
  visible,
  duration,
  onCancel,
  onSend,
  isUploading = false,
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
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.durationContainer}>
              <View style={styles.pulse} />
              <Text style={styles.duration}>{formatDuration(duration)}</Text>
            </View>

            <Waveform />

            <View style={styles.actions}>
              <Button
                title="Cancelar"
                onPress={onCancel}
                variant="secondary"
                style={styles.cancelButton}
              />
              <Button
                title="✓ Enviar"
                onPress={onSend}
                style={styles.sendButton}
                disabled={isUploading}
                loading={isUploading}
              />
            </View>
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
    backgroundColor: 'rgba(13, 13, 15, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing[4],
  },
  durationContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.recording.active,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
    position: 'relative',
  },
  pulse: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.recording.active,
    opacity: 0.3,
  },
  duration: {
    ...typography.title1,
    color: colors.text.primary,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[8],
  },
  cancelButton: {
    flex: 1,
  },
  sendButton: {
    flex: 1,
  },
});

