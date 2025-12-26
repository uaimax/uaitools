# Guia de Deploy

## Estrutura de Deploy

Este projeto suporta dois modos de deploy:

### Modo 1: Serviço Único (Recomendado para MVP)

Backend e frontend rodam no mesmo container/serviço.

**Configuração CapRover:**
- App único apontando para `backend/Dockerfile`
- Frontend buildado e servido pelo Django/WhiteNoise

### Modo 2: Serviços Separados (Recomendado para escala)

Backend e frontend em serviços separados.

**Configuração CapRover usando `captain-definition` (Recomendado):**
- App "backend": Captain Definition File = `backend/captain-definition`
- App "frontend": Captain Definition File = `frontend/captain-definition`

**Configuração CapRover usando Dockerfile (Alternativa):**
- App "backend": Dockerfile Location = `backend/Dockerfile`
- App "frontend": Dockerfile Location = `frontend/Dockerfile`

## Variáveis de Ambiente

### Desenvolvimento (junto)
```bash
ENVIRONMENT=development  # ou ENVIRONMENT=dev (compatível)
FRONTEND_URL=          # Vazio = mesmo domínio
API_URL=/api          # Relativo
CORS_ENABLED=False     # Desabilitado
```

### Produção (separado)
```bash
ENVIRONMENT=production  # ou ENVIRONMENT=prod (compatível)
FRONTEND_URL=https://meusite.com
API_URL=https://api.meusite.com
CORS_ENABLED=True
ALLOWED_HOSTS=api.meusite.com
```

## Configuração no CapRover

### Usando `captain-definition` (Recomendado)

O projeto inclui arquivos `captain-definition` prontos para uso:

1. **Criar dois apps no CapRover:**
   - App "backend"
   - App "frontend"

2. **Configurar Captain Definition File para cada app:**
   - **Backend**: No app "backend", configure:
     - **Captain Definition File**: `backend/captain-definition`
     - O caminho é relativo à raiz do repositório Git

   - **Frontend**: No app "frontend", configure:
     - **Captain Definition File**: `frontend/captain-definition`
     - O caminho é relativo à raiz do repositório Git

3. **Configurar repositório Git:**
   - Conecte o repositório Git no CapRover
   - O CapRover irá clonar o repositório e usar os arquivos `captain-definition` especificados

4. **Variáveis de ambiente:**
   - Configure as variáveis de ambiente necessárias em cada app (veja seção abaixo)

### Usando Dockerfile (Alternativa)

Se preferir usar Dockerfiles diretamente:

1. Criar dois apps no CapRover
2. Configurar Dockerfile Location para cada um:
   - Backend: `backend/Dockerfile`
   - Frontend: `frontend/Dockerfile`

## Migração de Junto para Separado

1. Criar dois apps no CapRover
2. Configurar Captain Definition File ou Dockerfile Location para cada um
3. Atualizar variáveis de ambiente:
   - Backend: `FRONTEND_URL`, `CORS_ENABLED=True`
   - Frontend: `API_URL` (URL absoluta do backend)
4. Instalar `django-cors-headers` no backend (já incluído)
5. Configurar CORS no settings (já configurado)

## URLs

**IMPORTANTE:** Todas as APIs devem usar prefixo `/api/`

- ✅ Correto: `/api/leads/`, `/api/auth/login/`
- ❌ Errado: `/leads/`, `/auth/login/`

Isso facilita:
- Proxy reverso (nginx) quando separar
- Identificação clara de rotas de API
- Migração futura sem quebrar URLs




