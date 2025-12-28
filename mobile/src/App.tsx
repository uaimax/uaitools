/**
 * App principal - Ponto de entrada
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ToastContainer } from '@/components/common/ToastContainer';
import { initDatabase } from '@/services/storage/database';
import { colors } from '@/theme';
import { API_BASE_URL, SENTRY_DSN } from '@/constants/config';

// Inicializa Sentry/GlitchTip para captura de erros
Sentry.init({
  dsn: SENTRY_DSN,
  debug: __DEV__, // Logs detalhados em dev
  environment: __DEV__ ? 'development' : 'production',
  // Captura erros não tratados automaticamente
  enableAutoSessionTracking: true,
  // Breadcrumbs para rastrear ações do usuário
  enableNativeCrashHandling: true,
  // Não enviar dados sensíveis
  beforeSend(event) {
    // Remove dados sensíveis se necessário
    if (event.request?.headers) {
      delete event.request.headers['Authorization'];
    }
    return event;
  },
});

console.log('[SENTRY] Inicializado', { dsn: SENTRY_DSN ? 'configurado' : 'não configurado' });

export default function App() {
  useEffect(() => {
    // Inicializa banco de dados ao iniciar app
    initDatabase().catch((error) => {
      console.error('Erro ao inicializar banco:', error);
    });

    // #region agent log - Teste de conectividade ao iniciar app
    const testConnectivity = async () => {
      const testUrl = `${API_BASE_URL}/api/v1/health/`;
      console.log('[DEBUG APP STARTUP] Testing API connectivity', { API_BASE_URL, testUrl });

      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        console.log('[DEBUG APP STARTUP] API connectivity SUCCESS', {
          status: response.status,
          ok: response.ok,
          API_BASE_URL
        });
      } catch (error: any) {
        console.error('[DEBUG APP STARTUP] API connectivity FAILED', {
          error: error.message,
          testUrl,
          API_BASE_URL,
          errorName: error.name,
          errorStack: error.stack?.substring(0, 200)
        });
      }
    };

    testConnectivity();
    // #endregion
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="light" backgroundColor={colors.bg.base} />
            <RootNavigator />
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

