#!/bin/bash
# Script seguro para aplicar migrations após renomeação

set -e

cd "$(dirname "$0")/backend"

echo "🔄 Aplicando Migrations de Forma Segura"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado${NC}"
    exit 1
fi

source venv/bin/activate

# Verificar se banco existe
echo -e "${BLUE}1️⃣  Verificando banco de dados...${NC}"
python manage.py showmigrations bau_mental 2>&1 | head -5
echo ""

# Verificar se há tabelas antigas
echo -e "${BLUE}2️⃣  Verificando tabelas...${NC}"
HAS_OLD_TABLES=$(python manage.py dbshell <<EOF 2>/dev/null | grep "bau_mental" || true
\dt bau_mental*
EOF
)

if [ -n "$HAS_OLD_TABLES" ]; then
    echo -e "${YELLOW}   ⚠️  Tabelas antigas encontradas:${NC}"
    echo "$HAS_OLD_TABLES" | sed 's/^/      /'
    echo ""
    echo -e "${YELLOW}   A migration 0010 vai renomeá-las para bau_mental_*${NC}"
else
    echo -e "${GREEN}   ✅ Nenhuma tabela antiga encontrada${NC}"
    echo -e "${YELLOW}   ℹ️  Se o banco está vazio, as migrations serão aplicadas normalmente${NC}"
fi
echo ""

# Marcar migrations antigas como aplicadas
echo -e "${BLUE}3️⃣  Marcando migrations antigas como aplicadas (fake)...${NC}"
echo -e "${YELLOW}   Isso é necessário porque elas já foram aplicadas como 'bau_mental'${NC}"
echo ""

MIGRATIONS=(
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

for mig in "${MIGRATIONS[@]}"; do
    echo -n "   Marcando $mig... "
    python manage.py migrate bau_mental $mig --fake 2>&1 | grep -q "No migrations" && echo -e "${YELLOW}já aplicada${NC}" || echo -e "${GREEN}OK${NC}"
done

echo ""
echo -e "${BLUE}4️⃣  Aplicando migration de renomeação...${NC}"
echo -e "${YELLOW}   ⚠️  ATENÇÃO: Isso vai renomear as tabelas no banco!${NC}"
echo ""
read -p "   Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}   Operação cancelada.${NC}"
    exit 0
fi

python manage.py migrate bau_mental 0010_rename_app_tables --verbosity=2

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration aplicada com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}5️⃣  Verificando resultado...${NC}"
    python manage.py showmigrations bau_mental 2>&1 | tail -3
    echo ""
    echo -e "${GREEN}✅ Processo concluído!${NC}"
else
    echo ""
    echo -e "${RED}❌ Erro ao aplicar migration${NC}"
    echo ""
    echo "Possíveis causas:"
    echo "  - Tabelas antigas não existem (banco vazio)"
    echo "  - Migration já foi aplicada"
    echo "  - Erro de permissão no banco"
    exit 1
fi
