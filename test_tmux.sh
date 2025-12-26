#!/bin/bash
# Script de teste para diagnosticar problema do tmux

export TERM=xterm-256color

echo "=== Diagnóstico do TMUX ==="
echo "TERM: $TERM"
echo "UID: $(id -u)"
echo "User: $(whoami)"
echo ""

SOCKET_DIR="/tmp/tmux-$(id -u)"
SOCKET_PATH="$SOCKET_DIR/default"

echo "=== Verificando diretório do socket ==="
if [ ! -d "$SOCKET_DIR" ]; then
    echo "Criando diretório: $SOCKET_DIR"
    mkdir -p "$SOCKET_DIR"
    chmod 700 "$SOCKET_DIR"
fi
ls -ld "$SOCKET_DIR"
echo ""

echo "=== Removendo socket antigo ==="
rm -f "$SOCKET_PATH"
echo "Socket removido"
echo ""

echo "=== Tentando iniciar servidor tmux ==="
tmux -V
echo ""

echo "=== Teste 1: tmux start-server ==="
tmux start-server 2>&1
sleep 2
tmux list-sessions 2>&1
echo ""

echo "=== Teste 2: tmux new-session (deve iniciar servidor automaticamente) ==="
rm -f "$SOCKET_PATH"
tmux new-session -d -s test-diagnostic "echo 'test'" 2>&1
sleep 2
tmux list-sessions 2>&1
if tmux has-session -t test-diagnostic 2>/dev/null; then
    echo "✅ Sessão criada com sucesso!"
    tmux kill-session -t test-diagnostic 2>&1
else
    echo "❌ Falha ao criar sessão"
fi
echo ""

echo "=== Teste 3: Socket customizado ==="
CUSTOM_SOCKET="/tmp/tmux-test-$(id -u)"
rm -f "$CUSTOM_SOCKET"
tmux -S "$CUSTOM_SOCKET" new-session -d -s test-custom "echo 'test'" 2>&1
sleep 2
tmux -S "$CUSTOM_SOCKET" list-sessions 2>&1
if tmux -S "$CUSTOM_SOCKET" has-session -t test-custom 2>/dev/null; then
    echo "✅ Sessão com socket customizado criada!"
    tmux -S "$CUSTOM_SOCKET" kill-session -t test-custom 2>&1
    rm -f "$CUSTOM_SOCKET"
else
    echo "❌ Falha com socket customizado"
fi
echo ""

echo "=== Verificando processos tmux ==="
ps aux | grep -E "[t]mux" || echo "Nenhum processo tmux rodando"
echo ""

echo "=== Verificando socket ==="
ls -la "$SOCKET_PATH" 2>&1 || echo "Socket não existe"
echo ""

echo "=== Fim do diagnóstico ==="



