# Guia do dev-start.sh

## 🎯 Funcionalidades

O script `dev-start.sh` é um **comando único** para iniciar todo o ambiente de desenvolvimento:

- ✅ Backend (Django) + Frontend (Vite) simultaneamente
- ✅ Usa `tmux` se disponível (recomendado)
- ✅ Fallback automático se tmux não estiver instalado
- ✅ Reutiliza sessão existente (attach automático)
- ✅ Setup completo (virtualenv, dependências, migrations, superuser)
- ✅ Funciona em qualquer máquina

## 🚀 Uso Básico

```bash
# Uma linha só - sempre funciona!
./dev-start.sh
```

**O que acontece:**
1. Se sessão tmux já existe → faz attach
2. Se não existe → cria tudo e inicia
3. Se não tem tmux → roda backend em modo simples

## 🔄 Reiniciar Tudo

```bash
# Mata sessão existente e recria
./dev-start.sh --restart
# ou
./dev-start.sh -r
```

## 📺 Com tmux (Recomendado)

### Comandos Úteis

- `Ctrl+B + D` - Detach (sair sem parar serviços)
- `Ctrl+B + 0` - Ir para janela Backend
- `Ctrl+B + 1` - Ir para janela Frontend
- `Ctrl+B + C` - Criar nova janela
- `Ctrl+B + X` - Fechar janela atual

### Parar Tudo

```bash
tmux kill-session -t saas-dev
```

### Ver Sessões

```bash
tmux ls
```

## 🔧 Sem tmux (Fallback)

Se `tmux` não estiver instalado, o script:
- ✅ Roda o backend normalmente
- ⚠️ Frontend precisa ser iniciado manualmente em outro terminal

**Para instalar tmux:**
```bash
# Linux (Debian/Ubuntu)
sudo apt install tmux

# Mac
brew install tmux

# Verificar instalação
tmux -V
```

## 🌐 Portas

- **Backend**: `8001` (configurável via `PORT=8000 ./dev-start.sh`)
- **Frontend**: `5173` (configurável via `FRONTEND_PORT=3000 ./dev-start.sh`)

## 📊 URLs

Após iniciar:
- **Backend**: http://localhost:8001
- **Frontend**: http://localhost:5173
- **Admin**: http://localhost:8001/manage/ (admin / admin123)

## 🐛 Troubleshooting

### Porta já em uso
O script mata processos automaticamente. Se persistir:
```bash
# Verificar processo
lsof -i :8001

# Matar manualmente
kill -9 <PID>
```

### Sessão tmux travada
```bash
# Listar sessões
tmux ls

# Matar sessão específica
tmux kill-session -t saas-dev

# Matar todas as sessões
tmux kill-server
```

### Frontend não inicia
```bash
cd frontend
npm install
npm run dev
```

## 💡 Dicas

1. **Primeira vez**: O script faz setup completo (virtualenv, dependências, migrations)
2. **Próximas vezes**: Apenas inicia os serviços (muito mais rápido)
3. **Detach**: Use `Ctrl+B + D` para sair sem parar os serviços
4. **Reattach**: Execute `./dev-start.sh` novamente para voltar
5. **Logs**: Cada janela mostra logs do respectivo serviço

## 🔐 Credenciais Padrão

- **Usuário**: `admin`
- **Senha**: `admin123`
- **Admin URL**: `/manage/` (configurável via `ADMIN_URL_PREFIX` no `.env`)
