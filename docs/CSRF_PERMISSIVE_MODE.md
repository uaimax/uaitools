# 🔧 Modo CSRF Permissivo (TEMPORÁRIO)

## ⚠️ AVISO

Este é um **modo temporário** para permitir testar o sistema sem configurar `CSRF_TRUSTED_ORIGINS`. **É menos seguro** e deve ser removido assim que possível.

## Como Funciona

Quando `ALLOWED_HOSTS=*` está configurado e `CSRF_TRUSTED_ORIGINS` não está configurado (ou está vazio), o sistema automaticamente:

1. **Ativa modo permissivo**: Substitui o middleware CSRF padrão por `PermissiveCsrfMiddleware`
2. **Permite qualquer origem HTTPS**: Aceita requisições de qualquer origem que use HTTPS
3. **Mantém validação de token**: Ainda valida o token CSRF, apenas não verifica a origem

## Configuração

### Para Ativar Modo Permissivo

**Remova** a variável de ambiente `CSRF_TRUSTED_ORIGINS` e mantenha:
```
ALLOWED_HOSTS=*
```

### Para Desativar (Recomendado)

Configure `CSRF_TRUSTED_ORIGINS` adequadamente:
```
ALLOWED_HOSTS=*
CSRF_TRUSTED_ORIGINS=https://ut-be.app.webmaxdigital.com
```

Quando `CSRF_TRUSTED_ORIGINS` estiver configurado, o modo permissivo é **automaticamente desativado**.

## Logs

Quando o modo permissivo está ativo, você verá nos logs:

```
[CSRF] ⚠️  ALLOWED_HOSTS=* detectado - modo permissivo ativado (TEMPORÁRIO)
[CSRF] ⚠️  Desabilitando verificação de origem CSRF (menos seguro)
[CSRF] ⚠️  Ativando middleware CSRF permissivo (TEMPORÁRIO)
[CSRF] ⚠️  MIDDLEWARE atualizado: CsrfViewMiddleware → PermissiveCsrfMiddleware
```

## Segurança

### O que ainda é validado:
- ✅ Token CSRF (ainda é obrigatório)
- ✅ Cookies de sessão
- ✅ Autenticação

### O que não é validado (modo permissivo):
- ❌ Origem da requisição (qualquer origem HTTPS é aceita)

## Remover Modo Permissivo

Quando estiver pronto para usar configuração adequada:

1. Configure `CSRF_TRUSTED_ORIGINS` no CapRover
2. Faça redeploy
3. O modo permissivo será automaticamente desativado

## Arquivos Envolvidos

- `backend/config/settings/prod.py` - Lógica de ativação do modo permissivo
- `backend/apps/core/middleware/csrf_permissive.py` - Middleware permissivo
- `backend/apps/core/middleware/__init__.py` - Exporta o middleware

## TODO

- [ ] Configurar `CSRF_TRUSTED_ORIGINS` adequadamente
- [ ] Remover modo permissivo após configuração
- [ ] Remover `csrf_permissive.py` quando não for mais necessário

