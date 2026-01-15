#!/bin/bash
# Script para resetar completamente o banco - limpa TUDO e recria do zero

set -e

cd "$(dirname "$0")/backend"

echo "🔄 Reset Completo do Banco - Limpar TUDO e Recriar"
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
echo "   1. Dropar TODAS as tabelas do banco"
echo "   2. Limpar COMPLETAMENTE o histórico de migrations"
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
echo -e "${BLUE}1️⃣  Dropar todas as tabelas...${NC}"

# Dropar todas as tabelas usando SQL direto
python manage.py dbshell <<'EOF' 2>/dev/null || true
-- Dropar todas as tabelas em cascata
DO $$ 
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
END $$;
EOF

echo -e "${GREEN}   ✅ Tabelas removidas${NC}"

# Limpar COMPLETAMENTE o histórico de migrations
echo ""
echo -e "${BLUE}2️⃣  Limpando COMPLETAMENTE o histórico de migrations...${NC}"
python manage.py dbshell <<'EOF' 2>/dev/null || true
-- Dropar tabela de migrations completamente
DROP TABLE IF EXISTS django_migrations CASCADE;
EOF

# Também limpar via Python para garantir
python <<'PYEOF'
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()
from django.db import connection
with connection.cursor() as cursor:
    cursor.execute("DROP TABLE IF EXISTS django_migrations CASCADE")
PYEOF

echo -e "${GREEN}   ✅ Histórico completamente limpo${NC}"

# Aplicar todas as migrations do zero
echo ""
echo -e "${BLUE}3️⃣  Aplicando todas as migrations do zero...${NC}"
echo -e "${YELLOW}   Isso pode levar alguns segundos...${NC}"
echo ""

# Primeiro criar a tabela django_migrations se não existir
python manage.py migrate --run-syncdb --verbosity=1

# Depois aplicar todas as migrations normalmente
python manage.py migrate --verbosity=1

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migrations aplicadas com sucesso!${NC}"
    echo ""
    echo -e "${BLUE}4️⃣  Verificando estado final...${NC}"
    echo ""
    echo "Migrations do bau_mental:"
    python manage.py showmigrations bau_mental 2>&1 | tail -10
    echo ""
    
    # Verificar tabelas criadas
    echo -e "${BLUE}5️⃣  Verificando tabelas criadas...${NC}"
    python manage.py dbshell <<'EOF' 2>/dev/null | grep -E "bau_mental|List of relations" || echo "   (Verificando...)"
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
