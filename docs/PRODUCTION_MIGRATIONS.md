# Migrations em Produção

## ⚠️ Problema Identificado

O banco de dados de produção está faltando tabelas do app `supbrainnote`:
- `supbrainnote_note` não existe
- `supbrainnote_box` pode não existir

**Erro no GlitchTip:**
```
ProgrammingError: relation "supbrainnote_note" does not exist
```

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

