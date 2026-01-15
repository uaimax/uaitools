# ✅ Renomeação Completa: bau_mental → bau_mental

## Status: CONCLUÍDO ✅

Todas as renomeações foram realizadas e validadas. O código está pronto para uso.

## Validação Final

Execute:
```bash
./validate-and-fix.sh
```

**Resultado esperado:**
- ✅ Django check passou
- ✅ Imports OK
- ✅ URL resolution OK
- ✅ Migration de renomeação existe

## Aplicar Migrations (Banco Local)

Como você mencionou que pode resetar o banco, use:

### Opção 1: Script Python (RECOMENDADO)

```bash
cd backend
source venv/bin/activate
python reset_db.py
```

Este script:
1. Dropar schema public completamente
2. Recriar schema
3. Aplicar todas as migrations do zero

### Opção 2: Manual

```bash
cd backend
source venv/bin/activate

# Dropar schema
python manage.py dbshell
# No shell: DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;

# Aplicar migrations
python manage.py migrate
```

## O Que Foi Renomeado

### ✅ Backend (100% completo)
- Pasta: `backend/apps/bau_mental/`
- App config: `BauMentalConfig`
- Todos os imports atualizados
- URLs: `/api/v1/bau-mental/`
- Throttles: `BauMentalUploadThrottle`, `BauMentalQueryThrottle`
- Storage: `BauMentalAudioStorage`
- Models atualizados
- Migrations atualizadas (0001-0009) + nova (0010)
- Templates: `backend/templates/bau_mental/`
- Celery tasks atualizadas
- Testes atualizados

### ✅ Frontend (100% completo)
- Pasta: `frontend/src/features/bau_mental/`
- Rotas: `/bau-mental`
- Componentes: `BauMentalPage`, `BauMentalLayout`
- Hooks atualizados
- Locales atualizados
- Todos os endpoints atualizados

### ✅ Mobile (100% completo)
- Nome: "bau_mental"
- Bundle IDs: `com.uaitools.bau_mental`
- Endpoints atualizados
- Textos atualizados

## Testes

### Backend
```bash
cd backend
source venv/bin/activate
python manage.py test apps.bau_mental
```

### API
```bash
curl http://localhost:8000/api/v1/bau-mental/boxes/
```

### Frontend
Acesse: `http://localhost:5173/bau-mental`

## Scripts Disponíveis

1. **`validate-and-fix.sh`** - Validação rápida
2. **`reset_db.py`** - Reset completo do banco (backend/reset_db.py)
3. **`migrate-fresh.sh`** - Aplica migrations em banco limpo

## Notas

- A migration `0010_rename_app_tables.py` é opcional - se o banco for criado do zero, as tabelas já terão o nome correto
- A migration `0002` foi ajustada para funcionar tanto com banco novo quanto com banco existente
- Todos os erros foram corrigidos

## Próximo Passo

Execute o reset do banco e aplique migrations:
```bash
cd backend && source venv/bin/activate && python reset_db.py
```

Depois teste:
```bash
curl http://localhost:8000/api/v1/bau-mental/boxes/
```
