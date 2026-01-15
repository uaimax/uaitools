# Deep Research: Android Share Intent - App não aparece no menu de compartilhamento

## 📋 Sumário Executivo

**Problema**: O app bau_mental não aparece na lista de apps quando o usuário tenta compartilhar um áudio do WhatsApp.

**Causa Raiz**: Embora os `intentFilters` estejam configurados no `app.json`, o Expo pode não estar aplicando corretamente essas configurações no `AndroidManifest.xml` gerado, especialmente:
1. Falta de `android:exported="true"` na MainActivity (necessário no Android 12+)
2. Intent filters podem não estar sendo aplicados corretamente pelo Expo
3. O expo-linking pode não estar capturando arquivos compartilhados via ACTION_SEND

**Solução**: Criar um config plugin customizado que garante a aplicação correta dos intent filters no AndroidManifest.xml.

---

## 🔍 Análise Detalhada

### 1. Configuração Atual

O `app.json` já possui os intent filters configurados:

```json
"android": {
  "intentFilters": [
    {
      "action": "android.intent.action.SEND",
      "type": "audio/*",
      "category": ["android.intent.category.DEFAULT"]
    },
    {
      "action": "android.intent.action.SEND_MULTIPLE",
      "type": "audio/*",
      "category": ["android.intent.category.DEFAULT"]
    }
  ]
}
```

### 2. Problemas Identificados

#### Problema 1: Expo pode não aplicar intentFilters corretamente
- O Expo usa `app.json` para gerar o `AndroidManifest.xml`
- Em alguns casos, os intent filters podem não ser aplicados corretamente
- Especialmente quando há múltiplas configurações ou plugins

#### Problema 2: Falta de `android:exported="true"`
- No Android 12+ (API 31+), atividades que recebem intents devem ter `android:exported="true"`
- O Expo pode não adicionar isso automaticamente
- Sem isso, o app não aparece no menu de compartilhamento

#### Problema 3: expo-linking pode não capturar ACTION_SEND
- O `expo-linking` é projetado principalmente para deep links (URLs)
- Arquivos compartilhados via ACTION_SEND podem não ser capturados automaticamente
- Pode ser necessário usar um módulo nativo ou código customizado

### 3. Soluções Encontradas

#### Solução 1: Config Plugin Customizado ✅ (Implementada)
- Criar um config plugin que modifica diretamente o `AndroidManifest.xml`
- Garantir que `android:exported="true"` está presente
- Garantir que os intent filters estão corretamente configurados

#### Solução 2: Verificar AndroidManifest Gerado
- Após o build, verificar se o `AndroidManifest.xml` contém os intent filters
- Localização: `android/app/src/main/AndroidManifest.xml` (após `npx expo prebuild`)

#### Solução 3: Usar Módulo Nativo (Se necessário)
- Se o expo-linking não funcionar, usar `react-native-share-menu` ou criar módulo customizado
- Isso requer código nativo e pode ser mais complexo

---

## 🛠️ Implementação

### Config Plugin Criado

Foi criado `app.config.js` com um config plugin customizado que:

1. **Encontra a MainActivity** no AndroidManifest
2. **Adiciona `android:exported="true"`** se não existir
3. **Remove intent filters duplicados** de audio/*
4. **Adiciona intent filters corretos** para ACTION_SEND e ACTION_SEND_MULTIPLE

### Como Funciona

```javascript
function withAndroidIntentFilters(config) {
  return withAndroidManifest(config, async (config) => {
    // Modifica o AndroidManifest.xml diretamente
    // Garante que os intent filters estão corretos
  });
}
```

### Recebendo Arquivos Compartilhados

O `App.tsx` já está configurado para receber arquivos via `expo-linking`:

```typescript
const handleUrl = async (event: { url: string }) => {
  const { queryParams } = Linking.parse(event.url);
  if (queryParams?.audioUri || queryParams?.uri) {
    // Navegar para AudioReceivedScreen
  }
};
```

**Nota**: O expo-linking pode não capturar automaticamente arquivos compartilhados. Pode ser necessário:
1. Verificar se o intent está sendo recebido
2. Usar um módulo nativo se necessário
3. Verificar logs do Android para ver se o intent está chegando

---

## 📝 Checklist de Verificação

Após fazer o build, verificar:

- [ ] O `AndroidManifest.xml` contém os intent filters
- [ ] A MainActivity tem `android:exported="true"`
- [ ] Os intent filters têm `action`, `category` e `data` corretos
- [ ] O app aparece no menu de compartilhamento do WhatsApp
- [ ] O app recebe o arquivo quando compartilhado

### Como Verificar o AndroidManifest

```bash
cd mobile
npx expo prebuild --platform android
cat android/app/src/main/AndroidManifest.xml | grep -A 10 "intent-filter"
```

---

## 🚨 Problemas Conhecidos

### 1. WhatsApp pode ter restrições
- Algumas versões do WhatsApp podem ter restrições sobre quais apps aparecem
- Testar em diferentes versões do WhatsApp

### 2. Android 11+ Package Visibility
- No Android 11+, pode ser necessário declarar queries no AndroidManifest
- O config plugin pode precisar adicionar isso também

### 3. expo-linking pode não funcionar para arquivos
- Se o expo-linking não capturar arquivos compartilhados, pode ser necessário:
  - Usar `react-native-share-menu`
  - Criar módulo nativo customizado
  - Usar `expo-intent-launcher` de forma diferente

---

## 🔄 Próximos Passos

1. **Fazer novo build** com o config plugin
2. **Testar no dispositivo** se o app aparece no menu de compartilhamento
3. **Verificar logs** se o intent está sendo recebido
4. **Se não funcionar**, considerar usar módulo nativo

---

## 📚 Referências

- [Android Intent Filters Documentation](https://developer.android.com/training/basics/intents/filters)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)
- [Expo Linking Documentation](https://docs.expo.dev/versions/latest/sdk/linking/)
- [Android Package Visibility](https://developer.android.com/training/package-visibility)

---

## ✅ Solução Implementada

- ✅ Config plugin customizado criado em `app.config.js`
- ✅ Garante `android:exported="true"` na MainActivity
- ✅ Adiciona intent filters corretos para ACTION_SEND e ACTION_SEND_MULTIPLE
- ✅ Remove duplicações de intent filters

**Próximo passo**: Fazer novo build e testar no dispositivo.

