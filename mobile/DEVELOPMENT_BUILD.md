# Development Build - Guia de Uso

## O que é Development Build?

Development Build é uma versão nativa do seu app que permite testar todas as funcionalidades, incluindo:
- ✅ Notificações push completas
- ✅ Todas as features do Sentry (offline caching, native errors)
- ✅ Módulos nativos customizados
- ✅ Plugins que não funcionam no Expo Go

## Setup Inicial

### 1. Instalar o Development Build no dispositivo

#### Android:
```bash
# Build via EAS (recomendado)
npm run build:dev:android

# Ou build local (mais rápido, mas requer Android Studio)
npx expo run:android
```

#### iOS:
```bash
# Build via EAS (recomendado)
npm run build:dev:ios

# Ou build local (requer Xcode e Mac)
npx expo run:ios
```

### 2. Instalar o APK/IPA no dispositivo

- **Android**: Baixe o APK do EAS e instale no dispositivo
- **iOS**: Use TestFlight ou instale diretamente via EAS

## Uso Diário

### Iniciar o servidor de desenvolvimento

```bash
# Com tunnel (para testar em dispositivo físico remoto)
npm run start:dev:tunnel

# Sem tunnel (mesma rede)
npm run start:dev
```

### Conectar o app

1. Abra o Development Build instalado no dispositivo
2. O app vai se conectar automaticamente ao servidor
3. Se usar tunnel, funciona de qualquer lugar

## Diferenças do Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Notificações Push | ❌ Limitado | ✅ Completo |
| Sentry Offline | ❌ Não funciona | ✅ Funciona |
| Módulos Nativos | ❌ Limitado | ✅ Todos |
| Velocidade Setup | ✅ Instantâneo | ⚠️ Requer build |
| Atualizações | ✅ Instantâneas | ✅ Instantâneas |

## Scripts Disponíveis

```bash
# Iniciar servidor
npm run start:dev              # Development build (sem tunnel)
npm run start:dev:tunnel        # Development build (com tunnel)

# Builds
npm run build:dev:android       # Build Android via EAS
npm run build:dev:ios           # Build iOS via EAS

# Expo Go (fallback)
npm run start                   # Expo Go normal
npm run start:tunnel            # Expo Go com tunnel
```

## Troubleshooting

### App não conecta ao servidor

1. Verifique se o servidor está rodando
2. Se usar tunnel, aguarde a conexão do tunnel
3. Verifique se o dispositivo está na mesma rede (sem tunnel)
4. Reinicie o app

### Build falha

1. Verifique se está logado no EAS: `eas login`
2. Verifique se o projeto está configurado: `eas project:info`
3. Veja os logs: `eas build:list`

### Atualizar após mudanças nativas

Se você adicionar novos plugins nativos ou modificar `app.json`:
1. Faça um novo build: `npm run build:dev:android`
2. Instale o novo APK/IPA
3. O JavaScript continua atualizando automaticamente

## Quando Usar Cada Um

### Use Expo Go quando:
- Desenvolvendo UI/UX
- Testando funcionalidades básicas
- Prototipando rapidamente
- Não precisa de features nativas avançadas

### Use Development Build quando:
- Testando notificações push
- Precisa de todas as features do Sentry
- Testando módulos nativos customizados
- Preparando para produção
- Testando features que não funcionam no Expo Go

## Integração com dev-start.sh

O `dev-start.sh` detecta automaticamente se `expo-dev-client` está instalado:
- **Com dev-client**: Inicia com `start:dev:tunnel`
- **Sem dev-client**: Inicia com `start:tunnel` (Expo Go)

## Próximos Passos

1. Faça o primeiro build: `npm run build:dev:android`
2. Instale o APK no dispositivo
3. Execute `./dev-start.sh` (ou `npm run start:dev:tunnel`)
4. Abra o Development Build no dispositivo
5. Desenvolva normalmente - mudanças JS são instantâneas!

