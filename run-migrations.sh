#!/bin/bash
# Script para rodar migrations do bau_mental de forma segura

set -e  # Parar em caso de erro

cd "$(dirname "$0")/backend"

echo "🔄 Executando migrations do bau_mental..."
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

# 1. Verificar estado atual das migrations
echo "1️⃣  Verificando estado das migrations..."
python manage.py showmigrations bau_mental | tail -5
echo ""

# 2. Criar migrations se necessário
echo "2️⃣  Criando migrations se necessário..."
python manage.py makemigrations bau_mental --dry-run > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Criando novas migrations...${NC}"
    python manage.py makemigrations bau_mental
else
    echo -e "${GREEN}✅ Nenhuma migration pendente${NC}"
fi
echo ""

# 3. Aplicar migrations
echo "3️⃣  Aplicando migrations..."
echo -e "${YELLOW}⚠️  ATENÇÃO: Isso vai renomear as tabelas do banco de dados!${NC}"
echo -e "${YELLOW}⚠️  Certifique-se de ter backup antes de continuar.${NC}"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada pelo usuário.${NC}"
    exit 0
fi

# Aplicar migrations
python manage.py migrate bau_mental --verbosity=2

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migrations aplicadas com sucesso!${NC}"
    echo ""
    echo "4️⃣  Verificando tabelas no banco..."
    python manage.py dbshell <<EOF 2>/dev/null | grep -E "bau_mental|bau_mental" || true
\dt bau_mental*
\dt bau_mental*
EOF
    echo ""
    echo -e "${GREEN}✅ Processo concluído!${NC}"
else
    echo ""
    echo -e "${RED}❌ Erro ao aplicar migrations${NC}"
    exit 1
fi
