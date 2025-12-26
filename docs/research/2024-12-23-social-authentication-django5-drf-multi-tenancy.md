# Social Authentication (OAuth2/OIDC) em Django 5 + DRF com Multi-Tenancy

**Data da Pesquisa**: 2024-12-23
**Status**: ✅ Completa
**Confiança da Análise**: 9/10
**Fontes Consultadas**: 18+ fontes

---

## 📊 Sumário Executivo

Para implementar autenticação social (OAuth2/OIDC) em um projeto Django 5 com Django REST Framework (DRF) e suporte a multi-tenancy, **recomenda-se fortemente o uso do `django-allauth`** como biblioteca principal. Esta solução oferece:

- **Modularidade**: Suporte nativo a 50+ provedores sociais com arquitetura extensível
- **Compatibilidade**: Totalmente compatível com Django 5 e DRF, com integração via `dj-rest-auth`
- **Manutenção Ativa**: Comunidade robusta, atualizações regulares (versão 65.13.1 em novembro 2025 com suporte a Django 6.0)
- **Multi-Tenancy**: Permite customização via adapters para associar usuários a tenants durante o fluxo OAuth
- **Segurança**: Segue práticas OWASP 2024-2025, suporte a PKCE, validação de state parameter

**Arquitetura Recomendada:**
1. **Frontend (React SPA)**: Inicia fluxo OAuth → recebe código → troca por JWT no backend
2. **Backend (Django 5 + DRF)**: Processa callbacks OAuth → associa usuário ao tenant via `X-Tenant-ID` → emite JWT
3. **Middleware**: `TenantMiddleware` identifica tenant em todas as requisições
4. **Autenticação**: JWT para APIs REST (stateless), cookies HTTP-only para segurança

**Principais Descobertas:**
- `django-allauth` é a escolha mais madura e mantida ativamente (superior a `social-auth-app-django` e `django-oauth-toolkit` para autenticação social)
- Integração com multi-tenancy requer customização de `SocialAccountAdapter` para associar `tenant_id` durante o fluxo OAuth
- Para SPAs, o fluxo Authorization Code com PKCE é recomendado (mais seguro que Implicit Flow)
- Vulnerabilidades recentes em `social-auth-app-django` (CVE-2025-61783) reforçam a importância de manter bibliotecas atualizadas

---

## 1. Bibliotecas e Ferramentas 2025

### 1.1 Análise Comparativa Detalhada

| Biblioteca | Versão Atual | Manutenção | Suporte DRF | Multi-Tenancy | Comunidade | Recomendação |
|------------|--------------|------------|-------------|--------------|------------|--------------|
| **django-allauth** | 65.13.1+ | ✅ Ativa (nov 2025) | ✅ Nativo via dj-rest-auth | ⚠️ Requer customização | ⭐⭐⭐⭐⭐ | **RECOMENDADO** |
| **social-auth-app-django** | 5.6.0+ | ✅ Ativa | ⚠️ Manual | ⚠️ Requer customização | ⭐⭐⭐ | Alternativa |
| **django-oauth-toolkit** | 3.0+ | ✅ Ativa (nov 2025) | ✅ Nativo | ⚠️ Requer customização | ⭐⭐⭐⭐ | Para OAuth2 Server |
| **mozilla-django-oidc** | - | ✅ Ativa | ⚠️ Manual | ⚠️ Requer customização | ⭐⭐ | Apenas OIDC |
| **Authlib** | - | ✅ Ativa | ⚠️ Manual | ⚠️ Requer customização | ⭐⭐⭐ | Muito flexível |

### 1.2 django-allauth (Recomendado)

**Prós:**
- ✅ Suporte a 50+ provedores sociais (Google, GitHub, Microsoft, Facebook, etc.)
- ✅ Integração nativa com Django authentication system
- ✅ Compatível com Django 5 e Django 6.0 (desde nov 2025)
- ✅ Extensível via adapters (`AccountAdapter`, `SocialAccountAdapter`)
- ✅ Suporte a email verification, password reset, account management
- ✅ Comunidade ativa com 5k+ stars no GitHub
- ✅ Documentação abrangente e exemplos práticos
- ✅ Suporte a múltiplos sites (django.contrib.sites)

**Contras:**
- ⚠️ Configuração inicial pode ser complexa (múltiplos apps, migrations)
- ⚠️ Multi-tenancy requer customização de adapters
- ⚠️ Curva de aprendizado para personalizações avançadas

**Integração com DRF:**
- Usar `dj-rest-auth` (fork mantido de `django-rest-auth`)
- Fornece endpoints REST para login social, token management
- Suporte a JWT via `djangorestframework-simplejwt`

### 1.3 social-auth-app-django

**Prós:**
- ✅ Flexibilidade na configuração de provedores
- ✅ Suporte a múltiplos provedores
- ✅ Baseado em `python-social-auth` (biblioteca base robusta)

**Contras:**
- ⚠️ Vulnerabilidade recente: CVE-2025-61783 (corrigida em 5.6.0)
- ⚠️ Comunidade menor que django-allauth
- ⚠️ Documentação menos estruturada
- ⚠️ Integração com DRF requer mais código manual
- ⚠️ Menos extensível para casos de uso específicos

**Recomendação:** Usar apenas se já estiver em uso no projeto ou se precisar de flexibilidade extrema não oferecida pelo django-allauth.

### 1.4 django-oauth-toolkit

**Prós:**
- ✅ Implementação robusta de servidor OAuth2
- ✅ Compatível com Django 5
- ✅ Boa integração com DRF
- ✅ Suporte a tokens de acesso e refresh

**Contras:**
- ❌ **Focado em fornecer OAuth2 para suas próprias APIs**, não em autenticação social
- ❌ Não oferece suporte nativo a provedores sociais (Google, GitHub, etc.)
- ❌ Requer implementação adicional para integração com provedores sociais

**Recomendação:** Usar apenas se você precisa **fornecer** uma API OAuth2, não para **consumir** OAuth2 de provedores sociais.

### 1.5 Conclusão sobre Bibliotecas

**Recomendação Final:** `django-allauth` + `dj-rest-auth` + `djangorestframework-simplejwt`

Esta combinação oferece:
- Autenticação social completa
- Integração REST nativa
- Tokens JWT para SPAs
- Extensibilidade para multi-tenancy

**Fontes Consultadas:**
- [django-allauth Documentation](https://allauth.org/)
- [django-allauth no DjangoMatrix](https://www.djangomatrix.com/packages/django-allauth/)
- [social-auth-app-django no PyPI](https://pypi.org/project/social-auth-app-django/)
- [CVE-2025-61783 - Vulnerabilidade social-auth-app-django](https://security.snyk.io/vuln/SNYK-PYTHON-SOCIALAUTHAPPDJANGO-13512562)

---

## 2. Padrões Arquiteturais Multi-Tenancy

### 2.1 Identificação do Tenant no Fluxo OAuth

**Desafio Principal:** Garantir que o usuário autenticado via OAuth seja associado ao tenant correto.

**Solução Recomendada:**

1. **Incluir `tenant_id` no State Parameter:**
   ```python
   # No frontend, ao iniciar OAuth
   const state = btoa(JSON.stringify({ tenant_id: currentTenantId, nonce: randomNonce }))
   window.location.href = `/api/auth/google/login/?state=${state}`
   ```

2. **Middleware Identifica Tenant:**
   ```python
   # backend/apps/core/middleware.py
   class TenantMiddleware:
       def __init__(self, get_response):
           self.get_response = get_response

       def __call__(self, request):
           # Prioridade: header > state parameter > subdomain
           tenant_id = (
               request.headers.get('X-Tenant-ID') or
               self._extract_from_state(request) or
               self._extract_from_subdomain(request)
           )
           if tenant_id:
               try:
                   request.tenant = Tenant.objects.get(id=tenant_id, is_active=True)
               except Tenant.DoesNotExist:
                   request.tenant = None
           else:
               request.tenant = None
           return self.get_response(request)
   ```

3. **Custom SocialAccountAdapter:**
   ```python
   # backend/apps/accounts/adapters.py
   from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
   from allauth.exceptions import ImmediateHttpResponse

   class TenantSocialAccountAdapter(DefaultSocialAccountAdapter):
       def pre_social_login(self, request, sociallogin):
           """Associa usuário ao tenant antes de completar login."""
           tenant = getattr(request, 'tenant', None)
           if not tenant:
               raise ImmediateHttpResponse(
                   HttpResponseBadRequest("Tenant não identificado")
               )

           # Se usuário já existe, verificar se pertence ao tenant
           if sociallogin.is_existing:
               user = sociallogin.user
               if user.tenant_id != tenant.id:
                   raise ImmediateHttpResponse(
                       HttpResponseForbidden("Usuário não pertence a este tenant")
                   )

           # Associar tenant ao usuário
           sociallogin.user.tenant = tenant

       def save_user(self, request, sociallogin, form=None):
           """Garante que tenant seja salvo com o usuário."""
           user = super().save_user(request, sociallogin, form)
           user.tenant = request.tenant
           user.save()
           return user
   ```

### 2.2 Associação de Usuário ao Tenant

**Cenários a Considerar:**

1. **Novo Usuário Social:**
   - Criar usuário com `tenant_id` do request
   - Validar que email não está em uso em outro tenant (se aplicável)

2. **Usuário Existente:**
   - Verificar se usuário já pertence ao tenant
   - Se não, decidir política: bloquear ou permitir associação múltipla

3. **Email Já em Uso:**
   - Opção A: Bloquear (mais seguro para multi-tenancy estrito)
   - Opção B: Associar conta social à conta existente (requer validação)

**Implementação Recomendada:**
```python
# Política: Um email pode ter contas em múltiplos tenants
# Mas cada usuário pertence a apenas um tenant
def get_or_create_user(sociallogin, tenant):
    email = sociallogin.account.extra_data.get('email')

    # Buscar usuário existente no tenant
    try:
        user = User.objects.get(email=email, tenant=tenant)
        # Associar conta social existente
        sociallogin.connect(request, user)
        return user
    except User.DoesNotExist:
        # Criar novo usuário
        user = sociallogin.user
        user.tenant = tenant
        user.email = email
        user.save()
        return user
```

### 2.3 Isolamento de Dados

**Row-Level Security (RLS):**

1. **Querysets Filtrados:**
   ```python
   # backend/apps/core/managers.py
   class TenantQuerySet(models.QuerySet):
       def for_tenant(self, tenant):
           return self.filter(tenant=tenant)

   class TenantManager(models.Manager):
       def get_queryset(self):
           return TenantQuerySet(self.model, using=self._db)

       def for_tenant(self, tenant):
           return self.get_queryset().for_tenant(tenant)
   ```

2. **ViewSets com Filtro Automático:**
   ```python
   # backend/apps/leads/viewsets.py
   class LeadViewSet(viewsets.ModelViewSet):
       def get_queryset(self):
           return Lead.objects.for_tenant(self.request.tenant)
   ```

**Fontes Consultadas:**
- [Django Multi-Tenancy Best Practices 2025](https://umatechnology.org/best-practices-using-multi-tenant-saas-apps-in-2025-and-beyond/)
- [Django Tenant-Specific Migrations Guide](https://www.codingeasypeasy.com/blog/django-tenant-specific-migrations-a-comprehensive-guide-to-managing-database-changes-in-multi-tenant-applications)

---

## 3. Integração com DRF e SPA

### 3.1 Fluxo OAuth para SPA (Recomendado 2025)

**Authorization Code Flow com PKCE** (mais seguro que Implicit Flow):

```
1. Frontend (React):
   ├─ Usuário clica "Login com Google"
   ├─ Gera code_verifier e code_challenge (PKCE)
   ├─ Redireciona para: /api/auth/google/login/?state={tenant_id}
   └─ Usuário autentica no Google

2. Google Callback:
   ├─ Google redireciona para: /api/auth/google/callback/?code=XXX&state=YYY
   └─ Backend processa callback

3. Backend (Django):
   ├─ Valida state (extrai tenant_id)
   ├─ Troca code por access_token
   ├─ Busca dados do usuário no Google
   ├─ Cria/atualiza usuário com tenant_id
   ├─ Gera JWT com tenant_id no payload
   └─ Redireciona para frontend com JWT

4. Frontend:
   ├─ Recebe JWT via URL fragment ou query param
   ├─ Armazena JWT em cookie HTTP-only (ou memory)
   └─ Usa JWT em requisições subsequentes
```

### 3.2 Implementação com dj-rest-auth

**Instalação:**
```bash
pip install django-allauth dj-rest-auth djangorestframework-simplejwt
```

**Configuração:**
```python
# backend/config/settings/base.py
INSTALLED_APPS = [
    # ... outras apps
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.github',
    'allauth.socialaccount.providers.microsoft',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'rest_framework_simplejwt',
]

SITE_ID = 1

# DRF Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
}

# dj-rest-auth Configuration
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'access-token',
    'JWT_AUTH_REFRESH_COOKIE': 'refresh-token',
    'JWT_AUTH_HTTPONLY': False,  # Para SPAs, pode ser False
}

# django-allauth Configuration
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_EMAIL_VERIFICATION = 'optional'  # Para SPAs, pode ser 'none'
```

**URLs:**
```python
# backend/config/urls.py
urlpatterns = [
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/auth/social/', include('allauth.urls')),
]
```

### 3.3 Frontend React - Exemplo de Implementação

```typescript
// frontend/src/services/auth.ts
export const initiateSocialLogin = (provider: string, tenantId: string) => {
  const state = btoa(JSON.stringify({ tenant_id: tenantId, nonce: generateNonce() }))
  const redirectUri = `${API_BASE_URL}/api/auth/${provider}/login/?state=${state}`
  window.location.href = redirectUri
}

// frontend/src/pages/OAuthCallback.tsx
export const OAuthCallback: React.FC = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (token) {
      // Armazenar JWT
      localStorage.setItem('access_token', token)
      // Redirecionar para dashboard
      window.location.href = '/dashboard'
    } else if (error) {
      // Tratar erro
      console.error('OAuth error:', error)
    }
  }, [])

  return <div>Processando autenticação...</div>
}
```

### 3.4 Callback Customizado com Tenant

```python
# backend/apps/accounts/views.py
from allauth.socialaccount.views import SignupView
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import RefreshToken

class TenantSocialCallbackView(SignupView):
    def dispatch(self, request, *args, **kwargs):
        response = super().dispatch(request, *args, **kwargs)

        if request.user.is_authenticated:
            # Gerar JWT
            refresh = RefreshToken.for_user(request.user)
            access_token = str(refresh.access_token)

            # Redirecionar para frontend com token
            frontend_url = settings.FRONTEND_URL
            return redirect(f'{frontend_url}/oauth/callback?token={access_token}')

        return response
```

**Fontes Consultadas:**
- [API Security in Django: Approaches, Trade-offs, and Best Practices](https://dev.to/topunix/api-security-in-django-approaches-trade-offs-and-best-practices-nk4)
- [dj-rest-auth GitHub](https://github.com/iMerica/dj-rest-auth)
- [Django REST Framework JWT Authentication](https://www.django-rest-framework.org/api-guide/authentication/#json-web-token-authentication)

---

## 4. Segurança e Compliance 2025

### 4.1 Vulnerabilidades Comuns em OAuth2/OIDC

**OWASP Top 10 Aplicado a Social Auth:**

1. **A01:2021 – Broken Access Control**
   - **Risco:** Usuário acessa dados de outro tenant
   - **Mitigação:** Sempre validar `tenant_id` em todas as requisições, filtrar querysets por tenant

2. **A02:2021 – Cryptographic Failures**
   - **Risco:** Tokens expostos, secrets em código
   - **Mitigação:** Usar HTTPS sempre, armazenar secrets em variáveis de ambiente, validar assinaturas JWT

3. **A03:2021 – Injection**
   - **Risco:** SQL injection via parâmetros OAuth
   - **Mitigação:** Usar ORM do Django (parameterized queries), validar todos os inputs

4. **A07:2021 – Identification and Authentication Failures**
   - **Risco:** CSRF, state parameter não validado, PKCE não implementado
   - **Mitigação:**
     - ✅ Implementar PKCE (Proof Key for Code Exchange)
     - ✅ Validar state parameter (prevenir CSRF)
     - ✅ Validar redirect_uri (whitelist)
     - ✅ Usar nonce para prevenir replay attacks

5. **A08:2021 – Software and Data Integrity Failures**
   - **Risco:** Bibliotecas desatualizadas com vulnerabilidades
   - **Mitigação:** Manter todas as dependências atualizadas, monitorar CVEs

### 4.2 Implementação de Segurança

**PKCE (Proof Key for Code Exchange):**
```python
# backend/apps/accounts/utils.py
import secrets
import hashlib
import base64

def generate_pkce_pair():
    """Gera code_verifier e code_challenge para PKCE."""
    code_verifier = base64.urlsafe_b64encode(
        secrets.token_bytes(32)
    ).decode('utf-8').rstrip('=')

    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode('utf-8')).digest()
    ).decode('utf-8').rstrip('=')

    return code_verifier, code_challenge
```

**Validação de State Parameter:**
```python
# backend/apps/accounts/middleware.py
import json
import base64
from django.core.cache import cache

class OAuthStateMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/auth/social/'):
            state = request.GET.get('state')
            if state:
                try:
                    decoded = json.loads(base64.b64decode(state))
                    tenant_id = decoded.get('tenant_id')
                    nonce = decoded.get('nonce')

                    # Validar nonce (prevenir replay)
                    cache_key = f'oauth_nonce:{nonce}'
                    if cache.get(cache_key):
                        return HttpResponseBadRequest("Nonce já usado")
                    cache.set(cache_key, True, timeout=600)  # 10 min

                    request.tenant_id_from_state = tenant_id
                except (ValueError, json.JSONDecodeError):
                    return HttpResponseBadRequest("State inválido")

        return self.get_response(request)
```

**Validação de Redirect URI:**
```python
# backend/config/settings/base.py
ALLOWED_REDIRECT_URIS = [
    'http://localhost:3000/oauth/callback',
    'https://app.example.com/oauth/callback',
]

# Validar em adapter
class TenantSocialAccountAdapter(DefaultSocialAccountAdapter):
    def validate_redirect_uri(self, request, redirect_uri):
        if redirect_uri not in settings.ALLOWED_REDIRECT_URIS:
            raise ValueError("Redirect URI não permitido")
        return redirect_uri
```

### 4.3 LGPD/GDPR Compliance

**Requisitos:**

1. **Consentimento Explícito:**
   ```python
   # Model para armazenar consentimentos
   class UserConsent(models.Model):
       user = models.ForeignKey(User, on_delete=models.CASCADE)
       tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE)
       consent_type = models.CharField(max_length=50)  # 'social_auth', 'data_processing', etc.
       granted = models.BooleanField(default=False)
       granted_at = models.DateTimeField(null=True, blank=True)
       ip_address = models.GenericIPAddressField()
       user_agent = models.TextField()
   ```

2. **Direito ao Esquecimento:**
   ```python
   # backend/apps/accounts/services.py
   def delete_user_data(user, tenant):
       """Remove todos os dados do usuário (LGPD compliance)."""
       # Anonimizar dados pessoais
       user.email = f"deleted_{user.id}@deleted.local"
       user.username = f"deleted_{user.id}"
       user.first_name = ""
       user.last_name = ""
       user.save()

       # Deletar contas sociais associadas
       SocialAccount.objects.filter(user=user).delete()

       # Log de auditoria
       AuditLog.objects.create(
           tenant=tenant,
           action='delete',
           model_name='User',
           object_id=str(user.id),
           is_personal_data=True,
           data_subject=user.email
       )
   ```

3. **Transparência:**
   - Documentar quais dados são coletados dos provedores sociais
   - Permitir usuário visualizar dados coletados
   - Fornecer mecanismo de exportação de dados

**Fontes Consultadas:**
- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/secretariageral/pt-br/lgpd)
- [GDPR - General Data Protection Regulation](https://gdpr-info.eu/)

---

## 5. Modularidade e Extensibilidade

### 5.1 Padrão Strategy para Providers

**Estrutura Modular:**
```
backend/apps/
├── accounts/
│   ├── providers/
│   │   ├── __init__.py
│   │   ├── base.py          # Interface base
│   │   ├── google.py        # Implementação Google
│   │   ├── github.py        # Implementação GitHub
│   │   └── microsoft.py     # Implementação Microsoft
│   ├── adapters.py          # SocialAccountAdapter customizado
│   └── services.py          # Lógica de negócio
```

**Interface Base:**
```python
# backend/apps/accounts/providers/base.py
from abc import ABC, abstractmethod

class SocialProviderStrategy(ABC):
    """Interface para provedores sociais."""

    @abstractmethod
    def get_user_data(self, access_token: str) -> dict:
        """Busca dados do usuário no provedor."""
        pass

    @abstractmethod
    def validate_token(self, access_token: str) -> bool:
        """Valida token de acesso."""
        pass

    @abstractmethod
    def get_email(self, user_data: dict) -> str:
        """Extrai email dos dados do usuário."""
        pass
```

**Implementação Concreta:**
```python
# backend/apps/accounts/providers/google.py
import requests
from .base import SocialProviderStrategy

class GoogleProvider(SocialProviderStrategy):
    def get_user_data(self, access_token: str) -> dict:
        response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        response.raise_for_status()
        return response.json()

    def validate_token(self, access_token: str) -> bool:
        # Implementar validação
        return True

    def get_email(self, user_data: dict) -> str:
        return user_data.get('email')
```

### 5.2 Padrão Factory

```python
# backend/apps/accounts/providers/factory.py
from .google import GoogleProvider
from .github import GitHubProvider
from .microsoft import MicrosoftProvider

class SocialProviderFactory:
    _providers = {
        'google': GoogleProvider,
        'github': GitHubProvider,
        'microsoft': MicrosoftProvider,
    }

    @classmethod
    def get_provider(cls, provider_name: str):
        provider_class = cls._providers.get(provider_name)
        if not provider_class:
            raise ValueError(f"Provider '{provider_name}' não suportado")
        return provider_class()

    @classmethod
    def register_provider(cls, name: str, provider_class):
        """Permite registrar novos providers dinamicamente."""
        cls._providers[name] = provider_class
```

### 5.3 Adicionar Novo Provider

**Passos:**

1. **Criar classe do provider:**
   ```python
   # backend/apps/accounts/providers/linkedin.py
   from .base import SocialProviderStrategy

   class LinkedInProvider(SocialProviderStrategy):
       # Implementar métodos
       pass
   ```

2. **Registrar no factory:**
   ```python
   # backend/apps/accounts/providers/factory.py
   from .linkedin import LinkedInProvider

   SocialProviderFactory.register_provider('linkedin', LinkedInProvider)
   ```

3. **Configurar no django-allauth:**
   ```python
   # settings.py
   INSTALLED_APPS += ['allauth.socialaccount.providers.linkedin']
   ```

4. **Adicionar credenciais:**
   - Via admin do Django (SocialApp model)
   - Ou via fixtures/migrations

**Vantagens:**
- ✅ Adicionar provider não afeta outros
- ✅ Fácil testar providers isoladamente
- ✅ Permite desabilitar providers sem remover código
- ✅ Facilita mock em testes

**Fontes Consultadas:**
- [Design Patterns: Strategy](https://refactoring.guru/design-patterns/strategy)
- [Design Patterns: Factory](https://refactoring.guru/design-patterns/factory-method)

---

## 6. Providers Principais 2025

### 6.1 Google OAuth2

**Requisitos:**
- Criar projeto no [Google Cloud Console](https://console.cloud.google.com/)
- Configurar OAuth 2.0 Client ID
- Adicionar redirect URIs autorizados
- Obter Client ID e Client Secret

**Configuração:**
```python
# settings.py
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'APP': {
            'client_id': env('GOOGLE_CLIENT_ID'),
            'secret': env('GOOGLE_CLIENT_SECRET'),
            'key': ''
        }
    }
}
```

**Complexidade:** ⭐⭐ (Baixa - bem documentado)

### 6.2 GitHub OAuth2

**Requisitos:**
- Criar OAuth App no [GitHub Settings](https://github.com/settings/developers)
- Configurar Authorization callback URL
- Obter Client ID e Client Secret

**Configuração:**
```python
SOCIALACCOUNT_PROVIDERS = {
    'github': {
        'SCOPE': [
            'user:email',
        ],
        'APP': {
            'client_id': env('GITHUB_CLIENT_ID'),
            'secret': env('GITHUB_CLIENT_SECRET'),
        }
    }
}
```

**Complexidade:** ⭐⭐ (Baixa - popular entre devs)

### 6.3 Microsoft (Azure AD) OAuth2

**Requisitos:**
- Registrar app no [Azure Portal](https://portal.azure.com/)
- Configurar redirect URIs
- Obter Application (client) ID e Directory (tenant) ID
- Configurar API permissions

**Configuração:**
```python
SOCIALACCOUNT_PROVIDERS = {
    'microsoft': {
        'SCOPE': [
            'User.Read',
        ],
        'APP': {
            'client_id': env('MICROSOFT_CLIENT_ID'),
            'secret': env('MICROSOFT_CLIENT_SECRET'),
            'tenant': env('MICROSOFT_TENANT_ID', default='common'),
        }
    }
}
```

**Complexidade:** ⭐⭐⭐ (Média - mais complexo que Google/GitHub)

### 6.4 Comparação de Providers

| Provider | Popularidade | Complexidade | Documentação | Recomendação |
|----------|-------------|--------------|--------------|--------------|
| Google | ⭐⭐⭐⭐⭐ | ⭐⭐ | Excelente | **Essencial** |
| GitHub | ⭐⭐⭐⭐ | ⭐⭐ | Boa | **Essencial** (devs) |
| Microsoft | ⭐⭐⭐⭐ | ⭐⭐⭐ | Boa | **Recomendado** (enterprise) |
| Facebook | ⭐⭐⭐ | ⭐⭐ | Boa | Opcional |
| LinkedIn | ⭐⭐⭐ | ⭐⭐⭐ | Média | Opcional (B2B) |

**Fontes Consultadas:**
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [Microsoft Identity Platform Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)

---

## 7. Testes e Qualidade

### 7.1 Estratégia de Testes

**Níveis de Teste:**

1. **Unit Tests:** Testar adapters, services, utils isoladamente
2. **Integration Tests:** Testar fluxo completo com mocks de providers
3. **E2E Tests:** Testar com providers reais (ambiente de staging)

### 7.2 Mocks e Fixtures

**Mock de Resposta OAuth:**
```python
# backend/apps/accounts/tests/fixtures.py
GOOGLE_OAUTH_RESPONSE = {
    'id': '123456789',
    'email': 'user@example.com',
    'verified_email': True,
    'name': 'John Doe',
    'given_name': 'John',
    'family_name': 'Doe',
    'picture': 'https://example.com/photo.jpg',
}

# backend/apps/accounts/tests/test_social_auth.py
from unittest.mock import patch, Mock
from django.test import TestCase
from apps.accounts.models import User, Tenant

class SocialAuthTestCase(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test Tenant', slug='test')

    @patch('allauth.socialaccount.providers.google.views.requests.get')
    def test_google_oauth_login(self, mock_get):
        # Mock resposta do Google
        mock_response = Mock()
        mock_response.json.return_value = GOOGLE_OAUTH_RESPONSE
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        # Simular callback OAuth
        response = self.client.get(
            '/api/auth/google/callback/',
            {'code': 'test_code', 'state': 'test_state'}
        )

        # Verificar que usuário foi criado
        user = User.objects.get(email='user@example.com')
        self.assertEqual(user.tenant, self.tenant)
        self.assertTrue(user.is_authenticated)
```

### 7.3 Testes de Multi-Tenancy

```python
def test_user_belongs_to_correct_tenant(self):
    """Garante que usuário é associado ao tenant correto."""
    tenant1 = Tenant.objects.create(name='Tenant 1', slug='t1')
    tenant2 = Tenant.objects.create(name='Tenant 2', slug='t2')

    # Simular OAuth com tenant1
    with patch('apps.core.middleware.TenantMiddleware') as mock_middleware:
        mock_middleware.return_value.tenant = tenant1
        # ... realizar login social

    user = User.objects.get(email='user@example.com')
    self.assertEqual(user.tenant, tenant1)
    self.assertNotEqual(user.tenant, tenant2)
```

### 7.4 Cobertura Recomendada

**Mínimo:** 80% de cobertura para:
- ✅ Adapters (SocialAccountAdapter, AccountAdapter)
- ✅ Services (autenticação, associação de tenant)
- ✅ Views (callbacks OAuth)
- ✅ Middleware (identificação de tenant)

**Ferramentas:**
- `pytest` + `pytest-django`
- `coverage.py` para medir cobertura
- `factory_boy` para fixtures

**Fontes Consultadas:**
- [Django Testing Best Practices](https://docs.djangoproject.com/en/5.0/topics/testing/)
- [pytest-django Documentation](https://pytest-django.readthedocs.io/)

---

## 8. Performance e Escalabilidade

### 8.1 Impacto na Performance

**Gargalos Identificados:**

1. **Chamadas Externas aos Providers:**
   - Latência de rede (100-500ms por chamada)
   - Dependência de disponibilidade do provider

2. **Validação de Tokens:**
   - Verificação de assinatura JWT
   - Consultas ao banco de dados

3. **Criação de Usuários:**
   - Inserções no banco
   - Validações e signals

### 8.2 Otimizações

**1. Cache de Tokens:**
```python
# backend/apps/accounts/services.py
from django.core.cache import cache

def get_cached_user_data(provider, access_token):
    cache_key = f'social_user_data:{provider}:{hashlib.sha256(access_token.encode()).hexdigest()}'
    cached_data = cache.get(cache_key)

    if cached_data:
        return cached_data

    # Buscar do provider
    user_data = fetch_from_provider(provider, access_token)

    # Cachear por 5 minutos
    cache.set(cache_key, user_data, timeout=300)
    return user_data
```

**2. Processamento Assíncrono:**
```python
# backend/apps/accounts/tasks.py
from celery import shared_task

@shared_task
def sync_user_profile(user_id, provider, access_token):
    """Sincroniza perfil do usuário de forma assíncrona."""
    user = User.objects.get(id=user_id)
    user_data = fetch_from_provider(provider, access_token)
    # Atualizar perfil do usuário
    update_user_profile(user, user_data)
```

**3. Connection Pooling:**
```python
# Usar requests.Session para reutilizar conexões
import requests

session = requests.Session()
adapter = requests.adapters.HTTPAdapter(
    pool_connections=10,
    pool_maxsize=20
)
session.mount('https://', adapter)
```

### 8.3 Considerações para Alta Escala

**Horizontal Scaling:**
- Usar Redis para cache compartilhado
- Session storage em Redis (não em banco)
- Load balancer com sticky sessions (se necessário)

**Database Optimization:**
- Índices em `tenant_id` (já implementado em TenantModel)
- Índices em `email` para busca rápida
- Considerar read replicas para queries de leitura

**Monitoring:**
- Métricas de latência de OAuth callbacks
- Taxa de sucesso/falha de autenticação
- Tempo de resposta de providers externos

**Fontes Consultadas:**
- [Django Performance Best Practices](https://docs.djangoproject.com/en/5.0/topics/performance/)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/cache/)

---

## 9. Guia de Implementação Prático

### 9.1 Passo a Passo

**Fase 1: Instalação e Configuração Base**

```bash
# 1. Instalar dependências
pip install django-allauth dj-rest-auth djangorestframework-simplejwt

# 2. Adicionar ao INSTALLED_APPS
# (ver seção 3.2)

# 3. Executar migrations
python manage.py migrate

# 4. Criar superuser (se necessário)
python manage.py createsuperuser
```

**Fase 2: Configurar Provider (Google como exemplo)**

```bash
# 1. Criar projeto no Google Cloud Console
# 2. Obter Client ID e Secret
# 3. Configurar redirect URI: http://localhost:8000/api/auth/google/callback/

# 4. Adicionar credenciais ao settings.py
GOOGLE_CLIENT_ID = env('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = env('GOOGLE_CLIENT_SECRET')

# 5. Ou criar SocialApp via admin Django
python manage.py shell
>>> from django.contrib.sites.models import Site
>>> from allauth.socialaccount.models import SocialApp
>>> site = Site.objects.get_current()
>>> app = SocialApp.objects.create(
...     provider='google',
...     name='Google',
...     client_id='YOUR_CLIENT_ID',
...     secret='YOUR_SECRET',
... )
>>> app.sites.add(site)
```

**Fase 3: Implementar Multi-Tenancy**

```python
# 1. Criar adapter customizado
# backend/apps/accounts/adapters.py
# (ver seção 2.1)

# 2. Configurar adapter no settings.py
SOCIALACCOUNT_ADAPTER = 'apps.accounts.adapters.TenantSocialAccountAdapter'

# 3. Testar fluxo completo
```

**Fase 4: Integrar com Frontend**

```typescript
// 1. Criar componente de login social
// 2. Implementar callback handler
// 3. Armazenar JWT
// 4. Usar JWT em requisições API
```

### 9.2 Checklist de Implementação

- [ ] Dependências instaladas
- [ ] Migrations executadas
- [ ] Provider configurado (Google/GitHub/Microsoft)
- [ ] Credenciais OAuth obtidas e configuradas
- [ ] Adapter customizado implementado
- [ ] Middleware de tenant funcionando
- [ ] URLs configuradas
- [ ] Frontend integrado
- [ ] Testes escritos (cobertura >80%)
- [ ] Segurança implementada (PKCE, state validation)
- [ ] LGPD/GDPR compliance (consentimento, direito ao esquecimento)
- [ ] Documentação atualizada

### 9.3 Troubleshooting Comum

**Problema:** "Redirect URI mismatch"
- **Solução:** Verificar redirect URIs configurados no provider e no Django

**Problema:** "Tenant não identificado no callback"
- **Solução:** Garantir que state parameter inclui tenant_id e é validado corretamente

**Problema:** "Usuário criado sem tenant"
- **Solução:** Verificar que SocialAccountAdapter está associando tenant corretamente

**Problema:** "JWT não sendo gerado"
- **Solução:** Verificar configuração do dj-rest-auth e djangorestframework-simplejwt

---

## 🔍 Análise Crítica

### Padrões Emergentes

1. **django-allauth como Padrão de Mercado:**
   - Consenso entre fontes: django-allauth é a solução mais madura e recomendada
   - Comunidade ativa e atualizações regulares
   - Suporte oficial a Django 6.0 demonstra manutenção ativa

2. **JWT para SPAs:**
   - Tendência clara: JWT é preferido sobre sessions para SPAs
   - Stateless authentication facilita escalabilidade
   - Cookies HTTP-only recomendados para armazenamento seguro

3. **PKCE como Padrão de Segurança:**
   - OWASP 2024-2025 recomenda PKCE para todos os fluxos OAuth
   - Substitui Implicit Flow (deprecated)
   - Reduz risco de code interception

### Contradições Identificadas

1. **Session vs JWT:**
   - Algumas fontes recomendam sessions para segurança (CSRF protection nativa)
   - Outras recomendam JWT para escalabilidade (stateless)
   - **Resolução:** JWT com cookies HTTP-only oferece melhor equilíbrio

2. **Multi-Tenancy: Email Único vs Múltiplo:**
   - Algumas implementações permitem mesmo email em múltiplos tenants
   - Outras bloqueiam (isolamento estrito)
   - **Resolução:** Depende do caso de uso - para MicroSaaS, permitir múltiplo é mais flexível

### Gaps de Informação

1. **Performance em Alta Escala:**
   - Poucos dados sobre performance de django-allauth com milhões de usuários
   - Recomendação: Implementar cache e monitoramento desde o início

2. **Testes E2E:**
   - Documentação limitada sobre como testar fluxos OAuth completos
   - Recomendação: Usar mocks para desenvolvimento, testes reais apenas em staging

3. **Rate Limiting:**
   - Pouca discussão sobre rate limiting em endpoints OAuth
   - Recomendação: Implementar throttling no DRF para prevenir abuse

### Dados Mais Recentes vs. Históricos

- ✅ **Dados Recentes (2024-2025):**
  - django-allauth 65.13.1 com suporte Django 6.0 (nov 2025)
  - CVE-2025-61783 em social-auth-app-django (corrigida)
  - OWASP Top 10 2021 (ainda atual em 2024-2025)
  - Práticas de segurança OAuth2 atualizadas (PKCE obrigatório)

- ⚠️ **Dados Desatualizados Encontrados:**
  - Algumas fontes mencionam Implicit Flow (deprecated)
  - Referências a versões antigas de bibliotecas
  - **Ação:** Priorizar fontes de 2024-2025, validar informações com documentação oficial

---

## 📚 Fontes Consultadas (Bibliografia Completa)

1. **[django-allauth Documentation](https://allauth.org/)**
   *Snippet*: Documentação oficial do django-allauth com guias de instalação, configuração e customização.

2. **[django-allauth no DjangoMatrix](https://www.djangomatrix.com/packages/django-allauth/)**
   *Snippet*: Análise comparativa de pacotes Django, incluindo django-allauth com informações sobre manutenção e comunidade.

3. **[social-auth-app-django no PyPI](https://pypi.org/project/social-auth-app-django/)**
   *Snippet*: Página do PyPI com informações sobre versões, dependências e estatísticas de uso.

4. **[CVE-2025-61783 - Vulnerabilidade social-auth-app-django](https://security.snyk.io/vuln/SNYK-PYTHON-SOCIALAUTHAPPDJANGO-13512562)**
   *Snippet*: Detalhes sobre vulnerabilidade de segurança corrigida na versão 5.6.0 do social-auth-app-django.

5. **[API Security in Django: Approaches, Trade-offs, and Best Practices](https://dev.to/topunix/api-security-in-django-approaches-trade-offs-and-best-practices-nk4)**
   *Snippet*: Artigo sobre práticas de segurança em APIs Django, incluindo autenticação JWT e OAuth2.

6. **[Best Practices Using multi-tenant SaaS apps in 2025 and beyond](https://umatechnology.org/best-practices-using-multi-tenant-saas-apps-in-2025-and-beyond/)**
   *Snippet*: Guia de melhores práticas para aplicações SaaS multi-tenant em 2025.

7. **[Django Tenant-Specific Migrations Guide](https://www.codingeasypeasy.com/blog/django-tenant-specific-migrations-a-comprehensive-guide-to-managing-database-changes-in-multi-tenant-applications)**
   *Snippet*: Guia completo sobre gerenciamento de migrations em aplicações Django multi-tenant.

8. **[Adding Social Authentication to Django | TestDriven.io](https://testdriven.io/blog/django-social-auth/)**
   *Snippet*: Tutorial prático sobre como adicionar autenticação social em projetos Django.

9. **[What are the Best Solutions for OpenID with Django? - GeeksforGeeks](https://www.geeksforgeeks.org/what-are-the-best-solutions-for-openid-with-django/)**
   *Snippet*: Comparação de soluções para OpenID/OAuth em Django, incluindo django-allauth e alternativas.

10. **[How do you design auth & RBAC in Django with providers?](https://wild.codes/candidate-toolkit-question/how-do-you-design-auth-rbac-in-django-with-providers)**
    *Snippet*: Discussão sobre design de autenticação e autorização em Django com provedores sociais.

11. **[Django Social Authentication - Compile N Run](https://www.compilenrun.com/docs/framework/django/django-authentication/django-social-authentication/)**
    *Snippet*: Documentação sobre autenticação social em Django, incluindo exemplos de código.

12. **[Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)**
    *Snippet*: Documentação oficial do Google sobre implementação de OAuth 2.0.

13. **[GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)**
    *Snippet*: Guia oficial do GitHub para autorização de aplicações OAuth.

14. **[Microsoft Identity Platform Documentation](https://learn.microsoft.com/en-us/azure/active-directory/develop/)**
    *Snippet*: Documentação da Microsoft sobre plataforma de identidade e autenticação OAuth2/OIDC.

15. **[OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)**
    *Snippet*: Lista das 10 principais vulnerabilidades de segurança em aplicações web, atualizada em 2021 e ainda relevante em 2024-2025.

16. **[LGPD - Lei Geral de Proteção de Dados](https://www.gov.br/secretariageral/pt-br/lgpd)**
    *Snippet*: Legislação brasileira sobre proteção de dados pessoais, equivalente ao GDPR.

17. **[GDPR - General Data Protection Regulation](https://gdpr-info.eu/)**
    *Snippet*: Regulamentação europeia sobre proteção de dados pessoais.

18. **[dj-rest-auth GitHub](https://github.com/iMerica/dj-rest-auth)**
    *Snippet*: Repositório GitHub do dj-rest-auth, biblioteca para integração de django-allauth com DRF.

---

## 🎯 Próximos Passos de Research

- [ ] Pesquisar implementações específicas de PKCE em django-allauth
- [ ] Avaliar alternativas modernas a dj-rest-auth (se houver)
- [ ] Investigar rate limiting strategies para endpoints OAuth
- [ ] Pesquisar casos de uso reais de social auth em MicroSaaS multi-tenant
- [ ] Avaliar impacto de performance de cache de tokens em alta escala
- [ ] Investigar melhores práticas de logging e auditoria para OAuth

---

## 📈 Elementos Visuais Sugeridos

- **Diagrama de Fluxo OAuth:** Mostrar fluxo completo de autenticação social com multi-tenancy
- **Arquitetura de Componentes:** Diagrama mostrando interação entre Frontend, Backend, Providers e Database
- **Tabela Comparativa de Bibliotecas:** Visualização das características de cada biblioteca
- **Timeline de Implementação:** Passos e fases de implementação

---

## 📁 Relatório Salvo

Este relatório foi salvo automaticamente em:
**`docs/research/2024-12-23-social-authentication-django5-drf-multi-tenancy.md`**

Você pode acessá-lo a qualquer momento para referência futura.




