#!/bin/bash
# Script para criar migrations do SupBrainNote

cd "$(dirname "$0")"

echo "📦 Criando migrations para SupBrainNote..."
python manage.py makemigrations supbrainnote

if [ $? -eq 0 ]; then
    echo "✅ Migrations criadas com sucesso!"
    echo ""
    echo "📋 Para aplicar as migrations, execute:"
    echo "   python manage.py migrate"
else
    echo "❌ Erro ao criar migrations"
    exit 1
fi



