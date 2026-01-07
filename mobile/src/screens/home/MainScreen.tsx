/**
 * MainScreen - Tela principal do app
 * É a lista de notas (não mais landing page)
 * Com SearchBar composta, RecordFAB e AppDrawer integrado
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Settings, Mic } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NoteCard } from '@/components/notes';
import { SearchBar } from '@/components/common';
import { RecordFAB } from '@/components/notes/RecordFAB';
import { NotesDrawer } from '@/components/navigation/NotesDrawer';
import { RecordingModal } from '@/components/recording/RecordingModal';
import { AskBrainModal } from '@/components/query/AskBrainModal';
import type { QueryResponse } from '@/services/api/query';
import { useNotes } from '@/hooks/useNotes';
import { useNotesView } from '@/hooks/useNotesView';
import { useRecording } from '@/hooks/useRecording';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { uploadAudio } from '@/services/api/notes';
import { saveNoteLocal } from '@/services/storage/database';
import { useToast } from '@/context/ToastContext';
import { colors, typography, spacing, elevation } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import type { Note } from '@/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = spacing[2];
const GRID_CARD_WIDTH = (SCREEN_WIDTH - spacing[4] * 2 - CARD_MARGIN) / 2;

export const MainScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();
  const { state: recordingState, duration, start, stop, cancel } = useRecording();
  const { isOnline, pendingCount, queueItem } = useOfflineSync();
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showAskBrainModal, setShowAskBrainModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isUploadingRef = React.useRef(false);

  const {
    drawerOpen,
    setDrawerOpen,
    activeFilter,
    activeBoxId,
    setFilter,
  } = useNotesView();

  // Determinar filtros para buscar notas
  const notesParams = useMemo(() => {
    const params: { box?: string; status?: string; deleted?: boolean } = {};
    if (activeBoxId) {
      params.box = activeBoxId;
    }
    // Filtros de status (trash/archived)
    if (activeFilter === 'trash') {
      // TODO: Backend precisa suportar parâmetro 'deleted=true' para buscar notas deletadas
      // Por enquanto, vamos filtrar no frontend (mas idealmente deveria ser no backend)
      params.deleted = true;
    }
    if (activeFilter === 'archived') {
      // TODO: Backend precisa suportar campo 'archived' ou usar metadata
      // Por enquanto, vamos filtrar no frontend
    }
    return Object.keys(params).length > 0 ? params : undefined;
  }, [activeBoxId, activeFilter]);

  const { notes, loading, refresh } = useNotes(notesParams);

  // Filtrar notas por tipo se necessário
  const filteredNotes = useMemo(() => {
    if (activeFilter === 'audio') {
      return notes.filter((n) => n.audio_uri);
    }
    if (activeFilter === 'text') {
      return notes.filter((n) => !n.audio_uri && n.transcript);
    }
    if (activeFilter === 'checklist') {
      // TODO: Filtrar por checklist quando implementado
      return notes;
    }
    if (activeFilter === 'archived') {
      // TODO: Filtrar arquivados quando backend suportar campo 'archived' ou metadata
      // Por enquanto, retorna vazio até backend implementar
      return [];
    }
    if (activeFilter === 'trash') {
      // TODO: Filtrar lixeira quando backend suportar parâmetro 'deleted=true'
      // Por enquanto, retorna vazio até backend implementar
      return [];
    }
    return notes;
  }, [notes, activeFilter]);

  // Agrupar notas por data
  const groupedNotes = useMemo(() => {
    return filteredNotes.reduce((acc, note) => {
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
    }, {} as Record<string, Note[]>);
  }, [filteredNotes]);

  // Renderizar card em grid
  const renderGridCard = ({ item }: { item: Note }) => (
    <View style={styles.gridCard}>
      <NoteCard
        note={item}
        onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
        onDelete={refresh}
        onMove={refresh}
      />
    </View>
  );

  // Renderizar seção de data
  const renderDateSection = (date: string, dateNotes: Note[]) => {
    return (
      <View key={date} style={styles.dateSection}>
        <Text style={styles.dateHeader}>{date}</Text>
        <FlatList
          data={dateNotes}
          renderItem={renderGridCard}
          numColumns={2}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          columnWrapperStyle={styles.gridRow}
        />
      </View>
    );
  };

  // Handlers de gravação
  React.useEffect(() => {
    if (recordingState === 'recording') {
      setShowRecordingModal(true);
    } else if (recordingState === 'idle') {
      setShowRecordingModal(false);
    }
  }, [recordingState]);

  const handleRecordPress = () => {
    if (recordingState === 'idle') {
      start();
    } else if (recordingState === 'recording') {
      handleStopRecording();
    }
  };

  const handleStopRecording = React.useCallback(async () => {
    if (isUploadingRef.current || isUploading) {
      console.log('Upload já em andamento, ignorando chamada duplicada');
      return;
    }

    isUploadingRef.current = true;
    setIsUploading(true);
    const uri = await stop();

    if (!uri) {
      setShowRecordingModal(false);
      isUploadingRef.current = false;
      setIsUploading(false);
      return;
    }

    try {
      setShowRecordingModal(false);

      const noteId = `local_${Date.now()}`;
      await saveNoteLocal({
        id: noteId,
        audio_uri: uri,
        box_id: activeBoxId, // Se estiver dentro de uma caixinha, associa automaticamente
        created_at: new Date().toISOString(),
      });

      if (isOnline) {
        showToast('Enviando gravação...', 'info');
        try {
          // Passa o activeBoxId para associar a nota à caixinha atual
          const result = await uploadAudio(uri, activeBoxId || undefined);
          console.log('Upload result:', result);
          showToast('Nota salva com sucesso!', 'success');
          refresh();
        } catch (error: any) {
          console.error('Erro no upload:', error);
          await queueItem('note_upload', { audio_uri: uri, box_id: activeBoxId });
          showToast('Nota salva localmente. Sincronizando...', 'warning');
        }
      } else {
        await queueItem('note_upload', { audio_uri: uri, box_id: activeBoxId });
        showToast('Nota salva localmente. Sincronizará quando online.', 'warning');
      }
    } catch (error: any) {
      showToast('Erro ao salvar nota. Tente novamente.', 'error');
      console.error('Erro ao salvar nota:', error);
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  }, [stop, isOnline, showToast, queueItem, isUploading, refresh]);

  const handleCancelRecording = async () => {
    await cancel();
    setShowRecordingModal(false);
  };

  const handleSearchPress = () => {
    navigation.navigate('NotesSearch');
  };

  const handleMicPress = () => {
    setShowAskBrainModal(true);
  };

  const handleBrainAnswer = (response: QueryResponse, question: string) => {
    navigation.navigate('BrainAnswer', {
      question,
      answer: response.answer,
      sources: response.sources,
    });
  };

  const getFABState = (): 'idle' | 'recording' | 'processing' => {
    if (isUploading) return 'processing';
    if (recordingState === 'recording') return 'recording';
    return 'idle';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* AppBar */}
      <View style={[styles.appBar, elevation[0]]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.appBarButton}
          accessibilityLabel="Configurações"
          accessibilityRole="button"
        >
          <Settings size={24} color={colors.text.secondary} />
        </TouchableOpacity>

        <SearchBar
          onSearchPress={handleSearchPress}
          onMicPress={handleMicPress}
        />

        {/* Menu à direita como no Google Keep */}
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          style={styles.appBarButton}
          accessibilityLabel="Abrir menu"
          accessibilityRole="button"
        >
          <Menu size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Banner offline (se houver notas pendentes) */}
      {pendingCount > 0 && !isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠️ {pendingCount} {pendingCount === 1 ? 'nota' : 'notas'} aguardando sincronização
          </Text>
        </View>
      )}

      {/* Área Principal de Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {Object.entries(groupedNotes).length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Mic size={80} color={`${colors.primary.default}99`} />
            <Text style={styles.emptyText}>
              Toque no microfone para gravar sua primeira nota
            </Text>
          </View>
        )}

        {Object.entries(groupedNotes).map(([date, dateNotes]) =>
          renderDateSection(date, dateNotes)
        )}
      </ScrollView>

      {/* RecordFAB */}
      <RecordFAB
        state={getFABState()}
        onPress={handleRecordPress}
        disabled={isUploading}
      />

      {/* Drawer */}
      <NotesDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeFilter={activeFilter}
        activeBoxId={activeBoxId}
        onFilterChange={setFilter}
      />

      {/* RecordingModal */}
      <RecordingModal
        visible={showRecordingModal}
        duration={duration}
        onCancel={handleCancelRecording}
        onStop={handleStopRecording}
        isProcessing={isUploading}
      />

      {/* AskBrainModal - Contexto baseado na caixinha ativa */}
      <AskBrainModal
        visible={showAskBrainModal}
        onClose={() => setShowAskBrainModal(false)}
        onAnswer={handleBrainAnswer}
        caixinha_contexto={activeBoxId}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.bg.base,
    height: 56,
  },
  appBarButton: {
    padding: spacing[1],
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    marginBottom: CARD_MARGIN,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
    paddingBottom: spacing[12],
    paddingHorizontal: spacing[8],
  },
  emptyText: {
    ...typography.bodyLarge,
    color: `${colors.text.secondary}99`,
    marginTop: spacing[4],
    textAlign: 'center',
  },
});

