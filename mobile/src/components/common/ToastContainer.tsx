/**
 * Container de Toasts - Gerencia exibição de múltiplos toasts
 * Posicionado no topo da tela (abaixo da safe area) para não sobrepor conteúdo
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/context/ToastContext';
import { Toast } from './Toast';
import { spacing } from '@/theme';

export const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  // Posicionar toasts no topo, logo abaixo da safe area
  // Isso evita sobrepor conteúdo importante em telas sem header (como login)
  const topOffset = insets.top + spacing[3];

  return (
    <View
      style={[
        styles.container,
        {
          top: topOffset,
        },
      ]}
      pointerEvents="box-none"
    >
      {toasts.slice(0, 2).map((toast, index) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={() => hideToast(toast.id)}
          index={index}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing[4],
    right: spacing[4],
    zIndex: 9999,
    gap: spacing[2],
    // Permitir que toques passem através do container (apenas os toasts são clicáveis)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

