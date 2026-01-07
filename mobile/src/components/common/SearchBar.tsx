/**
 * SearchBar Composta - Barra de busca com duas áreas de tap
 * Área central: busca por texto
 * Ícone mic: perguntar ao cérebro por voz
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, Brain } from 'lucide-react-native';
import { colors, typography, spacing } from '@/theme';

interface SearchBarProps {
  onSearchPress: () => void;
  onMicPress: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchPress,
  onMicPress,
  placeholder = 'Pergunte algo...',
}) => {
  return (
    <View style={styles.container}>
      {/* Área central - Busca por texto */}
      <TouchableOpacity
        style={styles.searchArea}
        onPress={onSearchPress}
        activeOpacity={0.7}
        accessibilityLabel="Buscar notas"
        accessibilityRole="button"
      >
        <Search size={18} color={colors.text.tertiary} />
        <Text style={styles.placeholder}>{placeholder}</Text>
      </TouchableOpacity>

      {/* Ícone cérebro - Perguntar ao cérebro */}
      <TouchableOpacity
        style={styles.micButton}
        onPress={onMicPress}
        activeOpacity={0.7}
        accessibilityLabel="Perguntar ao cérebro por voz"
        accessibilityRole="button"
      >
        <Brain size={20} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  searchArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: `${colors.bg.elevated}66`, // 40% opacity
    borderRadius: 28, // pill shape
    height: 48,
    paddingHorizontal: spacing[4],
  },
  placeholder: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    flex: 1,
  },
  micButton: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

