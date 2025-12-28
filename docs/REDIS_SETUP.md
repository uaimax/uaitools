# Configuração do Redis no CapRover

## 📋 Visão Geral

O projeto usa Redis para duas finalidades:

1. **Celery (DB 0)**: Broker e Result Backend para tarefas assíncronas
2. **Cache (DB 1)**: Cache do Django para melhorar performance

## 🔧 Configuração no CapRover

### 1. Obter Informações do Redis

Se você já tem um serviço Redis no CapRover (`srv-captain--redis`):

1. **Acesse o CapRover Dashboard**
2. **Vá em "One-Click Apps/Databases"** → Encontre o serviço Redis
3. **Anote as informações:**
   - Hostname interno: `srv-captain--redis` (ou o nome do seu serviço)
   - Porta: `6379` (padrão)
   - Senha: (a que você mencionou ter)

### 2. Formato da URL do Redis

O formato da URL do Redis com senha é:

```
redis://:SENHA@HOSTNAME:PORTA/DB_NUMBER
```

**Exemplo:**
```
redis://:minhasenha123@srv-captain--redis:6379/0
```

**Importante:**
- Se a senha tiver caracteres especiais, você precisa fazer URL encoding:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `&` → `%26`
  - `+` → `%2B`
  - `=` → `%3D`
  - `?` → `%3F`
  - `/` → `%2F`
  - `:` → `%3A`

### 3. Verificar Bancos de Dados em Uso

Para verificar quais bancos estão sendo usados no Redis:

```bash
# Conectar ao Redis via CapRover CLI
caprover exec -s srv-captain--redis "redis-cli -a SUA_SENHA"

# Dentro do redis-cli, verificar bancos em uso:
INFO keyspace

# Ou verificar chaves em cada banco:
SELECT 0
KEYS *
SELECT 1
KEYS *
```

**Bancos usados pelo projeto:**
- **DB 0**: Celery (broker e result backend)
- **DB 1**: Cache do Django

### 4. Configurar Variáveis de Ambiente no CapRover

No app **backend** do CapRover, adicione as seguintes variáveis de ambiente:

#### Para Celery (DB 0):
```bash
CELERY_BROKER_URL=redis://:SUA_SENHA@srv-captain--redis:6379/0
CELERY_RESULT_BACKEND=redis://:SUA_SENHA@srv-captain--redis:6379/0
```

#### Para Cache (DB 1):
```bash
REDIS_CACHE_URL=redis://:SUA_SENHA@srv-captain--redis:6379/1
```

**Exemplo completo (substitua `SUA_SENHA` pela senha real):**
```bash
CELERY_BROKER_URL=redis://:minhasenha123@srv-captain--redis:6379/0
CELERY_RESULT_BACKEND=redis://:minhasenha123@srv-captain--redis:6379/0
REDIS_CACHE_URL=redis://:minhasenha123@srv-captain--redis:6379/1
```

### 5. Se a Senha Tiver Caracteres Especiais

Se sua senha tiver caracteres especiais, use URL encoding:

**Exemplo:** Senha = `senha@123#`
- `@` → `%40`
- `#` → `%23`
- Senha codificada: `senha%40123%23`

**URL final:**
```
CELERY_BROKER_URL=redis://:senha%40123%23@srv-captain--redis:6379/0
```

### 6. Testar Conexão

Após configurar, teste a conexão:

```bash
# Via CapRover CLI
caprover exec -a ut-be "python manage.py shell"

# No shell Python:
from django.core.cache import cache
cache.set('test', 'ok', 10)
print(cache.get('test'))  # Deve imprimir 'ok'

# Testar Celery
from config.celery import app
print(app.control.inspect().active())  # Deve retornar informações do worker
```

## 🔍 Verificar se Redis Está Funcionando

### 1. Verificar Cache

```bash
# No shell do Django
from django.core.cache import cache
cache.set('test_key', 'test_value', 60)
print(cache.get('test_key'))  # Deve imprimir 'test_value'
```

### 2. Verificar Celery

```bash
# Verificar se worker está rodando
celery -A config inspect active

# Verificar conexão com broker
celery -A config inspect ping
```

## 📝 Checklist de Configuração

- [ ] Redis service criado no CapRover (`srv-captain--redis`)
- [ ] Senha do Redis anotada
- [ ] Variável `CELERY_BROKER_URL` configurada (DB 0)
- [ ] Variável `CELERY_RESULT_BACKEND` configurada (DB 0)
- [ ] Variável `REDIS_CACHE_URL` configurada (DB 1)
- [ ] Senha com caracteres especiais foi URL-encoded
- [ ] Teste de conexão realizado
- [ ] Celery worker iniciado (se necessário)

## 🚨 Troubleshooting

### Erro: "Connection refused"
- Verifique se o hostname está correto (`srv-captain--redis`)
- Verifique se a porta está correta (`6379`)
- Verifique se o serviço Redis está rodando no CapRover

### Erro: "NOAUTH Authentication required"
- Verifique se a senha está correta
- Verifique se a senha foi URL-encoded corretamente se tiver caracteres especiais

### Erro: "Invalid password"
- Verifique se não há espaços extras na URL
- Verifique se a senha está entre `:` e `@` na URL

### Cache não funciona mas Celery funciona
- Verifique se `REDIS_CACHE_URL` está configurada
- Verifique se está usando DB 1 (não DB 0)
- Verifique se `django-redis` está instalado (`pip list | grep django-redis`)

## 📚 Referências

- [Redis URL Format](https://www.iana.org/assignments/uri-schemes/prov/redis)
- [django-redis Documentation](https://django-redis.readthedocs.io/)
- [Celery Redis Backend](https://docs.celeryproject.org/en/stable/getting-started/backends-and-brokers/redis.html)

