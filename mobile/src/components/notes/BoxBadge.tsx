/**
 * Componente BoxBadge - Badge de caixinha
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '@/theme';

interface BoxBadgeProps {
  name: string | null | undefined;
  color: string | null;
  onPress?: () => void;
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

  const boxKeys: (keyof typeof colors.box)[] = [1, 2, 3, 4, 5, 6, 7, 8];
  const index = Math.abs(hash) % boxKeys.length;
  return colors.box[boxKeys[index]];
}

export const BoxBadge: React.FC<BoxBadgeProps> = ({ name, color, onPress }) => {
  const safeName = name ?? 'Inbox';
  const boxColor = color || getBoxColor(safeName);
  const displayName = safeName.length > 8 ? `${safeName.slice(0, 8)}.` : safeName;

  const BadgeContent = (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${boxColor}1A`, // 10% opacity
          borderColor: `${boxColor}4D`, // 30% opacity
        },
        onPress && styles.badgeClickable,
      ]}
    >
      <Text style={[styles.badgeText, { color: boxColor }]}>
        {displayName.toUpperCase()}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {BadgeContent}
      </TouchableOpacity>
    );
  }

  return BadgeContent;
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
  badgeClickable: {
    opacity: 1,
  },
});

