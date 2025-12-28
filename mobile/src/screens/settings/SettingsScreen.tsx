/**
 * Tela Configurações
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { colors, typography, spacing, elevation } from '@/theme';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = () => {
    Alert.alert('Sair da conta?', 'Você precisará fazer login novamente.', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          showToast('Logout realizado', 'success');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta?',
      'Esta ação não pode ser desfeita. Todos os seus dados serão removidos permanentemente.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            showToast('Funcionalidade em desenvolvimento', 'info');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Conta */}
        <Text style={styles.sectionTitle}>CONTA</Text>
        <View style={[styles.card, elevation[1]]}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.card, elevation[1]]}>
          <Text style={styles.cardText}>Alterar senha</Text>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Dados */}
        <Text style={[styles.sectionTitle, { marginTop: spacing[6] }]}>DADOS</Text>
        <TouchableOpacity
          style={[styles.card, elevation[1]]}
          onPress={() => navigation.navigate('BoxesManagement' as never)}
        >
          <Text style={styles.cardText}>Gerenciar caixinhas</Text>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, elevation[1]]}>
          <Text style={styles.cardText}>Exportar minhas notas</Text>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Sobre */}
        <Text style={[styles.sectionTitle, { marginTop: spacing[6] }]}>SOBRE</Text>
        <View style={[styles.card, elevation[1]]}>
          <Text style={styles.cardText}>Versão</Text>
          <Text style={styles.cardValue}>1.0.0</Text>
        </View>

        <TouchableOpacity style={[styles.card, elevation[1]]}>
          <Text style={styles.cardText}>Termos de uso</Text>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, elevation[1]]}>
          <Text style={styles.cardText}>Política de privacidade</Text>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Ações */}
        <TouchableOpacity
          style={[styles.card, elevation[1], { marginTop: spacing[6] }]}
          onPress={handleLogout}
        >
          <Text style={styles.cardText}>🚪 Sair da conta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, elevation[1], styles.dangerCard]}
          onPress={handleDeleteAccount}
        >
          <Text style={[styles.cardText, styles.dangerText]}>🗑️ Excluir minha conta</Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[16],
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing[2],
    marginTop: spacing[4],
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg.elevated,
    borderRadius: 12,
    padding: spacing[4],
    marginBottom: spacing[2],
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...typography.title3,
    color: colors.text.primary,
  },
  userEmail: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  cardText: {
    ...typography.body,
    color: colors.text.primary,
  },
  cardValue: {
    ...typography.body,
    color: colors.text.secondary,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: colors.semantic.error,
  },
  dangerText: {
    color: colors.semantic.error,
  },
});

