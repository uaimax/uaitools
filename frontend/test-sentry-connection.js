/**
 * Script simples para testar conexão com Sentry/GlitchTip no frontend
 * Execute com: node test-sentry-connection.js
 */

// Simular variável de ambiente
process.env.VITE_SENTRY_DSN = process.env.VITE_SENTRY_DSN || 'https://47e342089bdc47bd875666cdaca73eee@app.glitchtip.com/14243';

console.log('='.repeat(60));
console.log('Teste de Conexão GlitchTip - Frontend');
console.log('='.repeat(60));

// Verificar se @sentry/react está instalado
try {
  const sentry = require('@sentry/react');
  console.log('\n✅ @sentry/react está instalado');

  // Verificar DSN
  const dsn = process.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.log('\n❌ VITE_SENTRY_DSN não configurado');
    process.exit(1);
  }

  const maskedDsn = dsn.substring(0, 30) + '...' + dsn.substring(dsn.length - 10);
  console.log(`\n📋 DSN configurado: ${maskedDsn}`);

  // Inicializar Sentry
  console.log('\n🔄 Inicializando Sentry SDK...');
  sentry.init({
    dsn: dsn,
    environment: 'test',
    tracesSampleRate: 0,
  });
  console.log('✅ SDK inicializado');

  // Testar envio de mensagem
  console.log('\n📤 Enviando mensagem de teste...');
  sentry.captureMessage('Teste de conexão GlitchTip - Frontend (Node)', 'info');
  console.log('✅ Mensagem enviada');

  // Testar exceção
  console.log('\n📤 Enviando exceção de teste...');
  try {
    throw new Error('Exceção de teste do frontend - Node script');
  } catch (e) {
    sentry.captureException(e);
  }
  console.log('✅ Exceção enviada');

  // Flush
  console.log('\n🔄 Aguardando envio...');
  sentry.flush(5000).then(() => {
    console.log('✅ Flush concluído');
    console.log('\n' + '='.repeat(60));
    console.log('✅ Teste concluído! Verifique no GlitchTip.');
    console.log('='.repeat(60));
    process.exit(0);
  });

} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('\n❌ @sentry/react não está instalado');
    console.log('   Instale com: npm install @sentry/react');
  } else {
    console.log('\n❌ Erro:', error.message);
  }
  process.exit(1);
}



