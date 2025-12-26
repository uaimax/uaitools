# Erros Comuns e Soluções - Gerais

Este arquivo documenta **erros gerais já enfrentados** e suas soluções para evitar repetição.

---

---
date: 2024-12-23
category: devops
tags: [tmux, scripts, desenvolvimento, automação]
severity: medium
---

## tmux: Janelas Separadas vs Split (Dividido)

### Contexto
Script `dev-start.sh` criando duas janelas separadas quando o usuário queria uma janela dividida ao meio.

### Problema
- Script usava `tmux new-window` criando janela 1 separada
- Usuário queria ver backend e frontend simultaneamente na mesma tela
- Duas janelas separadas dificultam visualização simultânea

### Solução
**Usar `split-window` em vez de `new-window`:**

```bash
# Criar sessão com backend
tmux new-session -d -s "$TMUX_SESSION" -n "dev" \
    -c "$BACKEND_DIR" \
    "source venv/bin/activate && python manage.py runserver 0.0.0.0:$PORT"

# Dividir janela horizontalmente (split)
tmux split-window -h -t "$TMUX_SESSION:0" -c "$FRONTEND_DIR" \
    "npm run dev -- --host 0.0.0.0 --port $FRONTEND_PORT"

# Selecionar painel esquerdo por padrão
tmux select-pane -t "$TMUX_SESSION:0.0"
```

**Comandos atualizados:**
- `Ctrl+B + ←/→` - Alternar entre painéis (não mais `Ctrl+B + 0/1`)
- `Ctrl+B + Q` - Mostrar números dos painéis

### Lições Aprendidas
- `split-window -h` divide horizontalmente (lado a lado)
- `split-window -v` divide verticalmente (um em cima do outro)
- Painéis são referenciados como `sessão:janela.painel` (ex: `0.0`, `0.1`)
- Split é melhor para visualização simultânea de serviços relacionados

### Referências
- Arquivos: `dev-start.sh`
- Docs: `docs/DEV_START.md`

---

---
date: 2025-01-27
category: backend
tags: [cache, api, performance, debugging]
severity: medium
---

## Cache Retornando Dados Vazios ou Desatualizados

### Contexto
Endpoint `/workspaces/` retornando array vazio mesmo com empresas cadastradas no banco de dados.

### Problema
O cache estava sendo usado sem considerar o contexto do usuário (super admin vs usuário normal), e o cache podia estar vazio ou desatualizado:

```python
# ❌ PROBLEMÁTICO
@api_view(["GET"])
def workspaces_list_view(request: Request) -> Response:
    cache_key = get_cache_key("workspaces_list")

    def fetch_workspaces():
        workspaces = Workspace.objects.filter(is_active=True)
        serializer = WorkspaceSerializer(workspaces, many=True)
        return serializer.data

    data = cache_get_or_set(cache_key, fetch_workspaces, timeout=300)
    return Response(data, status=status.HTTP_200_OK)
```

**Problemas:**
- Cache não diferencia super admin de usuário normal
- Cache pode estar vazio se foi criado antes de empresas serem cadastradas
- Cache não invalida quando empresas são criadas/modificadas
- Dificulta debug (dados parecem estar corretos no banco, mas API retorna vazio)

### Solução
**Remover cache temporariamente ou invalidar corretamente:**

```python
# ✅ CORRETO (sem cache para garantir dados atualizados)
@api_view(["GET"])
def workspaces_list_view(request: Request) -> Response:
    # Super admins veem todas as empresas ativas
    if request.user and request.user.is_authenticated and request.user.is_superuser:
        workspaces = Workspace.objects.filter(is_active=True)
    elif request.user and request.user.is_authenticated and hasattr(request.user, "workspace") and request.user.workspace:
        # Usuário normal: apenas sua própria empresa
        workspaces = Workspace.objects.filter(id=request.user.workspace.id, is_active=True)
    else:
        # Não autenticado: todas as empresas ativas
        workspaces = Workspace.objects.filter(is_active=True)

    serializer = WorkspaceSerializer(workspaces, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
```

**Ou usar cache com invalidação adequada:**
```python
# ✅ CORRETO (com cache e invalidação)
from django.core.cache import cache

@api_view(["GET"])
def workspaces_list_view(request: Request) -> Response:
    # Cache key deve incluir contexto do usuário
    cache_key = f"workspaces_list_{request.user.id if request.user.is_authenticated else 'anon'}"

    data = cache.get(cache_key)
    if data is None:
        workspaces = Workspace.objects.filter(is_active=True)
        serializer = WorkspaceSerializer(workspaces, many=True)
        data = serializer.data
        cache.set(cache_key, data, timeout=300)

    return Response(data, status=status.HTTP_200_OK)

# Invalidar cache quando empresa é criada/modificada
def invalidate_workspaces_cache():
    cache.delete_many([key for key in cache.keys() if key.startswith("workspaces_list_")])
```

### Lições Aprendidas
- **Cuidado com cache** em endpoints que retornam dados dinâmicos
- Cache deve considerar contexto do usuário (super admin vs normal)
- Cache vazio pode ser confundido com "não há dados"
- Sempre verificar banco de dados diretamente quando API retorna vazio
- Para debug, remover cache temporariamente
- Cache deve ser invalidado quando dados são modificados
- Em desenvolvimento, cache pode causar mais problemas que benefícios

### Referências
- Arquivos: `backend/apps/accounts/views.py`
- Docs: [Django Cache Framework](https://docs.djangoproject.com/en/5.0/topics/cache/)

---
