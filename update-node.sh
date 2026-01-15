#!/bin/bash
# Script para atualizar Node.js para versão compatível com Vite

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📦 Atualizando Node.js para versão compatível com Vite...${NC}"
echo ""

# Verificar se nvm já está instalado
if [ -d "$HOME/.nvm" ]; then
    echo -e "${GREEN}✅ NVM já está instalado${NC}"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    echo -e "${YELLOW}📥 Instalando NVM...${NC}"
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    echo -e "${GREEN}✅ NVM instalado${NC}"
fi

# Instalar Node.js LTS (22.x - compatível com Vite)
echo -e "${YELLOW}📥 Instalando Node.js LTS (22.x)...${NC}"
nvm install --lts
nvm use --lts
nvm alias default lts/*

echo ""
echo -e "${GREEN}✅ Node.js atualizado!${NC}"
echo -e "${BLUE}📊 Versão atual:${NC}"
node --version
npm --version

echo ""
echo -e "${YELLOW}💡 Para usar esta versão em novos terminais, adicione ao seu ~/.zshrc:${NC}"
echo -e "   ${BLUE}export NVM_DIR=\"\$HOME/.nvm\"${NC}"
echo -e "   ${BLUE}[ -s \"\$NVM_DIR/nvm.sh\" ] && \\. \"\$NVM_DIR/nvm.sh\"${NC}"
echo -e "   ${BLUE}[ -s \"\$NVM_DIR/bash_completion\" ] && \\. \"\$NVM_DIR/bash_completion\"${NC}"
