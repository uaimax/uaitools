#!/bin/bash
# Script FINAL para aplicar migrations em banco limpo

set -e

cd "$(dirname "$0")/backend"

echo "🔄 Aplicando Migrations em Banco Limpo"
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

echo "⚠️  Este script aplica migrations do zero"
echo "   Se o banco tiver dados, execute primeiro:"
echo "   python manage.py dbshell"
echo "   DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "Aplicando migrations..."
python manage.py migrate --verbosity=1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migrations aplicadas!"
    echo ""
    echo "Verificando bau_mental:"
    python manage.py showmigrations bau_mental 2>&1 | tail -5
    echo ""
    echo "✅ Pronto!"
else
    echo "❌ Erro"
    exit 1
fi
