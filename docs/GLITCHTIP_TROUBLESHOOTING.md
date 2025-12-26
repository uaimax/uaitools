# Troubleshooting GlitchTip - ERR_BLOCKED_BY_CLIENT

## Problema

Você está vendo o erro `ERR_BLOCKED_BY_CLIENT` ao tentar enviar logs para o GlitchTip.

## Causa

Este erro geralmente ocorre quando:
1. **Bloqueador de anúncios** (AdBlock, uBlock Origin, etc) está bloqueando requisições para `glitchtip.com`
2. **Extensões de privacidade** estão bloqueando trackers
3. **Configurações de segurança do navegador** estão bloqueando requisições

## Solução Automática

O sistema já tem **fallback automático** implementado:
- Quando detecta bloqueio, automaticamente desabilita Sentry/GlitchTip
- Passa a usar o **banco de dados** como destino dos logs
- Funciona transparentemente sem interrupção

## Como Verificar

### 1. Verificar se está usando fallback

Abra o console do navegador e procure por:
```
⚠️ GlitchTip bloqueado por extensão do navegador, usando fallback para banco
```

Se aparecer, o sistema já está usando o banco automaticamente.

### 2. Desabilitar bloqueador temporariamente

Para testar o GlitchTip:
1. Desabilite temporariamente o bloqueador de anúncios
2. Recarregue a página
3. Os logs devem ir para o GlitchTip

### 3. Adicionar exceção no bloqueador

Se quiser usar GlitchTip com bloqueador ativo:
1. Adicione `*.glitchtip.com` à lista de exceções
2. Recarregue a página

## Verificar Logs no Banco

Se o GlitchTip estiver bloqueado, os logs estão sendo salvos no banco:

```bash
# Backend - Ver logs recentes
cd backend
source venv/bin/activate
python manage.py shell

>>> from apps.core.models import ApplicationLog
>>> ApplicationLog.objects.filter(source='frontend').order_by('-created_at')[:10]
```

## Configuração Recomendada

### Para Desenvolvimento
- Use o **banco de dados** (mais simples, sem bloqueios)
- Configure: `USE_SENTRY=false` no backend

### Para Produção
- Use **GlitchTip** (melhor para análise)
- Configure exceções no bloqueador se necessário
- Ou use **self-hosted GlitchTip** (não é bloqueado)

## Alternativas

1. **Self-hosted GlitchTip**: Não é bloqueado por extensões
2. **Banco de dados**: Sempre funciona, sem bloqueios
3. **Sentry SaaS**: Geralmente não é bloqueado (domínio diferente)

## Status Atual

O sistema está configurado para:
- ✅ Detectar bloqueios automaticamente
- ✅ Fazer fallback para banco quando bloqueado
- ✅ Continuar funcionando mesmo com bloqueador ativo

**Conclusão**: Mesmo com bloqueador, os logs estão sendo salvos no banco! ✅



