# Análise: Suporte a Áudios Encaminhados de Outros Apps

## 📋 Situação Atual

### ✅ O que JÁ está preparado:

1. **Backend - Upload e Classificação**
   - ✅ Endpoint `/api/v1/supbrainnote/notes/upload/` aceita `box_id` opcional
   - ✅ Classificação automática já funciona após transcrição
   - ✅ Task `transcribe_audio` chama `classify_note` automaticamente
   - ✅ Serviço de classificação tem matching fonético e por nome de caixinha
   - ✅ Prompt do Whisper inclui nomes de caixinhas para melhor transcrição

2. **Mobile - Upload de Áudio**
   - ✅ Função `uploadAudio()` aceita `boxId` opcional
   - ✅ Suporte a `expo-file-system` para manipular arquivos

### ❌ O que FALTA:

1. **Mobile - Receber Áudios de Outros Apps**
   - ❌ **Share Extension** não configurada (iOS/Android)
   - ❌ **Deep Linking** não configurado para receber arquivos
   - ❌ **Tela/Fluxo** para processar áudios recebidos
   - ❌ **Detecção** de que é um áudio encaminhado (vs gravação direta)

2. **Backend - Melhorias para Áudios Encaminhados**
   - ⚠️ Classificação automática funciona, mas pode ser melhorada
   - ⚠️ Não há flag/metadata para identificar áudios encaminhados
   - ⚠️ Não há priorização de classificação para áudios encaminhados

---

## 🎯 O que precisa ser implementado

### 1. Share Extension (iOS/Android)

**iOS:**
- Configurar `Info.plist` para aceitar tipos de arquivo de áudio
- Criar Share Extension target no Xcode
- Implementar handler para receber arquivos compartilhados

**Android:**
- Configurar `AndroidManifest.xml` com intent filters
- Implementar `ShareActivity` para receber arquivos
- Processar arquivos recebidos via Intent

**Expo/React Native:**
- Usar `expo-sharing` ou `react-native-share-extension`
- Configurar `app.json` com `shareExtension` config
- Implementar handler no app principal

### 2. Deep Linking para Arquivos

**Configuração:**
```json
// app.json
{
  "expo": {
    "scheme": "supbrainnote",
    "ios": {
      "associatedDomains": ["applinks:supbrainnote.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "android.intent.action.SEND",
          "type": "audio/*"
        }
      ]
    }
  }
}
```

**Handler no App:**
```typescript
// App.tsx
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';

useEffect(() => {
  const handleUrl = async (event: { url: string }) => {
    // Processar URL com arquivo de áudio
  };

  Linking.addEventListener('url', handleUrl);
  return () => Linking.removeEventListener('url', handleUrl);
}, []);
```

### 3. Fluxo de Processamento

**Tela de Recebimento:**
- Tela intermediária para confirmar recebimento
- Mostrar preview do áudio (se possível)
- Opção de escolher caixinha antes de processar
- Upload automático com classificação

**Fluxo:**
```
Áudio recebido → Tela de confirmação → Upload → Transcrição → Classificação automática → Nota criada
```

### 4. Melhorias no Backend

**Adicionar flag `source_type`:**
```python
# Já existe, mas pode adicionar:
SOURCE_CHOICES = [
    ("memo", _("Memo próprio")),
    ("group_audio", _("Áudio de grupo")),
    ("forwarded", _("Áudio encaminhado")),  # NOVO
]
```

**Priorizar classificação para áudios encaminhados:**
```python
# Em tasks.py, após transcrição:
if note.source_type == "forwarded":
    # Classificação mais agressiva
    # Threshold menor para matching
    classify_note.delay(str(note.id), priority=9)  # Alta prioridade
```

---

## 📊 Prioridades de Implementação

### Fase 1: Essencial (MVP)
1. ✅ **Backend já está pronto** - classificação automática funciona
2. ⚠️ **Configurar Share Extension** - receber arquivos de outros apps
3. ⚠️ **Tela de recebimento** - confirmar e processar áudio
4. ⚠️ **Upload automático** - enviar para backend com `source_type="forwarded"`

### Fase 2: Melhorias
1. ⚠️ **Deep Linking** - receber via URL
2. ⚠️ **Preview de áudio** - mostrar antes de processar
3. ⚠️ **Seleção de caixinha** - opção antes de processar
4. ⚠️ **Priorização** - classificação mais rápida para encaminhados

---

## 🔧 Implementação Recomendada

### Opção 1: Share Extension Nativa (Recomendado)

**Vantagens:**
- ✅ Funciona nativamente no iOS/Android
- ✅ Melhor UX (aparece no menu de compartilhamento)
- ✅ Suporta múltiplos tipos de arquivo

**Desvantagens:**
- ❌ Requer configuração nativa (Xcode/Android Studio)
- ❌ Mais complexo de implementar

**Bibliotecas:**
- `react-native-share-extension` (não mantido ativamente)
- `expo-sharing` (limitado)
- Implementação nativa customizada

### Opção 2: Deep Linking + File Picker

**Vantagens:**
- ✅ Mais simples de implementar
- ✅ Funciona com Expo
- ✅ Não requer código nativo

**Desvantagens:**
- ❌ UX menos integrada
- ❌ Usuário precisa abrir app manualmente

**Bibliotecas:**
- `expo-file-system` (já instalado)
- `expo-document-picker` (para selecionar arquivo)
- `expo-sharing` (para compartilhar)

---

## 📝 Checklist de Implementação

### Backend (Já pronto ✅)
- [x] Endpoint de upload aceita `box_id`
- [x] Classificação automática funciona
- [x] Matching fonético implementado
- [ ] Adicionar `source_type="forwarded"` (opcional)

### Mobile (Precisa implementar ❌)
- [ ] Configurar Share Extension no `app.json`
- [ ] Implementar handler de recebimento
- [ ] Criar tela de confirmação de recebimento
- [ ] Integrar upload com `source_type="forwarded"`
- [ ] Testar fluxo completo

---

## 🚀 Próximos Passos

1. **Decidir abordagem**: Share Extension nativa ou Deep Linking?
2. **Implementar recebimento**: Configurar app para receber arquivos
3. **Criar tela de processamento**: Confirmar e processar áudio
4. **Testar fluxo**: WhatsApp → App → Transcrição → Classificação

---

## 📚 Referências

- [Expo Sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)
- [Expo File System](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [React Native Share Extension](https://github.com/meedan/react-native-share-extension)
- [iOS Share Extension Guide](https://developer.apple.com/documentation/extensionkit/sharing_content_with_your_app_extension)
- [Android Share Intent](https://developer.android.com/training/sharing/receive)

