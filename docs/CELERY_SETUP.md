# Configuração do Celery Worker no CapRover

## 📋 Visão Geral

O Celery Worker é necessário para processar tarefas assíncronas, como:
- Transcrição de áudio (bau_mental)
- Classificação de anotações
- Outras tarefas assíncronas

## 🔧 Configuração no CapRover

### ⚡ Configuração Padrão: Mesmo Container (Recomendado para MVP)

**Por padrão, o Celery Worker roda no mesmo container do backend** usando Supervisor para gerenciar ambos os processos (Gunicorn + Celery).

**Vantagens:**
- ✅ Simplicidade: Um único app no CapRover
- ✅ Economia: Menos recursos consumidos
- ✅ Deploy único: Menos complexidade
- ✅ Adequado para baixo/médio tráfego

**Como funciona:**
- O `captain-definition` já está configurado com Supervisor
- Supervisor gerencia Gunicorn (backend HTTP) e Celery Worker simultaneamente
- Auto-restart automático em caso de falha
- Logs separados por processo

**Nenhuma configuração adicional necessária!** Apenas certifique-se de que as variáveis de ambiente do Redis estão configuradas:
```bash
CELERY_BROKER_URL=redis://:SENHA@srv-captain--redis:6379/0
CELERY_RESULT_BACKEND=redis://:SENHA@srv-captain--redis:6379/0
```

### Opção 2: Serviço Separado (Para Escala Futura)

**Quando usar:** Quando a carga for alta (>500 uploads/dia) ou precisar escalar workers independentemente.

Crie um **novo app** no CapRover chamado `ut-be-celery` (ou outro nome de sua escolha):

1. **Criar novo app no CapRover:**
   - Nome: `ut-be-celery` (ou `ut-be-worker`)
   - Captain Definition File: `backend/captain-definition-celery.json`

2. **Configurar variáveis de ambiente:**
   - Copie **todas** as variáveis de ambiente do app backend
   - Especialmente importantes:
     ```bash
     CELERY_BROKER_URL=redis://:y8JtINWf^%23@srv-captain--redis:6379/0
     CELERY_RESULT_BACKEND=redis://:y8JtINWf^%23@srv-captain--redis:6379/0
     DATABASE_URL=postgresql://...
     OPENAI_API_KEY=sk-...
     ENVIRONMENT=production
     ```

3. **Configurar modo separado no backend:**
   - No app backend, adicione variável de ambiente:
     ```bash
     CELERY_MODE=separate
     ```
   - Isso fará o backend rodar apenas Gunicorn (sem Celery)

4. **Deploy:**
   - Faça deploy do novo app Celery
   - Faça deploy do backend (com `CELERY_MODE=separate`)
   - O Celery worker iniciará automaticamente no serviço separado

### Opção 2: Mesmo Container (Não Recomendado)

Você pode modificar o `captain-definition` do backend para iniciar Gunicorn e Celery no mesmo container, mas isso não é recomendado porque:
- Se um processo falhar, ambos param
- Dificulta escalonamento independente
- Dificulta monitoramento

## 🔍 Verificar se Celery está Funcionando

### 1. Verificar Logs do Worker

```bash
# Ver logs do app Celery no CapRover
caprover logs -a ut-be-celery
```

Você deve ver:
```
[tasks]
  . apps.bau_mental.tasks.transcribe_audio
  . apps.bau_mental.tasks.classify_note
```

### 2. Verificar Tasks Pendentes

```bash
# Conectar ao container do backend
caprover exec -a ut-be "python manage.py shell"

# No shell Python:
from config.celery import app
inspect = app.control.inspect()
print(inspect.active())  # Tasks ativas
print(inspect.scheduled())  # Tasks agendadas
print(inspect.reserved())  # Tasks reservadas
```

### 3. Testar Task Manualmente

```bash
# No shell do Django
from apps.bau_mental.tasks import transcribe_audio
from apps.bau_mental.models import Note

# Pegar uma nota pendente
note = Note.objects.filter(processing_status='pending').first()
if note:
    result = transcribe_audio.delay(str(note.id))
    print(f"Task ID: {result.id}")
    print(f"Status: {result.status}")
```

## 🚨 Troubleshooting

### Worker não está processando tasks

1. **Verificar conexão com Redis:**
   ```bash
   caprover exec -a ut-be-celery "python -c 'import redis; r=redis.from_url(\"redis://:y8JtINWf^%23@srv-captain--redis:6379/0\"); print(r.ping())'"
   ```
   Deve retornar: `True`

2. **Verificar se tasks estão sendo enfileiradas:**
   ```bash
   caprover exec -s srv-captain--redis "redis-cli -a 'y8JtINWf^#'"
   # No redis-cli:
   SELECT 0
   KEYS celery*
   LLEN celery  # Ver quantas tasks estão na fila
   ```

3. **Verificar logs do worker:**
   ```bash
   caprover logs -a ut-be-celery --tail 100
   ```

### Tasks falhando

1. **Verificar OPENAI_API_KEY:**
   ```bash
   caprover exec -a ut-be-celery "python -c 'import os; print(\"OK\" if os.getenv(\"OPENAI_API_KEY\") else \"FALTANDO\")'"
   ```

2. **Verificar acesso ao banco de dados:**
   ```bash
   caprover exec -a ut-be-celery "python manage.py check --database default"
   ```

3. **Verificar acesso ao storage (R2/S3):**
   - Verifique se as credenciais estão configuradas
   - Verifique se o worker tem acesso à rede para acessar R2/S3

## 📝 Checklist de Configuração

- [ ] App `ut-be-celery` criado no CapRover
- [ ] Captain Definition File configurado (`backend/captain-definition-celery.json`)
- [ ] Variáveis de ambiente copiadas do backend
- [ ] `CELERY_BROKER_URL` configurada corretamente
- [ ] `CELERY_RESULT_BACKEND` configurada corretamente
- [ ] `OPENAI_API_KEY` configurada (para transcrições)
- [ ] `DATABASE_URL` configurada
- [ ] Deploy realizado com sucesso
- [ ] Logs mostram worker iniciado
- [ ] Tasks sendo processadas (verificar logs)

## 🔄 Celery Beat (Tarefas Periódicas)

Se precisar de tarefas periódicas (ex: limpeza de áudios expirados), você pode adicionar um terceiro serviço para Celery Beat:

1. Criar app `ut-be-celery-beat`
2. Usar mesmo `captain-definition-celery.json`
3. Modificar CMD para: `celery -A config beat -l info`

**Por enquanto, não é necessário** - as tasks são disparadas apenas quando há upload de áudio.

