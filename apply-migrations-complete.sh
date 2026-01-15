#!/bin/bash
# Script FINAL para aplicar migrations após renomeação completa

set -e

cd "$(dirname "$0")/backend"

echo "🔄 Aplicando Migrations - bau_mental"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ ! -d "venv" ]; then
    echo "❌ Venv não encontrado"
    exit 1
fi

source venv/bin/activate

echo "⚠️  Este script vai resetar o banco e aplicar todas as migrations"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "1️⃣  Resetando banco..."
python reset_db.py

echo ""
echo "2️⃣  Verificando migrations..."
python manage.py showmigrations bau_mental 2>&1 | tail -12

echo ""
echo "3️⃣  Verificando tabelas..."
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()
from django.db import connection
cursor = connection.cursor()
cursor.execute(\"SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'bau_mental%' ORDER BY tablename\")
tables = cursor.fetchall()
print('Tabelas bau_mental:')
for table in tables:
    print(f'  ✅ {table[0]}')
" 2>&1 | grep -v "CSRF\|CORS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Processo concluído!"
echo ""
echo "Teste:"
echo "  curl http://localhost:8000/api/v1/bau-mental/boxes/"
