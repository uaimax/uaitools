# Cuidados Implementados para Separação Futura

Este documento lista todos os cuidados tomados para facilitar migração de "serviço único" para "serviços separados" no futuro.

## ✅ Mudanças Implementadas

### 1. Estrutura de URLs

**Arquivo:** `backend/config/urls.py`

**Mudança:**
- ✅ Todas as APIs agora usam prefixo `/api/`
- ✅ Criado `api/urls.py` para centralizar rotas de API
- ✅ Comentários explicando propósito

**Benefício:** Quando separar, nginx pode fazer proxy de `/api/*` para backend facilmente.

### 2. Variáveis de Ambiente para URLs

**Arquivo:** `backend/config/settings/base.py`

**Mudança:**
- ✅ `FRONTEND_URL` - URL do frontend (vazio = mesmo domínio)
- ✅ `API_URL` - Prefixo/URL da API (relativo ou absoluto)
- ✅ `API_PREFIX` - Constante com prefixo padrão

**Benefício:** Migração apenas mudando variáveis de ambiente, sem alterar código.

### 3. CORS Preparado

**Arquivo:** `backend/config/settings/base.py`

**Mudança:**
- ✅ `CORS_ENABLED` - Flag para habilitar CORS
- ✅ Estrutura preparada (comentada) para quando separar
- ✅ Desabilitado por padrão (normal quando junto)

**Benefício:** Ao separar, só habilitar flag e instalar `django-cors-headers`.

### 4. ALLOWED_HOSTS Configurável

**Arquivos:** `backend/config/settings/dev.py`, `backend/config/settings/prod.py`

**Mudança:**
- ✅ `ALLOWED_HOSTS` agora lê de variável de ambiente
- ✅ Suporta lista separada por vírgula
- ✅ Validação em produção (obrigatório)

**Benefício:** Fácil configurar diferentes hosts sem alterar código.

### 5. .env.example Atualizado

**Arquivo:** `.env.example`

**Mudança:**
- ✅ Adicionadas todas as novas variáveis
- ✅ Comentários explicando cada uma
- ✅ Exemplos para quando junto e quando separado

**Benefício:** Documentação clara de todas as configurações.

### 6. Documentação

**Arquivos:** `docs/DEPLOYMENT.md`, `docs/ARCHITECTURE.md`

**Mudança:**
- ✅ Guia de deploy completo
- ✅ Explicação de arquitetura
- ✅ Checklist de migração

**Benefício:** Facilita migração futura e onboarding.

## 🚫 O que NÃO fazer (Anti-patterns)

### ❌ URLs sem prefixo `/api/`
```python
# ❌ ERRADO
path("leads/", ...)  # Sem prefixo

# ✅ CORRETO
path("api/", include("api.urls"))  # Com prefixo
```

### ❌ URLs hardcoded
```python
# ❌ ERRADO
FRONTEND_URL = "https://meusite.com"

# ✅ CORRETO
FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
```

### ❌ CORS sempre habilitado
```python
# ❌ ERRADO (quando tudo junto)
CORS_ALLOWED_ORIGINS = ["https://meusite.com"]

# ✅ CORRETO
CORS_ENABLED = os.environ.get("CORS_ENABLED", "False") == "True"
if CORS_ENABLED:
    # Configurar CORS
```

## 📋 Checklist para Migração Futura

Quando quiser separar serviços:

- [ ] Criar dois apps no CapRover
- [ ] Configurar Dockerfile Location para cada app
- [ ] Atualizar variáveis de ambiente (FRONTEND_URL, CORS_ENABLED)
- [ ] Instalar `django-cors-headers` no backend
- [ ] Descomentar configuração CORS no settings
- [ ] Testar comunicação entre serviços
- [ ] Atualizar frontend para usar API_URL absoluto

## 🎯 Resultado

Com essas mudanças, a migração de "junto" para "separado" será:
- ✅ Simples (só variáveis de ambiente)
- ✅ Sem quebrar código existente
- ✅ Sem refatoração complexa
- ✅ Documentada e clara

