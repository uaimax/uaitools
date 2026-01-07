/**
 * Tela Lista de Notas - Estilo Google Keep
 * Header fixo, sidebar, grid/list toggle, área de cards
 */

import React, { useMemo } from 'react';
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
import { Menu, Search, Grid3x3, List, User } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NoteCard } from '@/components/notes';
import { NotesDrawer } from '@/components/navigation/NotesDrawer';
import { NotesFAB } from '@/components/notes/NotesFAB';
import { useNotes } from '@/hooks/useNotes';
import { useNotesView } from '@/hooks/useNotesView';
import { colors, typography, spacing, elevation } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import type { Note } from '@/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = spacing[2];
const GRID_CARD_WIDTH = (SCREEN_WIDTH - spacing[4] * 2 - CARD_MARGIN) / 2;

export const NotesListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const routeParams = (route.params || {}) as {
    boxId?: string;
    filterType?: 'audio' | 'text' | 'checklist' | 'all';
    viewMode?: 'grid' | 'list';
  };

  const {
    viewMode,
    toggleViewMode,
    drawerOpen,
    setDrawerOpen,
    activeFilter,
    activeBoxId,
    setFilter,
  } = useNotesView(routeParams.boxId);

  // Determinar filtros para buscar notas
  const notesParams = useMemo(() => {
    const params: { box?: string; status?: string; deleted?: boolean } = {};
    if (activeBoxId) {
      params.box = activeBoxId;
    }
    // Filtros de status (trash/archived)
    if (activeFilter === 'trash') {
      // TODO: Backend precisa suportar parâmetro 'deleted=true' para buscar notas deletadas
      params.deleted = true;
    }
    if (activeFilter === 'archived') {
      // TODO: Backend precisa suportar campo 'archived' ou usar metadata
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
        onPress={() => navigation.navigate('NoteEdit', { noteId: item.id })}
        onDelete={refresh}
        onMove={refresh}
      />
    </View>
  );

  // Renderizar seção de data
  const renderDateSection = (date: string, dateNotes: Note[]) => {
    if (viewMode === 'grid') {
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
    }

    return (
      <View key={date} style={styles.dateSection}>
        <Text style={styles.dateHeader}>{date}</Text>
        {dateNotes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onPress={() => navigation.navigate('NoteEdit', { noteId: note.id })}
            onDelete={refresh}
            onMove={refresh}
          />
        ))}
      </View>
    );
  };

  const handleSearchPress = () => {
    navigation.navigate('NotesSearch');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Fixo */}
      <View style={[styles.header, elevation[2]]}>
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          style={styles.headerButton}
        >
          <Menu size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <Search size={18} color={colors.text.tertiary} />
          <Text style={styles.searchPlaceholder}>Buscar notas...</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleViewMode}
          style={styles.headerButton}
        >
          {viewMode === 'grid' ? (
            <List size={24} color={colors.text.secondary} />
          ) : (
            <Grid3x3 size={24} color={colors.text.secondary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerButton}>
          <View style={styles.avatar}>
            <User size={18} color={colors.text.primary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Área Principal de Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
      >
        {Object.entries(groupedNotes).length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma nota encontrada</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === 'all'
                ? 'Comece gravando uma nota na tela inicial'
                : 'Tente outro filtro'}
            </Text>
          </View>
        )}

        {Object.entries(groupedNotes).map(([date, dateNotes]) =>
          renderDateSection(date, dateNotes)
        )}
      </ScrollView>

      {/* FAB */}
      <NotesFAB boxId={activeBoxId} />

      {/* Sidebar */}
      <NotesDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeFilter={activeFilter}
        activeBoxId={activeBoxId}
        onFilterChange={setFilter}
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
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.bg.elevated,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerButton: {
    padding: spacing[1],
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.bg.base,
    borderRadius: 24,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchPlaceholder: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },
  emptyText: {
    ...typography.title3,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
