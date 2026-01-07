/**
 * Tela de Busca de Notas
 * Busca dedicada com resultados em tempo real
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X, Mic, Lightbulb } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NoteCard } from '@/components/notes';
import { AskBrainModal } from '@/components/query/AskBrainModal';
import { useNotes } from '@/hooks/useNotes';
import { colors, typography, spacing } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import type { QueryResponse } from '@/services/api/query';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const NotesSearchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { notes, loading } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAskBrainModal, setShowAskBrainModal] = useState(false);

  // Filtrar notas por busca
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase().trim();
    return notes.filter((note) => {
      const transcript = (note.transcript || '').toLowerCase();
      const boxName = (note.box_name || '').toLowerCase();
      return transcript.includes(query) || boxName.includes(query);
    });
  }, [notes, searchQuery]);

  const handleClear = () => {
    setSearchQuery('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Adicionar à lista de buscas recentes
    if (query.trim() && !recentSearches.includes(query.trim())) {
      setRecentSearches((prev) => [query.trim(), ...prev.slice(0, 4)]);
    }
  };

  const handleAskBrain = () => {
    setShowAskBrainModal(true);
  };

  const handleBrainAnswer = (response: QueryResponse, question: string) => {
    navigation.navigate('BrainAnswer', {
      question,
      answer: response.answer,
      sources: response.sources,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header com busca */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar notas..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <X size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Resultados */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary.default} />
          </View>
        ) : searchQuery.trim().length === 0 ? (
          <>
            <Text style={styles.hintText}>
              Busque por palavras nas transcrições
            </Text>
            {recentSearches.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Buscas recentes:</Text>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchItem}
                    onPress={() => handleSearch(search)}
                  >
                    <Search size={16} color={colors.text.tertiary} />
                    <Text style={styles.recentSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        ) : filteredNotes.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              Nenhuma nota encontrada para "{searchQuery}"
            </Text>
            <View style={styles.upsellContainer}>
              <Lightbulb size={20} color={colors.primary.default} />
              <Text style={styles.upsellText}>
                Tente perguntar de outra forma:
              </Text>
              <TouchableOpacity
                style={styles.askBrainButton}
                onPress={handleAskBrain}
              >
                <Mic size={18} color={colors.primary.default} />
                <Text style={styles.askBrainText}>Pergunte ao cérebro</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {filteredNotes.length} {filteredNotes.length === 1 ? 'nota encontrada' : 'notas encontradas'}
            </Text>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPress={() =>
                  navigation.navigate('NoteDetail', { noteId: note.id })
                }
                onDelete={() => {}}
                onMove={() => {}}
              />
            ))}
            {/* Upsell para Ask Brain */}
            <View style={styles.upsellContainer}>
              <Lightbulb size={20} color={colors.primary.default} />
              <Text style={styles.upsellText}>
                Quer uma resposta mais completa?
              </Text>
              <TouchableOpacity
                style={styles.askBrainButton}
                onPress={handleAskBrain}
              >
                <Mic size={18} color={colors.primary.default} />
                <Text style={styles.askBrainText}>Pergunte ao cérebro</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* AskBrainModal - Contexto: todas as notas (null) */}
      <AskBrainModal
        visible={showAskBrainModal}
        onClose={() => setShowAskBrainModal(false)}
        onAnswer={handleBrainAnswer}
        caixinha_contexto={null}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    padding: spacing[1],
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.bg.elevated,
    borderRadius: 24,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    padding: 0,
  },
  clearButton: {
    padding: spacing[1],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[16],
  },
  centerContainer: {
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
    paddingHorizontal: spacing[4],
  },
  resultsCount: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  hintText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  recentSearchText: {
    ...typography.body,
    color: colors.text.primary,
  },
  upsellContainer: {
    marginTop: spacing[6],
    padding: spacing[4],
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing[2],
  },
  upsellText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  askBrainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    backgroundColor: `${colors.primary.default}15`,
    borderRadius: 20,
    marginTop: spacing[2],
  },
  askBrainText: {
    ...typography.bodySmall,
    color: colors.primary.default,
    fontWeight: '600',
  },
});

