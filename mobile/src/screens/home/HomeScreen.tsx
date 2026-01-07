/**
 * Tela Home - Portal cognitivo
 * Microfone dominante (50%+ da tela) com ações secundárias
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Brain, FileText } from 'lucide-react-native';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useNavigation } from '@react-navigation/native';
import { RecordButton, RecordingOverlay } from '@/components/recording';
import { useRecording } from '@/hooks/useRecording';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { uploadAudio } from '@/services/api/notes';
import { saveNoteLocal } from '@/services/storage/database';
import { useToast } from '@/context/ToastContext';
import { colors, typography, spacing } from '@/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { state: recordingState, duration, start, stop, cancel } = useRecording();
  const { isOnline, pendingCount, queueItem } = useOfflineSync();
  const [showOverlay, setShowOverlay] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isUploadingRef = React.useRef(false);

  React.useEffect(() => {
    if (recordingState === 'recording') {
      setShowOverlay(true);
    } else if (recordingState === 'idle') {
      setShowOverlay(false);
    }
  }, [recordingState]);

  const handleSendRecording = React.useCallback(async () => {
    if (isUploadingRef.current || isUploading) {
      console.log('Upload já em andamento, ignorando chamada duplicada');
      return;
    }

    isUploadingRef.current = true;
    setIsUploading(true);
    const uri = await stop();

    if (!uri) {
      setShowOverlay(false);
      isUploadingRef.current = false;
      setIsUploading(false);
      return;
    }

    try {
      setShowOverlay(false);

      const noteId = `local_${Date.now()}`;
      await saveNoteLocal({
        id: noteId,
        audio_uri: uri,
        created_at: new Date().toISOString(),
      });

      if (isOnline) {
        showToast('Enviando gravação...', 'info');
        try {
          const result = await uploadAudio(uri);
          console.log('Upload result:', result);
          showToast('Nota salva com sucesso!', 'success');
        } catch (error: any) {
          console.error('Erro no upload:', error);
          await queueItem('note_upload', { audio_uri: uri });
          showToast('Nota salva localmente. Sincronizando...', 'warning');
        }
      } else {
        await queueItem('note_upload', { audio_uri: uri });
        showToast('Nota salva localmente. Sincronizará quando online.', 'warning');
      }
    } catch (error: any) {
      showToast('Erro ao salvar nota. Tente novamente.', 'error');
      console.error('Erro ao salvar nota:', error);
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  }, [stop, isOnline, showToast, queueItem, isUploading]);

  const handleCancelRecording = async () => {
    await cancel();
    setShowOverlay(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SupBrainNote</Text>
        <View style={styles.headerActions}>
          {pendingCount > 0 && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>{pendingCount}</Text>
            </View>
          )}
          <NotificationBell />
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings' as never)}
            style={styles.headerActionButton}
          >
            <Settings size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {pendingCount > 0 && !isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠️ {pendingCount} {pendingCount === 1 ? 'nota' : 'notas'} aguardando sincronização
          </Text>
          <Text style={styles.offlineSubtext}>
            Conecte-se à internet para enviar
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.recordSection}>
          <TouchableOpacity
            onPress={recordingState === 'idle' ? start : undefined}
            activeOpacity={0.9}
            disabled={recordingState !== 'idle'}
          >
            <RecordButton state={recordingState} duration={duration} />
          </TouchableOpacity>
          {recordingState === 'idle' && (
            <Text style={styles.hint}>Toque para gravar sua primeira nota</Text>
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Query' as never)}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <Brain size={24} color={colors.primary.default} />
            </View>
            <Text style={styles.actionButtonText}>Pergunte ao cérebro</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('NotesList' as never)}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <FileText size={24} color={colors.primary.default} />
            </View>
            <Text style={styles.actionButtonText}>Ver notas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <RecordingOverlay
        visible={showOverlay}
        duration={duration}
        onCancel={handleCancelRecording}
        onSend={handleSendRecording}
        isUploading={isUploading}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    height: 56,
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
    flexGrow: 1,
  },
  recordSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT * 0.5, // 50% da altura da tela
    paddingVertical: spacing[8],
  },
  hint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[2],
    marginTop: spacing[4],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: 16,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary.default}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerActionButton: {
    padding: spacing[1],
  },
  syncBadge: {
    backgroundColor: colors.semantic.warning,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[1],
  },
  syncBadgeText: {
    ...typography.captionSmall,
    color: colors.text.primary,
    fontWeight: '700',
  },
  offlineBanner: {
    backgroundColor: `${colors.semantic.warning}26`,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.warning,
    padding: spacing[3],
    marginHorizontal: spacing[4],
    marginTop: spacing[2],
    borderRadius: 8,
  },
  offlineText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },
  offlineSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
});
