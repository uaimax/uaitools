#!/bin/bash
# Script para criar migrations do bau_mental

cd "$(dirname "$0")"

echo "📦 Criando migrations para bau_mental..."
python manage.py makemigrations bau_mental

if [ $? -eq 0 ]; then
    echo "✅ Migrations criadas com sucesso!"
    echo ""
    echo "📋 Para aplicar as migrations, execute:"
    echo "   python manage.py migrate"
else
    echo "❌ Erro ao criar migrations"
    exit 1
fi



