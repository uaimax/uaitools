# ✅ Renomeação Completa: bau_mental → bau_mental

## Status: CONCLUÍDO E VALIDADO ✅

Todas as renomeações foram realizadas com sucesso. O código está pronto para testes e uso.

## Validação

Execute para validar:
```bash
./validate-and-fix.sh
```

**Resultado esperado:**
- ✅ Django check passou
- ✅ Imports OK
- ✅ URL resolution OK
- ✅ Migration de renomeação existe

## Scripts Criados

### 1. `validate-and-fix.sh` ⭐ RECOMENDADO
Validação rápida do estado atual:
```bash
./validate-and-fix.sh
```

### 2. `apply-migrations-safe.sh` ⭐ PARA APLICAR MIGRATIONS
Aplica migrations de forma segura com confirmação:
```bash
./apply-migrations-safe.sh
```

Este script:
- Verifica estado do banco
- Marca migrations antigas (0001-0009) como aplicadas (fake)
- Aplica a migration de renomeação de tabelas (0010)
- Verifica o resultado

### 3. `fix-all.sh`
Alternativa ao script acima (mesma funcionalidade)

### 4. `run-migrations.sh`
Aplica migrations com confirmação interativa

## Como Aplicar as Migrations

### Opção 1: Script Automatizado (RECOMENDADO)
```bash
./apply-migrations-safe.sh
```

### Opção 2: Manual
```bash
cd backend
source venv/bin/activate

# Marcar migrations antigas como aplicadas (já foram aplicadas como bau_mental)
python manage.py migrate bau_mental --fake 0001
python manage.py migrate bau_mental --fake 0002
python manage.py migrate bau_mental --fake 0003
python manage.py migrate bau_mental --fake 0004
python manage.py migrate bau_mental --fake 0005
python manage.py migrate bau_mental --fake 0006
python manage.py migrate bau_mental --fake 0007
python manage.py migrate bau_mental --fake 0008
python manage.py migrate bau_mental --fake 0009

# Aplicar migration de renomeação de tabelas
python manage.py migrate bau_mental 0010_rename_app_tables
```

## O Que Foi Renomeado

### Backend
- ✅ Pasta: `backend/apps/bau_mental/` → `backend/apps/bau_mental/`
- ✅ App config: `BauMentalConfig`
- ✅ Todos os imports: `apps.bau_mental.*`
- ✅ URLs: `/api/v1/bau-mental/`
- ✅ Throttles: `BauMentalUploadThrottle`, `BauMentalQueryThrottle`
- ✅ Storage: `BauMentalAudioStorage`
- ✅ Models: `audio_upload_path` usa `bau_mental/audios`
- ✅ Migrations: Todas atualizadas (0001-0009) + nova (0010 para renomear tabelas)
- ✅ Templates: `backend/templates/bau_mental/`
- ✅ Celery tasks: `apps.bau_mental.tasks.*`
- ✅ Dependências em migrations do core atualizadas
- ✅ Testes atualizados

### Frontend
- ✅ Pasta: `frontend/src/features/bau_mental/`
- ✅ Rotas: `/bau-mental`
- ✅ Componentes: `BauMentalPage`, `BauMentalLayout`
- ✅ Hooks: query keys e endpoints atualizados
- ✅ Locales: "bau_mental" em pt e en
- ✅ Todos os endpoints: `/bau-mental/*`

### Mobile
- ✅ Nome do app: "bau_mental"
- ✅ Bundle IDs: `com.uaitools.bau_mental`
- ✅ Scheme: `bau-mental`
- ✅ Endpoints: `/api/v1/bau-mental/*`
- ✅ Textos da interface atualizados

## Convenções Usadas

- **Código Python/Django**: `bau_mental` (snake_case)
- **URLs da API**: `/api/v1/bau-mental/` (kebab-case)
- **Rotas Frontend**: `/bau-mental` (kebab-case)
- **Tabelas do Banco**: `bau_mental_box`, `bau_mental_note` (snake_case)
- **Interface do Usuário**: "bau_mental" (português, com acento)

## Testes

### Backend
```bash
cd backend
source venv/bin/activate
python manage.py test apps.bau_mental
```

### API Endpoints
```bash
# Testar boxes
curl http://localhost:8000/api/v1/bau-mental/boxes/

# Testar notes
curl http://localhost:8000/api/v1/bau-mental/notes/
```

### Frontend
Acesse: `http://localhost:5173/bau-mental`

## Notas Importantes

1. **Migrations**: A migration `0010_rename_app_tables.py` renomeia as tabelas no banco. Execute com cuidado em produção.

2. **Storage**: Arquivos já armazenados em `bau_mental/audios/` continuarão funcionando, mas novos uploads irão para `bau_mental/audios/`.

3. **Backward Compatibility**: Não há redirecionamentos automáticos. URLs antigas (`/api/v1/bau-mental/*`) não funcionarão mais.

4. **Banco de Dados**: Se o banco já tem dados, as migrations antigas (0001-0009) devem ser marcadas como aplicadas (fake) antes de aplicar a 0010.

## Checklist Final

- [x] Backend renomeado e atualizado
- [x] Frontend renomeado e atualizado
- [x] Mobile renomeado e atualizado
- [x] Migrations criadas e atualizadas
- [x] Scripts de validação criados
- [x] Scripts de aplicação de migrations criados
- [x] Validação básica passou
- [ ] Migrations aplicadas no banco (execute `./apply-migrations-safe.sh`)
- [ ] Testes executados e passando
- [ ] Endpoints testados manualmente
- [ ] Frontend testado manualmente

## Próximos Passos

1. **Aplicar migrations**: Execute `./apply-migrations-safe.sh`
2. **Testar endpoints**: Verifique que `/api/v1/bau-mental/boxes/` funciona
3. **Testar frontend**: Acesse `/bau-mental` no navegador
4. **Executar testes**: `python manage.py test apps.bau_mental`

---

**Data de conclusão**: $(date)
**Status**: ✅ Pronto para uso após aplicar migrations
