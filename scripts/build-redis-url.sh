#!/bin/bash
# Script helper para construir URL do Redis com senha
# Uso: ./scripts/build-redis-url.sh SENHA HOSTNAME PORTA DB_NUMBER

if [ $# -lt 4 ]; then
    echo "Uso: $0 SENHA HOSTNAME PORTA DB_NUMBER"
    echo ""
    echo "Exemplo:"
    echo "  $0 minhasenha123 srv-captain--redis 6379 0"
    echo ""
    echo "Isso gerará:"
    echo "  redis://:minhasenha123@srv-captain--redis:6379/0"
    exit 1
fi

PASSWORD="$1"
HOSTNAME="$2"
PORT="$3"
DB="$4"

# URL encode da senha (caracteres especiais comuns)
ENCODED_PASSWORD=$(echo "$PASSWORD" | sed 's/@/%40/g; s/#/%23/g; s/\$/%24/g; s/%/%25/g; s/&/%26/g; s/+/%2B/g; s/=/%3D/g; s/?/%3F/g; s/\//%2F/g; s/:/%3A/g')

echo "redis://:${ENCODED_PASSWORD}@${HOSTNAME}:${PORT}/${DB}"

