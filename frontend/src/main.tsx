import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Inicializar console logger ANTES de tudo (para capturar todos os logs)
import { initConsoleLogger } from '@/lib/console-logger'
initConsoleLogger()

// Inicializar i18n antes de renderizar app
import './i18n/config'

// Inicializar error logger antes de renderizar app
// Ele já configura Sentry se VITE_SENTRY_DSN estiver configurado
// e captura erros automaticamente
import '@/lib/error-logger'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
