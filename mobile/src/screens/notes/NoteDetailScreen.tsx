/**
 * Tela Detalhes da Nota
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MoreVertical, Pencil, Trash2, FolderInput } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getNote, deleteNote } from '@/services/api/notes';
import { useToast } from '@/context/ToastContext';
import { NotePlayer } from '@/components/notes';
import { BoxBadge } from '@/components/notes/BoxBadge';
import { colors, typography, spacing } from '@/theme';
import { formatRelativeTime } from '@/utils/formatters';
import type { MainStackParamList } from '@/navigation/types';
import type { Note } from '@/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const NoteDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { showToast } = useToast();
  const { noteId } = route.params as { noteId: string };

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNote();
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

  const handleDelete = () => {
    Alert.alert(
      'Excluir nota?',
      'O áudio e a transcrição serão removidos permanentemente.',
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
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nota</Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Ações',
              'Escolha uma ação',
              [
                {
                  text: 'Editar nota',
                  onPress: () =>
                    navigation.navigate('NoteEdit', { noteId: note.id }),
                },
                {
                  text: 'Mover para outra caixinha',
                  onPress: () => {
                    // TODO: Abrir modal de mover
                    showToast('Funcionalidade em desenvolvimento', 'info');
                  },
                },
                {
                  text: 'Excluir nota',
                  style: 'destructive',
                  onPress: handleDelete,
                },
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
              ]
            );
          }}
        >
          <MoreVertical size={24} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          onPress={() => {
            if (note.box_id) {
              // TODO: Navegar para lista filtrada por caixinha
            }
          }}
        >
          <BoxBadge name={note.box_name || 'Inbox'} color={note.box_color} />
        </TouchableOpacity>

        <Text style={styles.source}>🎤 Sua nota</Text>
        <Text style={styles.date}>
          {new Date(note.created_at).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {note.audio_url && note.duration_seconds && (
          <View style={styles.playerContainer}>
            <NotePlayer audioUrl={note.audio_url} duration={note.duration_seconds} />
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.transcript}>{note.transcript || 'Sem transcrição'}</Text>
      </ScrollView>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[16],
  },
  source: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  date: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  playerContainer: {
    marginTop: spacing[4],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: spacing[4],
  },
  transcript: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
  },
});

