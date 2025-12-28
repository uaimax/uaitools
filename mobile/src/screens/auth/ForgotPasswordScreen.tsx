/**
 * Tela de Esqueci a Senha
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useToast } from '@/context/ToastContext';
import { Button, Input } from '@/components/common';
import { colors, typography, spacing } from '@/theme';
import { isValidEmail } from '@/utils/validators';
import { requestPasswordReset } from '@/services/api/auth';
import type { AuthStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSendEmail = async () => {
    if (!email) {
      setError('Email é obrigatório');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Email inválido');
      return;
    }

    try {
      setLoading(true);
      setError(undefined);
      await requestPasswordReset(email);
      setEmailSent(true);
      showToast('Email enviado com sucesso!', 'success');
    } catch (err: any) {
      const message =
        err.response?.data?.error || 'Erro ao enviar email. Tente novamente.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.successContainer}>
            <MailCheck size={64} color={colors.semantic.success} />
            <Text style={styles.successTitle}>Email enviado!</Text>
            <Text style={styles.successText}>
              Enviamos um link de recuperação para {email}. O link expira em 1 hora.
            </Text>

            <Button
              title="VOLTAR AO LOGIN"
              onPress={() => navigation.navigate('Login')}
              style={styles.backToLoginButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Recuperar senha</Text>
            <Text style={styles.subtitle}>
              Digite seu email e enviaremos um link para redefinir sua senha.
            </Text>

            <View style={styles.form}>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                icon={<Mail size={20} color={colors.text.tertiary} />}
                error={error}
              />

              <Button
                title="ENVIAR LINK"
                onPress={handleSendEmail}
                loading={loading}
                style={styles.sendButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  backButton: {
    marginBottom: spacing[6],
  },
  title: {
    ...typography.title1,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[8],
  },
  form: {
    flex: 1,
  },
  sendButton: {
    marginTop: spacing[6],
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[12],
  },
  successTitle: {
    ...typography.title1,
    color: colors.text.primary,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  successText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[8],
    paddingHorizontal: spacing[4],
  },
  backToLoginButton: {
    marginTop: spacing[6],
  },
});

