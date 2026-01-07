/**
 * Tela Detalhes da Nota
 * UX redesenhada com ações claras e visíveis
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Tag,
  Share2,
  Trash2,
  MoreVertical,
  Volume2,
  Clock,
  Inbox,
  Check,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getNote, deleteNote, moveNote, updateNote } from '@/services/api/notes';
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
  const [transcript, setTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadNote();
    loadBoxes();
  }, [noteId]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const data = await getNote(noteId);
      setNote(data);
      setTranscript(data.transcript || '');
    } catch (error: any) {
      showToast('Erro ao carregar nota', 'error');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Auto-save após 2 segundos de inatividade
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (isEditing && transcript !== (note?.transcript || '')) {
      setSaveStatus('saving');
      autoSaveTimerRef.current = setTimeout(async () => {
        if (note) {
          try {
            await updateNote(noteId, transcript);
            setNote({ ...note, transcript });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          } catch (error: any) {
            showToast('Erro ao salvar', 'error');
            setSaveStatus('idle');
          }
        }
      }, 2000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [transcript, isEditing, note, noteId]);

  const loadBoxes = async () => {
    try {
      const data = await getBoxes();
      setBoxes(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar caixinhas:', error);
      setBoxes([]);
    }
  };

  const handleShare = () => {
    // TODO: Implementar compartilhamento
    showToast('Compartilhamento em breve', 'info');
  };

  const handleMore = () => {
    // TODO: Abrir menu com mais opções (Arquivar, Duplicar, Copiar texto)
    Alert.alert('Mais opções', 'Menu de ações adicionais');
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
      {/* AppBar com ações */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.appBarButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowMoveModal(true)}
            style={styles.appBarButton}
          >
            <Tag size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.appBarButton}
          >
            <Share2 size={24} color={colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.appBarButton}
          >
            <Trash2 size={24} color={colors.semantic.error} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleMore}
            style={styles.appBarButton}
          >
            <MoreVertical size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo Principal */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tag da Caixinha */}
        <View style={styles.boxSection}>
          <BoxBadge
            name={note.box_name || 'Inbox'}
            color={note.box_color || colors.text.tertiary}
            onPress={
              note.box_id
                ? () => navigation.navigate('NotesList', { boxId: note.box_id })
                : undefined
            }
          />
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

        {/* Conteúdo editável */}
        <View style={styles.contentSection}>
          <TextInput
            style={styles.contentInput}
            value={transcript}
            onChangeText={(text) => {
              setTranscript(text);
              setIsEditing(true);
            }}
            placeholder="Sem transcrição disponível"
            placeholderTextColor={colors.text.tertiary}
            multiline
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Metadata */}
        <View style={styles.metadataSection}>
          <Text style={styles.metadataText}>
            Criada em {new Date(note.created_at).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          {note.updated_at && note.updated_at !== note.created_at && (
            <Text style={styles.metadataText}>
              Última edição: {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          )}
        </View>

        {/* Status de salvamento */}
        {saveStatus !== 'idle' && (
          <View style={styles.saveStatusContainer}>
            <Text style={styles.saveStatusText}>
              {saveStatus === 'saving' ? 'Salvando...' : 'Salvo'}
            </Text>
          </View>
        )}
      </ScrollView>


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
    height: 56,
  },
  appBarButton: {
    padding: spacing[1],
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
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

  // Content
  contentSection: {
    marginTop: spacing[2],
  },
  contentInput: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 26,
    minHeight: 100,
    padding: 0,
  },
  // Metadata
  metadataSection: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  metadataText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  },
  saveStatusContainer: {
    marginTop: spacing[2],
    alignItems: 'flex-end',
  },
  saveStatusText: {
    ...typography.caption,
    color: colors.semantic.success,
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
