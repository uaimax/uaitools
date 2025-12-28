/**
 * Componente FAB - Floating Action Button
 */

import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Mic } from 'lucide-react-native';
import { colors, spacing, elevation } from '@/theme';

interface FABProps {
  onPress: () => void;
}

export const FAB: React.FC<FABProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.fab, elevation[3]]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Mic size={24} color={colors.text.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

