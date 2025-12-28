/**
 * Tela Home - Tela principal do app
 * Versão com paginação local e ações rápidas
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Inbox, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { RecordButton, RecordingOverlay } from '@/components/recording';
import { NoteCard } from '@/components/notes';
import { useNotes } from '@/hooks/useNotes';
import { useRecording } from '@/hooks/useRecording';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { uploadAudio } from '@/services/api/notes';
import { saveNoteLocal } from '@/services/storage/database';
import { useToast } from '@/context/ToastContext';
import { colors, typography, spacing } from '@/theme';

const INITIAL_NOTES_COUNT = 4;
const NOTES_PER_PAGE = 4;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { notes, loading, refresh } = useNotes();
  const { state: recordingState, duration, start, stop, cancel } = useRecording();
  const { isOnline, pendingCount, sync, queueItem } = useOfflineSync();
  const [showOverlay, setShowOverlay] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [displayedNotesCount, setDisplayedNotesCount] = useState(INITIAL_NOTES_COUNT);
  const isUploadingRef = React.useRef(false);

  React.useEffect(() => {
    if (recordingState === 'recording') {
      setShowOverlay(true);
    } else if (recordingState === 'idle') {
      setShowOverlay(false);
    }
  }, [recordingState]);

  const handleSendRecording = React.useCallback(async () => {
    if (isUploadingRef.current || isUploading) {
      console.log('Upload já em andamento, ignorando chamada duplicada');
      return;
    }

    isUploadingRef.current = true;
    setIsUploading(true);
    const uri = await stop();

    if (!uri) {
      setShowOverlay(false);
      isUploadingRef.current = false;
      setIsUploading(false);
      return;
    }

    try {
      setShowOverlay(false);

      const noteId = `local_${Date.now()}`;
      await saveNoteLocal({
        id: noteId,
        audio_uri: uri,
        created_at: new Date().toISOString(),
      });

      if (isOnline) {
        showToast('Enviando gravação...', 'info');
        try {
          const result = await uploadAudio(uri);
          console.log('Upload result:', result);
          showToast('Nota salva com sucesso!', 'success');
          await refresh();
        } catch (error: any) {
          console.error('Erro no upload:', error);
          await queueItem('note_upload', { audio_uri: uri });
          showToast('Nota salva localmente. Sincronizando...', 'warning');
        }
      } else {
        await queueItem('note_upload', { audio_uri: uri });
        showToast('Nota salva localmente. Sincronizará quando online.', 'warning');
      }
    } catch (error: any) {
      showToast('Erro ao salvar nota. Tente novamente.', 'error');
      console.error('Erro ao salvar nota:', error);
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  }, [stop, isOnline, showToast, queueItem, refresh, isUploading]);

  const handleCancelRecording = async () => {
    await cancel();
    setShowOverlay(false);
  };

  const handleLoadMore = () => {
    const newCount = displayedNotesCount + NOTES_PER_PAGE;
    const maxCount = (notes || []).length;
    setDisplayedNotesCount(Math.min(newCount, maxCount));
  };

  const handleRefresh = async () => {
    setDisplayedNotesCount(INITIAL_NOTES_COUNT);
    await refresh();
  };

  const displayedNotes = (notes || []).slice(0, displayedNotesCount);
  const hasMoreNotes = displayedNotesCount < (notes || []).length;
  const totalNotes = (notes || []).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SupBrainNote</Text>
        <View style={styles.headerActions}>
          {pendingCount > 0 && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>{pendingCount}</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => navigation.navigate('Settings' as never)}>
            <Settings size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {pendingCount > 0 && !isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠️ {pendingCount} {pendingCount === 1 ? 'nota' : 'notas'} aguardando sincronização
          </Text>
          <Text style={styles.offlineSubtext}>
            Conecte-se à internet para enviar
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.recordSection}>
          <TouchableOpacity
            onPress={recordingState === 'idle' ? start : undefined}
            activeOpacity={0.9}
            disabled={recordingState !== 'idle'}
          >
            <RecordButton state={recordingState} duration={duration} />
          </TouchableOpacity>
          {(notes || []).length === 0 && recordingState === 'idle' && (
            <Text style={styles.hint}>Toque para gravar sua primeira nota</Text>
          )}
        </View>

        {displayedNotes.length > 0 && (
          <View style={styles.notesSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>Últimas notas</Text>
                {totalNotes > 0 && (
                  <Text style={styles.sectionSubtitle}>
                    {displayedNotes.length} de {totalNotes}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={() => navigation.navigate('NotesList' as never)}
              >
                <Text style={styles.seeAllText}>Ver todas</Text>
                <ChevronRight size={16} color={colors.primary.default} />
              </TouchableOpacity>
            </View>

            {displayedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={() =>
                  navigation.navigate('NoteDetail' as never, { noteId: note.id } as never)
                }
                onDelete={handleRefresh}
                onMove={handleRefresh}
              />
            ))}

            {hasMoreNotes && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
              >
                <Text style={styles.loadMoreText}>
                  Ver mais ({totalNotes - displayedNotesCount} restantes)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.inboxButton}
          onPress={() => navigation.navigate('Inbox' as never)}
        >
          <Inbox size={20} color={colors.text.primary} />
          <Text style={styles.inboxText}>Inbox</Text>
          {(notes || []).filter((n) => !n.box_id).length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {(notes || []).filter((n) => !n.box_id).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <RecordingOverlay
        visible={showOverlay}
        duration={duration}
        onCancel={handleCancelRecording}
        onSend={handleSendRecording}
        isUploading={isUploading}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    height: 56,
  },
  headerTitle: {
    ...typography.title2,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[16],
  },
  recordSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    minHeight: 300,
  },
  hint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[4],
  },
  notesSection: {
    marginTop: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
  },
  seeAllText: {
    ...typography.bodySmall,
    color: colors.primary.default,
    fontWeight: '600',
  },
  loadMoreButton: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    marginTop: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadMoreText: {
    ...typography.bodySmall,
    color: colors.primary.default,
    fontWeight: '500',
  },
  bottomBar: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: colors.bg.elevated,
  },
  inboxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.overlay,
    borderRadius: 20,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    position: 'relative',
  },
  inboxText: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.semantic.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  badgeText: {
    ...typography.captionSmall,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  syncBadge: {
    backgroundColor: colors.semantic.warning,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  syncBadgeText: {
    ...typography.captionSmall,
    color: colors.text.primary,
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: `${colors.semantic.warning}26`,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.warning,
    padding: spacing[3],
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    borderRadius: 8,
  },
  offlineText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  offlineSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
});
