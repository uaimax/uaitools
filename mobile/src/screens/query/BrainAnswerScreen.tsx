/**
 * BrainAnswerScreen - Tela dedicada para exibir resposta da IA
 * Mostra pergunta, resposta e notas fonte
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mic, Brain } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NoteCard } from '@/components/notes';
import { AskBrainModal } from '@/components/query/AskBrainModal';
import { colors, typography, spacing, elevation } from '@/theme';
import type { MainStackParamList } from '@/navigation/types';
import type { QueryResponse } from '@/services/api/query';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface RouteParams {
  question: string;
  answer: string;
  sources: QueryResponse['sources'];
}

export const BrainAnswerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;
  const [showAskModal, setShowAskModal] = React.useState(false);

  const handleNewQuestion = (response: QueryResponse, question: string) => {
    navigation.replace('BrainAnswer', {
      question,
      answer: response.answer,
      sources: response.sources,
    });
  };

  return (
    <>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* AppBar */}
        <View style={styles.appBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.appBarButton}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Resposta</Text>
          <TouchableOpacity
            onPress={() => setShowAskModal(true)}
            style={styles.appBarButton}
          >
            <Mic size={24} color={colors.primary.default} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card da Pergunta */}
          <View style={styles.questionCard}>
            <Mic size={20} color={colors.text.secondary} />
            <Text style={styles.questionText}>"{params.question}"</Text>
          </View>

          {/* Card da Resposta */}
          <View style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Brain size={24} color={colors.primary.default} />
              <Text style={styles.answerTitle}>Resposta</Text>
            </View>
            <Text style={styles.answerText}>{params.answer}</Text>
          </View>

          {/* Notas Fonte */}
          {params.sources && params.sources.length > 0 && (
            <>
              <Text style={styles.sourcesTitle}>Baseado em</Text>
              {params.sources.map((source, index) => (
                <NoteCard
                  key={index}
                  note={{
                    id: source.note_id,
                    transcript: source.excerpt,
                    created_at: source.date,
                    box_name: source.box_name,
                    box_id: null,
                    box_color: null,
                    processing_status: 'completed',
                  } as any}
                  onPress={() =>
                    navigation.navigate('NoteDetail', { noteId: source.note_id })
                  }
                />
              ))}
            </>
          )}

          {/* Estado: Nenhuma nota relacionada */}
          {(!params.sources || params.sources.length === 0) && (
            <View style={styles.noSourcesContainer}>
              <Text style={styles.noSourcesText}>
                Não encontrei nenhuma nota relacionada.
              </Text>
              <Text style={styles.noSourcesHint}>
                💡 Dica: Grave uma nota sobre isso para que eu possa lembrar depois.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* AskBrainModal para nova pergunta - Contexto: todas as notas (null) */}
      <AskBrainModal
        visible={showAskModal}
        onClose={() => setShowAskModal(false)}
        onAnswer={handleNewQuestion}
        caixinha_contexto={null}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    height: 56,
  },
  appBarButton: {
    padding: spacing[1],
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
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
  questionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    padding: spacing[4],
    marginTop: spacing[4],
    marginBottom: spacing[4],
    ...elevation[1],
  },
  questionText: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    fontStyle: 'italic',
    flex: 1,
  },
  answerCard: {
    backgroundColor: `${colors.primary.default}15`,
    borderRadius: 16,
    padding: spacing[5],
    marginBottom: spacing[4],
    ...elevation[1],
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  answerTitle: {
    ...typography.title3,
    color: colors.text.primary,
    fontWeight: '600',
  },
  answerText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    lineHeight: 24,
  },
  sourcesTitle: {
    ...typography.labelLarge,
    color: `${colors.text.secondary}99`,
    marginTop: spacing[4],
    marginBottom: spacing[3],
  },
  noSourcesContainer: {
    padding: spacing[4],
    alignItems: 'center',
    marginTop: spacing[4],
  },
  noSourcesText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  noSourcesHint: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

