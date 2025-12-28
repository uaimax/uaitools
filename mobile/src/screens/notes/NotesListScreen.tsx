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
import { ArrowLeft, Search } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NoteCard } from '@/components/notes';
import { FAB } from '@/components/common';
import { useNotes } from '@/hooks/useNotes';
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
        <Text style={styles.headerTitle}>
          {boxId ? 'Notas da caixinha' : 'Todas as notas'}
        </Text>
        <TouchableOpacity>
          <Search size={24} color={colors.text.secondary} />
        </TouchableOpacity>
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
                  navigation.navigate('NoteDetail', { noteId: note.id })
                }
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

      <FAB
        onPress={() => {
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
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

