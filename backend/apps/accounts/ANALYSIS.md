# Accounts App — Análise do Módulo

> **Última atualização**: 2024-12
> **Domínio**: Autenticação e Multi-Tenancy (User, Workspace)
> **Status**: ✅ Ativo
> **Zona**: 🔴 VERMELHA (NUNCA TOCAR sem autorização)

---

## 🎯 Visão Geral

O app `accounts` gerencia:
- **User**: Modelo de usuário customizado (email como USERNAME_FIELD)
- **Workspace**: Modelo de empresa para multi-tenancy
- **LegalDocument**: Documentos legais (Termos, Política de Privacidade)
- **LegalDocumentAcceptance**: Aceite de documentos pelos usuários

**Este é um módulo CRÍTICO** — mudanças aqui podem quebrar autenticação e multi-tenancy.

---

## 🔐 ÁREA PROTEGIDA — ZONA VERMELHA

### ⚠️ NUNCA MODIFICAR SEM AUTORIZAÇÃO

```
apps/accounts/models.py           # User, Workspace (modelos críticos)
apps/accounts/migrations/          # Migrations de autenticação
```

**Ação**: PARAR imediatamente e solicitar autorização humana.

### 🟡 ZONA AMARELA — CUIDADO

```
apps/accounts/serializers.py      # Serializers de User/Workspace
apps/accounts/views.py            # Views de autenticação
apps/accounts/services.py         # Services de negócio
```

**Ação**: Criar PLAN, aguardar aprovação.

---

## 📁 Estrutura

```
apps/accounts/
├── models.py           # User, Workspace, LegalDocument
├── serializers.py      # Serializers de registro/login
├── views.py            # Views de autenticação
├── services.py         # Services de negócio
├── signals.py          # Signals (pós-save, etc)
├── admin.py            # Configuração do Django Admin
├── urls.py             # Rotas de autenticação
└── migrations/         # 🔴 ZONA VERMELHA
```

---

## 🏗️ Modelos Principais

### 1. User (Customizado)

```python
class User(UUIDPrimaryKeyMixin, AbstractUser):
    """User customizado com email como USERNAME_FIELD."""

    email = models.EmailField(unique=True, blank=False)
    username = models.CharField(blank=True, null=True, unique=False)
    workspace = models.ForeignKey(Workspace, ...)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]
```

**Características**:
- **Email como USERNAME_FIELD** (não username)
- **UUID como primary key** (não inteiro)
- **ForeignKey para Workspace** (multi-tenancy)
- **Timestamps** (`created_at`, `updated_at`)

**⚠️ Invariantes**:
- Email sempre único
- Email sempre obrigatório
- Workspace pode ser None (usuários sem empresa)

### 2. Workspace

```python
class Workspace(UUIDPrimaryKeyMixin, models.Model):
    """Modelo de empresa para multi-tenancy."""

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)  # Usado no header X-Workspace-ID
    is_active = models.BooleanField(default=True)

    # Dados da empresa
    legal_name = models.CharField(...)
    cnpj = models.CharField(unique=True, ...)
    # ... outros campos
```

**Características**:
- **Slug único** (usado no header `X-Workspace-ID`)
- **UUID como primary key**
- **Campos LGPD** (DPO, endereço, etc)
- **Soft delete** (via `is_active`)

**⚠️ Invariantes**:
- Slug sempre único
- Slug sempre válido (regex: `^[a-z0-9-]+$`)
- Workspace inativa não pode ser usada no middleware

### 3. LegalDocument

```python
class LegalDocument(models.Model):
    """Documentos legais (Termos, Política de Privacidade)."""

    document_type = models.CharField(choices=[...])
    version = models.CharField(max_length=50)
    content = models.TextField()
    is_active = models.BooleanField(default=True)
```

**Uso**: Armazena versões de Termos de Uso e Política de Privacidade.

### 4. LegalDocumentAcceptance

```python
class LegalDocumentAcceptance(models.Model):
    """Registro de aceite de documentos legais."""

    user = models.ForeignKey(User, ...)
    document = models.ForeignKey(LegalDocument, ...)
    accepted_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField()
```

**Uso**: Auditoria de aceite de documentos (LGPD).

### 5. PasswordResetToken

```python
class PasswordResetToken(UUIDPrimaryKeyMixin, WorkspaceModel):
    """Token para reset de senha com expiração e uso único."""

    user = models.ForeignKey(User, ...)
    token = models.UUIDField(unique=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    used_at = models.DateTimeField(null=True, blank=True)
```

**Características**:
- **Token UUID único** (seguro e não previsível)
- **Expiração configurável** (padrão: 24 horas via `PASSWORD_RESET_TOKEN_EXPIRATION_HOURS`)
- **Uso único** (marcado como usado após reset)
- **Multi-tenancy** (herda `WorkspaceModel`)

**⚠️ Invariantes**:
- Token sempre único
- Token sempre expira
- Token usado não pode ser reutilizado

---

## 🔄 Fluxo de Autenticação

### Registro de Usuário

```
1. POST /api/v1/accounts/register/
2. UserRegistrationSerializer valida dados
3. Service cria User e Workspace (se nova)
4. Retorna token JWT
```

### Login

```
1. POST /api/v1/accounts/login/
2. Valida email/password
3. Retorna token JWT
4. Header X-Workspace-ID define request.workspace
```

### Reset de Senha

```
1. POST /api/auth/password-reset-request/
   - Valida email (sempre retorna sucesso genérico - segurança)
   - Gera PasswordResetToken
   - Envia email com link de reset

2. POST /api/auth/password-reset-confirm/
   - Valida token (UUID)
   - Valida senha forte
   - Atualiza senha do usuário
   - Marca token como usado
```

**Segurança**:
- **Não expõe se email existe**: Sempre retorna mensagem genérica
- **Token único e seguro**: UUID v4
- **Expiração configurável**: Via `PASSWORD_RESET_TOKEN_EXPIRATION_HOURS`
- **Uso único**: Token marcado como usado após reset
- **Validação de senha forte**: Mínimo 8 caracteres (validadores Django)

### Multi-Tenancy

```
1. Request com header X-Workspace-ID: slug-da-empresa
2. WorkspaceMiddleware busca Workspace pelo slug
3. Define request.workspace
4. ViewSets filtram automaticamente por workspace
```

---

## 📋 Convenções

### ALWAYS (Sempre Fazer)

1. **Email sempre único** e obrigatório
2. **Slug sempre válido** (regex: `^[a-z0-9-]+$`)
3. **UUID como primary key** (não inteiro)
4. **Auditar mudanças** em dados pessoais
5. **Validar ownership** em todas as operações

### NEVER (Nunca Fazer)

1. **Modificar `User` ou `Workspace`** sem autorização
2. **Modificar migrations existentes**
3. **Usar username** como USERNAME_FIELD
4. **Hardcodar workspace_id** em queries
5. **Ignorar validação de slug**

---

## 🔗 Dependências

```
accounts (User, Workspace)
    ↑
    └── core (WorkspaceModel, middleware)
```

**Regra**: `accounts` depende de `core`. Outros apps dependem de `accounts`.

---

## 🧪 Testes

### Arquivos de Teste

```
apps/accounts/tests/
├── test_models.py      # Testes de User, Workspace
├── test_serializers.py # Testes de serializers
├── test_views.py       # Testes de autenticação
└── test_services.py    # Testes de services
```

### Cobertura Esperada

- Models: 100% (crítico)
- Serializers: 90%+
- Views: 90%+
- Services: 90%+

---

## 🔐 Segurança

### Validações Críticas

1. **Email único**: Previne duplicação
2. **Slug válido**: Previne enumeração e SQL injection
3. **Workspace ativa**: Apenas workspaces ativas podem ser usadas
4. **Ownership**: Usuários só acessam dados da própria workspace
5. **Auditoria**: Todas as mudanças em dados pessoais são auditadas

### Vulnerabilidades a Evitar

- **IDOR**: Sempre validar ownership
- **Enumeration**: Validar formato do slug
- **SQL Injection**: Usar ORM (nunca raw SQL)
- **XSS**: Sanitizar inputs

---

## 📚 Referências

- `@backend/ANALYSIS.md` — Análise geral do backend
- `@backend/apps/core/ANALYSIS.md` — Análise do app core
- `@docs/ARCHITECTURE.md` — Decisões arquiteturais
- `@docs/LGPD_COMPLIANCE.md` — Compliance LGPD
- `@CLAUDE.md` — Contexto global
- `@AGENTS.md#007security` — Agente de segurança

---

## ⚠️ Invariantes (Nunca Quebrar)

1. **Email sempre único e obrigatório**
2. **Slug sempre válido e único**
3. **UUID sempre como primary key**
4. **Workspace sempre validada no middleware**
5. **Auditoria sempre captura mudanças em dados pessoais**

---

## 🚀 Próximos Passos Recomendados

1. ✅ Implementar reset de senha (concluído)
2. Implementar autenticação social (OAuth) - parcialmente implementado
3. Adicionar 2FA (two-factor authentication)
4. Implementar rate limiting por workspace
5. Melhorar validação de CNPJ

---

## 🔍 Anchors Semânticos

| Termo | Significado |
|-------|-------------|
| `User` | Modelo de usuário customizado (email como USERNAME_FIELD) |
| `Workspace` | Modelo de empresa para multi-tenancy |
| `X-Workspace-ID` | Header HTTP com slug da workspace |
| `USERNAME_FIELD` | Campo usado para autenticação (email) |
| `LegalDocument` | Documentos legais (Termos, Política) |
| `PasswordResetToken` | Token para reset de senha (UUID, expiração, uso único) |

## 📧 Variáveis de Ambiente - Password Reset

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PASSWORD_RESET_TOKEN_EXPIRATION_HOURS` | Horas até expiração do token | `24` |
| `PASSWORD_RESET_URL_PATH` | Caminho da página de reset no frontend | `/reset-password` |
| `FRONTEND_URL` | URL do frontend (para link de reset) | `http://localhost:5173` |
| `PROJECT_NAME` | Nome do projeto (usado no email) | `SaaS Bootstrap` |
| `SAAS_WORKSPACE_EMAIL` | Email de suporte (usado no email) | `contato@saasbootstrap.com` |
| `DEFAULT_FROM_EMAIL` | Email remetente | `noreply@...` |
| `DEFAULT_FROM_NAME` | Nome do remetente | `PROJECT_NAME` |



