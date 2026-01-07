/**
 * AskBrainModal - Modal para gravação de pergunta ao cérebro
 * Fluxo com 4 estados: seleção escopo → seletor caixinha → gravando → processando
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Brain, StopCircle, ArrowLeft, Search, Check } from 'lucide-react-native';
import { useRecording } from '@/hooks/useRecording';
import { useBoxes } from '@/hooks/useBoxes';
import { transcribeAudio, askQuery, type QueryResponse } from '@/services/api/query';
import { useToast } from '@/context/ToastContext';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { colors, typography, spacing } from '@/theme';
import { Waveform } from '@/components/recording/Waveform';
import { BoxBadge } from '@/components/notes';

interface AskBrainModalProps {
  visible: boolean;
  onClose: () => void;
  onAnswer: (response: QueryResponse, question: string) => void;
  caixinha_contexto?: string | null; // null = todas as notas, string = ID da caixinha
}

type ModalState = 'scope' | 'box-selector' | 'recording' | 'processing';

export const AskBrainModal: React.FC<AskBrainModalProps> = ({
  visible,
  onClose,
  onAnswer,
  caixinha_contexto = null,
}) => {
  const { showToast } = useToast();
  const { isOnline } = useOfflineSync();
  const { boxes } = useBoxes();
  const { state: recordingState, duration, start, stop, cancel } = useRecording();

  const [modalState, setModalState] = useState<ModalState>('scope');
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [boxSearchQuery, setBoxSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recordingStartedRef = useRef(false);

  // Reset quando modal fecha
  useEffect(() => {
    if (!visible) {
      setModalState('scope');
      setSelectedBoxId(null);
      setBoxSearchQuery('');
      setIsProcessing(false);
      recordingStartedRef.current = false;
      cancel(); // Garantir que gravação está cancelada
    }
  }, [visible, cancel]);

  // Comportamento contextual: definir estado inicial baseado no contexto
  useEffect(() => {
    if (visible) {
      if (caixinha_contexto === null) {
        // Contexto: Todas as notas → abre no ESTADO 1 (seleção de escopo)
        setModalState('scope');
        setSelectedBoxId(null);
      } else {
        // Contexto: Dentro de uma caixinha → pula ESTADO 1, vai direto para ESTADO 3
        setModalState('recording');
        setSelectedBoxId(caixinha_contexto);
      }
    }
  }, [visible, caixinha_contexto]);

  // Auto-iniciar gravação quando entrar no estado 'recording'
  useEffect(() => {
    if (modalState === 'recording' && !recordingStartedRef.current && recordingState === 'idle') {
      recordingStartedRef.current = true;
      // Usar setTimeout para garantir que o estado foi atualizado
      setTimeout(() => {
        handleStartRecording();
      }, 100);
    }
  }, [modalState, recordingState, handleStartRecording]);

  // Animação de pulso durante gravação
  useEffect(() => {
    if (recordingState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingState, pulseAnim]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartRecording = useCallback(async () => {
    if (!isOnline) {
      showToast('Conecte-se à internet para perguntar ao cérebro', 'warning');
      return;
    }

    try {
      await start();
    } catch (error: any) {
      console.error('Erro ao iniciar gravação:', error);
      showToast('Erro ao iniciar gravação. Tente novamente.', 'error');
      setModalState('scope');
      recordingStartedRef.current = false;
    }
  }, [isOnline, showToast, start]);

  const handleStopRecording = async () => {
    const uri = await stop();
    if (!uri) {
      setModalState('scope');
      recordingStartedRef.current = false;
      return;
    }

    try {
      setModalState('processing');
      setIsProcessing(true);

      // Transcrever áudio
      const transcript = await transcribeAudio(uri);
      if (!transcript) {
        showToast('Erro ao transcrever áudio', 'error');
        setModalState('scope');
        setIsProcessing(false);
        recordingStartedRef.current = false;
        return;
      }

      // Consultar IA com box_id se selecionado
      const response = await askQuery(transcript, selectedBoxId || null);
      onAnswer(response, transcript);
      onClose();
    } catch (error: any) {
      console.error('Erro ao processar pergunta:', error);
      showToast('Erro ao processar pergunta. Tente novamente.', 'error');
      setModalState('scope');
      setIsProcessing(false);
      recordingStartedRef.current = false;
    }
  };

  const handleCancel = async () => {
    if (recordingState === 'recording') {
      await cancel();
    }
    setModalState('scope');
    setSelectedBoxId(null);
    setBoxSearchQuery('');
    recordingStartedRef.current = false;
    onClose();
  };

  const handleSelectAllNotes = () => {
    setSelectedBoxId(null);
    setModalState('recording');
  };

  const handleSelectBox = () => {
    setModalState('box-selector');
  };

  const handleBoxSelected = (boxId: string) => {
    setSelectedBoxId(boxId);
    setModalState('recording');
  };

  const handleBackFromBoxSelector = () => {
    setModalState('scope');
    setBoxSearchQuery('');
  };

  // Filtrar caixinhas por busca
  const filteredBoxes = boxes.filter((box) =>
    box.name.toLowerCase().includes(boxSearchQuery.toLowerCase())
  );

  // Obter nome da caixinha selecionada
  const selectedBoxName = selectedBoxId
    ? boxes.find((b) => b.id === selectedBoxId)?.name
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.overlay}>
          {/* Close button - apenas nos estados scope e box-selector */}
          {(modalState === 'scope' || modalState === 'box-selector') && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              accessibilityLabel="Fechar modal"
              accessibilityRole="button"
            >
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          )}

          {/* ESTADO 1: Seleção de escopo */}
          {modalState === 'scope' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <Brain size={48} color={colors.primary.default} />
                <Text style={styles.title}>Perguntar ao cérebro</Text>
              </View>

              <View style={styles.optionsContainer}>
                {/* Opção: Todas as notas */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={handleSelectAllNotes}
                  activeOpacity={0.7}
                  accessibilityLabel="Perguntar em todas as notas"
                  accessibilityRole="button"
                >
                  <Text style={styles.optionText}>Todas as notas</Text>
                </TouchableOpacity>

                {/* Opção: Escolher caixinha */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={handleSelectBox}
                  activeOpacity={0.7}
                  accessibilityLabel="Escolher caixinha para perguntar"
                  accessibilityRole="button"
                >
                  <Text style={styles.optionText}>Escolher caixinha...</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ESTADO 2: Seletor de caixinha */}
          {modalState === 'box-selector' && (
            <View style={styles.content}>
              {/* AppBar */}
              <View style={styles.boxSelectorHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackFromBoxSelector}
                  accessibilityLabel="Voltar"
                  accessibilityRole="button"
                >
                  <ArrowLeft size={24} color={colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.boxSelectorTitle}>Escolher caixinha</Text>
                <View style={{ width: 24 }} />
              </View>

              {/* SearchBar */}
              <View style={styles.searchContainer}>
                <Search size={18} color={colors.text.tertiary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar caixinha..."
                  placeholderTextColor={colors.text.tertiary}
                  value={boxSearchQuery}
                  onChangeText={setBoxSearchQuery}
                  autoFocus
                  accessibilityLabel="Buscar caixinha"
                />
              </View>

              {/* Lista de caixinhas */}
              <ScrollView style={styles.boxesList} showsVerticalScrollIndicator={false}>
                {filteredBoxes.length === 0 ? (
                  <View style={styles.emptyBoxes}>
                    <Text style={styles.emptyBoxesText}>
                      {boxSearchQuery ? 'Nenhuma caixinha encontrada' : 'Nenhuma caixinha criada'}
                    </Text>
                  </View>
                ) : (
                  filteredBoxes.map((box) => (
                    <TouchableOpacity
                      key={box.id}
                      style={styles.boxItem}
                      onPress={() => handleBoxSelected(box.id)}
                      activeOpacity={0.7}
                      accessibilityLabel={`Selecionar caixinha ${box.name}`}
                      accessibilityRole="button"
                    >
                      <BoxBadge name={box.name} color={box.color} />
                      <Text style={styles.boxItemText}>{box.name}</Text>
                      {selectedBoxId === box.id && (
                        <Check size={20} color={colors.semantic.success} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* ESTADO 3: Gravando */}
          {modalState === 'recording' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <Animated.View
                  style={[
                    styles.brainIconContainer,
                    {
                      transform: [{ scale: pulseAnim }],
                    },
                  ]}
                >
                  <Brain size={48} color={colors.primary.default} />
                </Animated.View>
                <Text style={styles.title}>
                  {selectedBoxName
                    ? `Perguntando em ${selectedBoxName}...`
                    : 'Perguntando em todas as notas...'}
                </Text>
              </View>

              <View style={styles.recordingArea}>
                <Text style={styles.duration}>{formatDuration(duration)}</Text>
                <View style={styles.waveformContainer}>
                  <Waveform isActive={recordingState === 'recording'} />
                </View>
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={handleStopRecording}
                  activeOpacity={0.9}
                  accessibilityLabel="Parar gravação"
                  accessibilityRole="button"
                >
                  <StopCircle size={40} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ESTADO 4: Processando */}
          {modalState === 'processing' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <Brain size={48} color={colors.primary.default} />
                <Text style={styles.title}>Pensando...</Text>
              </View>
              <ActivityIndicator
                size="large"
                color={colors.primary.default}
                style={styles.spinner}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 13, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: spacing[2],
    zIndex: 10,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    padding: spacing[4],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  brainIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary.default}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  title: {
    ...typography.headline6,
    color: colors.text.primary,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: spacing[3],
  },
  optionCard: {
    backgroundColor: colors.bg.base,
    borderRadius: 12,
    padding: spacing[4],
    alignItems: 'center',
  },
  optionText: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    fontWeight: '500',
  },
  boxSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  backButton: {
    padding: spacing[1],
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxSelectorTitle: {
    ...typography.headline6,
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.base,
    borderRadius: 12,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    padding: 0,
  },
  boxesList: {
    maxHeight: 300,
  },
  boxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: 8,
  },
  boxItemText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  emptyBoxes: {
    padding: spacing[6],
    alignItems: 'center',
  },
  emptyBoxesText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  recordingArea: {
    alignItems: 'center',
    width: '100%',
  },
  duration: {
    ...typography.headline4,
    color: colors.text.primary,
    fontFamily: 'monospace',
    marginBottom: spacing[4],
  },
  waveformContainer: {
    width: '100%',
    height: 60,
    marginBottom: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.semantic.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: spacing[4],
  },
});
