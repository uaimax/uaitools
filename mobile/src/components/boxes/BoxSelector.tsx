/**
 * Componente BoxSelector - Seletor horizontal de caixinhas
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, typography, spacing } from '@/theme';
import { Box } from '@/types';
import { BoxBadge } from '@/components/notes/BoxBadge';

interface BoxSelectorProps {
  boxes: Box[];
  selectedBoxId?: string | null;
  onSelect: (boxId: string | null) => void;
  onCreateNew: () => void;
}

export const BoxSelector: React.FC<BoxSelectorProps> = ({
  boxes,
  selectedBoxId,
  onSelect,
  onCreateNew,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Mover para:</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {boxes.map((box) => (
          <TouchableOpacity
            key={box.id}
            style={[
              styles.boxButton,
              selectedBoxId === box.id && styles.boxButtonSelected,
              {
                backgroundColor: `${box.color || colors.box[1]}1A`,
                borderColor: `${box.color || colors.box[1]}4D`,
              },
            ]}
            onPress={() => onSelect(box.id)}
          >
            <Text
              style={[
                styles.boxText,
                { color: box.color || colors.box[1] },
              ]}
            >
              {box.name.length > 6 ? `${box.name.slice(0, 6)}.` : box.name}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.boxButton, styles.createButton]}
          onPress={onCreateNew}
        >
          <Plus size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing[3],
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  scrollContent: {
    gap: spacing[2],
  },
  boxButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 16,
    borderWidth: 1,
    marginRight: spacing[2],
  },
  boxButtonSelected: {
    borderWidth: 2,
  },
  boxText: {
    ...typography.caption,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: colors.bg.overlay,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
  },
});

