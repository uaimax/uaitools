/**
 * Tela Inbox - Notas não classificadas
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NoteCard } from '@/components/notes';
import { BoxSelector } from '@/components/boxes';
import { FAB } from '@/components/common';
import { useNotes } from '@/hooks/useNotes';
import { useBoxes } from '@/hooks/useBoxes';
import { useRecording } from '@/hooks/useRecording';
import { moveNote } from '@/services/api/notes';
import { useToast } from '@/context/ToastContext';
import { colors, typography, spacing } from '@/theme';

export const InboxScreen: React.FC = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  // useMemo para estabilizar o objeto de filtros e evitar re-renderizações
  const inboxFilter = useMemo(() => ({ inbox: true }), []);
  const { notes, loading, refresh } = useNotes(inboxFilter);
  const { boxes, refresh: refreshBoxes } = useBoxes();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const handleMoveNote = async (noteId: string, boxId: string | null) => {
    try {
      await moveNote(noteId, boxId);
      const box = boxes.find((b) => b.id === boxId);
      showToast(`Movido para ${box?.name || 'Inbox'}`, 'success');
      setSelectedNoteId(null);
      await refresh();
      await refreshBoxes();
    } catch (error: any) {
      showToast('Erro ao mover nota', 'error');
      console.error('Erro ao mover nota:', error);
    }
  };

  const inboxNotes = (notes || []).filter((note) => !note.box_id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <Text style={styles.headerSubtitle}>
            {inboxNotes.length} {inboxNotes.length === 1 ? 'nota' : 'notas'} para classificar
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
        {inboxNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Check size={48} color={colors.semantic.success} />
            <Text style={styles.emptyTitle}>Tudo organizado!</Text>
            <Text style={styles.emptyText}>
              Suas notas estão nas caixinhas.
            </Text>
          </View>
        ) : (
          inboxNotes.map((note) => (
            <View key={note.id}>
              <NoteCard
                note={note}
                onPress={() =>
                  navigation.navigate('NoteDetail' as never, { noteId: note.id } as never)
                }
              />
              {selectedNoteId === note.id && (
                <BoxSelector
                  boxes={boxes}
                  onSelect={(boxId) => handleMoveNote(note.id, boxId)}
                  onCreateNew={() => {
                    // TODO: Abrir modal de criar caixinha
                    navigation.navigate('BoxesManagement' as never);
                  }}
                />
              )}
              {selectedNoteId !== note.id && (
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setSelectedNoteId(note.id)}
                >
                  <Text style={styles.selectButtonText}>Mover para caixinha</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <FAB
        onPress={() => {
          // TODO: Abrir gravação (mesma lógica da Home)
          showToast('Gravação será implementada', 'info');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...typography.title2,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[16],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
  },
  emptyTitle: {
    ...typography.title2,
    color: colors.text.primary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  selectButton: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
    paddingVertical: spacing[2],
  },
  selectButtonText: {
    ...typography.caption,
    color: colors.primary.default,
    textAlign: 'center',
  },
});

