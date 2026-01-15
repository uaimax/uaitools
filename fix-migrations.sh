#!/bin/bash
# Script para corrigir histórico de migrations após renomeação

set -e

cd "$(dirname "$0")/backend"

echo "🔧 Corrigindo histórico de migrations após renomeação..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar se venv existe
if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado. Execute ./dev-start.sh primeiro${NC}"
    exit 1
fi

# Ativar venv
source venv/bin/activate

# Verificar estado atual
echo "1️⃣  Verificando estado atual das migrations..."
echo ""
echo "Migrations do bau_mental:"
python manage.py showmigrations bau_mental 2>&1 | grep -E "\[X\]|\[ \]" | head -15 || true
echo ""

# Verificar se há tabelas antigas
echo "2️⃣  Verificando tabelas no banco..."
TABLES=$(python manage.py dbshell <<EOF 2>/dev/null | grep -E "bau_mental|bau_mental" || true
\dt bau_mental*
\dt bau_mental*
EOF
)

if [ -n "$TABLES" ]; then
    echo "$TABLES"
    echo ""
    HAS_OLD_TABLES=$(echo "$TABLES" | grep "bau_mental" || true)
    if [ -n "$HAS_OLD_TABLES" ]; then
        echo -e "${YELLOW}⚠️  Tabelas antigas (bau_mental_*) ainda existem${NC}"
        echo -e "${YELLOW}⚠️  A migration 0010 vai renomeá-las${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  Não foi possível verificar tabelas (banco pode não estar configurado)${NC}"
fi
echo ""

# Solução: Marcar migrations antigas como aplicadas (fake)
echo "3️⃣  Marcando migrations antigas como aplicadas (fake)..."
echo -e "${YELLOW}⚠️  Isso marca as migrations 0001-0009 como aplicadas${NC}"
echo -e "${YELLOW}⚠️  porque elas já foram aplicadas como 'bau_mental'${NC}"
echo ""

# Lista de migrations para marcar como aplicadas
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
    echo -n "  Marcando bau_mental.$mig... "
    python manage.py migrate bau_mental $mig --fake 2>&1 | grep -v "Operations to perform" | grep -v "Running migrations" | grep -v "OK" || echo "OK"
done

echo ""
echo -e "${GREEN}✅ Migrations antigas marcadas como aplicadas${NC}"
echo ""

# Agora aplicar a migration de renomeação
echo "4️⃣  Aplicando migration de renomeação de tabelas (0010)..."
echo -e "${YELLOW}⚠️  ATENÇÃO: Isso vai renomear as tabelas no banco!${NC}"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada. Execute manualmente:${NC}"
    echo "  python manage.py migrate bau_mental 0010_rename_app_tables"
    exit 0
fi

python manage.py migrate bau_mental 0010_rename_app_tables --verbosity=2

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration de renomeação aplicada com sucesso!${NC}"
    echo ""
    echo "5️⃣  Verificando resultado..."
    python manage.py showmigrations bau_mental 2>&1 | tail -5
    echo ""
    echo -e "${GREEN}✅ Processo concluído!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. Teste os endpoints: /api/v1/bau-mental/boxes/"
    echo "  2. Teste o frontend: /bau-mental"
else
    echo ""
    echo -e "${RED}❌ Erro ao aplicar migration${NC}"
    exit 1
fi
