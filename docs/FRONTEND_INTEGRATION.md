# Guia de Integração Frontend ↔ Backend

## Estado Atual

**Frontend:** Ainda não implementado (Fase 4)
**Backend:** Preparado e configurado para integração

## Configurações Preparadas no Backend

### 1. URLs da API

✅ **Todas as APIs usam prefixo `/api/`**

```python
# backend/config/urls.py
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),  # ✅ Prefixo /api/
]
```

**Para o frontend usar:**
- Quando junto: `http://localhost:8001/api/...`
- Quando separado: `https://api.meusite.com/...`

### 2. Variáveis de Ambiente

✅ **Configuradas e prontas:**

```python
# backend/config/settings/base.py
FRONTEND_URL = os.environ.get("FRONTEND_URL", "").strip()
API_URL = os.environ.get("API_URL", "/api").strip()
CORS_ENABLED = os.environ.get("CORS_ENABLED", "False") == "True"
```

**Valores padrão (quando junto):**
- `FRONTEND_URL` = "" (vazio = mesmo domínio)
- `API_URL` = "/api" (relativo)
- `CORS_ENABLED` = False (desabilitado)

### 3. CORS Preparado

✅ **Estrutura pronta para quando separar:**

```python
# CORS será habilitado automaticamente quando:
# - CORS_ENABLED=True
# - FRONTEND_URL configurado
# - django-cors-headers instalado
```

## Como o Frontend Deve Referenciar o Backend

### Desenvolvimento (quando implementar)

**Opção 1: Frontend separado (Vite dev server)**
```typescript
// frontend/src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
});
```

**Opção 2: Mesmo serviço (Django serve tudo)**
```typescript
// frontend/src/config/api.ts
const API_URL = '/api';  // Relativo - mesmo domínio

export const apiClient = axios.create({
  baseURL: API_URL,
});
```

### Produção

**Quando junto:**
```typescript
const API_URL = '/api';  // Relativo
```

**Quando separado:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://api.meusite.com';
```

## Checklist para Fase 4 (Implementação Frontend)

### Backend (já preparado ✅)
- [x] APIs com prefixo `/api/`
- [x] Variáveis de ambiente configuradas
- [x] CORS preparado (estrutura pronta)
- [ ] Catch-all para SPA (adicionar quando implementar)

### Frontend (a implementar)
- [ ] Criar projeto React + Vite + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Instalar e configurar componentes UI
- [ ] Configurar variável `VITE_API_URL`
- [ ] Criar cliente HTTP (axios/fetch) usando `API_URL`
- [ ] Nunca hardcodar URLs da API
- [ ] Usar variáveis de ambiente
- [ ] Configurar tema (cores, dark mode opcional)

## Exemplo de Configuração Frontend

### Setup Inicial (Fase 4)

```bash
# 1. Criar projeto React + Vite + TypeScript
npm create vite@latest frontend -- --template react-ts

# 2. Instalar dependências base
cd frontend
npm install

# 3. Instalar Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Configurar Componentes UI
# Componentes UI customizados já estão configurados

# 5. Instalar cliente HTTP (opcional)
npm install axios
```

### Configuração de Variáveis de Ambiente

#### `.env` (desenvolvimento)
```bash
VITE_API_URL=http://localhost:8001/api
```

#### `.env.production` (produção - quando separado)
```bash
VITE_API_URL=https://api.meusite.com
```

### Arquivos de Configuração

#### `frontend/src/config/api.ts`
```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // Para cookies/sessão
});
```

#### `frontend/components.json` (configuração de componentes UI)
```json
{
  "$schema": "https://json.schemastore.org/package.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Componentes UI Disponíveis

Componentes UI customizados já estão disponíveis em `src/components/ui/`:
- button, input, form, table, dialog, dropdown-menu, toast, etc.

## Problemas Comuns a Evitar

### ❌ Hardcodar URLs
```typescript
// ❌ ERRADO
const API_URL = 'http://localhost:8001/api';

// ✅ CORRETO
const API_URL = import.meta.env.VITE_API_URL || '/api';
```

### ❌ Não usar prefixo /api/
```typescript
// ❌ ERRADO
fetch('/leads/')  // Sem prefixo

// ✅ CORRETO
fetch('/api/leads/')  // Com prefixo
```

### ❌ CORS sempre habilitado
```python
# ❌ ERRADO (quando tudo junto)
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]

# ✅ CORRETO
CORS_ENABLED = os.environ.get("CORS_ENABLED", "False") == "True"
```

## Stack Frontend Recomendada

### Tecnologias Core
- **React 18+** - Framework UI
- **Vite** - Build tool e dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utilitários CSS
- **Componentes UI Customizados** - Componentes UI (customizáveis)

### Bibliotecas Complementares
- **React Query** (opcional) - Cache e sincronização de dados
- **React Hook Form** (opcional) - Forms com validação
- **Zod** (opcional) - Validação de schemas
- **axios** ou **fetch** - Cliente HTTP

### Por que Componentes UI Customizados?
- ✅ Componentes prontos para SaaS (forms, tables, dialogs)
- ✅ Código mínimo (menos CSS manual)
- ✅ Totalmente customizável (você possui o código)
- ✅ Acessibilidade built-in (Radix UI primitives)
- ✅ Fácil de estender (criar componentes novos seguindo padrões)
- ✅ Bundle pequeno (tree-shaking)

## Próximos Passos

1. **Fase 4:** Implementar frontend React + Vite + TypeScript
2. **Configurar:** Componentes UI e Tailwind CSS
3. **Configurar:** Variáveis de ambiente no frontend
4. **Criar:** Cliente HTTP usando `API_URL`
5. **Testar:** Integração backend ↔ frontend
6. **Deploy:** Configurar CapRover com paths customizados

