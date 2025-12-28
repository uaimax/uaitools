/**
 * Componente Card - Container com elevação
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, elevation } from '@/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: keyof typeof elevation;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation: elevationLevel = 1,
}) => {
  return (
    <View style={[styles.card, elevation[elevationLevel], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    padding: spacing[4],
  },
});

