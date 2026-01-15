#!/bin/bash
# Script para resetar banco de dados e aplicar todas as migrations do zero

set -e

cd "$(dirname "$0")/backend"

echo "🔄 Resetando Banco de Dados e Aplicando Migrations"
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

echo -e "${YELLOW}⚠️  ATENÇÃO: Este script vai:${NC}"
echo "   1. Deletar TODAS as tabelas do banco de dados"
echo "   2. Aplicar todas as migrations do zero"
echo "   3. Perder TODOS os dados existentes"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}1️⃣  Resetando banco de dados...${NC}"

# Dropar todas as tabelas
python manage.py dbshell <<EOF 2>/dev/null || true
-- Dropar todas as tabelas em cascata
DO \$\$ 
DECLARE 
    r RECORD;
BEGIN
    -- Desabilitar triggers temporariamente
    SET session_replication_role = 'replica';
    
    -- Dropar todas as tabelas
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Reabilitar triggers
    SET session_replication_role = 'origin';
END \$\$;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Tabelas removidas${NC}"
else
    echo -e "${YELLOW}   ⚠️  Erro ao dropar tabelas (pode ser que não existam)${NC}"
fi

# Limpar histórico de migrations
echo ""
echo -e "${BLUE}2️⃣  Limpando histórico de migrations...${NC}"
python manage.py dbshell <<EOF 2>/dev/null || true
DELETE FROM django_migrations;
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✅ Histórico de migrations limpo${NC}"
else
    echo -e "${YELLOW}   ⚠️  Tabela django_migrations pode não existir ainda${NC}"
fi

# Aplicar todas as migrations do zero
echo ""
echo -e "${BLUE}3️⃣  Aplicando todas as migrations do zero...${NC}"
python manage.py migrate --verbosity=2

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migrations aplicadas com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}4️⃣  Verificando estado final...${NC}"
    python manage.py showmigrations bau_mental 2>&1 | tail -5
    echo ""
    
    # Verificar tabelas criadas
    echo -e "${BLUE}5️⃣  Verificando tabelas criadas...${NC}"
    python manage.py dbshell <<EOF 2>/dev/null | grep -E "bau_mental|bau_mental" || true
\dt bau_mental*
\dt bau_mental*
EOF
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ Processo concluído!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. Teste os endpoints: curl http://localhost:8000/api/v1/bau-mental/boxes/"
    echo "  2. Teste o frontend: http://localhost:5173/bau-mental"
    echo "  3. Execute os testes: python manage.py test apps.bau_mental"
else
    echo ""
    echo -e "${RED}❌ Erro ao aplicar migrations${NC}"
    exit 1
fi
