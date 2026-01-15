# bau_mental Mobile App

## Visão Geral

App mobile React Native + Expo para bau_mental, permitindo gravação de notas por voz com classificação automática em "caixinhas" temáticas.

## Stack Tecnológica

- **Framework**: React Native + Expo (~54.0)
- **Linguagem**: TypeScript
- **Navegação**: React Navigation 7
- **Estado Global**: Context API + Hooks
- **Storage**:
  - SecureStore (tokens)
  - AsyncStorage (preferências)
  - SQLite (notas offline)
- **Áudio**: expo-av
- **UI**: Design system customizado (dark theme)
- **Ícones**: Lucide React Native

## Estrutura

```
mobile/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── common/      # Button, Input, Card, Toast, Modal, FAB
│   │   ├── notes/       # NoteCard, NotePlayer, BoxBadge
│   │   ├── recording/   # RecordButton, Waveform, RecordingOverlay
│   │   └── boxes/       # BoxSelector
│   ├── screens/         # Telas principais
│   │   ├── auth/       # Login, SignUp, ForgotPassword
│   │   ├── home/       # HomeScreen
│   │   ├── inbox/      # InboxScreen
│   │   ├── notes/      # NotesList, NoteDetail, NoteEdit
│   │   ├── boxes/      # BoxesManagement
│   │   └── settings/   # SettingsScreen
│   ├── navigation/     # React Navigation
│   ├── services/       # API, storage, sync, audio
│   ├── hooks/          # Custom hooks
│   ├── context/        # Context API (Auth, Toast)
│   ├── types/          # TypeScript types
│   ├── theme/          # Design system
│   └── utils/          # Helpers, formatters, validators
├── app.json            # Config Expo
├── package.json
└── tsconfig.json
```

## Integração com Backend

### Endpoints Utilizados

1. **Autenticação** (`/api/v1/auth/`)
   - `POST /login/` - Login com email/senha
   - `POST /register/` - Criar conta
   - `GET /profile/` - Perfil do usuário
   - `POST /password-reset-request/` - Recuperar senha

2. **Notas** (`/api/v1/bau-mental/notes/`)
   - `GET /notes/` - Listar notas (com filtros)
   - `POST /notes/upload/` - Upload de áudio
   - `GET /notes/:id/` - Detalhes da nota
   - `PATCH /notes/:id/` - Editar transcrição
   - `DELETE /notes/:id/` - Excluir nota
   - `POST /notes/:id/move/` - Mover para outra caixinha

3. **Caixinhas** (`/api/v1/bau-mental/boxes/`)
   - `GET /boxes/` - Listar caixinhas
   - `POST /boxes/` - Criar caixinha
   - `PATCH /boxes/:id/` - Renomear
   - `DELETE /boxes/:id/` - Excluir

### Multi-tenancy

O app inclui automaticamente o header `X-Workspace-ID` em todas as requisições, obtido do AsyncStorage após login.

## Funcionalidades Implementadas

### ✅ Fase 1: Fundação
- Setup Expo + TypeScript
- Design system completo (cores, tipografia, espaçamento)
- Componentes base (Button, Input, Card, Toast, Modal, FAB)
- Navegação (React Navigation)
- Autenticação completa (Login, SignUp, ForgotPassword)
- Persistência de tokens (SecureStore)

### ✅ Fase 2: Core - Gravação
- HomeScreen com botão de gravar
- Gravação de áudio (expo-av)
- RecordingOverlay com waveform
- Upload de áudio para backend
- Lista de notas na Home
- Toast system

### ✅ Fase 3: Organização - Caixinhas
- InboxScreen (notas não classificadas)
- BoxSelector (seletor horizontal)
- NotesListScreen com filtro
- BoxesManagementScreen (CRUD completo)
- Modais para criar/renomear caixinhas
- Mover notas entre caixinhas

### ✅ Fase 4: Detalhes e Edição
- NoteDetailScreen (visualização completa)
- NotePlayer (player de áudio)
- NoteEditScreen (edição de transcrição)
- SettingsScreen
- Haptic feedback (já implementado)

### ✅ Fase 5: Offline e Polish
- SQLite local para notas offline
- Fila de sincronização
- Sync automático quando online
- Feedback visual de status offline
- Banner de notas pendentes

## Próximos Passos

### Melhorias Pendentes

1. **Refresh Token**: Implementar refresh automático de tokens
2. **Busca**: Implementar busca de notas (debounce, highlight)
3. **FlashList**: Substituir FlatList por FlashList para melhor performance
4. **Lazy Loading**: Lazy loading de telas pesadas
5. **Animações**: Adicionar mais animações de transição
6. **Splash Screen**: Criar splash screen nativa
7. **Assets**: Criar ícones e splash screens
8. **EAS Build**: Configurar EAS para builds

### Configuração Necessária

1. **Variável de Ambiente**: Criar `.env` em `mobile/`:
   ```bash
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```

2. **Assets**: Adicionar ícones e splash screens em `mobile/assets/`:
   - `icon.png` (1024x1024)
   - `splash.png` (1284x2778)
   - `adaptive-icon.png` (432x432)
   - `favicon.png`

3. **EAS Project ID**: Obter project ID do EAS e adicionar em `app.json`

## Testes

### Testes Manuais Recomendados

1. **Fluxo de Autenticação**:
   - Login → Home
   - Registro → Home
   - Logout → Login
   - Token persiste entre sessões

2. **Gravação**:
   - Gravar áudio
   - Cancelar gravação
   - Enviar gravação
   - Verificar upload e transcrição

3. **Offline**:
   - Gravar sem internet
   - Verificar salvamento local
   - Voltar online → verificar sync

4. **Caixinhas**:
   - Criar caixinha
   - Renomear caixinha
   - Mover nota para caixinha
   - Excluir caixinha

5. **Notas**:
   - Visualizar nota
   - Editar transcrição
   - Excluir nota
   - Player de áudio

## Performance

### Metas

- Cold start: < 2s
- Tap → Recording: < 300ms
- Scroll: 60fps
- Navegação: < 200ms

### Otimizações Implementadas

- ✅ SQLite para cache local
- ✅ Offline-first (salva local primeiro)
- ✅ Otimistic updates
- ⏳ FlashList (pendente)
- ⏳ Lazy loading (pendente)

## Referências

- **Especificações**: `docs/bau-mental-mobile/1-interfaces.md` e `2-prd.md`
- **Exemplo Arquitetural**: `examples/mobile/` (Smart Honey App)
- **Backend APIs**: `backend/apps/bau_mental/`


