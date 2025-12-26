# Compliance LGPD - Sistema de Auditoria

## 📋 Visão Geral

Este sistema implementa auditoria completa para compliance com a **Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)**.

### Requisitos LGPD Atendidos

✅ **Registra TODAS mudanças a dados pessoais**
✅ **Rastreia QUEM (user_id) + QUANDO (timestamp) + O QUÊ (values)**
✅ **Mantém audit trail 1-3 anos** (configurável)
✅ **Demonstrável em caso de ANPD audit**
✅ **Evita multas de até BRL 50 milhões por infração**

## 🔍 Como Funciona

### 1. Captura Automática

O sistema usa **Django Signals** para capturar automaticamente:
- Criação de registros com dados pessoais
- Atualização de campos com dados pessoais
- Exclusão de registros com dados pessoais

### 2. Identificação de Dados Pessoais

Campos identificados automaticamente como dados pessoais:
- `email`
- `cpf`
- `phone` / `telefone`
- `name` / `nome`
- `address` / `endereco`
- `birth_date` / `data_nascimento`

**Para adicionar novos campos**, edite `apps/core/audit.py` na lista `personal_data_fields`.

### 3. Rastreamento de Usuário

O middleware `TenantMiddleware` rastreia automaticamente:
- **QUEM**: Usuário autenticado (`request.user`)
- **QUANDO**: Timestamp automático (`created_at`)
- **O QUÊ**: Valores antigos e novos (`old_value`, `new_value`)
- **ONDE**: IP e User-Agent (quando disponível)

## 📊 Model AuditLog

### Campos Principais

```python
- tenant: Tenant que fez a mudança
- user: Usuário que fez a mudança
- action: create, update, delete, view
- model_name: Nome do model alterado
- object_id: ID do objeto alterado
- field_name: Campo alterado
- old_value: Valor antigo
- new_value: Valor novo
- is_personal_data: Se é dado pessoal (LGPD)
- data_subject: Titular dos dados (email)
- ip_address: IP do usuário
- user_agent: User-Agent do navegador
- created_at: Data/hora da mudança
```

### Índices para Performance

- `tenant + created_at` - Consultas por tenant e período
- `tenant + is_personal_data + created_at` - Dados pessoais por tenant
- `model_name + object_id` - Histórico de um objeto
- `data_subject + created_at` - Histórico de um titular

## 🔐 Acesso aos Logs

### Admin Django

Acesse `/manage/audit/` (ou seu `ADMIN_URL_PREFIX`) para visualizar logs.

**Filtros disponíveis:**
- Por ação (create, update, delete)
- Por dados pessoais (LGPD)
- Por model
- Por data

### API REST

```bash
# Listar todos os logs
GET /api/audit/logs/

# Filtrar por dados pessoais
GET /api/audit/logs/?is_personal_data=true

# Filtrar por ação
GET /api/audit/logs/?action=update

# Filtrar por model
GET /api/audit/logs/?model_name=Lead

# Filtrar por titular
GET /api/audit/logs/?data_subject=user@example.com

# Buscar
GET /api/audit/logs/?search=email
```

## 📝 Exemplo de Uso

### Criar Lead (gera log automaticamente)

```python
from apps.leads.models import Lead

lead = Lead.objects.create(
    tenant=tenant,
    name="John Doe",      # Dado pessoal - gera log
    email="john@example.com",  # Dado pessoal - gera log
    status="new"
)

# Logs criados automaticamente:
# - create | name | new_value="John Doe" | is_personal_data=True
# - create | email | new_value="john@example.com" | is_personal_data=True
```

### Atualizar Lead (gera log automaticamente)

```python
lead.email = "newemail@example.com"
lead.save()

# Log criado automaticamente:
# - update | email | old_value="john@example.com" | new_value="newemail@example.com" | is_personal_data=True
```

## 🗄️ Retenção de Dados (OBRIGATÓRIO LGPD)

### Política de Retenção

A política de retenção é **OBRIGATÓRIA** para compliance LGPD e está configurada via variável de ambiente:

```bash
# .env
AUDIT_LOG_RETENTION_DAYS=1095  # 3 anos (recomendado)
```

### Requisitos Legais

- **Mínimo Legal LGPD**: 365 dias (1 ano)
- **Recomendado**: 1095 dias (3 anos)
- **Máximo**: Conforme política da empresa

⚠️ **IMPORTANTE**: O sistema valida que a retenção seja no mínimo 365 dias. Valores menores geram warning.

### Configuração

1. **Defina no `.env`**:
```bash
AUDIT_LOG_RETENTION_DAYS=1095  # 3 anos
```

2. **Verifique no settings**:
```python
# backend/config/settings/base.py
AUDIT_LOG_RETENTION_DAYS = int(os.environ.get("AUDIT_LOG_RETENTION_DAYS", "1095"))
```

### Comando de Limpeza

O comando `cleanup_audit_logs` remove automaticamente logs mais antigos que a política:

```bash
# Executar limpeza
python manage.py cleanup_audit_logs

# Simular sem deletar (dry-run)
python manage.py cleanup_audit_logs --dry-run

# Override temporário (ex: 2 anos)
python manage.py cleanup_audit_logs --days 730
```

### Automação (Cron)

Execute periodicamente para manter compliance:

```bash
# Adicionar ao crontab (executa todo domingo às 2h)
0 2 * * 0 cd /path/to/project/backend && source venv/bin/activate && python manage.py cleanup_audit_logs >> /var/log/audit_cleanup.log 2>&1
```

### Monitoramento

O comando exibe estatísticas:
- Quantidade de logs removidos
- Logs restantes
- Espaço estimado liberado
- Data de corte aplicada

### Backup Antes de Limpar

⚠️ **CRÍTICO**: Faça backup antes de executar limpeza:

```bash
# Backup antes de limpar
python manage.py dumpdata core.AuditLog --output audit_logs_backup.json

# Executar limpeza
python manage.py cleanup_audit_logs

# Verificar
python manage.py shell -c "from apps.core.models import AuditLog; print(AuditLog.objects.count())"
```

## 🚨 Importante para Compliance

### 1. NUNCA Deletar Logs Manualmente

Logs de auditoria são **imutáveis** e **críticos para compliance**.
Apenas superusers podem deletar (com muito cuidado!).

### 2. Backup Regular

Faça backup regular da tabela `core_auditlog`:
- Diário para logs recentes
- Semanal para logs antigos
- Mensal para arquivo permanente

### 3. Monitoramento

Monitore o crescimento da tabela:
- Alerta se > 1M registros
- Planeje limpeza/arquivamento

### 4. Documentação

Mantenha documentado:
- Política de retenção
- Processo de limpeza
- Acesso aos logs
- Procedimentos para auditoria ANPD

## 📋 Checklist de Compliance

- [x] Sistema de auditoria implementado
- [x] Captura automática de mudanças
- [x] Rastreamento de usuário
- [x] Identificação de dados pessoais
- [x] Extração de titular dos dados
- [x] Índices para performance
- [x] API para consulta
- [x] Admin para visualização
- [ ] Política de retenção definida
- [ ] Comando de limpeza implementado
- [ ] Backup configurado
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

## 🔗 Referências

- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - Autoridade Nacional de Proteção de Dados](https://www.gov.br/anpd/pt-br)
- [Guia de Boas Práticas LGPD](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-guia-de-boas-praticas-para-protecao-de-dados-pessoais)

