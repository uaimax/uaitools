/**
 * Console Logger - Captura logs do console e envia para Sentry/GlitchTip
 *
 * Opcionalmente captura console.log, console.error, console.warn
 * e envia para Sentry se estiver configurado.
 */

/**
 * Inicializa o console logger
 * Por enquanto, implementação simples que não quebra o build
 * Pode ser expandido no futuro para capturar console logs e enviar para Sentry
 */
export function initConsoleLogger(): void {
  // Por enquanto, apenas uma função vazia para não quebrar o build
  // Pode ser expandido no futuro para:
  // - Capturar console.log/error/warn
  // - Enviar para Sentry com contexto
  // - Filtrar logs sensíveis

  // Verificar se Sentry está configurado
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    // Sentry não configurado - não fazer nada
    return;
  }

  // Futuro: Implementar captura de console logs aqui
  // Por enquanto, apenas retornar silenciosamente
}

