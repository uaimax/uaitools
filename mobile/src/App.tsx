/**
 * App principal - Ponto de entrada
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Sentry from '@sentry/react-native';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ToastContainer } from '@/components/common/ToastContainer';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { initDatabase } from '@/services/storage/database';
import { colors } from '@/theme';
import { API_BASE_URL, SENTRY_DSN } from '@/constants/config';

// Inicializa Sentry/GlitchTip para captura de erros (com tratamento de erro)
try {
  if (SENTRY_DSN) {
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
    console.log('[SENTRY] Inicializado com sucesso');
  } else {
    console.warn('[SENTRY] DSN não configurado. Erros não serão enviados.');
  }
} catch (error) {
  console.error('[SENTRY] Erro ao inicializar Sentry:', error);
  // Não crashar o app se Sentry falhar
}

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Inicializa banco de dados ao iniciar app (com tratamento robusto)
    initDatabase().catch((error) => {
      console.error('[APP] Erro ao inicializar banco:', error);
      // Reportar para Sentry se disponível
      if (SENTRY_DSN) {
        Sentry.captureException(error, {
          tags: { component: 'App', action: 'initDatabase' },
        });
      }
      // Não crashar o app se o banco falhar - tentará novamente quando necessário
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

    // Handler para deep linking e compartilhamento
    const handleUrl = async (event: { url: string }) => {
      console.log('[SHARE] URL recebida:', event.url);

      try {
        const { path, queryParams } = Linking.parse(event.url);

        // Verificar se é compartilhamento de arquivo
        if (queryParams?.audioUri || queryParams?.uri) {
          const audioUri = (queryParams.audioUri || queryParams.uri) as string;
          const audioName = (queryParams.name || queryParams.filename || 'Áudio recebido') as string;

          console.log('[SHARE] Áudio recebido:', { audioUri, audioName });

          // Navegar para tela de processamento
          // Usar setTimeout para garantir que navegação está pronta
          setTimeout(() => {
            if (navigationRef.current) {
              navigationRef.current.navigate('Main', {
                screen: 'AudioReceived',
                params: { audioUri, audioName },
              });
            }
          }, 1000);
        }
      } catch (error: any) {
        console.error('[SHARE] Erro ao processar URL:', error);
      }
    };

    // Listener para URLs recebidas enquanto app está aberto
    const subscription = Linking.addEventListener('url', handleUrl);

    // Verificar se app foi aberto com URL (app estava fechado)
    Linking.getInitialURL().then((url) => {
      if (url) {
        setTimeout(() => handleUrl({ url }), 1000);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <ToastProvider>
              <StatusBar style="light" backgroundColor={colors.bg.base} />
              <RootNavigator ref={navigationRef} />
              <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
