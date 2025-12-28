/**
 * Componente NoteCard - Card de nota padronizado
 * Ações sempre visíveis para consistência de UX
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Play, Pencil, FolderInput, Trash2, Inbox } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, spacing, elevation } from '@/theme';
import { Note } from '@/types';
import { formatRelativeTime, formatDuration, truncateText } from '@/utils/formatters';
import { BoxBadge } from './BoxBadge';
import { deleteNote, moveNote } from '@/services/api/notes';
import { getBoxes } from '@/services/api/boxes';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/common';
import type { MainStackParamList } from '@/navigation/types';
import type { Box } from '@/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  showActions?: boolean; // Por padrão sempre mostra ações
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPress,
  onEdit,
  onDelete,
  onMove,
  showActions = true,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [moving, setMoving] = useState(false);

  const boxName = note.box_name || 'Inbox';
  const boxColor = note.box_color || null;

  // Determinar texto de preview baseado no status
  const getPreviewText = (): string => {
    if (note.processing_status === 'pending' || note.processing_status === 'processing') {
      return 'Transcrevendo...';
    }
    if (note.processing_status === 'failed') {
      return 'Erro na transcrição';
    }
    return note.transcript || 'Sem transcrição';
  };

  const preview = truncateText(getPreviewText(), 100);
  const isProcessing = note.processing_status === 'pending' || note.processing_status === 'processing';

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      navigation.navigate('NoteEdit', { noteId: note.id });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir nota?',
      'O áudio e a transcrição serão removidos permanentemente.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNote(note.id);
              showToast('Nota excluída', 'success');
              if (onDelete) {
                onDelete();
              }
            } catch (error: any) {
              showToast('Erro ao excluir nota', 'error');
            }
          },
        },
      ]
    );
  };

  const handleMovePress = async () => {
    try {
      const data = await getBoxes();
      setBoxes(data || []);
      setShowMoveModal(true);
    } catch (error: any) {
      showToast('Erro ao carregar caixinhas', 'error');
    }
  };

  const handleMove = async (boxId: string | null) => {
    try {
      setMoving(true);
      await moveNote(note.id, boxId);
      setShowMoveModal(false);
      showToast(
        boxId ? 'Nota movida com sucesso!' : 'Nota movida para Inbox',
        'success'
      );
      if (onMove) {
        onMove();
      }
    } catch (error: any) {
      showToast('Erro ao mover nota', 'error');
    } finally {
      setMoving(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.card, elevation[1]]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Header com Badge e Timestamp */}
        <View style={styles.header}>
          <BoxBadge name={boxName} color={boxColor} />
          <Text style={styles.timestamp}>{formatRelativeTime(note.created_at)}</Text>
        </View>

        {/* Preview da Transcrição */}
        <Text style={styles.preview} numberOfLines={2}>
          {preview}
        </Text>

        {/* Duração do Áudio */}
        {note.duration_seconds && (
          <View style={styles.player}>
            <Play size={16} color={colors.text.tertiary} />
            <Text style={styles.duration}>
              {formatDuration(note.duration_seconds)}
            </Text>
          </View>
        )}

        {/* Barra de Ações - Sempre Visível */}
        {showActions && (
          <View style={styles.actionsBar}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonEdit,
                isProcessing && styles.actionButtonDisabled,
              ]}
              onPress={handleEdit}
              disabled={isProcessing}
            >
              <Pencil
                size={16}
                color={isProcessing ? colors.text.tertiary : colors.primary.default}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  isProcessing && styles.actionButtonTextDisabled,
                ]}
              >
                Editar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonMove,
                isProcessing && styles.actionButtonDisabled,
              ]}
              onPress={handleMovePress}
              disabled={isProcessing}
            >
              <FolderInput
                size={16}
                color={isProcessing ? colors.text.tertiary : colors.primary.default}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  isProcessing && styles.actionButtonTextDisabled,
                ]}
              >
                Mover
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.actionButtonDelete,
                isProcessing && styles.actionButtonDisabled,
              ]}
              onPress={handleDelete}
              disabled={isProcessing}
            >
              <Trash2
                size={16}
                color={isProcessing ? colors.text.tertiary : colors.semantic.error}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  styles.actionButtonTextDanger,
                  isProcessing && styles.actionButtonTextDisabled,
                ]}
              >
                Excluir
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal para Mover Nota */}
      <Modal visible={showMoveModal} onClose={() => setShowMoveModal(false)}>
        <View style={styles.moveModalContent}>
          <Text style={styles.moveModalTitle}>Mover para</Text>
          <Text style={styles.moveModalSubtitle}>
            Escolha uma caixinha para organizar sua nota
          </Text>

          {/* Opção Inbox */}
          <TouchableOpacity
            style={[
              styles.moveOption,
              !note.box_id && styles.moveOptionSelected,
            ]}
            onPress={() => handleMove(null)}
            disabled={moving}
          >
            <View style={styles.moveOptionIcon}>
              <Inbox size={20} color={colors.text.secondary} />
            </View>
            <View style={styles.moveOptionContent}>
              <Text style={styles.moveOptionName}>Inbox</Text>
              <Text style={styles.moveOptionDesc}>Notas sem organização</Text>
            </View>
            {!note.box_id && (
              <View style={styles.checkIcon}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Lista de Caixinhas */}
          {(boxes || []).map((box) => (
            <TouchableOpacity
              key={box.id}
              style={[
                styles.moveOption,
                note.box_id === box.id && styles.moveOptionSelected,
              ]}
              onPress={() => handleMove(box.id)}
              disabled={moving}
            >
              <View
                style={[
                  styles.moveOptionIcon,
                  { backgroundColor: `${box.color}20` },
                ]}
              >
                <View
                  style={[styles.moveOptionDot, { backgroundColor: box.color }]}
                />
              </View>
              <View style={styles.moveOptionContent}>
                <Text style={styles.moveOptionName}>{box.name}</Text>
                <Text style={styles.moveOptionDesc}>
                  {box.note_count} {box.note_count === 1 ? 'nota' : 'notas'}
                </Text>
              </View>
              {note.box_id === box.id && (
                <View style={styles.checkIcon}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          {moving && (
            <View style={styles.movingOverlay}>
              <Text style={styles.movingText}>Movendo...</Text>
            </View>
          )}
        </View>
      </Modal>
    </>
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
    minHeight: 40,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[3],
  },
  duration: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  // Barra de Ações - Padrão Consistente
  actionsBar: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: spacing[2],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
    borderRadius: 8,
  },
  actionButtonEdit: {
    backgroundColor: `${colors.primary.default}15`,
  },
  actionButtonMove: {
    backgroundColor: `${colors.primary.default}15`,
  },
  actionButtonDelete: {
    backgroundColor: `${colors.semantic.error}15`,
  },
  actionButtonText: {
    ...typography.caption,
    color: colors.primary.default,
    fontWeight: '500',
  },
  actionButtonTextDanger: {
    color: colors.semantic.error,
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.bg.base,
  },
  actionButtonTextDisabled: {
    color: colors.text.tertiary,
  },
  // Move Modal
  moveModalContent: {
    gap: spacing[2],
  },
  moveModalTitle: {
    ...typography.title2,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  moveModalSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  moveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: 12,
    backgroundColor: colors.bg.base,
    marginBottom: spacing[2],
  },
  moveOptionSelected: {
    backgroundColor: `${colors.primary.default}10`,
    borderWidth: 1,
    borderColor: `${colors.primary.default}30`,
  },
  moveOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveOptionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  moveOptionContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  moveOptionName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  moveOptionDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  movingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  movingText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});
