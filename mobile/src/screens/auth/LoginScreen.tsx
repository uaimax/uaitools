/**
 * Tela de Login
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Input } from '@/components/common';
import { colors, typography, spacing } from '@/theme';
import { isValidEmail } from '@/utils/validators';
import type { AuthStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await login({ email, password });
      // Navegação será feita automaticamente pelo RootNavigator
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Erro ao fazer login. Tente novamente.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

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
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>🏺</Text>
            </View>

            <Text style={styles.title}>Baú Mental</Text>
            <Text style={styles.subtitle}>
              Grave, jogue, esqueça.{'\n'}Quando precisar, pergunte.
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
                error={errors.email}
              />

              <Input
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon={<Lock size={20} color={colors.text.tertiary} />}
                error={errors.password}
              />

              <Button
                title="ENTRAR"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginButton}
              />

              <Button
                title="Esqueci minha senha"
                onPress={() => navigation.navigate('ForgotPassword')}
                variant="ghost"
                style={styles.forgotButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.signUpText}>
                Não tem conta?{' '}
                <Text
                  style={styles.signUpLink}
                  onPress={() => navigation.navigate('SignUp')}
                >
                  Criar conta
                </Text>
              </Text>
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
    paddingTop: spacing[8], // Reduzido para dar mais espaço ao toast
    paddingBottom: spacing[6],
    justifyContent: 'center', // Centralizar conteúdo verticalmente
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  logo: {
    fontSize: 64,
  },
  title: {
    ...typography.title1,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[10],
  },
  form: {
    flex: 1,
  },
  loginButton: {
    marginTop: spacing[6],
  },
  forgotButton: {
    marginTop: spacing[4],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginHorizontal: spacing[4],
  },
  signUpText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  signUpLink: {
    color: colors.primary.default,
    fontWeight: '600',
  },
});

