#!/bin/bash
# Script final simplificado - valida e aplica correções

set -e

cd "$(dirname "$0")/backend"

echo "🎯 Validação e Correção Final"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado${NC}"
    exit 1
fi

source venv/bin/activate

# Testes básicos
echo "1. Django check..."
python manage.py check > /dev/null 2>&1 && echo -e "${GREEN}✅${NC}" || { echo -e "${RED}❌${NC}"; python manage.py check; exit 1; }

echo "2. Imports..."
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev'); import django; django.setup(); from apps.bau_mental.models import Box, Note" 2>&1 | grep -q "Traceback" && { echo -e "${RED}❌${NC}"; exit 1; } || echo -e "${GREEN}✅${NC}"

echo "3. URL resolution..."
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev'); import django; django.setup(); from django.urls import resolve; resolve('/api/v1/bau-mental/boxes/')" 2>&1 | grep -q "Traceback" && { echo -e "${RED}❌${NC}"; exit 1; } || echo -e "${GREEN}✅${NC}"

echo "4. Migration de renomeação..."
[ -f "apps/bau_mental/migrations/0010_rename_app_tables.py" ] && echo -e "${GREEN}✅${NC}" || { echo -e "${RED}❌${NC}"; exit 1; }

echo ""
echo -e "${GREEN}✅ Validação básica OK!${NC}"
echo ""
echo "Para aplicar migrations, execute:"
echo "  ./fix-all.sh"
echo ""
echo "Ou manualmente:"
echo "  python manage.py migrate bau_mental --fake 0001 0002 0003 0004 0005 0006 0007 0008 0009"
echo "  python manage.py migrate bau_mental 0010_rename_app_tables"
