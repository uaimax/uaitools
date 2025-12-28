# Migrations em Produção

## ⚠️ Problemas Identificados

### 1. Tabelas Faltando

O banco de dados de produção estava faltando tabelas do app `supbrainnote`:
- `supbrainnote_note` não existe
- `supbrainnote_box` pode não existir

**Erro no GlitchTip:**
```
ProgrammingError: relation "supbrainnote_note" does not exist
```

### 2. Conversão de bigint para UUID

**Erro crítico em produção:**
```
psycopg2.errors.CannotCoerce: cannot cast type bigint to uuid
LINE 1: ...pbrainnote_box" ALTER COLUMN "id" TYPE uuid USING "id"::uuid
```

**Causa:**
A migration `0002_alter_box_id_alter_note_id` estava tentando converter o campo `id` de `bigint` para `uuid` diretamente, o que o PostgreSQL não permite.

**Solução:**
A migration foi reescrita para usar SQL customizado que:
1. Remove foreign key constraints temporariamente
2. Cria uma nova coluna UUID
3. Remove a coluna antiga bigint
4. Renomeia a nova coluna para `id`
5. Recria as constraints necessárias

**Migration corrigida:** `backend/apps/supbrainnote/migrations/0002_alter_box_id_alter_note_id.py`

## ✅ Solução Implementada

O `captain-definition` foi atualizado para **executar migrations automaticamente** antes de iniciar o Gunicorn.

### Como Funciona

1. **Durante o build do Docker:**
   - Instala dependências
   - Coleta arquivos estáticos
   - Cria script de inicialização (`/app/start.sh`)

2. **Ao iniciar o container:**
   - Executa `python manage.py migrate --noinput`
   - Inicia o Gunicorn

### Aplicar Migrations Manualmente (Se Necessário)

Se precisar aplicar migrations manualmente em produção:

```bash
# Via CapRover CLI
caprover exec -a ut-be "python manage.py migrate --noinput"

# Ou via terminal do container (se tiver acesso SSH)
docker exec -it <container_id> python manage.py migrate --noinput
```

## 🔍 Verificar Status das Migrations

Para verificar quais migrations estão pendentes:

```bash
caprover exec -a ut-be "python manage.py showmigrations supbrainnote"
```

## 📋 Checklist Pós-Deploy

Após fazer deploy, verificar:

- [ ] Migrations aplicadas (verificar logs do CapRover)
- [ ] Tabelas criadas (verificar via admin Django ou logs)
- [ ] App mobile consegue fazer upload de notas
- [ ] GlitchTip não mostra mais erros de `relation does not exist`

## 🚨 Workspace Não Encontrado

**Problema adicional identificado:**
```
[WorkspaceMiddleware] ❌ Workspace não encontrado: 'c7631f01-9c34-4279-8ea7-d529da3fc31e'
```

**Solução:**
- Verificar se o workspace existe no banco de produção
- Se não existir, criar manualmente ou via script de seed
- Verificar se o usuário está associado ao workspace correto

## 📝 Notas

- Migrations são executadas **automaticamente** a cada deploy
- Se houver erro nas migrations, o container não inicia (fail-fast)
- Verificar logs do CapRover para diagnosticar problemas de migrations
- **Importante:** A migration `0002_alter_box_id_alter_note_id` limpa todos os dados existentes de Box e Note antes de converter para UUID (dados de teste apenas)

## 🔧 Troubleshooting

### Erro: "cannot cast type bigint to uuid"

**Sintoma:**
```
django.db.utils.ProgrammingError: cannot cast type bigint to uuid
```

**Solução:**
1. Verificar se a migration `0002_alter_box_id_alter_note_id.py` está usando SQL customizado (não `AlterField` direto)
2. Se necessário, fazer rollback da migration e reaplicar:
   ```bash
   caprover exec -a ut-be "python manage.py migrate supbrainnote 0001"
   caprover exec -a ut-be "python manage.py migrate supbrainnote"
   ```

### Verificar Status da Migration

```bash
# Ver migrations aplicadas
caprover exec -a ut-be "python manage.py showmigrations supbrainnote"

# Ver estrutura da tabela (verificar se id é UUID)
caprover exec -a ut-be "python manage.py dbshell"
# No psql:
# \d supbrainnote_box
# \d supbrainnote_note
```

