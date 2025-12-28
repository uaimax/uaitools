# Configuração do App Mobile

## 🔧 Configuração da URL do Backend

O app mobile usa a variável de ambiente `EXPO_PUBLIC_API_URL` para se conectar ao backend.

### 📍 URL de Produção

A URL de produção está configurada como:
```
https://ut-be.app.webmaxdigital.com
```

### 🛠️ Como Configurar

#### Opção 1: Criar `.env` manualmente (Recomendado para produção)

1. Copie o arquivo de exemplo:
   ```bash
   cd mobile
   cp .env.example .env
   ```

2. Edite o `.env` e configure:
   ```env
   EXPO_PUBLIC_API_URL=https://ut-be.app.webmaxdigital.com
   EXPO_PUBLIC_SENTRY_DSN=sua_chave_sentry_aqui
   ```

#### Opção 2: Usar `test-mobile.sh` para desenvolvimento

O script `test-mobile.sh` automaticamente cria um `.env` para desenvolvimento local, mas **NÃO sobrescreve** se já existir uma URL de produção configurada.

**Comportamento:**
- ✅ Se `.env` não existe → Cria com URL de desenvolvimento
- ✅ Se `.env` existe mas não tem URL de produção → Atualiza para desenvolvimento
- ⚠️ Se `.env` existe com URL de produção → **NÃO sobrescreve** (mantém produção)
- 🔧 Use `./test-mobile.sh --force-env` para forçar sobrescrever

### 🔄 Alternando entre Produção e Desenvolvimento

#### Para usar Produção:
```bash
cd mobile
cat > .env << EOF
EXPO_PUBLIC_API_URL=https://ut-be.app.webmaxdigital.com
EXPO_PUBLIC_SENTRY_DSN=sua_chave_sentry
EOF
```

#### Para usar Desenvolvimento Local:
```bash
# Opção 1: Deixar o test-mobile.sh criar automaticamente
./test-mobile.sh

# Opção 2: Forçar sobrescrever mesmo com produção
./test-mobile.sh --force-env

# Opção 3: Editar manualmente
cd mobile
cat > .env << EOF
EXPO_PUBLIC_API_URL=http://localhost:8001
EXPO_PUBLIC_SENTRY_DSN=sua_chave_sentry
EOF
```

### 📝 Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|----------|-----------|------------|
| `EXPO_PUBLIC_API_URL` | URL base do backend | ✅ Sim |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN do Sentry/GlitchTip | ⚠️ Opcional |

### 🔍 Verificar Configuração Atual

```bash
cd mobile
cat .env
```

### ⚠️ Importante

- O arquivo `.env` está no `.gitignore` e **NÃO é versionado**
- Cada desenvolvedor deve criar seu próprio `.env`
- O `.env.example` serve como template
- O `test-mobile.sh` respeita configurações de produção existentes

### 🚀 Build de Produção

Para builds de produção (EAS Build, etc), certifique-se de que o `.env` ou `app.json` tenha a URL de produção configurada.

---

**Última atualização:** 2025-12-27

