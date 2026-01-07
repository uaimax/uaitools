/**
 * RecordFAB - Floating Action Button para gravação de notas
 * 72dp, sempre visível, com estados (idle/recording/processing)
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Mic, StopCircle } from 'lucide-react-native';
import { colors, elevation } from '@/theme';

interface RecordFABProps {
  state: 'idle' | 'recording' | 'processing';
  onPress: () => void;
  disabled?: boolean;
}

export const RecordFAB: React.FC<RecordFABProps> = ({
  state,
  onPress,
  disabled = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (state === 'recording') {
      // Animação de pulso durante gravação
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
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

  const getBackgroundColor = () => {
    if (state === 'recording') {
      return colors.semantic.error || colors.primary.default;
    }
    return colors.primary.default;
  };

  const getIcon = () => {
    if (state === 'processing') {
      return <ActivityIndicator size="small" color={colors.text.primary} />;
    }
    if (state === 'recording') {
      return <StopCircle size={32} color={colors.text.primary} />;
    }
    return <Mic size={32} color={colors.text.primary} />;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: getBackgroundColor() },
          elevation[3],
        ]}
        onPress={onPress}
        disabled={disabled || state === 'processing'}
        activeOpacity={0.9}
        accessibilityLabel={
          state === 'recording'
            ? 'Parar gravação'
            : state === 'processing'
            ? 'Processando gravação'
            : 'Gravar nota de voz'
        }
        accessibilityRole="button"
      >
        {getIcon()}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    zIndex: 1000,
  },
  fab: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

