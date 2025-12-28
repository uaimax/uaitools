/**
 * Componente Toast - Notificações temporárias com animações suaves
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Check, X, AlertTriangle, Info } from 'lucide-react-native';
import { colors, typography, spacing, elevation } from '@/theme';
import { Toast as ToastType } from '@/context/ToastContext';

interface ToastProps {
  toast: ToastType;
  onDismiss: () => void;
  index?: number;
}

const icons = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const borderColors = {
  success: colors.semantic.success,
  error: colors.semantic.error,
  warning: colors.semantic.warning,
  info: colors.semantic.info,
};

// Usar cores de fundo elevadas para melhor contraste
const bgColors = {
  success: colors.bg.elevated,
  error: colors.bg.elevated,
  warning: colors.bg.elevated,
  info: colors.bg.elevated,
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss, index = 0 }) => {
  const Icon = icons[toast.type];
  const borderColor = borderColors[toast.type];
  const bgColor = bgColors[toast.type];

  // Animações
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Animação de entrada
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    // Animação de saída
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          { borderLeftColor: borderColor, backgroundColor: bgColor },
        ]}
      >
        <Icon size={20} color={borderColor} style={styles.icon} />
        <Text style={styles.message} numberOfLines={3}>
          {toast.message}
        </Text>
        {toast.action && (
          <TouchableOpacity onPress={toast.action.onPress} style={styles.action}>
            <Text style={[styles.actionText, { color: borderColor }]}>
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleDismiss} style={styles.dismiss}>
          <X size={16} color={colors.text.tertiary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[2],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 12,
    borderLeftWidth: 4,
    minHeight: 56,
    // Background elevado para melhor legibilidade e contraste
    backgroundColor: colors.bg.elevated,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  icon: {
    marginRight: spacing[3],
  },
  message: {
    ...typography.bodySmall,
    color: colors.text.primary,
    flex: 1,
    lineHeight: 20,
  },
  action: {
    marginLeft: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  actionText: {
    ...typography.caption,
    fontWeight: '600',
  },
  dismiss: {
    marginLeft: spacing[2],
    padding: spacing[1],
    borderRadius: 12,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

