# Configuração da URL da API

## Como Funciona

A URL do backend é configurada através da variável de ambiente `EXPO_PUBLIC_API_URL`. É **muito fácil** mudar entre ambientes (dev, staging, produção).

## Configuração

### 1. Criar arquivo `.env`

Na raiz do projeto `mobile/`, crie um arquivo `.env`:

```bash
# Desenvolvimento local
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### 2. Diferentes Ambientes

#### Desenvolvimento Local
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
```

#### Desenvolvimento com Dispositivo Físico
Use o IP da sua máquina na mesma rede Wi-Fi:
```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

**Como descobrir seu IP:**
- Linux/Mac: `ifconfig` ou `ip addr`
- Windows: `ipconfig`
- Procure por `inet` ou `IPv4` na interface Wi-Fi

#### Staging
```bash
EXPO_PUBLIC_API_URL=https://staging-api.seudominio.com
```

#### Produção
```bash
EXPO_PUBLIC_API_URL=https://api.seudominio.com
```

### 3. Usar no Código

A URL é automaticamente lida em `src/constants/config.ts`:

```typescript
import { API_BASE_URL } from '@/constants/config';

// API_BASE_URL já está configurada corretamente
```

## Mudança Rápida Entre Ambientes

### Opção 1: Arquivo `.env` (Recomendado)

1. Crie `.env.development`, `.env.staging`, `.env.production`
2. Use o arquivo apropriado:

```bash
# Desenvolvimento
cp .env.development .env

# Staging
cp .env.staging .env

# Produção
cp .env.production .env
```

### Opção 2: Variável de Ambiente no Terminal

```bash
# Desenvolvimento
EXPO_PUBLIC_API_URL=http://localhost:8000 npm start

# Produção
EXPO_PUBLIC_API_URL=https://api.seudominio.com npm start
```

### Opção 3: app.json (Para Builds)

Para builds de produção (EAS Build), você pode configurar no `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.seudominio.com"
    }
  }
}
```

E usar no código:
```typescript
import Constants from 'expo-constants';
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
```

## Verificação

Para verificar qual URL está sendo usada, adicione um log temporário:

```typescript
// src/constants/config.ts
console.log('API Base URL:', API_BASE_URL);
```

## Troubleshooting

### Erro: "Network request failed"
- Verifique se a URL está correta
- Verifique se o backend está rodando
- Verifique se o dispositivo está na mesma rede (para IP local)
- Verifique firewall/antivírus

### Erro: "CORS error"
- O backend precisa permitir requisições do app mobile
- Configure `CORS_ALLOWED_ORIGINS` no backend Django
- Para desenvolvimento, pode usar `CORS_ALLOW_ALL_ORIGINS=True` (apenas dev!)

### App não conecta após mudar URL
1. Pare o servidor Expo (`Ctrl+C`)
2. Limpe o cache: `npx expo start -c`
3. Reinicie o app no dispositivo

## Exemplos Práticos

### Desenvolvimento Local
```bash
# mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### Teste em Dispositivo (mesma rede)
```bash
# mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

### Produção
```bash
# mobile/.env
EXPO_PUBLIC_API_URL=https://api.supbrainnote.com
```

## Segurança

⚠️ **Importante**: Nunca commite o arquivo `.env` com URLs de produção no Git!

O arquivo `.env` já está no `.gitignore`, mas sempre verifique antes de commitar.

## Resumo

✅ **Sim, é muito fácil mudar!**

1. Edite `mobile/.env`
2. Mude `EXPO_PUBLIC_API_URL`
3. Reinicie o app (`npm start`)

Pronto! O app agora usa a nova URL.


