# 🔄 Reset Completo do Banco de Dados

## Para Banco Local (Docker PostgreSQL)

Como você mencionou que pode resetar tudo, aqui estão as opções:

### Opção 1: Dropar Schema e Recriar (MAIS RÁPIDO)

```bash
cd backend
source venv/bin/activate

# Conectar ao banco e dropar schema
python manage.py dbshell
```

No shell do PostgreSQL:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
\q
```

Depois aplicar migrations:
```bash
python manage.py migrate
```

### Opção 2: Usar Script Automatizado

```bash
./migrate-fresh.sh
```

Este script aplica migrations normalmente. Se houver conflitos, use a Opção 1 primeiro.

### Opção 3: Reiniciar Container Docker

Se estiver usando Docker:
```bash
docker-compose down
docker-compose up -d
# Depois aplicar migrations
cd backend && source venv/bin/activate && python manage.py migrate
```

## Verificação

Após aplicar migrations:
```bash
python manage.py showmigrations bau_mental
```

Deve mostrar todas as migrations como aplicadas (marcadas com [X]).

## Teste

```bash
curl http://localhost:8000/api/v1/bau-mental/boxes/
```

Deve retornar uma lista (vazia ou com dados).
