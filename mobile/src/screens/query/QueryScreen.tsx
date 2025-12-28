/**
 * Tela "Pergunte pro seu cérebro"
 * Consulta IA sobre todas as notas ou filtrado por caixinha
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brain, Mic, Send, MessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RecordButton, RecordingOverlay } from '@/components/recording';
import { Modal, Button } from '@/components/common';
import { useRecording } from '@/hooks/useRecording';
import { useBoxes } from '@/hooks/useBoxes';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { askQuery } from '@/services/api/query';
import { uploadAudio } from '@/services/api/notes';
import { useToast } from '@/context/ToastContext';
import { colors, typography, spacing, elevation } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import type { QueryResponse } from '@/services/api/query';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

type QueryMode = 'text' | 'audio';

export const QueryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();
  const { boxes } = useBoxes();
  const { isOnline } = useOfflineSync();
  const { state: recordingState, duration, start, stop, cancel } = useRecording();

  const [mode, setMode] = useState<QueryMode>('text');
  const [question, setQuestion] = useState('');
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [showBoxSelector, setShowBoxSelector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  React.useEffect(() => {
    if (recordingState === 'recording') {
      setShowOverlay(true);
    } else if (recordingState === 'idle') {
      setShowOverlay(false);
    }
  }, [recordingState]);

  const handleSendTextQuery = async () => {
    if (!question.trim()) {
      showToast('Digite uma pergunta', 'warning');
      return;
    }

    try {
      setLoading(true);
      setResponse(null);
      const result = await askQuery(question.trim(), selectedBoxId);
      setResponse(result);
    } catch (error: any) {
      showToast('Erro ao consultar. Tente novamente.', 'error');
      console.error('Erro ao consultar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendAudioQuery = async () => {
    if (!isOnline) {
      showToast('Conecte-se à internet para usar áudio', 'warning');
      return;
    }

    const uri = await stop();
    if (!uri) {
      setShowOverlay(false);
      return;
    }

    try {
      setShowOverlay(false);
      setTranscribing(true);
      setResponse(null);

      // Upload do áudio para transcrever
      showToast('Transcrevendo pergunta...', 'info');
      const uploadResult = await uploadAudio(uri);

      // Aguardar transcrição (polling simples)
      let transcript = '';
      let attempts = 0;
      const maxAttempts = 30; // 30 tentativas (30 segundos)

      while (attempts < maxAttempts && !transcript) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        try {
          // Buscar nota atualizada
          const { getNote } = await import('@/services/api/notes');
          const note = await getNote(uploadResult.id);
          if (note.transcript && note.processing_status === 'completed') {
            transcript = note.transcript;
            break;
          }
        } catch (e) {
          // Continua tentando
        }
      }

      if (!transcript) {
        showToast('Erro ao transcrever áudio. Tente novamente.', 'error');
        setTranscribing(false);
        return;
      }

      // Enviar pergunta transcrita
      setTranscribing(false);
      setQuestion(transcript);
      setLoading(true);
      const result = await askQuery(transcript, selectedBoxId);
      setResponse(result);
      setLoading(false);
    } catch (error: any) {
      showToast('Erro ao processar áudio. Tente novamente.', 'error');
      console.error('Erro ao processar áudio:', error);
      setTranscribing(false);
      setLoading(false);
    }
  };

  const handleCancelRecording = async () => {
    await cancel();
    setShowOverlay(false);
  };

  const selectedBox = selectedBoxId
    ? boxes.find((b) => b.id === selectedBoxId)
    : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Brain size={24} color={colors.primary.default} />
          <Text style={styles.headerTitle}>Pergunte pro seu cérebro</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tabs: Texto / Áudio */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'text' && styles.tabActive]}
            onPress={() => setMode('text')}
          >
            <MessageSquare
              size={18}
              color={mode === 'text' ? colors.primary.default : colors.text.tertiary}
            />
            <Text
              style={[
                styles.tabText,
                mode === 'text' && styles.tabTextActive,
              ]}
            >
              Texto
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'audio' && styles.tabActive]}
            onPress={() => setMode('audio')}
          >
            <Mic
              size={18}
              color={mode === 'audio' ? colors.primary.default : colors.text.tertiary}
            />
            <Text
              style={[
                styles.tabText,
                mode === 'audio' && styles.tabTextActive,
              ]}
            >
              Áudio
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input de Texto ou Botão de Gravação */}
        {mode === 'text' ? (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Digite sua pergunta..."
              placeholderTextColor={colors.text.tertiary}
              value={question}
              onChangeText={setQuestion}
              multiline
              textAlignVertical="top"
            />
          </View>
        ) : (
          <View style={styles.audioContainer}>
            <TouchableOpacity
              style={styles.recordButtonContainer}
              onPress={recordingState === 'idle' ? start : undefined}
              disabled={recordingState !== 'idle'}
            >
              <RecordButton state={recordingState} duration={duration} />
            </TouchableOpacity>
            {recordingState === 'idle' && (
              <Text style={styles.audioHint}>
                Toque para gravar sua pergunta
              </Text>
            )}
          </View>
        )}

        {/* Seletor de Caixinha */}
        <TouchableOpacity
          style={styles.boxSelector}
          onPress={() => setShowBoxSelector(true)}
        >
          <Text style={styles.boxSelectorLabel}>Caixinha:</Text>
          <Text style={styles.boxSelectorValue}>
            {selectedBox ? selectedBox.name : 'Todas as notas'}
          </Text>
        </TouchableOpacity>

        {/* Botão Perguntar */}
        <Button
          title={loading ? 'Perguntando...' : 'Perguntar'}
          onPress={
            mode === 'text' ? handleSendTextQuery : handleSendAudioQuery
          }
          disabled={loading || transcribing || recordingState !== 'idle'}
          loading={loading || transcribing}
          style={styles.askButton}
        />

        {/* Resposta */}
        {response && (
          <View style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <Brain size={20} color={colors.primary.default} />
              <Text style={styles.responseTitle}>Resposta</Text>
            </View>
            <Text style={styles.responseText}>{response.answer}</Text>

            {/* Fontes */}
            {response.sources && response.sources.length > 0 && (
              <View style={styles.sourcesContainer}>
                <Text style={styles.sourcesTitle}>Fontes:</Text>
                {response.sources.map((source, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sourceItem}
                    onPress={() =>
                      navigation.navigate('NoteDetail', { noteId: source.note_id })
                    }
                  >
                    <View style={styles.sourceContent}>
                      <Text style={styles.sourceExcerpt}>{source.excerpt}</Text>
                      <View style={styles.sourceMeta}>
                        <Text style={styles.sourceMetaText}>
                          {source.box_name} • {source.date}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Seletor de Caixinha */}
      <Modal
        visible={showBoxSelector}
        onClose={() => setShowBoxSelector(false)}
      >
        <View style={styles.boxModalContent}>
          <Text style={styles.boxModalTitle}>Filtrar por caixinha</Text>
          <Text style={styles.boxModalSubtitle}>
            Escolha uma caixinha para restringir a busca
          </Text>

          <TouchableOpacity
            style={[
              styles.boxOption,
              !selectedBoxId && styles.boxOptionSelected,
            ]}
            onPress={() => {
              setSelectedBoxId(null);
              setShowBoxSelector(false);
            }}
          >
            <Text style={styles.boxOptionName}>Todas as notas</Text>
            {!selectedBoxId && (
              <View style={styles.checkIcon}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          {boxes.map((box) => (
            <TouchableOpacity
              key={box.id}
              style={[
                styles.boxOption,
                selectedBoxId === box.id && styles.boxOptionSelected,
              ]}
              onPress={() => {
                setSelectedBoxId(box.id);
                setShowBoxSelector(false);
              }}
            >
              <View
                style={[
                  styles.boxOptionDot,
                  { backgroundColor: box.color },
                ]}
              />
              <Text style={styles.boxOptionName}>{box.name}</Text>
              {selectedBoxId === box.id && (
                <View style={styles.checkIcon}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Overlay de Gravação */}
      <RecordingOverlay
        visible={showOverlay}
        duration={duration}
        onCancel={handleCancelRecording}
        onSend={handleSendAudioQuery}
        isUploading={transcribing}
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
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
  tabs: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: 12,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabActive: {
    backgroundColor: `${colors.primary.default}15`,
    borderColor: colors.primary.default,
  },
  tabText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  tabTextActive: {
    color: colors.primary.default,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: spacing[4],
  },
  textInput: {
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    padding: spacing[4],
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  audioContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
    paddingVertical: spacing[6],
  },
  recordButtonContainer: {
    marginBottom: spacing[3],
  },
  audioHint: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  boxSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  boxSelectorLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  boxSelectorValue: {
    ...typography.body,
    color: colors.primary.default,
    fontWeight: '500',
  },
  askButton: {
    marginBottom: spacing[6],
  },
  responseContainer: {
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    padding: spacing[4],
    marginTop: spacing[4],
    ...elevation[1],
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  responseTitle: {
    ...typography.title3,
    color: colors.text.primary,
  },
  responseText: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
    marginBottom: spacing[4],
  },
  sourcesContainer: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  sourcesTitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[3],
    fontWeight: '600',
  },
  sourceItem: {
    backgroundColor: colors.bg.base,
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  sourceContent: {
    gap: spacing[2],
  },
  sourceExcerpt: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontStyle: 'italic',
  },
  sourceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceMetaText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  boxModalContent: {
    gap: spacing[2],
  },
  boxModalTitle: {
    ...typography.title2,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  boxModalSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  boxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: 12,
    backgroundColor: colors.bg.base,
    marginBottom: spacing[2],
    gap: spacing[3],
  },
  boxOptionSelected: {
    backgroundColor: `${colors.primary.default}10`,
    borderWidth: 1,
    borderColor: `${colors.primary.default}30`,
  },
  boxOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  boxOptionName: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

