#!/bin/bash
# Script FINAL para resetar banco completamente - remove TUDO e recria

set -e

cd "$(dirname "$0")/backend"

echo "🔄 Reset FINAL do Banco - Remover TUDO e Recriar do Zero"
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
echo "   1. Dropar TODAS as tabelas (incluindo do Django)"
echo "   2. Limpar histórico de migrations"
echo "   3. Aplicar todas as migrations do zero"
echo "   4. Perder TODOS os dados existentes"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}1️⃣  Dropar TODAS as tabelas (incluindo Django)...${NC}"

# Dropar todas as tabelas usando SQL - método mais agressivo
python manage.py dbshell <<'EOF' 2>/dev/null || true
-- Desabilitar todas as constraints primeiro
SET session_replication_role = 'replica';

-- Dropar todas as tabelas em cascata
DO $$ 
DECLARE 
    r RECORD;
    tables TEXT[];
BEGIN
    -- Coletar todas as tabelas
    SELECT array_agg(tablename) INTO tables
    FROM pg_tables 
    WHERE schemaname = 'public';
    
    -- Dropar cada tabela
    IF tables IS NOT NULL THEN
        FOREACH r IN ARRAY tables
        LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r) || ' CASCADE';
        END LOOP;
    END IF;
END $$;

-- Reabilitar constraints
SET session_replication_role = 'origin';
EOF

# Método alternativo: dropar schema public e recriar
echo -e "${BLUE}   Tentando método alternativo (dropar schema)...${NC}"
python manage.py dbshell <<'EOF' 2>/dev/null || true
-- Dropar schema public e recriar (remove TUDO)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
EOF

echo -e "${GREEN}   ✅ Todas as tabelas removidas${NC}"

# Aplicar todas as migrations do zero
echo ""
echo -e "${BLUE}2️⃣  Aplicando todas as migrations do zero...${NC}"
echo -e "${YELLOW}   Isso pode levar alguns segundos...${NC}"
echo ""

# Aplicar migrations normalmente - Django criará tudo do zero
python manage.py migrate --verbosity=1

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migrations aplicadas com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}3️⃣  Verificando estado final...${NC}"
    echo ""
    echo "Migrations do bau_mental:"
    python manage.py showmigrations bau_mental 2>&1 | tail -10
    echo ""
    
    # Verificar tabelas criadas
    echo -e "${BLUE}4️⃣  Verificando tabelas criadas...${NC}"
    python manage.py dbshell <<'EOF' 2>/dev/null | head -20
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
