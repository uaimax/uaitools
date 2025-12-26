# Autenticação Social (OAuth2/OIDC)

Este documento descreve como configurar e usar autenticação social no SaaS Bootstrap.

## Visão Geral

O projeto suporta autenticação social via OAuth2/OIDC usando `django-allauth` e `dj-rest-auth`. Os providers são configurados via variáveis de ambiente e apenas os providers configurados aparecem como opções de login no frontend.

## Arquitetura

```
Frontend (React) → Backend (Django) → Provider OAuth (Google/GitHub/etc) → Backend → Frontend (com JWT)
```

1. Usuário clica em botão de login social no frontend
2. Frontend redireciona para endpoint OAuth do backend com `state` contendo `tenant_slug`
3. Backend redireciona para provider OAuth
4. Usuário autentica no provider
5. Provider redireciona de volta para backend
6. Backend processa callback, associa usuário ao tenant, gera JWT
7. Backend redireciona para frontend com token JWT
8. Frontend armazena token e redireciona para dashboard

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env` (opcional - apenas se quiser ativar providers):

**⚠️ Importante:** Após configurar as variáveis de ambiente, execute `python manage.py sync_social_apps` para criar os SocialApps automaticamente.

```bash
# Social Auth Providers (opcional)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GITHUB_CLIENT_ID=seu_github_client_id
GITHUB_CLIENT_SECRET=seu_github_client_secret
MICROSOFT_CLIENT_ID=seu_microsoft_client_id
MICROSOFT_CLIENT_SECRET=seu_microsoft_client_secret
MICROSOFT_TENANT_ID=common  # common, organizations, consumers
INSTAGRAM_CLIENT_ID=seu_instagram_app_id
INSTAGRAM_CLIENT_SECRET=seu_instagram_app_secret
LINKEDIN_CLIENT_ID=seu_linkedin_client_id
LINKEDIN_CLIENT_SECRET=seu_linkedin_client_secret
```

### 2. Configurar Providers

#### Google OAuth2

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Vá em "APIs & Services" > "Credentials"
4. Clique em "Create Credentials" > "OAuth client ID"
5. Configure:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8000/api/auth/social/google/callback/` (dev) ou sua URL de produção
6. Copie o Client ID e Client Secret para o `.env`

#### GitHub OAuth2

1. Acesse [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Clique em "New OAuth App"
3. Configure:
   - Application name: Nome da sua aplicação
   - Homepage URL: URL da sua aplicação
   - Authorization callback URL: `http://localhost:8000/api/auth/social/github/callback/` (dev) ou sua URL de produção
4. Copie o Client ID e Client Secret para o `.env`

#### Microsoft (Azure AD) OAuth2

1. Acesse [Azure Portal](https://portal.azure.com/)
2. Vá em "Azure Active Directory" > "App registrations"
3. Clique em "New registration"
4. Configure:
   - Name: Nome da aplicação
   - Supported account types: Escolha conforme necessário
     - "Accounts in any organizational directory and personal Microsoft accounts" (common)
     - "Accounts in any organizational directory" (organizations)
     - "Personal Microsoft accounts only" (consumers)
   - Redirect URI: `http://localhost:8000/api/auth/social/microsoft/callback/` (dev) ou sua URL de produção
5. Vá em "Certificates & secrets" e crie um novo client secret
6. Copie o Application (client) ID e o secret para o `.env`
7. Configure `MICROSOFT_TENANT_ID` no `.env`:
   - `common`: Permite qualquer conta Microsoft (padrão)
   - `organizations`: Apenas contas corporativas
   - `consumers`: Apenas contas pessoais

**Variáveis de ambiente:**
```bash
MICROSOFT_CLIENT_ID=seu_microsoft_client_id
MICROSOFT_CLIENT_SECRET=seu_microsoft_client_secret
MICROSOFT_TENANT_ID=common  # ou organizations, consumers
```

#### Instagram OAuth2

**⚠️ Importante:** Instagram Basic Display API requer aprovação do Facebook e tem limitações. Para produção, considere usar Facebook Login que inclui Instagram.

1. Acesse [Facebook Developers](https://developers.facebook.com/)
2. Crie um novo app ou selecione um existente
3. Adicione o produto "Instagram Basic Display"
4. Configure:
   - Valid OAuth Redirect URIs: `http://localhost:8000/api/auth/social/instagram/callback/` (dev) ou sua URL de produção
5. Vá em "Settings" > "Basic" e copie o App ID e App Secret
6. Configure as permissões necessárias (user_profile, user_media)
7. Adicione ao `.env`:
   ```bash
   INSTAGRAM_CLIENT_ID=seu_instagram_app_id
   INSTAGRAM_CLIENT_SECRET=seu_instagram_app_secret
   ```

**Nota:** Instagram Basic Display API é principalmente para exibir conteúdo do Instagram, não para autenticação completa. Para login social robusto, considere usar Facebook Login.

#### LinkedIn OAuth2

1. Acesse [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Crie um novo app
3. Configure:
   - App name: Nome da aplicação
   - LinkedIn Page: Página da empresa (opcional)
   - Privacy policy URL: URL da política de privacidade
   - App logo: Logo da aplicação
4. Vá em "Auth" e configure:
   - Redirect URLs: `http://localhost:8000/api/auth/social/linkedin_oauth2/callback/` (dev) ou sua URL de produção
   - Products: Selecione "Sign In with LinkedIn using OpenID Connect"
5. Vá em "Auth" > "Products" e solicite acesso aos produtos necessários
6. Copie o Client ID e Client Secret para o `.env`:
   ```bash
   LINKEDIN_CLIENT_ID=seu_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=seu_linkedin_client_secret
   ```

**Permissões (Scopes):**
- `r_liteprofile`: Informações básicas do perfil (deprecated, use OpenID Connect)
- `r_emailaddress`: Endereço de email
- `openid`: OpenID Connect (recomendado)
- `profile`: Informações do perfil (OpenID Connect)
- `email`: Email (OpenID Connect)

**Nota:** LinkedIn migrou para OpenID Connect. O provider `linkedin_oauth2` do django-allauth suporta ambos os formatos.

### 3. Sincronizar SocialApps a partir de Variáveis de Ambiente

Após configurar as variáveis de ambiente, você pode criar os SocialApps automaticamente usando o comando de sincronização:

```bash
python manage.py sync_social_apps
```

Este comando:
- Cria SocialApps para todos os providers com variáveis de ambiente configuradas
- Atualiza SocialApps existentes se as credenciais mudaram
- Associa os SocialApps ao site atual
- Ativa os SocialApps automaticamente

**Alternativa: Criar manualmente no Django Admin**

Se preferir criar manualmente:

1. Acesse o Django Admin: `http://localhost:8000/manage/`
2. Vá em "Social Accounts" > "Social applications"
3. Clique em "Add social application"
4. Configure:
   - Provider: Selecione o provider (Google, GitHub, Microsoft, etc.)
   - Name: Nome descritivo (ex: "Google OAuth")
   - Client id: Cole o valor da variável de ambiente
   - Secret key: Cole o valor da variável de ambiente
   - Sites: Selecione o site atual (geralmente "example.com")
5. Salve

**Recomendação:** Use o comando `sync_social_apps` para automatizar e manter sincronizado com as variáveis de ambiente.

## Multi-Tenancy

O sistema automaticamente associa usuários sociais aos tenants corretos:

1. **Via Header `X-Tenant-ID`**: Se o header estiver presente na requisição
2. **Via State Parameter**: O `state` do OAuth inclui `tenant_slug` que é extraído durante o callback

O adapter `TenantSocialAccountAdapter` garante que:
- Usuários sejam associados ao tenant correto
- Usuários existentes sejam validados (não podem acessar tenant diferente)
- Novos usuários sejam criados com o tenant correto

## Fluxo de Autenticação

### Frontend

1. Usuário clica em botão de login social
2. `SocialButton` chama `initiateSocialLogin(provider, tenantSlug)`
3. Frontend redireciona para `/api/auth/social/{provider}/login/?state={encoded_state}`
4. Após callback, frontend recebe token JWT via query parameter
5. Token é armazenado em `localStorage` como `access_token`
6. Token é incluído automaticamente em requisições via interceptor do axios

### Backend

1. `TenantMiddleware` identifica tenant do header ou state
2. `TenantSocialAccountAdapter` associa usuário ao tenant
3. `oauth_callback_view` gera JWT e redireciona para frontend

## Endpoints

### GET `/api/auth/providers/`

Retorna lista de providers sociais configurados e ativos.

**Resposta:**
```json
{
  "providers": [
    {
      "provider": "google",
      "name": "Google"
    },
    {
      "provider": "github",
      "name": "GitHub"
    }
  ]
}
```

### GET `/api/auth/social/{provider}/login/`

Inicia o fluxo OAuth com o provider especificado.

**Query Parameters:**
- `state`: Base64 encoded JSON com `tenant_slug` e `nonce`

### GET `/api/auth/social/{provider}/callback/`

Callback do provider OAuth (gerenciado pelo django-allauth).

### GET `/api/auth/social/callback/`

Callback customizado que gera JWT e redireciona para frontend.

## Segurança

### State Parameter

O `state` parameter inclui:
- `tenant_slug`: Slug do tenant para associar o usuário
- `nonce`: UUID único para prevenir replay attacks

O nonce é validado e armazenado em cache por 10 minutos.

### JWT Tokens

- Tokens são gerados usando `djangorestframework-simplejwt`
- Access tokens são incluídos no header `Authorization: Bearer {token}`
- Tokens são armazenados no frontend (localStorage) - considere usar cookies HTTP-only em produção

### Validação de Tenant

- Usuários existentes não podem acessar tenants diferentes
- Novos usuários são sempre associados ao tenant correto
- Validação ocorre no `TenantSocialAccountAdapter`

## Troubleshooting

### Botões de login social não aparecem

**Causa:** Nenhum provider está configurado.

**Solução:**
1. Verifique se as variáveis de ambiente estão configuradas
2. Verifique se o SocialApp foi criado no Django Admin
3. Verifique se o SocialApp está ativo e associado ao site correto

### Erro "Tenant não encontrado"

**Causa:** O `tenant_slug` no state parameter não corresponde a um tenant ativo.

**Solução:**
1. Verifique se o tenant existe e está ativo
2. Verifique se o `tenant_slug` está correto no state parameter

### Erro "Redirect URI mismatch"

**Causa:** A redirect URI configurada no provider não corresponde à URL do callback.

**Solução:**
1. Verifique a redirect URI configurada no provider (Google/GitHub/Microsoft)
2. Deve ser: `http://localhost:8000/api/auth/social/{provider}/callback/` (dev)
3. Ou: `https://seu-dominio.com/api/auth/social/{provider}/callback/` (prod)

### Token JWT não é gerado

**Causa:** Problema na configuração do `djangorestframework-simplejwt` ou usuário não autenticado.

**Solução:**
1. Verifique se `rest_framework_simplejwt` está instalado
2. Verifique se o usuário foi autenticado corretamente pelo django-allauth
3. Verifique os logs do servidor para erros

### Usuário criado sem tenant

**Causa:** O adapter não conseguiu identificar o tenant.

**Solução:**
1. Verifique se o `TenantMiddleware` está funcionando
2. Verifique se o state parameter inclui `tenant_slug`
3. Verifique os logs do adapter

## Providers Configurados

O projeto já está preparado para os seguintes providers:

- ✅ **Google** - Configurado e pronto
- ✅ **GitHub** - Configurado e pronto
- ✅ **Microsoft (Azure AD)** - Configurado e pronto
- ✅ **Instagram** - Configurado e pronto
- ✅ **LinkedIn** - Configurado e pronto

Todos os providers estão no `INSTALLED_APPS` e têm ícones no `SocialButton`. Basta configurar as credenciais e criar o SocialApp no Django Admin.

## Adicionar Novo Provider

Para adicionar um novo provider:

1. Adicione o provider ao `INSTALLED_APPS` em `backend/config/settings/base.py`:
   ```python
   'allauth.socialaccount.providers.novoprovider',
   ```

2. Adicione variáveis de ambiente (opcional):
   ```python
   NOVOPROVIDER_CLIENT_ID = os.environ.get('NOVOPROVIDER_CLIENT_ID', '')
   NOVOPROVIDER_CLIENT_SECRET = os.environ.get('NOVOPROVIDER_CLIENT_SECRET', '')
   ```

3. Adicione ícone no `SocialButton` (`frontend/src/components/ui/social-button.tsx`)

4. Adicione configuração específica em `SOCIALACCOUNT_PROVIDERS` se necessário

5. Crie SocialApp no Django Admin

6. Configure o provider no console do provedor

## Referências

- [django-allauth Documentation](https://allauth.org/)
- [dj-rest-auth Documentation](https://dj-rest-auth.readthedocs.io/)
- [djangorestframework-simplejwt](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Pesquisa Completa: Social Authentication](docs/research/2024-12-23-social-authentication-django5-drf-multi-tenancy.md)

