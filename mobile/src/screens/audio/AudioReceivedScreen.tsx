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
import { ArrowLeft, Upload, X, Check } from 'lucide-react-native';
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
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    // Se não recebeu URI, tentar obter de outras fontes
    if (!audioUri) {
      // Pode vir de deep linking ou share extension
      // Por enquanto, mostra erro
    }
  }, [audioUri]);

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
          showToast('Áudio recebido e processado!', 'success');
          setUploaded(true);

          // Navegar de volta após 1 segundo
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
        <Text style={styles.headerTitle}>Áudio Recebido</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.audioInfo}>
          <View style={styles.audioIcon}>
            <Upload size={32} color={colors.primary.default} />
          </View>
          <Text style={styles.audioName}>{audioName}</Text>
          <Text style={styles.audioHint}>
            {uploaded
              ? 'Áudio processado com sucesso!'
              : 'Este áudio será transcrito e classificado automaticamente'}
          </Text>
        </View>

        {/* Seletor de Caixinha */}
        {!uploaded && (
          <>
            <TouchableOpacity
              style={styles.boxSelector}
              onPress={() => setShowBoxSelector(true)}
              disabled={uploading}
            >
              <Text style={styles.boxSelectorLabel}>Caixinha (opcional):</Text>
              <View style={styles.boxSelectorValue}>
                {selectedBox ? (
                  <BoxBadge name={selectedBox.name} color={selectedBox.color} />
                ) : (
                  <Text style={styles.boxSelectorText}>Deixar vazio</Text>
                )}
              </View>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Se deixar vazio, o áudio será classificado automaticamente em uma
              caixinha baseado no conteúdo.
            </Text>
          </>
        )}

        {/* Botão Upload */}
        {!uploaded && (
          <Button
            title={uploading ? 'Enviando...' : 'Processar Áudio'}
            onPress={handleUpload}
            disabled={uploading}
            loading={uploading}
            style={styles.uploadButton}
          />
        )}

        {uploaded && (
          <View style={styles.successContainer}>
            <Check size={48} color={colors.semantic.success} />
            <Text style={styles.successText}>Áudio processado!</Text>
            <Text style={styles.successSubtext}>
              A transcrição e classificação estão em andamento.
            </Text>
          </View>
        )}
      </View>

      {/* Modal Seletor de Caixinha */}
      <Modal
        visible={showBoxSelector}
        onClose={() => setShowBoxSelector(false)}
      >
        <View style={styles.boxModalContent}>
          <Text style={styles.boxModalTitle}>Escolher caixinha</Text>
          <Text style={styles.boxModalSubtitle}>
            Opcional: escolha uma caixinha ou deixe vazio para classificação automática
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
            <Text style={styles.boxOptionName}>Classificação automática</Text>
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
              <BoxBadge name={box.name} color={box.color} />
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
    marginBottom: spacing[6],
  },
  audioIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary.default}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  audioName: {
    ...typography.title3,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  audioHint: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
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

