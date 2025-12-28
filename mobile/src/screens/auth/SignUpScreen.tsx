/**
 * Tela de Registro
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
import { ArrowLeft, Mail, Lock, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Input } from '@/components/common';
import { colors, typography, spacing } from '@/theme';
import { isValidEmail, isValidPassword, passwordsMatch } from '@/utils/validators';
import type { AuthStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
    }

    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (!isValidPassword(password)) {
      newErrors.password = 'Mínimo 8 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (!passwordsMatch(password, confirmPassword)) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    if (!acceptedTerms) {
      showToast('Você deve aceitar os termos de uso', 'warning');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      // Navegação será feita automaticamente pelo RootNavigator
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Erro ao criar conta. Tente novamente.';
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
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color={colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.title}>Criar sua conta</Text>

            <View style={styles.form}>
              <Input
                placeholder="Nome"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                icon={<User size={20} color={colors.text.tertiary} />}
                error={errors.firstName}
              />

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
              <Text style={styles.hint}>Mínimo 8 caracteres</Text>

              <Input
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                icon={<Lock size={20} color={colors.text.tertiary} />}
                error={errors.confirmPassword}
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>
                  Li e aceito os{' '}
                  <Text style={styles.link}>Termos de Uso</Text> e{' '}
                  <Text style={styles.link}>Política de Privacidade</Text>
                </Text>
              </TouchableOpacity>

              <Button
                title="CRIAR CONTA"
                onPress={handleSignUp}
                loading={loading}
                style={styles.signUpButton}
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
    marginBottom: spacing[8],
  },
  form: {
    flex: 1,
  },
  hint: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: -spacing[3],
    marginBottom: spacing[3],
    marginLeft: spacing[4],
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing[4],
    marginBottom: spacing[6],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary.default,
    borderColor: colors.primary.default,
  },
  checkmark: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  link: {
    color: colors.primary.default,
  },
  signUpButton: {
    marginTop: spacing[6],
  },
});

