#!/bin/bash
# Script simplificado de validação

set -e

cd "$(dirname "$0")/backend"

echo "🔍 Validação Rápida da Renomeação..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Ativar venv
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado${NC}"
    exit 1
fi

source venv/bin/activate

# 1. Verificar se app está registrado
echo "1️⃣  Verificando app registrado..."
python manage.py check 2>&1 | grep -i "bau_mental" > /dev/null && echo -e "${GREEN}✅ App bau_mental registrado${NC}" || { echo -e "${RED}❌ App não encontrado${NC}"; ERRORS=$((ERRORS+1)); }

# 2. Verificar imports
echo "2️⃣  Verificando imports..."
python -c "from apps.bau_mental.models import Box, Note; print('OK')" 2>&1 | grep -q "OK" && echo -e "${GREEN}✅ Imports OK${NC}" || { echo -e "${RED}❌ Erro nos imports${NC}"; ERRORS=$((ERRORS+1)); }

# 3. Verificar URLs
echo "3️⃣  Verificando URLs..."
python manage.py show_urls 2>&1 | grep -q "bau-mental" && echo -e "${GREEN}✅ URLs OK${NC}" || echo -e "${YELLOW}⚠️  URLs não verificadas (show_urls pode não estar disponível)${NC}"

# 4. Verificar referências antigas
echo "4️⃣  Verificando referências antigas..."
OLD_REFS=$(grep -r "apps\.bau_mental\|from apps\.bau_mental" --include="*.py" . 2>/dev/null | grep -v "__pycache__" | grep -v ".pyc" | grep -v "migrations/0002" | wc -l)
if [ "$OLD_REFS" -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhuma referência antiga encontrada${NC}"
else
    echo -e "${YELLOW}⚠️  $OLD_REFS referências antigas encontradas (pode ser normal em migrations antigas)${NC}"
fi

# 5. Verificar migrations
echo "5️⃣  Verificando migrations..."
if [ -f "apps/bau_mental/migrations/0010_rename_app_tables.py" ]; then
    echo -e "${GREEN}✅ Migration de renomeação existe${NC}"
else
    echo -e "${RED}❌ Migration de renomeação não encontrada${NC}"
    ERRORS=$((ERRORS+1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Validação básica OK!${NC}"
    echo ""
    echo "Para aplicar migrations, execute:"
    echo "  ./fix-migrations.sh"
    exit 0
else
    echo -e "${RED}❌ Validação falhou com $ERRORS erro(s)${NC}"
    exit 1
fi
