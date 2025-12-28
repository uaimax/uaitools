/**
 * Componente Waveform - Visualização de amplitude do áudio
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from '@/theme';

const BAR_COUNT = 40;
const BAR_WIDTH = 4;
const BAR_GAP = 2;

interface WaveformProps {
  isActive?: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isActive = true }) => {
  const bars = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (!isActive) {
      // Reset bars
      bars.forEach((bar) => {
        Animated.timing(bar, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    // Anima barras aleatoriamente
    const animations = bars.map((bar, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: Math.random() * 0.7 + 0.3, // 0.3 a 1.0
            duration: 200 + Math.random() * 300,
            useNativeDriver: true,
          }),
          Animated.timing(bar, {
            toValue: Math.random() * 0.7 + 0.3,
            duration: 200 + Math.random() * 300,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isActive, bars]);

  return (
    <View style={styles.container}>
      {bars.map((bar, index) => {
        // Usa scaleY ao invés de height para suportar native driver
        const scaleY = bar.interpolate({
          inputRange: [0, 1],
          outputRange: [0.13, 1], // 8/60 = 0.13, 60/60 = 1
        });
        const opacity = bar.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 0.8],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                transform: [{ scaleY }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: '80%',
    gap: BAR_GAP,
  },
  bar: {
    width: BAR_WIDTH,
    height: 60, // Altura fixa, animada via scaleY
    backgroundColor: colors.primary.default,
    borderRadius: BAR_WIDTH / 2,
  },
});

