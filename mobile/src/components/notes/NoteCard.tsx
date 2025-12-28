/**
 * Componente NoteCard - Card de nota na lista
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play } from 'lucide-react-native';
import { colors, typography, spacing, elevation } from '@/theme';
import { Note } from '@/types';
import { formatRelativeTime, formatDuration, truncateText } from '@/utils/formatters';
import { BoxBadge } from './BoxBadge';

interface NoteCardProps {
  note: Note;
  onPress: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress }) => {
  const boxName = note.box_name || 'Inbox';
  const boxColor = note.box_color || null;
  const preview = truncateText(note.transcript || 'Sem transcrição', 100);

  return (
    <TouchableOpacity
      style={[styles.card, elevation[1]]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <BoxBadge name={boxName} color={boxColor} />
        <Text style={styles.timestamp}>{formatRelativeTime(note.created_at)}</Text>
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {preview}
      </Text>

      {note.duration_seconds && (
        <View style={styles.player}>
          <Play size={16} color={colors.text.tertiary} />
          <Text style={styles.duration}>
            {formatDuration(note.duration_seconds)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  timestamp: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  preview: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  duration: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
});

