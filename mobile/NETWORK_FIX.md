# Correção de Erro de Rede

## Problema

**Erro:** `Network Error` ao tentar fazer login no app mobile.

## Causa

Quando usa **Expo tunnel** com dispositivo físico, o app não consegue acessar `localhost:8001` porque:

1. O tunnel do Expo é apenas para o **código do app** (hot reload, etc.)
2. As **requisições HTTP** ainda precisam ir para o IP real da máquina
3. `localhost` no dispositivo físico aponta para o próprio dispositivo, não para o WSL

## Solução

### Opção 1: Usar IP Local (Recomendado)

O script `test-mobile.sh` foi corrigido para **sempre usar IP local**, mesmo com tunnel:

```bash
# O .env agora usa IP local:
EXPO_PUBLIC_API_URL=http://172.29.198.127:8001
```

### Opção 2: Atualizar Manualmente

Se o script não atualizou automaticamente:

```bash
# 1. Descobrir IP local
ip route get 8.8.8.8 | grep -oP 'src \K\S+'

# 2. Atualizar .env
echo "EXPO_PUBLIC_API_URL=http://SEU_IP:8001" > mobile/.env
```

## Verificação

1. **Backend deve estar rodando em `0.0.0.0:8001`** (não apenas `127.0.0.1`):
   ```bash
   python manage.py runserver 0.0.0.0:8001
   ```

2. **Testar conectividade:**
   ```bash
   curl http://SEU_IP:8001/api/v1/auth/login/
   ```

3. **Verificar firewall:**
   - Windows Firewall deve permitir porta 8001
   - WSL não deve bloquear conexões

## Importante

- ✅ **Tunnel**: Apenas para código do app (hot reload)
- ✅ **HTTP**: Sempre usa IP local da máquina
- ✅ **Backend**: Deve rodar em `0.0.0.0:8001` para aceitar conexões externas

## Próximos Passos

1. Reinicie o Expo:
   ```bash
   cd mobile
   npm start -c
   ```

2. Teste o login novamente

3. Se ainda não funcionar, verifique:
   - Backend está rodando?
   - Firewall está bloqueando?
   - IP está correto no `.env`?

