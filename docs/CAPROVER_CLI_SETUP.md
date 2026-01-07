# Guia de Instalação e Configuração do CapRover CLI

## 📦 Instalação

### Linux/WSL

```bash
# Instalar via npm (requer Node.js)
npm install -g caprover

# OU via npx (sem instalar globalmente)
# npx caprover <comando>
```

**Se não tiver Node.js instalado:**

```bash
# Instalar Node.js via nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts

# Depois instalar CapRover CLI
npm install -g caprover
```

### Verificar Instalação

```bash
caprover --version
# Deve mostrar a versão instalada
```

## 🔧 Configuração Inicial

### 1. Obter Credenciais do CapRover

Você precisa de:
- **URL do CapRover**: Ex: `https://captain.yourdomain.com` ou `http://your-server-ip:3000`
- **Password**: A senha que você configurou ao instalar o CapRover

### 2. Fazer Login

```bash
caprover login
```

O comando irá pedir:
- **CapRover server URL**: URL do seu CapRover (ex: `https://captain.yourdomain.com`)
- **Password**: Senha do CapRover

**Exemplo:**
```bash
$ caprover login
? CapRover server URL: https://captain.yourdomain.com
? Password: ********
✅ Login successful!
```

### 3. Verificar Conexão

```bash
caprover list
```

Isso deve listar todos os apps no seu CapRover.

## 🚀 Comandos Úteis

### Listar Apps

```bash
caprover list
```

### Ver Logs de um App

```bash
caprover logs -a NOME_DO_APP
# Exemplo:
caprover logs -a ut-be
```

### Ver Logs com Tail (últimas linhas)

```bash
caprover logs -a ut-be --tail 100
```

### Executar Comando no Container

```bash
caprover exec -a NOME_DO_APP "COMANDO"
# Exemplo:
caprover exec -a ut-be "python check_csrf_config.py"
```

### Ver Variáveis de Ambiente

```bash
caprover getenv -a NOME_DO_APP
```

### Configurar Variável de Ambiente

```bash
caprover setenv -a NOME_DO_APP KEY=VALUE
# Exemplo:
caprover setenv -a ut-be CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com
```

### Fazer Deploy

```bash
caprover deploy
```

## 🔍 Executar Script de Diagnóstico CSRF

Após configurar o CapRover CLI, execute:

```bash
# 1. Verificar se está conectado
caprover list

# 2. Executar script de diagnóstico
caprover exec -a ut-be "python check_csrf_config.py"
```

## 📝 Troubleshooting

### Erro: "command not found: caprover"

**Solução:**
```bash
# Verificar se Node.js está instalado
node --version
npm --version

# Se não estiver, instalar Node.js primeiro
# Depois instalar CapRover CLI
npm install -g caprover
```

### Erro: "Cannot connect to CapRover"

**Solução:**
1. Verificar se a URL está correta
2. Verificar se o CapRover está acessível
3. Verificar se a senha está correta
4. Tentar fazer login novamente: `caprover login`

### Erro: "Permission denied"

**Solução:**
```bash
# Se usar npm global, pode precisar de sudo (não recomendado)
# Melhor: usar nvm para instalar Node.js sem precisar de sudo
```

## 🔗 Referências

- [CapRover CLI Documentation](https://caprover.com/docs/cli.html)
- [CapRover GitHub](https://github.com/caprover/caprover)


