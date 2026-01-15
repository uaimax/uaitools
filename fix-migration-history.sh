#!/bin/bash
# Script para corrigir histórico de migrations inconsistente
# Resolve o erro: "Migration X is applied before its dependency Y"

set -e

cd "$(dirname "$0")/backend"

echo "🔧 Corrigindo Histórico de Migrations Inconsistente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ ! -d "venv" ]; then
    echo -e "${RED}❌ Venv não encontrado. Execute ./dev-start.sh primeiro${NC}"
    exit 1
fi

source venv/bin/activate

# Carregar .env se existir
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    load_env_safe() {
        local env_file="$1"
        if [ ! -f "$env_file" ]; then
            return 1
        fi
        python3 -c "
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

env_file = Path('$env_file')
if env_file.exists():
    load_dotenv(env_file, override=True)
    with open(env_file, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip()
                if (value.startswith(\"'\") and value.endswith(\"'\")) or (value.startswith('\"') and value.endswith('\"')):
                    value = value[1:-1]
                value_escaped = value.replace(\"'\", \"'\"'\"'\"'\")
                print(f\"export {key}='{value_escaped}'\")
"
    }
    eval "$(load_env_safe "$SCRIPT_DIR/.env")"
fi

echo -e "${YELLOW}⚠️  Este script vai corrigir o histórico de migrations inconsistente${NC}"
echo "   Isso pode ser necessário após renomeações ou mudanças no banco"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}1️⃣  Verificando estado atual...${NC}"

# Verificar se há migrations do bau_mental não aplicadas
BAU_MENTAL_PENDING=$(python manage.py showmigrations bau_mental 2>&1 | grep -c "\[ \]" || echo "0")
CORE_0002_APPLIED=$(python manage.py showmigrations core 2>&1 | grep "0002_add_notifications" | grep -c "\[X\]" || echo "0")

echo "   Migrations pendentes do bau_mental: $BAU_MENTAL_PENDING"
echo "   core.0002_add_notifications aplicada: $CORE_0002_APPLIED"
echo ""

if [ "$CORE_0002_APPLIED" -gt 0 ] && [ "$BAU_MENTAL_PENDING" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  Detectado: core.0002 aplicada mas bau_mental.0001 não${NC}"
    echo -e "${YELLOW}   Isso causa o erro de histórico inconsistente${NC}"
    echo ""
    
    echo -e "${BLUE}2️⃣  Corrigindo histórico...${NC}"
    echo -e "${YELLOW}   Marcando migrations do bau_mental como aplicadas (fake)...${NC}"
    
    # Lista de migrations do bau_mental para marcar como aplicadas
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
        echo -n "   Marcando bau_mental.$mig... "
        python manage.py migrate bau_mental $mig --fake 2>&1 | grep -E "No migrations|OK|Faked" > /dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${YELLOW}já aplicada${NC}"
    done
    
    echo ""
    echo -e "${GREEN}   ✅ Histórico corrigido${NC}"
    echo ""
    
    echo -e "${BLUE}3️⃣  Aplicando migrations restantes...${NC}"
    python manage.py migrate --noinput
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Migrations aplicadas com sucesso!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Erro ao aplicar migrations${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}   ✅ Histórico parece consistente${NC}"
    echo ""
    echo -e "${BLUE}2️⃣  Aplicando migrations pendentes...${NC}"
    python manage.py migrate --noinput
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Migrations aplicadas com sucesso!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Erro ao aplicar migrations${NC}"
        echo ""
        echo -e "${YELLOW}💡 Se o erro persistir, tente resetar o banco:${NC}"
        echo "   python reset_db.py"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}4️⃣  Verificando estado final...${NC}"
PENDING=$(python manage.py showmigrations --plan 2>/dev/null | grep -c "\[ \]" || echo "0")

if [ "$PENDING" -gt 0 ]; then
    echo -e "${YELLOW}   ⚠️  Ainda há $PENDING migrations pendentes${NC}"
    python manage.py showmigrations --plan | grep "\[ \]"
else
    echo -e "${GREEN}   ✅ Todas as migrations estão aplicadas${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Processo concluído!${NC}"
echo ""
