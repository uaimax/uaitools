/**
 * Tela para processar áudio recebido de outros apps
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Mic, Check, Bot, Tag, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system';
import { useToast } from '@/context/ToastContext';
import { useBoxes } from '@/hooks/useBoxes';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { uploadAudio } from '@/services/api/notes';
import { saveNoteLocal } from '@/services/storage/database';
import { colors, typography, spacing, elevation } from '@/theme';
import { Modal, Button } from '@/components/common';
import { BoxBadge } from '@/components/notes';
import { NotePlayer } from '@/components/notes/NotePlayer';
import type { MainStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface RouteParams {
  audioUri?: string;
  audioName?: string;
}

export const AudioReceivedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { showToast } = useToast();
  const { boxes } = useBoxes();
  const { isOnline, queueItem } = useOfflineSync();

  const params = (route.params || {}) as RouteParams;
  const [audioUri, setAudioUri] = useState<string | null>(params.audioUri || null);
  const [audioName, setAudioName] = useState<string>(params.audioName || 'Áudio recebido');
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [showBoxSelector, setShowBoxSelector] = useState(false);
  const [showBoxList, setShowBoxList] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  useEffect(() => {
    // Carregar duração do áudio se disponível
    if (audioUri) {
      loadAudioDuration();
    }
  }, [audioUri]);

  const loadAudioDuration = async () => {
    // TODO: Carregar duração real do áudio usando expo-av
    // Por enquanto, usar placeholder
    setAudioDuration(47); // Placeholder
  };

  const handleUpload = async () => {
    if (!audioUri) {
      showToast('Áudio não encontrado', 'error');
      return;
    }

    try {
      setUploading(true);

      // Verificar se arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        showToast('Arquivo de áudio não encontrado', 'error');
        setUploading(false);
        return;
      }

      // Salvar localmente primeiro
      const noteId = `local_${Date.now()}`;
      await saveNoteLocal({
        id: noteId,
        audio_uri: audioUri,
        created_at: new Date().toISOString(),
      });

      if (isOnline) {
        showToast('Enviando áudio...', 'info');
        try {
          // Upload com source_type="forwarded"
          const result = await uploadAudio(audioUri, selectedBoxId || undefined, 'forwarded');
          console.log('Upload result:', result);
          const boxName = result.box_name || 'caixinha';
          showToast(`Nota salva em ${boxName}!`, 'success');
          setUploaded(true);

          // Fechar tela após 1 segundo
          setTimeout(() => {
            navigation.goBack();
          }, 1000);
        } catch (error: any) {
          console.error('Erro no upload:', error);
          await queueItem('note_upload', { audio_uri: audioUri, box_id: selectedBoxId });
          showToast('Áudio salvo localmente. Sincronizando...', 'warning');
          setUploaded(true);
          setTimeout(() => {
            navigation.goBack();
          }, 1000);
        }
      } else {
        await queueItem('note_upload', { audio_uri: audioUri, box_id: selectedBoxId });
        showToast('Áudio salvo localmente. Sincronizará quando online.', 'warning');
        setUploaded(true);
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      }
    } catch (error: any) {
      showToast('Erro ao processar áudio. Tente novamente.', 'error');
      console.error('Erro ao processar áudio:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    if (uploading) {
      Alert.alert(
        'Cancelar upload?',
        'O áudio será descartado.',
        [
          { text: 'Continuar', style: 'cancel' },
          {
            text: 'Cancelar',
            style: 'destructive',
            onPress: () => {
              setUploading(false);
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const selectedBox = selectedBoxId
    ? boxes.find((b) => b.id === selectedBoxId)
    : null;

  if (!audioUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Áudio Recebido</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Nenhum áudio encontrado</Text>
          <Text style={styles.errorSubtext}>
            O áudio pode não ter sido recebido corretamente.
          </Text>
          <Button
            title="Voltar"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <X size={24} color={colors.text.primary} />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salvar nota</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Ícone e título */}
        <View style={styles.audioInfo}>
          <Mic size={48} color={colors.primary.default} />
          <Text style={styles.audioName}>Áudio recebido</Text>
        </View>

        {/* Preview do áudio com player */}
        {!uploaded && audioUri && (
          <View style={styles.audioPlayerContainer}>
            <NotePlayer
              audioUrl={audioUri}
              duration={audioDuration || 47}
            />
          </View>
        )}

        {/* Opções de destino */}
        {!uploaded && (
          <>
            <Text style={styles.sectionLabel}>Salvar em:</Text>

            {/* Opção: Deixar IA classificar (default) */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                !selectedBoxId && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedBoxId(null)}
              disabled={uploading}
            >
              <Bot size={24} color={colors.primary.default} />
              <Text style={styles.optionText}>Deixar IA classificar</Text>
              {!selectedBoxId && (
                <Check size={20} color={colors.semantic.success} />
              )}
            </TouchableOpacity>

            {/* Opção: Escolher caixinha */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedBoxId && styles.optionCardSelected,
              ]}
              onPress={() => setShowBoxList(!showBoxList)}
              disabled={uploading}
            >
              <Tag size={24} color={colors.primary.default} />
              <Text style={styles.optionText}>
                {selectedBox ? selectedBox.name : 'Escolher caixinha...'}
              </Text>
              <ChevronRight
                size={20}
                color={colors.text.secondary}
                style={[
                  styles.chevron,
                  showBoxList && styles.chevronExpanded,
                ]}
              />
            </TouchableOpacity>

            {/* Lista de caixinhas (expansível) */}
            {showBoxList && (
              <View style={styles.boxList}>
                {boxes.map((box) => (
                  <TouchableOpacity
                    key={box.id}
                    style={[
                      styles.boxListItem,
                      selectedBoxId === box.id && styles.boxListItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedBoxId(box.id);
                      setShowBoxList(false);
                    }}
                  >
                    <BoxBadge name={box.name} color={box.color} />
                    <Text style={styles.boxListItemText}>{box.name}</Text>
                    {selectedBoxId === box.id && (
                      <Check size={20} color={colors.semantic.success} />
                    )}
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.createBoxItem}
                  onPress={() => {
                    // TODO: Abrir dialog para criar nova caixinha
                    navigation.navigate('BoxesManagement');
                  }}
                >
                  <Text style={styles.createBoxText}>+ Criar nova</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Botão Salvar nota */}
        {!uploaded && (
          <View style={styles.buttonContainer}>
            <Button
              title={uploading ? 'Salvando...' : 'Salvar nota'}
              onPress={handleUpload}
              disabled={uploading}
              loading={uploading}
              style={styles.saveButton}
            />
          </View>
        )}

        {/* Estado: Salvando */}
        {uploading && (
          <View style={styles.savingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary.default}
            />
            <Text style={styles.savingText}>Salvando nota...</Text>
          </View>
        )}
      </View>
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
  headerTitle: {
    ...typography.title2,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
  audioInfo: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  audioName: {
    ...typography.headline6,
    color: colors.text.primary,
    marginTop: spacing[2],
  },
  audioPlayerContainer: {
    width: '100%',
    marginBottom: spacing[6],
  },
  sectionLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionCardSelected: {
    borderColor: colors.primary.default,
    backgroundColor: `${colors.primary.default}10`,
  },
  optionText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '500',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  boxList: {
    marginLeft: spacing[4],
    marginBottom: spacing[3],
    maxHeight: 200,
  },
  boxListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  boxListItemSelected: {
    backgroundColor: `${colors.primary.default}10`,
  },
  boxListItemText: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
  },
  createBoxItem: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  createBoxText: {
    ...typography.body,
    color: colors.primary.default,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: spacing[6],
  },
  saveButton: {
    width: '100%',
  },
  savingContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  savingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing[4],
  },
  boxSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  boxSelectorLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  boxSelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  boxSelectorText: {
    ...typography.body,
    color: colors.primary.default,
    fontWeight: '500',
  },
  hint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  uploadButton: {
    marginTop: 'auto',
    marginBottom: spacing[6],
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  successText: {
    ...typography.title2,
    color: colors.semantic.success,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  successSubtext: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },
  errorText: {
    ...typography.title2,
    color: colors.semantic.error,
    marginBottom: spacing[2],
  },
  errorSubtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  backButton: {
    marginTop: spacing[4],
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

