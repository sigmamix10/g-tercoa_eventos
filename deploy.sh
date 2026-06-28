#!/usr/bin/env bash

# ==============================================================================
# Script de Deploy e Atualização Automática - G-TERCOA Eventos
# ==============================================================================

# Cores para formatação de logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Definir o diretório de destino
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}          SCRIPT DE DEPLOY AUTOMÁTICO - G-TERCOA EVENTOS              ${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "Diretório do Projeto: ${BOLD}${PROJECT_DIR}${NC}"
echo ""

cd "$PROJECT_DIR" || exit 1

# 1. Puxar alterações do GitHub
echo -e "${YELLOW}[1/4] Baixando alterações do GitHub...${NC}"

# Tenta liberar travas ou modificações locais em arquivos sob rastreamento para evitar conflito de merge
git status | grep -E "modified:|modificado:" &> /dev/null
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}Limpando modificações locais temporárias no código do servidor para evitar conflito...${NC}"
    git checkout .
fi

git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao fazer o git pull do GitHub! Verifique suas credenciais e permissões.${NC}"
    exit 1
fi
echo -e "${GREEN}Código atualizado com sucesso do repositório remoto!${NC}"

# 2. Atualizar dependências npm
echo -e "\n${YELLOW}[2/4] Atualizando dependências dos pacotes (npm install)...${NC}"
echo "Verificando backend..."
cd "$PROJECT_DIR/backend" || exit 1
npm install --no-audit --no-fund
if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao instalar dependências do backend!${NC}"
    exit 1
fi

echo "Verificando frontend..."
cd "$PROJECT_DIR/frontend" || exit 1
npm install --no-audit --no-fund
if [ $? -ne 0 ]; then
    echo -e "${RED}Falha ao instalar dependências do frontend!${NC}"
    exit 1
fi

# 3. Compilar o Frontend (React/Vite)
echo -e "\n${YELLOW}[3/4] Compilando os arquivos de produção do frontend (Vite)...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro na compilação do React/Vite!${NC}"
    echo -e "${YELLOW}Dica: Se a compilação travar com 'Killed', verifique se o servidor tem Swap ativo ou use o instalador setup.sh para configurar.${NC}"
    exit 1
fi
echo -e "${GREEN}Frontend compilado em dist/ com sucesso!${NC}"

# 4. Reiniciar processo no PM2
echo -e "\n${YELLOW}[4/4] Reiniciando os processos do backend no PM2...${NC}"

# Verificar se o PM2 está instalado no sistema
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}PM2 não encontrado no PATH! O backend pode estar rodando como serviço do sistema.${NC}"
    echo -e "${YELLOW}Tentando reiniciar como serviço systemd...${NC}"
    sudo systemctl restart g-tercoa-backend
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Serviço 'g-tercoa-backend' reiniciado via systemctl!${NC}"
    else
        echo -e "${RED}Não foi possível reiniciar o serviço do backend.${NC}"
    fi
else
    # Se o PM2 existir, verifica o nome do app
    pm2 status | grep -E "gtercoa-backend|index" &> /dev/null
    if [ $? -eq 0 ]; then
        # Descobre o nome em execução (seja gtercoa-backend ou index)
        local app_name="gtercoa-backend"
        pm2 status | grep "index" &> /dev/null && app_name="index"
        
        pm2 restart "$app_name"
        echo -e "${GREEN}Processo '${app_name}' reiniciado com sucesso no PM2!${NC}"
    else
        echo -e "${YELLOW}Processo da API não estava ativo no PM2. Inicializando...${NC}"
        cd "$PROJECT_DIR/backend" || exit 1
        pm2 start index.js --name "gtercoa-backend"
        pm2 save
        echo -e "${GREEN}Processo 'gtercoa-backend' iniciado e salvo no PM2!${NC}"
    fi
fi

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}             🎉 DEPLOY E ATUALIZAÇÃO CONCLUÍDOS COM SUCESSO!         ${NC}"
echo -e "${GREEN}======================================================================${NC}"
