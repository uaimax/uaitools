# Anti-Patterns - O Que Evitar

Este arquivo documenta **padrões que devem ser evitados** no projeto.

---

## ❌ Anti-Pattern: Lógica de Negócio em Views

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [architecture, separation-of-concerns]
**Severidade**: high

### Descrição
Colocar lógica de negócio diretamente em views/viewsets.

### Exemplo do Anti-Pattern
```python
# ❌ ERRADO
class LeadViewSet(viewsets.ModelViewSet):
    def create(self, request):
        # Lógica complexa aqui
        if request.data['status'] == 'new':
            # ... 50 linhas de lógica ...
        return Response(...)
```

### Solução Correta
```python
# ✅ CORRETO
class LeadViewSet(viewsets.ModelViewSet):
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = LeadService.create_lead(
            tenant=request.tenant,
            data=serializer.validated_data
        )
        return Response(LeadSerializer(lead).data)

# services.py
class LeadService:
    @staticmethod
    def create_lead(tenant: Tenant, data: dict) -> Lead:
        # Lógica de negócio aqui
        # ...
```

### Por Que Evitar
- Views ficam difíceis de testar
- Lógica não pode ser reutilizada
- Viola separação de responsabilidades

### Referências
- `docs/ARCHITECTURE.md`
- `AGENTS.md` (@007backend)

---

## ❌ Anti-Pattern: Queries N+1

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [performance, django, orm]
**Severidade**: medium

### Descrição
Fazer queries dentro de loops, causando múltiplas queries ao banco.

### Exemplo do Anti-Pattern
```python
# ❌ ERRADO
leads = Lead.objects.filter(tenant=tenant)
for lead in leads:
    # Query adicional por iteração!
    contact = lead.contact  # SELECT * FROM contacts WHERE id=...
    print(contact.name)
```

### Solução Correta
```python
# ✅ CORRETO: Usar select_related ou prefetch_related
leads = Lead.objects.filter(tenant=tenant).select_related('contact')
for lead in leads:
    contact = lead.contact  # Sem query adicional!
    print(contact.name)
```

### Por Que Evitar
- Performance degrada com muitos registros
- Sobrecarga desnecessária no banco
- Pode causar timeouts

### Referências
- Django ORM docs
- `docs/ARCHITECTURE.md`

---

## ❌ Anti-Pattern: Ignorar Multi-tenancy em Queries

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [multi-tenancy, security]
**Severidade**: critical

### Descrição
Fazer queries sem filtrar por tenant, permitindo acesso a dados de outros tenants.

### Exemplo do Anti-Pattern
```python
# ❌ ERRADO: Sem filtro de tenant!
lead = Lead.objects.get(id=lead_id)
```

### Solução Correta
```python
# ✅ CORRETO: Sempre filtrar por tenant
lead = Lead.objects.filter(
    tenant=request.tenant,
    id=lead_id
).first()

if not lead:
    raise NotFound()
```

### Por Que Evitar
- **Violação de segurança crítica**
- Vazamento de dados entre tenants
- Quebra isolamento multi-tenant

### Referências
- `docs/ARCHITECTURE.md`
- `.context/mistakes.md`

---

## ❌ Anti-Pattern: Query Parameters Sem Validação

**Data**: 2025-12-24
**Categoria**: backend, security
**Tags**: [security, validation, sql-injection]
**Severidade**: medium

### Descrição
Usar query parameters diretamente em queries sem validação.

### Exemplo do Anti-Pattern
```python
# ❌ ERRADO
def get_queryset(self):
    queryset = super().get_queryset()
    status = self.request.query_params.get("status")
    queryset = queryset.filter(status=status)  # Pode ser qualquer coisa!
    return queryset
```

### Solução Correta
```python
# ✅ CORRETO: Validar valores permitidos
def get_queryset(self):
    queryset = super().get_queryset()

    VALID_STATUSES = ['new', 'contacted', 'converted']
    status = self.request.query_params.get("status")
    if status and status in VALID_STATUSES:
        queryset = queryset.filter(status=status)

    return queryset
```

### Por Que Evitar
- Permite valores inválidos
- Pode causar erros inesperados
- Risco de SQL injection se usar `.extra()` ou `.raw()`

### Referências
- `backend/.context/security-patterns.md`
- Django ORM docs

---

## ❌ Anti-Pattern: Mass Assignment em Serializers

**Data**: 2025-12-24
**Categoria**: backend, security
**Tags**: [security, serializers, mass-assignment]
**Severidade**: high

### Descrição
Serializer que permite alterar campos sensíveis porque não define `read_only_fields`.

### Exemplo do Anti-Pattern
```python
# ❌ ERRADO
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'is_staff', 'is_active']
        # read_only_fields não definido - is_staff pode ser alterado!
```

### Solução Correta
```python
# ✅ CORRETO: Definir read_only_fields explicitamente
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'is_staff', 'is_active']
        read_only_fields = ['id', 'is_staff']  # Campos protegidos
```

### Por Que Evitar
- Permite escalação de privilégios (alterar `is_staff`)
- Permite mudança de tenant (alterar `workspace_id`)
- Violação de controle de acesso

### Referências
- `backend/.context/security-patterns.md`
- DRF Serializers docs

---

## ❌ Anti-Pattern: SQL Raw ou .extra() Sem Sanitização

**Data**: 2025-12-24
**Categoria**: backend, security
**Tags**: [security, sql-injection, django-orm]
**Severidade**: critical

### Descrição
Usar SQL raw ou `.extra()` sem sanitização adequada.

### Exemplo do Anti-Pattern
```python
# ❌ ERRADO: SQL injection!
status = request.query_params.get("status")
queryset = Model.objects.extra(where=[f"status = '{status}'"])

# ❌ ERRADO: Raw SQL sem sanitização
queryset = Model.objects.raw(f"SELECT * FROM table WHERE status = '{status}'")
```

### Solução Correta
```python
# ✅ CORRETO: Usar Django ORM
status = request.query_params.get("status")
if status:
    queryset = queryset.filter(status=status)  # ORM protege automaticamente

# ✅ CORRETO: Se precisar usar .extra(), usar params
queryset = Model.objects.extra(
    where=["status = %s"],
    params=[status]  # Django sanitiza automaticamente
)
```

### Por Que Evitar
- **Risco crítico de SQL injection**
- Django ORM já protege na maioria dos casos
- `.extra()` e `.raw()` requerem cuidado manual

### Referências
- `backend/.context/security-patterns.md`
- Django Security docs

---

## ❌ Anti-Pattern: Commitar Secrets

**Data**: 2025-01-27
**Categoria**: security
**Tags**: [security, git, secrets]
**Severidade**: critical

### Descrição
Comitar arquivos com secrets, senhas, ou tokens no Git.

### Exemplo do Anti-Pattern
```python
# ❌ ERRADO: Secret no código
API_KEY = "sk_live_abc123..."
```

### Solução Correta
```python
# ✅ CORRETO: Variável de ambiente
import os
API_KEY = os.getenv('API_KEY')
```

E garantir que `.env` está no `.gitignore`:
```
.env
.env.local
*.key
```

### Por Que Evitar
- **Risco de segurança crítico**
- Secrets expostos no histórico do Git
- Mesmo removendo, fica no histórico

### Referências
- `.gitignore`
- `.cursorrules`

---

## ❌ Anti-Pattern: Modificar Models Críticos Sem Análise

**Data**: 2025-01-27
**Categoria**: backend
**Tags**: [architecture, models]
**Severidade**: high

### Descrição
Modificar models críticos (User, Tenant, TenantModel) sem entender impacto completo.

### Models Críticos (Zona Vermelha)
- `apps.accounts.models.User`
- `apps.accounts.models.Tenant`
- `apps.core.models.TenantModel`
- `apps.core.middleware.TenantMiddleware`

### Por Que Evitar
- Impacto em cascata em todo o sistema
- Pode quebrar multi-tenancy
- Requer análise profunda de dependências

### Processo Correto
1. Ler `docs/context/PROTECTED_AREAS.md`
2. Analisar todas as dependências
3. Criar plano detalhado
4. Aguardar aprovação
5. Implementar com testes extensivos

### Referências
- `docs/context/PROTECTED_AREAS.md`
- `.cursorrules`

---

