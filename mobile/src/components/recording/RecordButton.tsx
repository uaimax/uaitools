/**
 * Componente RecordButton - Botão gigante para gravar
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Mic } from 'lucide-react-native';
import { colors, typography, elevation } from '@/theme';

interface RecordButtonProps {
  state: 'idle' | 'recording' | 'processing';
  duration?: number;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ state, duration = 0 }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (state === 'recording') {
      // Animação de pulso
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [state, scaleAnim]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const buttonColor = state === 'recording' ? colors.recording.active : colors.primary.default;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.button, { backgroundColor: buttonColor }]}>
        {state === 'recording' ? (
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
        ) : (
          <Mic size={48} color={colors.text.primary} />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation[3],
  },
  duration: {
    ...typography.title1,
    color: colors.text.primary,
    fontWeight: '700',
  },
});

