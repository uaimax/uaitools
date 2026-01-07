/**
 * Tela Editar Nota
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getNote, updateNote } from '@/services/api/notes';
import { useToast } from '@/context/ToastContext';
import { NotePlayer } from '@/components/notes';
import { colors, typography, spacing } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import type { Note } from '@/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const NoteEditScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { showToast } = useToast();
  const { noteId } = route.params as { noteId: string };

  const [note, setNote] = useState<Note | null>(null);
  const [transcript, setTranscript] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNote();
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

  useEffect(() => {
    if (note) {
      setHasChanges(transcript !== (note.transcript || ''));
    }
  }, [transcript, note]);

  const handleSave = async () => {
    if (!note) return;

    try {
      setSaving(true);
      await updateNote(noteId, transcript);
      showToast('Nota atualizada', 'success');
      navigation.goBack();
    } catch (error: any) {
      showToast('Erro ao salvar nota', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Descartar alterações?',
        'Suas alterações serão perdidas.',
        [
          {
            text: 'Continuar editando',
            style: 'cancel',
          },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
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
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelButton}>Cancelar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar nota</Text>
        <TouchableOpacity onPress={handleSave} disabled={!hasChanges || saving}>
          <Text
            style={[
              styles.saveButton,
              (!hasChanges || saving) && styles.saveButtonDisabled,
            ]}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <TextInput
          style={styles.input}
          value={transcript}
          onChangeText={setTranscript}
          placeholder="Digite sua nota..."
          placeholderTextColor={colors.text.tertiary}
          multiline
          autoFocus
          textAlignVertical="top"
        />

        {note.audio_url && note.duration_seconds && (
          <View style={styles.playerContainer}>
            <NotePlayer audioUrl={note.audio_url} duration={note.duration_seconds} />
          </View>
        )}
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
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    ...typography.body,
    color: colors.text.secondary,
  },
  headerTitle: {
    ...typography.title3,
    color: colors.text.primary,
  },
  saveButton: {
    ...typography.body,
    color: colors.primary.default,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    opacity: 0.5,
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
    padding: spacing[4],
  },
  input: {
    ...typography.body,
    color: colors.text.primary,
    minHeight: 200,
    backgroundColor: colors.bg.elevated,
    borderRadius: 8,
    padding: spacing[4],
  },
  playerContainer: {
    marginTop: spacing[4],
  },
});


