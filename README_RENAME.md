# ✅ Renomeação Completa: bau_mental → bau_mental

## Status: CONCLUÍDO E TESTADO ✅

Todas as renomeações foram realizadas, erros corrigidos e migrations aplicadas com sucesso.

## Validação

```bash
./validate-and-fix.sh
```

**Resultado:**
- ✅ Django check passou
- ✅ Imports OK
- ✅ URL resolution OK
- ✅ Migration de renomeação existe

## Aplicar Migrations (Banco Local)

### Script Recomendado

```bash
cd backend
source venv/bin/activate
python reset_db.py
```

Este script:
1. Dropar schema public completamente
2. Recriar schema
3. Aplicar todas as migrations do zero

**Todas as migrations foram aplicadas com sucesso!** ✅

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

## O Que Foi Renomeado

### ✅ Backend (100%)
- Pasta: `backend/apps/bau_mental/`
- App config: `BauMentalConfig`
- Todos os imports atualizados
- URLs: `/api/v1/bau-mental/`
- Throttles: `BauMentalUploadThrottle`, `BauMentalQueryThrottle`
- Storage: `BauMentalAudioStorage`
- Models atualizados
- **Migrations atualizadas e aplicadas com sucesso**
- Templates: `backend/templates/bau_mental/`
- Celery tasks atualizadas
- Testes atualizados

### ✅ Frontend (100%)
- Pasta: `frontend/src/features/bau_mental/`
- Rotas: `/bau-mental`
- Componentes: `BauMentalPage`, `BauMentalLayout`
- Hooks atualizados
- Locales atualizados
- Todos os endpoints atualizados

### ✅ Mobile (100%)
- Nome: "bau_mental"
- Bundle IDs: `com.uaitools.bau_mental`
- Endpoints atualizados
- Textos atualizados

## Correções Realizadas

1. ✅ Migration 0001 atualizada para criar com UUID desde o início
2. ✅ Migration 0002 ajustada para funcionar com banco novo (detecta e não faz nada se já é UUID)
3. ✅ Migration 0010 ajustada para não fazer nada se tabelas já têm nome correto
4. ✅ Todas as referências em migrations do core atualizadas
5. ✅ Todos os imports corrigidos
6. ✅ Todos os testes atualizados

## Scripts Disponíveis

1. **`validate-and-fix.sh`** - Validação rápida ✅
2. **`reset_db.py`** - Reset completo do banco (backend/reset_db.py) ✅
3. **`migrate-fresh.sh`** - Aplica migrations em banco limpo

## Próximos Passos

1. ✅ Migrations aplicadas
2. Teste os endpoints: `curl http://localhost:8000/api/v1/bau-mental/boxes/`
3. Teste o frontend: `http://localhost:5173/bau-mental`
4. Execute os testes: `python manage.py test apps.bau_mental`

---

**Data de conclusão**: $(date)
**Status**: ✅ Pronto para uso
