# Testando o App Mobile Localmente

## Visão Geral

Este guia explica como testar o app mobile bau_mental localmente, especialmente quando usando **WSL (Windows Subsystem for Linux)** com um **dispositivo físico separado** (celular Android/iOS).

## Como Funciona: Backend vs Expo Tunnel

### ⚠️ IMPORTANTE: Backend NÃO precisa de tunnel!

**O backend Django:**
- Roda localmente no WSL (notebook)
- É acessível via `localhost:8001` ou `127.0.0.1:8001`
- **NÃO precisa de tunnel** - apenas precisa estar rodando em `0.0.0.0` para aceitar conexões

**O Expo Dev Server:**
- **PRECISA de tunnel** quando você está no WSL e usa dispositivo físico
- O tunnel conecta seu celular ao código do app (hot reload, etc.)
- As requisições HTTP do app vão para `localhost:8001`, que o Expo resolve corretamente

### Fluxo de Conexão

```
Celular Android (dispositivo físico)
    ↓ (via Expo Tunnel - apenas para código do app)
Expo Dev Server (WSL no notebook)
    ↓ (requisições HTTP do app)
Backend Django (localhost:8001 no WSL)
```

**Resumo:**
- ✅ Backend roda normalmente (sem tunnel)
- ✅ Expo usa tunnel apenas para servir o código do app
- ✅ Requisições do app vão direto para `localhost:8001` (Expo resolve)

## Script de Teste

### Uso Básico (Padrão - Recomendado)

```bash
./test-mobile.sh
```

**Padrão:** Usa Expo tunnel + ngrok para backend (funciona de qualquer rede)

Este script:
1. ✅ Verifica se backend está rodando (ou inicia se necessário)
2. ✅ Inicia ngrok tunnel para backend (URL pública)
3. ✅ Configura `.env` do mobile com URL do ngrok
4. ✅ Inicia Expo com tunnel (código do app)

### Outras Opções

**Sem tunnel do backend (usa IP local):**
```bash
./test-mobile.sh --no-backend-tunnel
```
- Expo usa tunnel (código do app)
- Backend usa IP local
- Requer mesma rede Wi-Fi ou firewall configurado

**Sem tunnels (LAN apenas):**
```bash
./test-mobile.sh --no-tunnel
```

**Vantagens do modo LAN:**
- ✅ Mais rápido (não depende de internet)
- ✅ Não usa dados móveis
- ✅ Mais estável

**Requisitos:**
- Celular e notebook na mesma rede Wi-Fi
- Backend acessível via IP local (ex: `192.168.1.100:8001`)
- Firewall configurado para permitir conexões

## Configuração Manual

### 1. Backend

O backend deve estar rodando e acessível:

```bash
# Opção 1: Usar dev-start.sh (inicia backend + frontend)
./dev-start.sh

# Opção 2: Iniciar apenas backend
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8001
```

**⚠️ IMPORTANTE:** Backend deve rodar em `0.0.0.0` (não apenas `127.0.0.1`) para aceitar conexões externas quando usar modo LAN.

### 2. CORS no Backend

O backend já está configurado para aceitar requisições do Expo. Verifique em `backend/config/settings/base.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Frontend web
    "http://127.0.0.1:5173",
    # Expo adiciona automaticamente origens do tunnel
]
```

**Para desenvolvimento mobile, você pode temporariamente permitir todas as origens:**

```python
# backend/config/settings/dev.py
# Já configurado para aceitar via variável de ambiente:
# CORS_ALLOW_ALL_ORIGINS = os.environ.get("CORS_ALLOW_ALL_ORIGINS", "False")...

# Ou ative diretamente (apenas para desenvolvimento):
CORS_ALLOW_ALL_ORIGINS = True  # ⚠️ Apenas para desenvolvimento!
```

⚠️ **NUNCA** faça isso em produção!

### 3. Mobile .env

O script `test-mobile.sh` cria automaticamente o `.env`, mas você pode criar manualmente:

**Com tunnel (WSL + dispositivo físico):**
```bash
# mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:8001
```
O Expo tunnel resolve `localhost` corretamente.

**Sem tunnel (LAN - mesma rede Wi-Fi):**
```bash
# mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8001  # IP do seu notebook
```

### 4. Iniciar Expo

```bash
cd mobile

# Com tunnel (WSL + dispositivo físico) - RECOMENDADO
npx expo start --tunnel

# Sem tunnel (LAN - mesma rede Wi-Fi)
npx expo start --lan

# Modo local (apenas emulador)
npx expo start
```

## Cenários de Uso

### Cenário 1: WSL + Celular Android (Dispositivo Físico)

**Setup:**
- Notebook com WSL (onde você programa)
- Celular Android (dispositivo físico, pode estar em outra rede)

**Comando:**
```bash
./test-mobile.sh  # Usa tunnel automaticamente
```

**Como funciona:**
1. Backend roda em `0.0.0.0:8001` no WSL (sem tunnel)
2. Expo inicia com `--tunnel` (cria tunnel público)
3. Você escaneia QR code no celular
4. App carrega via tunnel
5. Requisições do app vão para `localhost:8001` (Expo resolve)

### Cenário 2: WSL + Celular Android (Mesma Rede Wi-Fi)

**Setup:**
- Notebook com WSL (onde você programa)
- Celular Android (mesma rede Wi-Fi)

**Comando:**
```bash
./test-mobile.sh --no-tunnel  # Usa LAN
```

**Como funciona:**
1. Backend roda em `0.0.0.0:8001` no WSL
2. Expo inicia com `--lan` (usa IP local)
3. Você escaneia QR code no celular
4. App carrega via LAN (mais rápido)
5. Requisições do app vão para `192.168.1.100:8001` (IP do notebook)

### Cenário 3: WSL + Emulador Android

**Setup:**
- Notebook com WSL
- Emulador Android rodando no Windows

**Comando:**
```bash
cd mobile
npx expo start  # Sem tunnel necessário
# Pressione 'a' para Android
```

**Como funciona:**
- Emulador acessa `localhost` diretamente (não precisa de tunnel)
- Requisições vão para `localhost:8001`

## Troubleshooting

### Erro: "Network request failed"

**Causa:** App não consegue conectar ao backend.

**Soluções:**
1. Verifique se backend está rodando:
   ```bash
   curl http://localhost:8001/api/v1/
   ```

2. Verifique `.env` do mobile:
   ```bash
   cat mobile/.env
   # Deve ter: EXPO_PUBLIC_API_URL=http://localhost:8001 (tunnel)
   # Ou: EXPO_PUBLIC_API_URL=http://192.168.1.100:8001 (LAN)
   ```

3. Verifique se backend está em `0.0.0.0`:
   ```bash
   # Deve ver algo como:
   # Starting development server at http://0.0.0.0:8001/
   ```

4. Verifique CORS no backend:
   ```python
   # backend/config/settings/dev.py
   CORS_ALLOW_ALL_ORIGINS = True  # Temporariamente para debug
   ```

5. Reinicie Expo:
   ```bash
   # Parar Expo (Ctrl+C)
   # Limpar cache
   npx expo start -c --tunnel
   ```

### Erro: "CORS policy"

**Causa:** Backend bloqueando requisições do Expo.

**Solução:**
```python
# backend/config/settings/dev.py
CORS_ALLOW_ALL_ORIGINS = True  # Apenas para desenvolvimento!
```

Reinicie o backend após mudar.

### Expo Tunnel não conecta

**Causa:** Problemas de rede ou firewall.

**Soluções:**
1. Verifique conexão com internet
2. Tente modo LAN:
   ```bash
   ./test-mobile.sh --no-tunnel
   ```
3. Use emulador local (não precisa de tunnel):
   ```bash
   cd mobile
   npx expo start
   # Pressione 'a' para Android ou 'i' para iOS
   ```

### Backend não acessível via IP local (modo LAN)

**Causa:** Firewall do Windows/WSL bloqueando conexões.

**Soluções:**
1. **Windows Firewall:**
   - Abra "Windows Defender Firewall"
   - "Permitir um aplicativo ou recurso através do firewall"
   - Adicione Python ou permita porta 8001

2. **WSL Firewall:**
   ```bash
   # No WSL, verifique se porta está aberta
   sudo ufw allow 8001
   ```

3. **Teste conectividade:**
   ```bash
   # Do celular, tente acessar:
   # http://192.168.1.100:8001/api/v1/
   # (substitua pelo IP do seu notebook)
   ```

### Backend não inicia

**Causa:** Porta em uso ou erro de configuração.

**Soluções:**
1. Verifique se porta está livre:
   ```bash
   lsof -i :8001
   # Se estiver em uso, mate o processo:
   kill -9 <PID>
   ```

2. Verifique logs:
   ```bash
   tail -f /tmp/backend-mobile.log
   ```

3. Inicie backend manualmente:
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py runserver 0.0.0.0:8001
   ```

## Resumo Rápido

### WSL + Celular Android (Dispositivo Físico)
```bash
./test-mobile.sh  # Usa tunnel automaticamente
```
- ✅ Backend roda normalmente (sem tunnel)
- ✅ Expo usa tunnel apenas para código do app
- ✅ Requisições vão para `localhost:8001`

### WSL + Celular Android (Mesma Rede Wi-Fi)
```bash
./test-mobile.sh --no-tunnel  # Usa LAN
```
- ✅ Backend roda em `0.0.0.0:8001`
- ✅ Expo usa LAN (mais rápido)
- ✅ Requisições vão para IP local do notebook

### WSL + Emulador
```bash
cd mobile
npx expo start  # Sem tunnel necessário
```
- ✅ Emulador acessa `localhost` diretamente

## Próximos Passos

1. ✅ Backend rodando em `0.0.0.0:8001`
2. ✅ Mobile configurado (`.env`)
3. ✅ Expo iniciado (tunnel ou LAN)
4. 📱 Escanear QR code com Expo Go
5. 🎉 Testar app!

---

**Dúvidas?** Verifique os logs:
- Backend: `/tmp/backend-mobile.log` ou `logs/backend-*.log`
- Expo: Console do terminal onde rodou `expo start`
