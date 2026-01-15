#!/bin/bash
# Script completo para corrigir todos os problemas e aplicar migrations

set -e

cd "$(dirname "$0")/backend"

echo "🔧 Script Completo de Correção e Aplicação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ativar venv
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado${NC}"
    exit 1
fi

source venv/bin/activate

# 1. Verificar Django
echo -e "${BLUE}1️⃣  Verificando Django...${NC}"
python manage.py check > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Django OK${NC}"
else
    echo -e "${RED}   ❌ Django check falhou${NC}"
    python manage.py check
    exit 1
fi

# 2. Verificar imports
echo ""
echo -e "${BLUE}2️⃣  Verificando imports...${NC}"
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev'); import django; django.setup(); from apps.bau_mental.models import Box, Note; print('OK')" 2>&1 | grep -q "OK" && echo -e "${GREEN}   ✅ Imports OK${NC}" || { echo -e "${RED}   ❌ Erro nos imports${NC}"; exit 1; }

# 3. Verificar se há migrations pendentes
echo ""
echo -e "${BLUE}3️⃣  Verificando migrations...${NC}"
MIGRATIONS_TO_FAKE=(
    "0001_initial"
    "0002_alter_box_id_alter_note_id"
    "0003_alter_note_audio_file"
    "0004_alter_note_audio_file"
    "0005_add_fulltext_search"
    "0006_add_forwarded_source_type"
    "0007_add_note_tracking"
    "0008_add_box_sharing"
    "0009_remove_note_note_transcript_gin_idx_and_more"
)

echo "   Marcando migrations antigas como aplicadas (fake)..."
for mig in "${MIGRATIONS_TO_FAKE[@]}"; do
    python manage.py migrate bau_mental $mig --fake 2>&1 | grep -v "Operations to perform" | grep -v "Running migrations" | grep -q "OK" && echo -e "   ${GREEN}✅${NC} $mig" || echo -e "   ${YELLOW}⚠️${NC}  $mig (pode já estar aplicada)"
done

# 4. Aplicar migration de renomeação
echo ""
echo -e "${BLUE}4️⃣  Aplicando migration de renomeação...${NC}"
echo -e "${YELLOW}   ⚠️  Isso vai renomear as tabelas no banco!${NC}"
echo ""
read -p "   Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}   Operação cancelada.${NC}"
    echo ""
    echo "   Para aplicar depois, execute:"
    echo "   python manage.py migrate bau_mental 0010_rename_app_tables"
    exit 0
fi

python manage.py migrate bau_mental 0010_rename_app_tables --verbosity=1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Migration aplicada!${NC}"
else
    echo -e "${RED}   ❌ Erro ao aplicar migration${NC}"
    exit 1
fi

# 5. Verificar resultado
echo ""
echo -e "${BLUE}5️⃣  Verificando resultado...${NC}"
python manage.py showmigrations bau_mental 2>&1 | tail -3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Processo concluído!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Teste os endpoints: curl http://localhost:8000/api/v1/bau-mental/boxes/"
echo "  2. Teste o frontend: http://localhost:5173/bau-mental"
echo "  3. Execute os testes: python manage.py test apps.bau_mental"
