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

**Configuração CapRover:**
- App "backend": Dockerfile Location = `backend/Dockerfile`
- App "frontend": Dockerfile Location = `frontend/Dockerfile`

## Variáveis de Ambiente

### Desenvolvimento (junto)
```bash
DJANGO_ENV=dev
FRONTEND_URL=          # Vazio = mesmo domínio
API_URL=/api          # Relativo
CORS_ENABLED=False     # Desabilitado
```

### Produção (separado)
```bash
DJANGO_ENV=prod
FRONTEND_URL=https://meusite.com
API_URL=https://api.meusite.com
CORS_ENABLED=True
ALLOWED_HOSTS=api.meusite.com
```

## Migração de Junto para Separado

1. Criar dois apps no CapRover
2. Configurar Dockerfile Location para cada um
3. Atualizar variáveis de ambiente:
   - Backend: `FRONTEND_URL`, `CORS_ENABLED=True`
   - Frontend: `API_URL` (URL absoluta do backend)
4. Instalar `django-cors-headers` no backend
5. Configurar CORS no settings

## URLs

**IMPORTANTE:** Todas as APIs devem usar prefixo `/api/`

- ✅ Correto: `/api/leads/`, `/api/auth/login/`
- ❌ Errado: `/leads/`, `/auth/login/`

Isso facilita:
- Proxy reverso (nginx) quando separar
- Identificação clara de rotas de API
- Migração futura sem quebrar URLs




