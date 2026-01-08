/**
 * Error Logger - Sistema de logging de erros para Sentry/GlitchTip
 *
 * Inicializa o Sentry/GlitchTip se VITE_SENTRY_DSN estiver configurado
 * e fornece função logError para capturar erros.
 */

import * as Sentry from '@sentry/react';

// Flag para evitar inicialização múltipla
let isInitialized = false;

/**
 * Inicializa o Sentry/GlitchTip se o DSN estiver configurado
 */
function initSentry(): void {
  if (isInitialized) {
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    // Sentry não configurado - modo silencioso
    return;
  }

  try {
    const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT ||
                       import.meta.env.MODE ||
                       'production';

    const release = import.meta.env.VITE_RELEASE;
    const deploymentType = import.meta.env.VITE_DEPLOYMENT_TYPE;

    Sentry.init({
      dsn,
      environment,
      release,
      // Configurações de performance (opcional)
      tracesSampleRate: 0.1, // 10% das transações
      // Adicionar tags customizadas via beforeSend
      beforeSend(event, hint) {
        if (deploymentType) {
          event.tags = event.tags || {};
          event.tags.deployment_type = deploymentType;
        }
        return event;
      },
    });

    isInitialized = true;
  } catch (error) {
    // Se houver erro ao inicializar Sentry, apenas logar no console
    console.error('[Error Logger] Erro ao inicializar Sentry:', error);
  }
}

// Inicializar automaticamente quando o módulo é carregado
initSentry();

/**
 * Loga um erro para Sentry/GlitchTip ou console
 *
 * @param error - Erro a ser logado
 * @param context - Contexto adicional (opcional)
 */
export function logError(
  error: Error,
  context?: Record<string, any>
): void {
  // Se Sentry estiver inicializado, usar Sentry
  if (isInitialized && Sentry.getCurrentHub().getClient()) {
    try {
      // Adicionar contexto se fornecido
      if (context) {
        Sentry.setContext('error_context', context);
      }

      // Capturar exceção
      Sentry.captureException(error);
    } catch (sentryError) {
      // Se houver erro ao enviar para Sentry, fallback para console
      console.error('[Error Logger] Erro ao enviar para Sentry:', sentryError);
      console.error('[Error Logger] Erro original:', error);
      if (context) {
        console.error('[Error Logger] Contexto:', context);
      }
    }
  } else {
    // Fallback para console se Sentry não estiver configurado
    console.error('[Error Logger] Erro capturado:', error);
    if (context) {
      console.error('[Error Logger] Contexto:', context);
    }
  }
}

/**
 * Loga uma mensagem para Sentry/GlitchTip ou console
 *
 * @param message - Mensagem a ser logada
 * @param level - Nível do log (info, warning, error)
 * @param context - Contexto adicional (opcional)
 */
export function logMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): void {
  // Se Sentry estiver inicializado, usar Sentry
  if (isInitialized && Sentry.getCurrentHub().getClient()) {
    try {
      // Adicionar contexto se fornecido
      if (context) {
        Sentry.setContext('message_context', context);
      }

      // Capturar mensagem
      Sentry.captureMessage(message, level);
    } catch (sentryError) {
      // Se houver erro ao enviar para Sentry, fallback para console
      console.error('[Error Logger] Erro ao enviar mensagem para Sentry:', sentryError);
      console[level]('[Error Logger] Mensagem:', message);
      if (context) {
        console[level]('[Error Logger] Contexto:', context);
      }
    }
  } else {
    // Fallback para console se Sentry não estiver configurado
    console[level]('[Error Logger] Mensagem:', message);
    if (context) {
      console[level]('[Error Logger] Contexto:', context);
    }
  }
}

