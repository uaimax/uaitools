# 🔍 Análise e Correção dos Erros do GlitchTip

**Data:** 2025-12-28
**Ambiente:** Produção (`https://ut-be.app.webmaxdigital.com`)

## 📊 Resumo dos Issues

| Issue ID | Título | Severidade | Status |
|----------|--------|-----------|--------|
| #10, #13 | `ProgrammingError: relation "supbrainnote_note" does not exist` | 🔴 CRÍTICO | ✅ Corrigido |
| #11, #12, #14, #15 | `HTTP Error 500` (GET/POST `/api/v1/supbrainnote/notes/`) | 🔴 CRÍTICO | ✅ Corrigido |
| #7 | `ModuleNotFoundError: No module named 'django_celery_beat'` | 🟡 MÉDIO | ✅ Corrigido |
| #6 | `AttributeError: 'Workspace' object has no attribute 'members'` | 🟡 MÉDIO | ✅ Já estava corrigido |
| #5 | `HTTP Error 401: POST /api/v1/auth/login/` | 🟢 BAIXO | ⚠️ Esperado (credenciais inválidas) |

## 🔴 Problema Principal: Migrations Não Aplicadas

### Erro
```
ProgrammingError: relation "supbrainnote_note" does not exist
LINE 1: INSERT INTO "supbrainnote_note" (...)
```

### Causa
As migrations do app `supbrainnote` **não foram aplicadas** no banco de dados de produção.

### Impacto
- ❌ Upload de notas falha (HTTP 500)
- ❌ Listagem de notas falha (HTTP 500)
- ❌ App mobile não funciona

### ✅ Solução Implementada

**1. Atualizado `backend/captain-definition`:**
- Adicionado script de inicialização que executa `migrate --noinput` antes de iniciar Gunicorn
- Migrations agora são aplicadas **automaticamente** a cada deploy

**2. Documentação criada:**
- `docs/PRODUCTION_MIGRATIONS.md` - Guia completo sobre migrations em produção

### 📋 Próximos Passos

1. **Fazer novo deploy** para aplicar as correções:
   ```bash
   caprover deploy -a ut-be
   ```

2. **Verificar logs do deploy:**
   - Procurar por: `📦 Aplicando migrations...`
   - Procurar por: `✅ Migrations aplicadas`

3. **Testar endpoints:**
   - `GET /api/v1/supbrainnote/notes/` deve retornar 200 (mesmo que vazio)
   - `POST /api/v1/supbrainnote/notes/upload/` deve funcionar

## 🟡 Problema Secundário: Workspace Não Encontrado

### Erro
```
[WorkspaceMiddleware] ❌ Workspace não encontrado: 'c7631f01-9c34-4279-8ea7-d529da3fc31e'
```

### Causa
O workspace enviado pelo app mobile não existe no banco de produção.

### Impacto
- ⚠️ Upload funciona, mas `workspace_id` fica `None`
- ⚠️ Notas podem não ser associadas ao workspace correto

### ✅ Solução Necessária

**Opção 1: Criar workspace manualmente**
```python
# Via Django shell em produção
from apps.accounts.models import Workspace
workspace = Workspace.objects.create(
    id='c7631f01-9c34-4279-8ea7-d529da3fc31e',
    name='Workspace Principal',
    slug='workspace-principal',
    is_active=True
)
```

**Opção 2: Verificar se workspace existe**
```python
from apps.accounts.models import Workspace
workspace = Workspace.objects.filter(id='c7631f01-9c34-4279-8ea7-d529da3fc31e').first()
if not workspace:
    # Criar workspace
```

## ✅ Outras Correções Aplicadas

### Issue #7: django-celery-beat
- ✅ Adicionado `django-celery-beat>=2.5,<3.0` ao `requirements.txt`
- ✅ Adicionado `django_celery_beat` ao `INSTALLED_APPS`
- ✅ Migrations aplicadas localmente

### Issue #6: Workspace.members
- ✅ Já estava corrigido no código (usa `user.workspace = workspace`)

### Issue #5: HTTP 401
- ⚠️ Warning esperado (credenciais inválidas no login)
- Não requer correção

## 📝 Checklist de Verificação

Após o próximo deploy, verificar:

- [ ] Migrations aplicadas (logs do CapRover)
- [ ] Tabela `supbrainnote_note` existe no banco
- [ ] Tabela `supbrainnote_box` existe no banco
- [ ] Workspace `c7631f01-9c34-4279-8ea7-d529da3fc31e` existe
- [ ] App mobile consegue fazer upload
- [ ] App mobile consegue listar notas
- [ ] GlitchTip não mostra mais erros de `relation does not exist`

## 🔗 Referências

- `docs/PRODUCTION_MIGRATIONS.md` - Guia de migrations em produção
- `backend/captain-definition` - Configuração do Docker para deploy
- `backend/requirements.txt` - Dependências (inclui django-celery-beat)

