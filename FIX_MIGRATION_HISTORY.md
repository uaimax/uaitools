# 🔧 Correção de Histórico de Migrations Inconsistente

## Problema

Erro ao executar `./dev-start.sh`:
```
django.db.migrations.exceptions.InconsistentMigrationHistory: 
Migration core.0002_add_notifications is applied before its dependency 
bau_mental.0001_initial on database 'default'.
```

## Causa

O histórico de migrations está inconsistente:
- `core.0002_add_notifications` está marcada como aplicada no banco
- Mas depende de `bau_mental.0001_initial` que não está aplicada
- Isso geralmente acontece após renomeações ou mudanças no banco

## Soluções Implementadas

### 1. Script Automático: `fix-migration-history.sh`

Script dedicado para corrigir o histórico:

```bash
./fix-migration-history.sh
```

**O que faz:**
1. Detecta o problema de histórico inconsistente
2. Marca migrations do `bau_mental` (0001-0009) como aplicadas (fake)
3. Aplica migrations restantes
4. Verifica que tudo está correto

### 2. Correção Automática no `dev-start.sh`

O `dev-start.sh` agora detecta e tenta corrigir automaticamente:

1. Tenta aplicar migrations normalmente
2. Se detectar erro de histórico inconsistente:
   - Marca migrations do `bau_mental` como aplicadas (fake)
   - Tenta aplicar novamente
3. Se não conseguir corrigir automaticamente:
   - Mostra mensagem para executar `./fix-migration-history.sh`

## Como Usar

### Opção 1: Correção Automática (Recomendado)

Simplesmente execute:
```bash
./dev-start.sh --restart
```

O script tentará corrigir automaticamente se detectar o problema.

### Opção 2: Correção Manual

Se a correção automática não funcionar:

```bash
./fix-migration-history.sh
```

### Opção 3: Reset Completo (Desenvolvimento)

Se estiver em ambiente de desenvolvimento e não se importar em perder dados:

```bash
cd backend
source venv/bin/activate
python reset_db.py
```

Isso reseta o banco completamente e aplica todas as migrations do zero.

## Verificação

Após corrigir, verifique que não há mais erros:

```bash
cd backend
source venv/bin/activate
python manage.py showmigrations
```

Todas as migrations devem estar marcadas com `[X]` (aplicadas).

## Prevenção

O `dev-start.sh` agora:
- ✅ Aplica migrations no `setup_backend()`
- ✅ Verifica migrations antes de iniciar o servidor
- ✅ Aplica migrations no contexto tmux antes do `runserver`
- ✅ Detecta e corrige histórico inconsistente automaticamente

## Notas

- A correção automática só funciona em ambiente de desenvolvimento
- Em produção, use o script `fix-migration-history.sh` com cuidado
- Sempre faça backup antes de corrigir migrations em produção
