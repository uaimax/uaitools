#!/bin/bash
# Script para executar testes e validar mudanças

set -e  # Para em caso de erro

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

cd "$BACKEND_DIR"

# Ativar virtualenv se existir
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Executar pytest
echo "🧪 Executando testes..."
pytest "$@"

# Retorna exit code do pytest
exit $?




