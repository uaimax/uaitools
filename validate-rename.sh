#!/bin/bash
# Script de validação completa da renomeação bau_mental → bau_mental

set -e  # Parar em caso de erro

cd "$(dirname "$0")/backend"

echo "🔍 Validando renomeação bau_mental → bau_mental..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Função para verificar erros
check_error() {
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ ERRO: $1${NC}"
        ERRORS=$((ERRORS + 1))
        return 1
    else
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    fi
}

# Função para verificar warnings
check_warning() {
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  AVISO: $1${NC}"
        WARNINGS=$((WARNINGS + 1))
        return 1
    else
        return 0
    fi
}

# 1. Verificar se venv existe
echo "1️⃣  Verificando ambiente..."
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado. Execute ./dev-start.sh primeiro${NC}"
    exit 1
fi

# Ativar venv
source venv/bin/activate
check_error "Venv ativado"

# 2. Verificar imports Python
echo ""
echo "2️⃣  Verificando imports Python..."
PYTHON_ERRORS=$(python -c "
import sys
sys.path.insert(0, '.')
try:
    from apps.bau_mental import models, viewsets, serializers
    from apps.bau_mental.models import Box, Note
    from apps.bau_mental.viewsets import BoxViewSet, NoteViewSet
    print('OK')
except ImportError as e:
    print(f'ERRO: {e}')
    sys.exit(1)
" 2>&1)

if [ "$PYTHON_ERRORS" != "OK" ]; then
    echo -e "${RED}❌ Erro nos imports: $PYTHON_ERRORS${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Imports Python OK${NC}"
fi

# 3. Verificar se há referências antigas no código
echo ""
echo "3️⃣  Verificando referências antigas..."
OLD_REFS=$(grep -r "apps\.bau_mental\|bau_mental\." --include="*.py" . 2>/dev/null | grep -v "__pycache__" | grep -v ".pyc" | grep -v "migrations/0002_alter_box_id_alter_note_id.py" | head -20)

if [ -n "$OLD_REFS" ]; then
    echo -e "${YELLOW}⚠️  Referências antigas encontradas:${NC}"
    echo "$OLD_REFS"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Nenhuma referência antiga encontrada${NC}"
fi

# 4. Verificar migrations
echo ""
echo "4️⃣  Verificando migrations..."
python manage.py makemigrations --check --dry-run > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations estão atualizadas${NC}"
else
    echo -e "${YELLOW}⚠️  Há migrations pendentes (isso é normal após renomeação)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# 5. Verificar estrutura de migrations
echo ""
echo "5️⃣  Verificando estrutura de migrations..."
if [ -f "apps/bau_mental/migrations/0010_rename_app_tables.py" ]; then
    echo -e "${GREEN}✅ Migration de renomeação de tabelas existe${NC}"
else
    echo -e "${RED}❌ Migration de renomeação de tabelas não encontrada${NC}"
    ERRORS=$((ERRORS + 1))
fi

# 6. Testar sintaxe Python
echo ""
echo "6️⃣  Verificando sintaxe Python..."
find apps/bau_mental -name "*.py" -not -path "*/migrations/*" -not -path "*/__pycache__/*" | while read file; do
    python -m py_compile "$file" 2>&1
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro de sintaxe em: $file${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Sintaxe Python OK${NC}"
fi

# 7. Verificar URLs
echo ""
echo "7️⃣  Verificando URLs..."
URL_CHECK=$(python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()
from django.urls import reverse
try:
    # Tentar resolver URLs do novo app
    reverse('bau_mental:box-list')
    reverse('bau_mental:note-list')
    print('OK')
except Exception as e:
    print(f'ERRO: {e}')
    exit(1)
" 2>&1)

if [ "$URL_CHECK" != "OK" ]; then
    echo -e "${RED}❌ Erro nas URLs: $URL_CHECK${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ URLs OK${NC}"
fi

# 8. Verificar se tabelas antigas existem (se banco estiver configurado)
echo ""
echo "8️⃣  Verificando banco de dados..."
DB_CHECK=$(python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()
from django.db import connection
try:
    with connection.cursor() as cursor:
        # Verificar se tabelas antigas ainda existem
        cursor.execute(\"\"\"
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'bau_mental_%'
        \"\"\")
        old_tables = cursor.fetchall()
        if old_tables:
            print(f'AVISO: {len(old_tables)} tabelas antigas ainda existem')
            for table in old_tables:
                print(f'  - {table[0]}')
        else:
            print('OK')
except Exception as e:
    # Se não conseguir conectar, não é erro crítico
    print(f'INFO: Não foi possível verificar banco ({type(e).__name__})')
" 2>&1)

if [[ "$DB_CHECK" == *"AVISO"* ]]; then
    echo -e "${YELLOW}⚠️  $DB_CHECK${NC}"
    WARNINGS=$((WARNINGS + 1))
elif [[ "$DB_CHECK" == "OK" ]]; then
    echo -e "${GREEN}✅ Banco de dados OK (tabelas antigas não existem)${NC}"
else
    echo -e "${YELLOW}ℹ️  $DB_CHECK${NC}"
fi

# 9. Resumo
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Validação completa! Tudo OK.${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. Execute: python manage.py migrate"
    echo "  2. Teste os endpoints: /api/v1/bau-mental/boxes/"
    echo "  3. Teste o frontend: /bau-mental"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Validação concluída com $WARNINGS aviso(s)${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. Revise os avisos acima"
    echo "  2. Execute: python manage.py migrate"
    exit 0
else
    echo -e "${RED}❌ Validação falhou com $ERRORS erro(s) e $WARNINGS aviso(s)${NC}"
    echo ""
    echo "Corrija os erros antes de continuar."
    exit 1
fi
