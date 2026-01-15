#!/bin/bash
# Script simples: flush + migrate (recomendado para banco local)

set -e

cd "$(dirname "$0")/backend"

echo "🔄 Reset e Migrations - Método Simples"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
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

echo -e "${YELLOW}⚠️  Este script vai limpar TODOS os dados e aplicar migrations${NC}"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}1️⃣  Limpando banco (flush)...${NC}"
python manage.py flush --no-input --verbosity=0
echo -e "${GREEN}   ✅ Banco limpo${NC}"

echo ""
echo -e "${BLUE}2️⃣  Aplicando migrations...${NC}"
python manage.py migrate --verbosity=1

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migrations aplicadas!${NC}"
    echo ""
    echo -e "${BLUE}3️⃣  Verificando...${NC}"
    python manage.py showmigrations bau_mental 2>&1 | tail -5
    echo ""
    echo -e "${GREEN}✅ Pronto!${NC}"
    echo ""
    echo "Teste: curl http://localhost:8000/api/v1/bau-mental/boxes/"
else
    echo -e "${RED}❌ Erro${NC}"
    exit 1
fi
