# 🚀 Como Iniciar o Celery Worker

## ⚠️ Problema: "Aguardando processamento..." nunca finaliza

Isso acontece porque o **Celery worker não está rodando**. O Celery é necessário para processar as transcrições de áudio de forma assíncrona.

---

## ✅ Solução Rápida

### 1. Verificar Redis (já está rodando ✅)

```bash
redis-cli ping
# Deve retornar: PONG
```

### 2. Verificar OPENAI_API_KEY

```bash
cd /home/uaimax/projects/uaitools
grep OPENAI_API_KEY .env
```

**Se não estiver configurada, adicione no `.env`:**

```bash
OPENAI_API_KEY=sk-sua-chave-aqui
```

### 3. Iniciar Celery Worker

**Abra um NOVO terminal e execute:**

```bash
cd /home/uaimax/projects/uaitools/backend
source venv/bin/activate
celery -A config worker -l info
```

**Você deve ver nos logs:**

```
[tasks]
  . apps.supbrainnote.tasks.transcribe_audio
  . apps.supbrainnote.tasks.classify_note
```

### 4. Testar Novamente

1. Volte para o frontend
2. Grave uma nova nota
3. Aguarde alguns segundos
4. A transcrição deve aparecer!

---

## 🔍 Verificar se está funcionando

**No terminal do Celery, você verá:**

```
[INFO] Task apps.supbrainnote.tasks.transcribe_audio[...] received
[INFO] Task apps.supbrainnote.tasks.transcribe_audio[...] succeeded
```

**Se houver erro, verifique:**

1. ✅ Redis está rodando
2. ✅ OPENAI_API_KEY está configurada
3. ✅ Celery worker está rodando
4. ✅ Backend está rodando

---

## 💡 Dica: Script Automático

Você pode usar o script:

```bash
./iniciar-supbrainnote.sh
```

Ou adicionar o Celery ao `dev-start.sh` para iniciar automaticamente.

