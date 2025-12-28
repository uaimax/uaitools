# SupBrainNote Mobile

App mobile React Native + Expo para SupBrainNote - gravação de notas por voz com classificação automática em "caixinhas" temáticas.

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ e npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app no celular ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Instalação

```bash
# Navegar para o diretório mobile
cd mobile

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start
```

### Testando no Celular

1. Execute `npm start`
2. Abra o app **Expo Go** no seu celular
3. Escaneie o QR code que aparece no terminal
4. O app será carregado automaticamente!

**Dica:** Mantenha o celular na mesma rede Wi-Fi do computador.

## 📁 Estrutura

```
mobile/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── common/      # Button, Input, Card, Toast
│   │   ├── notes/       # NoteCard, NotePlayer, BoxBadge
│   │   ├── recording/   # RecordButton, Waveform, RecordingOverlay
│   │   └── boxes/       # BoxSelector, BoxItem
│   ├── screens/         # Telas principais
│   │   ├── auth/        # Login, SignUp, ForgotPassword
│   │   ├── home/        # HomeScreen
│   │   ├── inbox/       # InboxScreen
│   │   ├── notes/       # NotesList, NoteDetail, NoteEdit
│   │   ├── boxes/       # BoxesManagement
│   │   └── settings/    # SettingsScreen
│   ├── navigation/      # React Navigation
│   ├── services/        # API, storage, sync, audio
│   ├── hooks/           # Custom hooks
│   ├── context/         # Context API (Auth, Toast)
│   ├── types/           # TypeScript types
│   ├── theme/           # Design system
│   └── utils/           # Helpers, formatters, validators
├── app.json             # Config Expo
├── package.json
└── tsconfig.json
```

## 🛠️ Comandos Disponíveis

```bash
# Teste completo (recomendado - do diretório raiz do projeto)
../test-mobile.sh         # Inicia backend + Expo com tunnel (WSL)
../test-mobile.sh --no-tunnel  # Usa LAN ao invés de tunnel

# Desenvolvimento
npm start                 # Inicia servidor Expo
npm run android           # Abre no Android (emulador/device)
npm run ios               # Abre no iOS (apenas macOS)
npm run web               # Abre no navegador

# Build
npm run build:apk         # Gera APK para Android (requer EAS)

# Type checking
npm run type-check        # Verifica tipos TypeScript
```

## 🔌 Configuração da API

O app precisa se conectar ao backend Django. Configure a URL da API:

### Configuração Rápida

1. **Copie o arquivo de exemplo**:
```bash
cp .env.example .env
```

2. **Edite o `.env`** e configure a URL do backend:
```bash
# Desenvolvimento local
EXPO_PUBLIC_API_URL=http://localhost:8000

# Dispositivo físico (use o IP da sua máquina)
# EXPO_PUBLIC_API_URL=http://192.168.1.100:8000

# Produção
# EXPO_PUBLIC_API_URL=https://api.seudominio.com
```

### Mudança Entre Ambientes

É **muito fácil** mudar a URL:

1. Edite `mobile/.env`
2. Mude `EXPO_PUBLIC_API_URL`
3. Reinicie o app (`npm start`)

**Pronto!** O app agora usa a nova URL.

📚 **Documentação completa**: Ver `docs/API_CONFIGURATION.md` para mais detalhes.

## 📦 Build para Produção

### Configurar EAS Build (primeira vez)

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Login na conta Expo
eas login

# Configurar projeto
eas build:configure
```

### Gerar APK

```bash
# Build de preview (assinatura dev, ideal para testes)
npm run build:apk

# Build de produção (assinatura release, para distribuição)
eas build -p android --profile production
```

## 🎨 Design System

O app usa um design system completo com:

- **Cores**: Dark theme padrão (ver `src/theme/colors.ts`)
- **Tipografia**: Escala completa usando fontes nativas (ver `src/theme/typography.ts`)
- **Espaçamento**: Sistema baseado em múltiplos de 4px (ver `src/theme/spacing.ts`)
- **Componentes**: Button, Input, Card, Toast (ver `src/components/common/`)

## 🔐 Autenticação

O app usa:
- **SecureStore** para tokens (armazenamento seguro)
- **AsyncStorage** para preferências
- **JWT tokens** do backend Django
- **Refresh token** automático (a implementar)

## 📚 Documentação

- **Especificações**: Ver `docs/supbrainnote-mobile/1-interfaces.md` e `2-prd.md`
- **Exemplo Arquitetural**: Ver `examples/mobile/` (Smart Honey App)
- **Backend**: Ver `backend/apps/supbrainnote/` para APIs disponíveis

## 🐛 Debug

### Logs
```typescript
// Desenvolvimento
console.log('Debug:', data);
```

### React DevTools
```bash
# Abrir React DevTools standalone
npx react-devtools
```

### Network Requests
```bash
# Ver requests HTTP no terminal
npx expo start --dev-client
```

## 📄 Licença

Privado - UAI Tools © 2025

---

**Feito com 🧠 para organização inteligente de notas**

