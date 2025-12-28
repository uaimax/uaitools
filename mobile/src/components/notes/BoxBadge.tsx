/**
 * Componente BoxBadge - Badge de caixinha
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';

interface BoxBadgeProps {
  name: string;
  color: string | null;
}

/**
 * Obtém cor automática baseada no nome (hash simples)
 */
function getBoxColor(name: string): string {
  if (!name) return colors.box[1];

  // Hash simples do nome para obter cor consistente
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const boxKeys = Object.keys(colors.box) as Array<keyof typeof colors.box>;
  const index = Math.abs(hash) % boxKeys.length;
  return colors.box[boxKeys[index]];
}

export const BoxBadge: React.FC<BoxBadgeProps> = ({ name, color }) => {
  const boxColor = color || getBoxColor(name);
  const displayName = name.length > 8 ? `${name.slice(0, 8)}.` : name;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${boxColor}1A`, // 10% opacity
          borderColor: `${boxColor}4D`, // 30% opacity
        },
      ]}
    >
      <Text style={[styles.badgeText, { color: boxColor }]}>
        {displayName.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.captionSmall,
    fontWeight: '600',
  },
});

