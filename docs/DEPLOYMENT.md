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
   - **IMPORTANTE**: Para `SECRET_KEY` com caracteres especiais, use aspas duplas no CapRover:
     ```
     SECRET_KEY="i8(!a7@87k(9p5@_#9l33b%ephvrlzntr3dsp89q-4a!84$mq-"
     ```
     O código remove automaticamente as aspas se presentes.

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

## 🔴 Redis Configuration

**IMPORTANTE:** Se você usar Celery ou Cache, precisa configurar Redis.

Veja o guia completo: [REDIS_SETUP.md](REDIS_SETUP.md)

**Resumo rápido:**
1. Configure as variáveis de ambiente no app backend:
   ```bash
   CELERY_BROKER_URL=redis://:SENHA@srv-captain--redis:6379/0
   CELERY_RESULT_BACKEND=redis://:SENHA@srv-captain--redis:6379/0
   REDIS_CACHE_URL=redis://:SENHA@srv-captain--redis:6379/1
   ```
2. Substitua `SENHA` pela senha do seu Redis
3. Se a senha tiver caracteres especiais, use URL encoding
4. DB 0 = Celery, DB 1 = Cache

## ⚙️ Celery Worker Configuration

**IMPORTANTE:** Se você usar funcionalidades que requerem processamento assíncrono (ex: SupBrainNote), precisa configurar o Celery Worker.

Veja o guia completo: [CELERY_SETUP.md](CELERY_SETUP.md)

**Resumo rápido:**
1. Crie um novo app no CapRover: `ut-be-celery`
2. Configure Captain Definition File: `backend/captain-definition-celery.json`
3. Copie todas as variáveis de ambiente do backend (especialmente `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `OPENAI_API_KEY`)
4. Faça deploy do app
5. Verifique os logs para confirmar que o worker está rodando




