#!/bin/bash
# Script para iniciar Celery Worker do bau_mental

cd "$(dirname "$0")/backend"

echo "🚀 Iniciando Celery Worker para bau_mental..."
echo ""

# Verificar se venv existe
if [ ! -d "venv" ]; then
    echo "❌ Venv não encontrado. Execute ./dev-start.sh primeiro"
    exit 1
fi

# Ativar venv
source venv/bin/activate

# Verificar Redis
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis não está rodando!"
    echo "💡 Inicie o Redis primeiro: redis-server"
    echo ""
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Verificar OPENAI_API_KEY
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY não está configurada!"
    echo "💡 Configure no arquivo .env do backend"
    echo ""
fi

echo "✅ Iniciando Celery Worker..."
echo "📌 Tasks disponíveis:"
echo "   - apps.bau_mental.tasks.transcribe_audio"
echo "   - apps.bau_mental.tasks.classify_note"
echo ""
echo "💡 Para parar: Ctrl+C"
echo ""

celery -A config worker -l info
