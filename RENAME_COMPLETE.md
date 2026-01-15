# ✅ Renomeação Completa: bau_mental → bau_mental

## Status: CONCLUÍDO

Todas as renomeações foram realizadas com sucesso. O código está pronto para testes.

## O Que Foi Feito

### ✅ Backend
- [x] Pasta renomeada: `backend/apps/bau_mental/` → `backend/apps/bau_mental/`
- [x] App config atualizado: `BauMentalConfig`
- [x] Todos os imports atualizados
- [x] URLs atualizadas: `/api/v1/bau-mental/`
- [x] Throttles renomeados: `BauMentalUploadThrottle`, `BauMentalQueryThrottle`
- [x] Storage renomeado: `BauMentalAudioStorage`
- [x] Models atualizados
- [x] Migrations atualizadas (0001-0009)
- [x] Migration criada: `0010_rename_app_tables.py` (renomeia tabelas)
- [x] Templates renomeados
- [x] Celery tasks atualizadas
- [x] Dependências em migrations do core atualizadas
- [x] Testes atualizados

### ✅ Frontend
- [x] Pasta renomeada: `frontend/src/features/bau_mental/`
- [x] Rotas atualizadas: `/bau-mental`
- [x] Componentes renomeados: `BauMentalPage`, `BauMentalLayout`
- [x] Hooks atualizados (query keys e endpoints)
- [x] Locales atualizados
- [x] Todos os endpoints da API atualizados

### ✅ Mobile
- [x] Configurações atualizadas
- [x] Nome do app: "bau_mental"
- [x] Bundle IDs atualizados
- [x] Endpoints da API atualizados
- [x] Textos da interface atualizados

## Scripts Criados

### 1. `validate-and-fix.sh`
Validação rápida do estado atual:
```bash
./validate-and-fix.sh
```

### 2. `fix-all.sh`
Aplica todas as migrations de forma segura:
```bash
./fix-all.sh
```

Este script:
- Marca migrations antigas (0001-0009) como aplicadas (fake)
- Aplica a migration de renomeação de tabelas (0010)
- Verifica o resultado

### 3. `run-migrations.sh`
Aplica migrations com confirmação interativa:
```bash
./run-migrations.sh
```

## Próximos Passos

### 1. Aplicar Migrations

**IMPORTANTE**: As migrations antigas (0001-0009) já foram aplicadas no banco como `bau_mental`. Precisamos marcá-las como aplicadas (fake) e então aplicar a migration de renomeação.

```bash
# Opção 1: Usar o script automatizado
./fix-all.sh

# Opção 2: Manual
cd backend
source venv/bin/activate
python manage.py migrate bau_mental --fake 0001 0002 0003 0004 0005 0006 0007 0008 0009
python manage.py migrate bau_mental 0010_rename_app_tables
```

### 2. Testar Endpoints da API

```bash
# Testar boxes
curl http://localhost:8000/api/v1/bau-mental/boxes/

# Testar notes
curl http://localhost:8000/api/v1/bau-mental/notes/
```

### 3. Testar Frontend

Acesse: `http://localhost:5173/bau-mental`

### 4. Executar Testes

```bash
cd backend
source venv/bin/activate
python manage.py test apps.bau_mental
```

## Convenções Usadas

- **Código Python/Django**: `bau_mental` (snake_case)
- **URLs da API**: `/api/v1/bau-mental/` (kebab-case)
- **Rotas Frontend**: `/bau-mental` (kebab-case)
- **Tabelas do Banco**: `bau_mental_box`, `bau_mental_note` (snake_case)
- **Interface do Usuário**: "bau_mental" (português, com acento)

## Arquivos Principais Modificados

### Backend
- `backend/apps/bau_mental/` (pasta inteira renomeada)
- `backend/api/v1/urls.py`
- `backend/config/celery.py`
- `backend/config/settings/base.py`
- `backend/config/settings/dev.py`
- `backend/apps/core/migrations/0002_add_notifications.py`
- `backend/apps/core/models.py`
- `backend/test_mobile_endpoints.py`

### Frontend
- `frontend/src/features/bau_mental/` (pasta inteira renomeada)
- `frontend/src/App.tsx`
- `frontend/src/locales/pt/common.json`
- `frontend/src/locales/en/common.json`

### Mobile
- `mobile/app.json`
- `mobile/app.config.js`
- `mobile/package.json`
- `mobile/src/constants/config.ts`
- `mobile/src/screens/home/HomeScreen.tsx`
- `mobile/src/components/navigation/NotesDrawer.tsx`

## Notas Importantes

1. **Migrations**: A migration `0010_rename_app_tables.py` renomeia as tabelas no banco. Execute com cuidado em produção.

2. **Storage**: Arquivos já armazenados em `bau_mental/audios/` continuarão funcionando, mas novos uploads irão para `bau_mental/audios/`.

3. **Backward Compatibility**: Não há redirecionamentos automáticos. URLs antigas não funcionarão mais.

4. **Testes**: Todos os testes foram atualizados para usar os novos namespaces de URL.

## Validação

Execute para validar:
```bash
./validate-and-fix.sh
```

Este script verifica:
- ✅ Django check
- ✅ Imports Python
- ✅ Resolução de URLs
- ✅ Existência da migration de renomeação

## Conclusão

A renomeação está **100% completa** e o código está pronto para testes. Execute `./fix-all.sh` para aplicar as migrations no banco de dados.
