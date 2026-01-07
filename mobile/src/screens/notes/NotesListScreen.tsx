/**
 * Tela Lista de Notas
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Mic } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NoteCard } from '@/components/notes';
import { RecordButton, RecordingOverlay } from '@/components/recording';
import { FAB } from '@/components/common';
import { useNotes } from '@/hooks/useNotes';
import { useRecording } from '@/hooks/useRecording';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { uploadAudio } from '@/services/api/notes';
import { saveNoteLocal } from '@/services/storage/database';
import { useToast } from '@/context/ToastContext';
import { colors, typography, spacing } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const NotesListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { showToast } = useToast();
  const { boxId } = (route.params || {}) as { boxId?: string };

  const { notes, loading, refresh } = useNotes(boxId ? { box: boxId } : undefined);
  const { state: recordingState, duration, start, stop, cancel } = useRecording();
  const { isOnline, queueItem } = useOfflineSync();
  const [showOverlay, setShowOverlay] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
          // Passar boxId se estiver em uma caixinha específica
          const result = await uploadAudio(uri, boxId || undefined);
          console.log('Upload result:', result);
          showToast('Nota salva com sucesso!', 'success');
          await refresh();
        } catch (error: any) {
          console.error('Erro no upload:', error);
          await queueItem('note_upload', { audio_uri: uri, box_id: boxId });
          showToast('Nota salva localmente. Sincronizando...', 'warning');
        }
      } else {
        await queueItem('note_upload', { audio_uri: uri, box_id: boxId });
        showToast('Nota salva localmente. Sincronizará quando online.', 'warning');
      }
    } catch (error: any) {
      showToast('Erro ao salvar nota. Tente novamente.', 'error');
      console.error('Erro ao salvar nota:', error);
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  }, [stop, isOnline, showToast, queueItem, refresh, isUploading, boxId]);

  const handleCancelRecording = async () => {
    await cancel();
    setShowOverlay(false);
  };

  // Agrupa notas por data
  const groupedNotes = notes.reduce((acc, note) => {
    const date = new Date(note.created_at).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(note);
    return acc;
  }, {} as Record<string, typeof notes>);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {boxId ? 'Notas da caixinha' : 'Todas as notas'}
          </Text>
          {boxId && (
            <Text style={styles.headerSubtitle}>
              Gravações serão criadas nesta caixinha
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {boxId && (
            <TouchableOpacity
              onPress={recordingState === 'idle' ? start : undefined}
              disabled={recordingState !== 'idle'}
              style={styles.recordButtonHeader}
            >
              <View style={styles.recordButtonSmall}>
                <Mic
                  size={20}
                  color={
                    recordingState === 'recording'
                      ? colors.recording.active
                      : colors.primary.default
                  }
                />
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity>
            <Search size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {Object.entries(groupedNotes).map(([date, dateNotes]) => (
          <View key={date} style={styles.dateSection}>
            <Text style={styles.dateHeader}>{date}</Text>
            {dateNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={() =>
                  navigation.navigate('NoteEdit', { noteId: note.id })
                }
                onDelete={refresh}
                onMove={refresh}
              />
            ))}
          </View>
        ))}

        {(notes || []).length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma nota encontrada</Text>
          </View>
        )}
      </ScrollView>

      {!boxId && (
        <FAB
          onPress={() => {
            showToast('Gravação será implementada', 'info');
          }}
        />
      )}

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing[3],
  },
  headerTitle: {
    ...typography.title2,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  recordButtonHeader: {
    marginRight: spacing[2],
  },
  recordButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary.default}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[16],
  },
  dateSection: {
    marginTop: spacing[6],
  },
  dateHeader: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing[3],
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
});

