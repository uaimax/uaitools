/**
 * Tela Detalhes da Nota
 * UX redesenhada com ações claras e visíveis
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  FolderInput,
  Volume2,
  Clock,
  Inbox,
  Check,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getNote, deleteNote, moveNote } from '@/services/api/notes';
import { getBoxes } from '@/services/api/boxes';
import { useToast } from '@/context/ToastContext';
import { NotePlayer } from '@/components/notes';
import { BoxBadge } from '@/components/notes/BoxBadge';
import { Modal } from '@/components/common';
import { colors, typography, spacing, elevation } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import type { Note, Box } from '@/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const NoteDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { showToast } = useToast();
  const { noteId } = route.params as { noteId: string };

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    loadNote();
    loadBoxes();
  }, [noteId]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const data = await getNote(noteId);
      setNote(data);
    } catch (error: any) {
      showToast('Erro ao carregar nota', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadBoxes = async () => {
    try {
      const data = await getBoxes();
      setBoxes(data);
    } catch (error: any) {
      console.error('Erro ao carregar caixinhas:', error);
    }
  };

  const handleEdit = () => {
    if (note) {
      navigation.navigate('NoteEdit', { noteId: note.id });
    }
  };

  const handleMove = async (boxId: string | null) => {
    if (!note) return;

    try {
      setMoving(true);
      const updatedNote = await moveNote(note.id, boxId);
      setNote(updatedNote);
      setShowMoveModal(false);
      showToast(
        boxId ? 'Nota movida com sucesso!' : 'Nota movida para Inbox',
        'success'
      );
    } catch (error: any) {
      showToast('Erro ao mover nota', 'error');
    } finally {
      setMoving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir nota?',
      'O áudio e a transcrição serão removidos permanentemente. Esta ação não pode ser desfeita.',
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
              await deleteNote(noteId);
              showToast('Nota excluída', 'success');
              navigation.goBack();
            } catch (error: any) {
              showToast('Erro ao excluir nota', 'error');
            }
          },
        },
      ]
    );
  };

  if (loading || !note) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary.default} />
          <Text style={styles.loadingText}>Carregando nota...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasAudio = note.audio_url && note.duration_seconds;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Simples */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerDate}>
            {new Date(note.created_at).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Conteúdo Principal */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge da Caixinha Atual */}
        <View style={styles.boxSection}>
          <TouchableOpacity
            onPress={() => setShowMoveModal(true)}
            style={styles.boxBadgeContainer}
          >
            <BoxBadge
              name={note.box_name || 'Inbox'}
              color={note.box_color || colors.text.tertiary}
            />
            <FolderInput
              size={14}
              color={colors.text.tertiary}
              style={styles.boxBadgeIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Player de Áudio - Hero Card */}
        {hasAudio && (
          <View style={styles.audioCard}>
            <View style={styles.audioHeader}>
              <View style={styles.audioIconContainer}>
                <Volume2 size={20} color={colors.primary.default} />
              </View>
              <View style={styles.audioMeta}>
                <Text style={styles.audioTitle}>Áudio Original</Text>
                <View style={styles.audioDuration}>
                  <Clock size={12} color={colors.text.tertiary} />
                  <Text style={styles.audioDurationText}>
                    {formatDuration(note.duration_seconds!)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.audioPlayerWrapper}>
              <NotePlayer
                audioUrl={note.audio_url!}
                duration={note.duration_seconds!}
              />
            </View>
          </View>
        )}

        {/* Divisor Visual */}
        <View style={styles.divider} />

        {/* Transcrição */}
        <View style={styles.transcriptSection}>
          <Text style={styles.transcriptLabel}>Transcrição</Text>
          <Text style={styles.transcript}>
            {note.transcript || 'Sem transcrição disponível'}
          </Text>
        </View>
      </ScrollView>

      {/* Action Bar Fixo no Rodapé */}
      <SafeAreaView edges={['bottom']} style={styles.actionBarSafeArea}>
        <View style={styles.actionBar}>
          {/* Botão Editar */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleEdit}
          >
            <Pencil size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonTextPrimary}>Editar</Text>
          </TouchableOpacity>

          {/* Botão Mover */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => setShowMoveModal(true)}
          >
            <FolderInput size={20} color={colors.primary.default} />
            <Text style={styles.actionButtonTextSecondary}>Mover</Text>
          </TouchableOpacity>

          {/* Botão Excluir */}
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={handleDelete}
          >
            <Trash2 size={20} color={colors.semantic.error} />
            <Text style={styles.actionButtonTextDanger}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

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
              <Check size={20} color={colors.semantic.success} />
            )}
          </TouchableOpacity>

          {/* Lista de Caixinhas */}
          {boxes.map((box) => (
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
                <Check size={20} color={colors.semantic.success} />
              )}
            </TouchableOpacity>
          ))}

          {moving && (
            <View style={styles.movingOverlay}>
              <ActivityIndicator size="small" color={colors.primary.default} />
              <Text style={styles.movingText}>Movendo...</Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

/**
 * Helper para formatar duração em mm:ss
 */
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },

  // Loading
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerDate: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  headerRight: {
    width: 40,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },

  // Box Section
  boxSection: {
    marginBottom: spacing[4],
  },
  boxBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[2],
  },
  boxBadgeIcon: {
    opacity: 0.6,
  },

  // Audio Card (Hero)
  audioCard: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...elevation[2],
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  audioIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primary.default}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioMeta: {
    marginLeft: spacing[3],
  },
  audioTitle: {
    ...typography.title3,
    color: colors.text.primary,
  },
  audioDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  audioDurationText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  audioPlayerWrapper: {
    marginTop: spacing[2],
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: spacing[2],
  },

  // Transcript
  transcriptSection: {
    marginTop: spacing[2],
  },
  transcriptLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[3],
  },
  transcript: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 26,
  },

  // Action Bar
  actionBarSafeArea: {
    backgroundColor: colors.bg.elevated,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionBar: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: 12,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary.default,
  },
  actionButtonSecondary: {
    backgroundColor: `${colors.primary.default}15`,
    borderWidth: 1,
    borderColor: `${colors.primary.default}30`,
  },
  actionButtonDanger: {
    backgroundColor: `${colors.semantic.error}15`,
    borderWidth: 1,
    borderColor: `${colors.semantic.error}30`,
  },
  actionButtonTextPrimary: {
    ...typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    ...typography.bodySmall,
    color: colors.primary.default,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    ...typography.bodySmall,
    color: colors.semantic.error,
    fontWeight: '600',
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
