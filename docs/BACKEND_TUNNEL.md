# Tunnel para Backend (ngrok)

## Quando Usar

Use tunnel para o backend quando:
- ✅ Dispositivo físico está em rede diferente do notebook
- ✅ Firewall bloqueia conexões diretas
- ✅ IP local não está acessível
- ✅ Quer testar de qualquer lugar (não precisa mesma Wi-Fi)

## Como Usar

### Opção 1: Script Automático (Recomendado)

```bash
./test-mobile.sh --backend-tunnel
```

O script vai:
1. ✅ Verificar se ngrok está instalado
2. ✅ Iniciar ngrok tunnel para backend (porta 8001)
3. ✅ Obter URL pública do ngrok
4. ✅ Atualizar `.env` do mobile automaticamente
5. ✅ Iniciar Expo com tunnel

### Opção 2: Manual

```bash
# 1. Iniciar ngrok em um terminal
ngrok http 8001

# 2. Copiar URL pública (ex: https://abc123.ngrok.io)

# 3. Atualizar .env do mobile
echo "EXPO_PUBLIC_API_URL=https://abc123.ngrok.io" > mobile/.env

# 4. Iniciar Expo
cd mobile
npm start --tunnel
```

## Instalação do ngrok

### Linux/WSL

```bash
# Download
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz

# Extrair
tar -xzf ngrok-v3-stable-linux-amd64.tgz

# Mover para /usr/local/bin
sudo mv ngrok /usr/local/bin/

# Verificar
ngrok version
```

### Autenticação (Opcional mas Recomendado)

```bash
# Criar conta em https://ngrok.com (grátis)
# Obter authtoken do dashboard

# Configurar
ngrok config add-authtoken SEU_TOKEN_AQUI
```

**Vantagens da autenticação:**
- ✅ URLs estáveis (não mudam a cada reinício)
- ✅ Mais seguro
- ✅ Dashboard web para monitorar requisições

## Verificar Tunnel

### Via API do ngrok

```bash
# Obter URL do tunnel
curl http://localhost:4040/api/tunnels | jq '.tunnels[0].public_url'

# Ou ver no dashboard web
# Abra: http://localhost:4040
```

### Testar Conectividade

```bash
# Do dispositivo ou outro computador
curl https://SEU_NGROK_URL.ngrok.io/api/v1/
```

## Troubleshooting

### ngrok não inicia

**Causa:** Porta 4040 em uso ou ngrok não instalado.

**Solução:**
```bash
# Verificar se ngrok está rodando
pgrep -f ngrok

# Matar processo se necessário
pkill ngrok

# Verificar instalação
which ngrok
```

### URL do ngrok não funciona

**Causa:** Backend não está rodando ou ngrok não conectou.

**Solução:**
1. Verificar se backend está rodando:
   ```bash
   curl http://localhost:8001/api/v1/
   ```

2. Verificar logs do ngrok:
   ```bash
   tail -f /tmp/ngrok-backend.log
   ```

3. Verificar dashboard do ngrok:
   ```bash
   # Abrir no navegador
   http://localhost:4040
   ```

### CORS Error com ngrok

**Causa:** Backend bloqueando requisições do domínio ngrok.

**Solução:**
```python
# backend/config/settings/dev.py
CORS_ALLOW_ALL_ORIGINS = True  # Apenas para desenvolvimento!
```

## Comparação de Métodos

| Método | Velocidade | Facilidade | Funciona de Qualquer Lugar |
|--------|-----------|------------|---------------------------|
| **IP Local** | ⚡⚡⚡ Rápido | ⭐⭐ Médio | ❌ Só mesma rede |
| **ngrok** | ⚡⚡ Médio | ⭐⭐⭐ Fácil | ✅ Sim |
| **Expo Tunnel** | ⚡ Lento | ⭐⭐⭐ Fácil | ✅ Sim |

## Resumo

### Com ngrok (Recomendado para dispositivos em redes diferentes)
```bash
./test-mobile.sh --backend-tunnel
```

### Sem ngrok (Mesma rede Wi-Fi)
```bash
./test-mobile.sh --no-tunnel
```

### Apenas Expo tunnel (Código do app)
```bash
./test-mobile.sh
```

---

**Dica:** Use ngrok quando IP local não funcionar ou dispositivo estiver em rede diferente!


