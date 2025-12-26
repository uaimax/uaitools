# Análise de Segurança Estrutural - SaaS Bootstrap

**Data:** 2025-12-24
**Analista:** Security Engineer (OWASP-focused)
**Objetivo:** Identificar gaps estruturais de segurança que são difíceis/caros de adicionar depois

---

## 📋 Resumo Executivo

Esta análise identifica **apenas controles estruturais fundamentais** que devem ser implementados ou projetados desde já, pois adicioná-los depois seria caro, arriscado ou traumático para um bootstrap SaaS reutilizável.

**Critério de inclusão:**
- ✅ Transversal a SaaS multi-tenant
- ✅ Impacta todos os produtos derivados
- ✅ Risco estrutural se não tratado agora
- ✅ Custo de mudança futura alto

**Critério de exclusão:**
- ❌ Controles facilmente adicionáveis depois
- ❌ Compliance formal (LGPD já coberto)
- ❌ Ferramentas específicas sem justificativa
- ❌ Overengineering

---

## 🔴 1. Validação Explícita de Ownership (IDOR Prevention)

### Risco OWASP
**A01:2021 – Broken Access Control**
Permite acesso a recursos de outros tenants através de manipulação de IDs.

### Por que é comum esquecer
- Django ORM filtra por `workspace`, mas não valida explicitamente no `get_object()`
- Se um desenvolvedor criar um ViewSet sem herdar `WorkspaceViewSet`, o isolamento quebra
- Fácil assumir que "já está protegido" sem validação explícita

### Impacto real
- **Crítico**: Vazamento de dados entre tenants
- **Traumático**: Se descoberto em produção, requer auditoria completa e possível notificação de clientes
- **Custo**: Refatorar todos os ViewSets existentes e adicionar testes

### Implementação vs Projeto

**✅ IMPLEMENTAR AGORA**

Criar um mixin/permission que valida explicitamente ownership:

```python
# apps/core/permissions.py
class WorkspaceObjectPermission(BasePermission):
    """Valida que objeto pertence à workspace do request."""

    def has_object_permission(self, request, view, obj):
        if not hasattr(obj, 'workspace'):
            return False
        request_workspace = getattr(request, 'workspace', None)
        if not request_workspace:
            return False
        return obj.workspace_id == request_workspace.id
```

**Aplicar em `WorkspaceViewSet`:**
```python
class WorkspaceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, WorkspaceObjectPermission]
```

**Por que implementar:**
- Custo baixo (1 arquivo, ~30 linhas)
- Proteção explícita e testável
- Padrão claro para desenvolvedores
- Previne erros humanos

---

## 🔴 2. Sanitização de Input em Campos de Texto Livre

### Risco OWASP
**A03:2021 – Injection** (XSS via stored data)
**A07:2021 – Identification and Authentication Failures** (via payloads maliciosos)

### Por que é comum esquecer
- DRF serializers validam formato, mas não sanitizam conteúdo HTML
- Campos como `notes`, `description`, `name` podem conter HTML/JavaScript
- Assumimos que o frontend "cuida disso", mas APIs podem ser consumidas diretamente

### Impacto real
- **Alto**: XSS stored em dados que são renderizados depois
- **Traumático**: Se dados maliciosos já estão no banco, requer limpeza massiva
- **Custo**: Adicionar sanitização depois requer migração de dados existentes

### Implementação vs Projeto

**✅ PROJETAR AGORA (com gancho claro)**

Criar um campo serializer customizado que sanitiza automaticamente:

```python
# apps/core/serializers.py
from django.utils.html import strip_tags
from bleach import clean

class SanitizedCharField(serializers.CharField):
    """CharField que sanitiza HTML automaticamente."""

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        # Remove HTML tags e sanitiza
        cleaned = clean(strip_tags(value), tags=[], strip=True)
        return cleaned
```

**Convenção documentada:**
- Usar `SanitizedCharField` para campos de texto livre
- Documentar em `ARCHITECTURE.md`
- Adicionar `bleach` ao `requirements.txt` (opcional agora, mas gancho claro)

**Por que projetar:**
- `bleach` adiciona dependência (pode não ser necessário em todos os casos)
- Mas o padrão deve estar claro desde o início
- Implementação real pode ser feita quando necessário, mas o padrão já existe

---

## 🔴 3. Prevenção de Vazamento de Dados Sensíveis em Logs

### Risco OWASP
**A01:2021 – Broken Access Control** (via logs)
**A09:2021 – Security Logging and Monitoring Failures**

### Por que é comum esquecer
- Logs estruturados capturam `request.data` automaticamente
- Senhas, tokens, dados pessoais podem ser logados acidentalmente
- Em produção, logs são acessíveis por múltiplas pessoas/ferramentas

### Impacto real
- **Crítico**: Vazamento de credenciais via logs
- **Traumático**: Se já logado, dados estão comprometidos (LGPD)
- **Custo**: Revisar todos os pontos de logging e criar filtros

### Implementação vs Projeto

**✅ IMPLEMENTAR AGORA**

Criar um filtro de logging que remove campos sensíveis:

```python
# apps/core/logging.py
SENSITIVE_FIELDS = [
    'password', 'password_confirm', 'token', 'secret',
    'api_key', 'access_token', 'refresh_token', 'authorization'
]

class SensitiveDataFilter(logging.Filter):
    """Remove campos sensíveis de logs."""

    def filter(self, record):
        if hasattr(record, 'request_data'):
            for field in SENSITIVE_FIELDS:
                if field in record.request_data:
                    record.request_data[field] = '***REDACTED***'
        return True
```

**Aplicar em `LOGGING` config:**
```python
'filters': {
    'sensitive_data': {
        '()': 'apps.core.logging.SensitiveDataFilter',
    },
},
```

**Por que implementar:**
- Custo baixo (1 arquivo, ~20 linhas)
- Previne vazamento desde o início
- Configurável (lista de campos sensíveis)

---

## 🟡 4. Validação e Rate Limiting de Workspace Header

### Risco OWASP
**A05:2021 – Security Misconfiguration**
**A07:2021 – Identification and Authentication Failures**

### Por que é comum esquecer
- Middleware aceita qualquer `X-Workspace-ID` e faz query no banco
- Permite enumeração de workspaces (tentativas de slug válidos)
- Permite brute force de slugs (muitas queries)

### Impacto real
- **Médio**: Enumeração de tenants e possível DoS via queries
- **Traumático**: Se descoberto, requer mudança no middleware (impacta tudo)
- **Custo**: Refatorar middleware e adicionar cache/rate limiting

### Implementação vs Projeto

**✅ IMPLEMENTADO: Validação de Formato**

Validação de formato implementada no middleware. Cache pode ser adicionado depois se necessário.

**Implementado:**
```python
# Validação de formato (slug válido) - Previne enumeração e queries maliciosas
if workspace_slug and not re.match(r'^[a-z0-9-]+$', workspace_slug):
    request.workspace = None
    return self.get_response(request)
```

**Pendente (opcional):**
Cache de lookup pode ser adicionado depois:

```python
# apps/core/middleware.py (modificação)
class WorkspaceMiddleware:
    def __call__(self, request):
        workspace_slug = request.headers.get("X-Workspace-ID", "").strip()

        # Validação de formato (slug válido)
        if workspace_slug and not re.match(r'^[a-z0-9-]+$', workspace_slug):
            request.workspace = None
            return self.get_response(request)

        # Cache de lookup (prevenir queries repetidas)
        if workspace_slug:
            cache_key = f"workspace_slug:{workspace_slug}"
            workspace = cache.get(cache_key)
            if not workspace:
                try:
                    workspace = Workspace.objects.filter(is_active=True).get(slug=workspace_slug)
                    cache.set(cache_key, workspace, timeout=300)
                except Workspace.DoesNotExist:
                    workspace = None
        else:
            workspace = None
```

**Por que projetar:**
- Validação de formato: implementar agora (custo baixo)
- Cache: pode ser adicionado depois, mas o gancho deve estar claro
- Rate limiting: pode ser feito no nível de API (já existe), mas documentar que workspace lookup deve ser cacheado

---

## 🟡 5. Proteção contra Mass Assignment em Updates

### Risco OWASP
**A01:2021 – Broken Access Control**
**A04:2021 – Insecure Design**

### Por que é comum esquecer
- DRF serializers permitem atualizar qualquer campo por padrão
- Campos como `is_staff`, `is_active`, `workspace_id` podem ser alterados acidentalmente
- Sem whitelist explícita, desenvolvedores podem expor campos sensíveis

### Impacto real
- **Alto**: Escalação de privilégios ou mudança de tenant
- **Traumático**: Se descoberto, requer revisão de todos os serializers
- **Costo**: Refatorar serializers e adicionar validações

### Implementação vs Projeto

**✅ PROJETAR AGORA (com convenção clara)**

Documentar padrão de `read_only_fields` e `extra_kwargs`:

```python
# Convenção: Sempre definir read_only_fields explicitamente
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'is_staff', 'is_active']
        read_only_fields = ['id', 'is_staff']  # ✅ Explícito
        # ❌ ERRADO: Deixar campos sensíveis editáveis
```

**Adicionar em `ARCHITECTURE.md`:**
- Seção sobre "Mass Assignment Prevention"
- Checklist para novos serializers
- Exemplos do que NÃO fazer

**Por que projetar:**
- Não requer código novo (já existe no DRF)
- Mas requer disciplina e documentação clara
- Implementação: seguir convenção em todos os serializers

---

## 🟢 6. Validação de Query Parameters (SQL Injection via ORM)

### Risco OWASP
**A03:2021 – Injection**

### Por que é comum esquecer
- Django ORM protege contra SQL injection, mas query params podem causar problemas
- Filtros como `status` e `search` são usados diretamente sem validação
- Se alguém usar `.extra()` ou `.raw()`, a proteção some

### Impacto real
- **Baixo**: Django ORM já protege na maioria dos casos
- **Médio**: Se desenvolvedor usar `.extra()` ou `.raw()` sem sanitização
- **Custo**: Adicionar validação depois é simples, mas requer disciplina

### Implementação vs Projeto

**✅ PROJETAR AGORA (com anti-pattern documentado)**

Documentar em `.context/anti-patterns.md`:

```markdown
## ❌ Anti-Pattern: Query Params Sem Validação

# ❌ ERRADO
status = request.query_params.get("status")
queryset = queryset.filter(status=status)  # Pode ser qualquer coisa

# ✅ CORRETO
VALID_STATUSES = ['new', 'contacted', 'converted']
status = request.query_params.get("status")
if status and status in VALID_STATUSES:
    queryset = queryset.filter(status=status)
```

**Por que projetar:**
- Django ORM já protege na maioria dos casos
- Mas documentar o padrão previne uso de `.extra()` sem sanitização
- Implementação: seguir padrão em todos os ViewSets

---

## 📊 Matriz de Priorização

| Item | Risco | Custo de Mudança | Implementar Agora? |
|------|-------|------------------|-------------------|
| 1. Validação de Ownership | 🔴 Crítico | Alto | ✅ SIM |
| 2. Sanitização de Input | 🟡 Alto | Médio | ⚠️ PROJETAR |
| 3. Filtro de Dados Sensíveis | 🔴 Crítico | Alto | ✅ SIM |
| 4. Validação Workspace Header | 🟡 Médio | Médio | ✅ IMPLEMENTADO (formato) |
| 5. Mass Assignment | 🟡 Alto | Baixo | ⚠️ PROJETAR |
| 6. Query Params | 🟢 Baixo | Baixo | ⚠️ PROJETAR |

---

## 🎯 Recomendações Finais

### Implementar Imediatamente (2 itens)
1. **Validação Explícita de Ownership** - Previne IDOR, custo baixo, impacto crítico
2. **Filtro de Dados Sensíveis em Logs** - Previne vazamento, custo baixo, impacto crítico

### Implementado (1 item adicional)
3. **Validação de Formato Workspace Header** - ✅ Implementado - Previne enumeração e queries maliciosas

### Projetar com Ganchos Claros (3 itens)
4. **Sanitização de Input** - Padrão claro, implementação quando necessário
5. **Mass Assignment Prevention** - Convenção documentada, disciplina
6. **Query Params Validation** - Anti-pattern documentado, disciplina

### Opcional (1 item)
7. **Cache Workspace Header** - Pode ser adicionado depois se necessário (performance)

### O Que NÃO Fazer
- ❌ Não implementar WAF ou ferramentas complexas agora
- ❌ Não adicionar compliance formal além do LGPD já existente
- ❌ Não criar sistema de permissões granular (RBAC básico já existe)
- ❌ Não adicionar 2FA agora (pode ser adicionado depois sem grande custo)

---

## 📚 Referências

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [Django Security Best Practices](https://docs.djangoproject.com/en/5.0/topics/security/)
- [DRF Security](https://www.django-rest-framework.org/topics/security/)

---

**Conclusão:** O bootstrap já tem boa base de segurança (CSRF, CORS, rate limiting, audit logs). Os 2 itens a implementar agora são críticos e de baixo custo. Os 4 itens a projetar garantem que padrões corretos sejam seguidos desde o início, evitando dívida técnica de segurança.

