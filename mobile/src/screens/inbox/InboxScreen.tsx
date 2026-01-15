/**
 * Tela Inbox - Notas não classificadas
 * Padrão consistente com ações sempre visíveis
 */

import React, { useMemo } from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import { NoteCard } from '@/components/notes';
import { FAB } from '@/components/common';
import { useNotes } from '@/hooks/useNotes';
import { useBoxes } from '@/hooks/useBoxes';
import { colors, typography, spacing } from '@/theme';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const InboxScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const inboxFilter = useMemo(() => ({ inbox: true }), []);
  const { notes, loading, refresh } = useNotes(inboxFilter);
  const { refresh: refreshBoxes } = useBoxes();

  const inboxNotes = (notes || []).filter((note) => !note.box_id);

  const handleRefresh = async () => {
    await refresh();
    await refreshBoxes();
  };

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
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
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
            <NoteCard
              key={note.id}
              note={note}
              onPress={() =>
                navigation.navigate('NoteEdit', { noteId: note.id })
              }
              onDelete={handleRefresh}
              onMove={handleRefresh}
            />
          ))
        )}
      </ScrollView>

      <FAB
        onPress={() => {
          // TODO: Abrir gravação (mesma lógica da Home)
          navigation.navigate('Home');
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
});
