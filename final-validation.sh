#!/bin/bash
# Script final de validação e aplicação de migrations

set -e

cd "$(dirname "$0")/backend"

echo "🎯 Validação Final e Aplicação de Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0

# Ativar venv
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado${NC}"
    exit 1
fi

source venv/bin/activate

echo -e "${BLUE}1️⃣  Verificando configuração do Django...${NC}"
python manage.py check > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Django check passou${NC}"
else
    echo -e "${RED}   ❌ Django check falhou${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""
echo -e "${BLUE}2️⃣  Verificando imports...${NC}"
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev'); import django; django.setup(); from apps.bau_mental.models import Box, Note; print('OK')" 2>&1 | grep -q "OK" && echo -e "${GREEN}   ✅ Imports OK${NC}" || { echo -e "${RED}   ❌ Erro nos imports${NC}"; ERRORS=$((ERRORS+1)); }

echo ""
echo -e "${BLUE}3️⃣  Verificando URLs...${NC}"
URL_TEST=$(python manage.py shell -c "from django.urls import reverse; print(reverse('api_v1:bau_mental:box-list'))" 2>&1 | grep -v "CSRF\|CORS\|objects imported" | tail -1)
if [[ "$URL_TEST" == *"/api/v1/bau-mental/boxes/"* ]]; then
    echo -e "${GREEN}   ✅ URLs OK: $URL_TEST${NC}"
else
    echo -e "${RED}   ❌ Erro nas URLs: $URL_TEST${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""
echo -e "${BLUE}4️⃣  Verificando migrations...${NC}"
if [ -f "apps/bau_mental/migrations/0010_rename_app_tables.py" ]; then
    echo -e "${GREEN}   ✅ Migration de renomeação existe${NC}"
else
    echo -e "${RED}   ❌ Migration de renomeação não encontrada${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""
if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Validação falhou com $ERRORS erro(s)${NC}"
    echo ""
    echo "Corrija os erros antes de continuar."
    exit 1
fi

echo -e "${GREEN}✅ Validação básica passou!${NC}"
echo ""

# Verificar se precisa aplicar migrations
echo -e "${BLUE}5️⃣  Verificando estado das migrations...${NC}"
MIGRATION_STATUS=$(python manage.py showmigrations bau_mental 2>&1 | tail -5)

if echo "$MIGRATION_STATUS" | grep -q "\[ \]"; then
    echo -e "${YELLOW}   ⚠️  Há migrations pendentes${NC}"
    echo ""
    echo "$MIGRATION_STATUS"
    echo ""
    echo -e "${YELLOW}⚠️  Para aplicar migrations, execute:${NC}"
    echo "   ./fix-migrations.sh"
    echo ""
    echo "Ou manualmente:"
    echo "   python manage.py migrate bau_mental --fake 0001 0002 0003 0004 0005 0006 0007 0008 0009"
    echo "   python manage.py migrate bau_mental 0010_rename_app_tables"
else
    echo -e "${GREEN}   ✅ Todas as migrations estão aplicadas${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Validação completa!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Se há migrations pendentes, execute: ./fix-migrations.sh"
echo "  2. Teste os endpoints: curl http://localhost:8000/api/v1/bau-mental/boxes/"
echo "  3. Teste o frontend: http://localhost:5173/bau-mental"
