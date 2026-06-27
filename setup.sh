#!/usr/bin/env bash

# ==============================================================================
# Script de Instalação e Configuração Interativa - G-TERCOA Eventos
# Sistema Operacional Alvo: Debian Server (Limpo) / Ubuntu Server
# ==============================================================================

# Cores para formatação de logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Limpar tela
clear

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}          INSTALADOR INTERATIVO - PLATAFORMA G-TERCOA EVENTOS         ${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -e "Este script irá configurar um servidor Debian/Ubuntu limpo, instalar as"
echo -e "dependências, configurar o Nginx, SQLite3, PM2 e implantar a plataforma."
echo -e "${BLUE}======================================================================${NC}"
echo ""

# Verificar se está rodando como root ou com privilégios sudo
IS_ROOT=false
if [ "$EUID" -eq 0 ]; then
    IS_ROOT=true
fi
USER_NAME=$(whoami)

# Função auxiliar para rodar comandos como root/sudo
run_as_root() {
    if [ "$IS_ROOT" = true ]; then
        "$@"
    else
        sudo "$@"
    fi
}

# Função auxiliar para rodar comandos no contexto do usuário comum
run_as_user() {
    if [ "$USER_NAME" = "$SYSTEM_USER" ]; then
        "$@"
    else
        sudo -u "$SYSTEM_USER" env PATH=$PATH "$@"
    fi
}

# Função auxiliar para perguntas interativas com padrão
prompt_default() {
    local prompt_msg="$1"
    local default_val="$2"
    local var_name="$3"
    
    echo -ne "${BOLD}${prompt_msg}${NC} [${YELLOW}${default_val}${NC}]: "
    read -r input_val
    if [ -z "$input_val" ]; then
        eval "$var_name=\"$default_val\""
    else
        eval "$var_name=\"$input_val\""
    fi
}

# ==============================================================================
# PERGUNTAS DE CONFIGURAÇÃO (INTERATIVO)
# ==============================================================================

# 1. Usuário e Diretório de Destino
if [ "$USER_NAME" = "root" ]; then
    prompt_default "Usuário do sistema que será dono dos arquivos (evite usar root)" "sigmamix" "SYSTEM_USER"
else
    prompt_default "Usuário do sistema que será dono dos arquivos" "$USER_NAME" "SYSTEM_USER"
fi

# Determinar pasta home do usuário escolhido
if [ "$SYSTEM_USER" = "root" ]; then
    USER_HOME="/root"
else
    USER_HOME="/home/$SYSTEM_USER"
fi
TARGET_DIR="$USER_HOME/g-tercoa_eventos"

# 2. Fonte dos arquivos
echo -e "\n${BOLD}Origem dos arquivos do projeto:${NC}"
echo -e "  [1] Clonar do repositório GitHub (https://github.com/sigmamix10/g-tercoa_eventos.git)"
echo -e "  [2] Copiar arquivos locais (desta pasta atual em que o script está rodando)"
prompt_default "Selecione a opção" "1" "FILE_SOURCE_OPTION"

# 3. Domínio e Rede
echo -e "\n${BOLD}Configurações de Rede e Nginx:${NC}"
prompt_default "Domínio ou IP público do servidor (ex: gtercoa.org ou 198.51.100.5)" "localhost" "SERVER_NAME"
prompt_default "Porta HTTP em que o site irá rodar" "8080" "HTTP_PORT"

# 4. Credenciais do Administrador
echo -e "\n${BOLD}Configuração do Usuário Administrador Principal:${NC}"
prompt_default "E-mail do administrador" "tercoa.monitoria@gmail.com" "ADMIN_EMAIL"
prompt_default "Senha do administrador" "G-tercoaufc@2024" "ADMIN_PASSWORD"

# 5. Configuração de E-mail (SMTP)
echo -e "\n${BOLD}Envio de E-mails (SMTP):${NC}"
echo -ne "Deseja configurar envio de e-mails de comprovante reais via SMTP agora? (s/N): "
read -r CONFIGURE_SMTP_ANSWER

USE_REAL_SMTP=false
if [[ "$CONFIGURE_SMTP_ANSWER" =~ ^[Ss]$ ]]; then
    USE_REAL_SMTP=true
    prompt_default "Servidor SMTP Host" "smtp.gmail.com" "SMTP_HOST"
    prompt_default "Porta SMTP" "587" "SMTP_PORT"
    prompt_default "Usuário/E-mail SMTP" "$ADMIN_EMAIL" "SMTP_USER"
    prompt_default "Senha (ou Senha de Aplicativo)" "" "SMTP_PASS"
    prompt_default "Usar conexão segura (SSL/TLS)? (s/N)" "n" "SMTP_SECURE_ANSWER"
    
    SMTP_SECURE="false"
    if [[ "$SMTP_SECURE_ANSWER" =~ ^[Ss]$ ]]; then
        SMTP_SECURE="true"
    fi
fi

# 6. Instalação de SSL com Certbot
echo -e "\n${BOLD}Certificado SSL (HTTPS):${NC}"
echo -ne "Deseja instalar SSL (HTTPS) gratuito via Let's Encrypt/Certbot? (s/N): "
read -r INSTALL_SSL_ANSWER

INSTALL_SSL=false
if [[ "$INSTALL_SSL_ANSWER" =~ ^[Ss]$ ]]; then
    if [ "$SERVER_NAME" = "localhost" ] || [ "$SERVER_NAME" = "127.0.0.1" ]; then
        echo -e "${RED}Erro: Não é possível emitir SSL para localhost/IP local. Opção desativada.${NC}"
    elif [ "$HTTP_PORT" != "80" ]; then
        echo -e "${RED}Erro: Certbot Let's Encrypt requer a porta HTTP 80 para validação. Opção desativada.${NC}"
    else
        INSTALL_SSL=true
    fi
fi

# Confirmar configurações
echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${BOLD}CONFIRMAÇÃO DOS PARÂMETROS DE IMPLANTAÇÃO:${NC}"
echo -e "• Usuário Linux de execução: ${GREEN}$SYSTEM_USER${NC}"
echo -e "• Diretório de Instalação:   ${GREEN}$TARGET_DIR${NC}"
echo -e "• Domínio/IP do Servidor:    ${GREEN}$SERVER_NAME${NC}"
echo -e "• Porta HTTP Nginx:          ${GREEN}$HTTP_PORT${NC}"
echo -e "• E-mail do Administrador:   ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "• Senha do Administrador:    ${GREEN}$ADMIN_PASSWORD${NC}"
echo -e "• SMTP Configurado:          ${GREEN}$USE_REAL_SMTP${NC}"
echo -e "• Instalação SSL HTTPS:      ${GREEN}$INSTALL_SSL${NC}"
echo -e "${BLUE}======================================================================${NC}"
echo -ne "Deseja iniciar a instalação com estes parâmetros? (S/n): "
read -r START_INSTALL_ANSWER

if [[ "$START_INSTALL_ANSWER" =~ ^[Nn]$ ]]; then
    echo -e "${RED}Instalação cancelada pelo usuário.${NC}"
    exit 0
fi

# ==============================================================================
# FASE 1: INSTALAÇÃO DE DEPENDÊNCIAS DO DEBIAN/UBUNTU
# ==============================================================================
echo -e "\n${YELLOW}[1/7] Instalando utilitários do sistema Debian...${NC}"
run_as_root apt update
run_as_root apt install -y curl git nginx sqlite3 build-essential sudo

# Criar o usuário de destino se ele não existir
if [ "$SYSTEM_USER" != "root" ]; then
    if ! id "$SYSTEM_USER" &>/dev/null; then
        echo -e "${YELLOW}Usuário $SYSTEM_USER não existe. Criando usuário...${NC}"
        run_as_root useradd -m -s /bin/bash "$SYSTEM_USER"
        run_as_root usermod -aG sudo "$SYSTEM_USER" &>/dev/null || true
        echo -e "${GREEN}Usuário $SYSTEM_USER criado com sucesso.${NC}"
    fi
fi

# Configuração de Memória Swap para Servidores com Pouca RAM
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
TOTAL_SWAP=$(free -m | awk '/^Swap:/{print $2}')

if [ -n "$TOTAL_RAM" ] && [ "$TOTAL_RAM" -lt 1500 ] && { [ -z "$TOTAL_SWAP" ] || [ "$TOTAL_SWAP" -eq 0 ]; }; then
    echo -e "\n${YELLOW}Aviso: O servidor possui pouca RAM ($TOTAL_RAM MB) e nenhuma Swap ativa.${NC}"
    echo -e "${YELLOW}A compilação do Frontend React com Vite pode travar devido a falta de memória.${NC}"
    echo -ne "Deseja que criemos um arquivo de Swap de 2GB automaticamente? (S/n): "
    read -r CREATE_SWAP_ANSWER
    if [[ ! "$CREATE_SWAP_ANSWER" =~ ^[Nn]$ ]]; then
        echo -e "${YELLOW}Criando e ativando arquivo Swap de 2GB (/swapfile)...${NC}"
        run_as_root fallocate -l 2G /swapfile || run_as_root dd if=/dev/zero of=/swapfile bs=1M count=2048
        run_as_root chmod 600 /swapfile
        run_as_root mkswap /swapfile
        run_as_root swapon /swapfile
        run_as_root bash -c "echo '/swapfile none swap sw 0 0' >> /etc/fstab"
        echo -e "${GREEN}Swap de 2GB configurada com sucesso!${NC}"
    fi
fi

# Instalar Node.js 20 se não estiver presente
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Instalando Node.js v20 LTS...${NC}"
    if [ "$IS_ROOT" = true ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    else
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    fi
    run_as_root apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js já instalado: $(node -v)${NC}"
fi

# Instalar PM2 globalmente se não estiver presente
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Instalando PM2 globalmente...${NC}"
    run_as_root npm install -g pm2
else
    echo -e "${GREEN}PM2 já instalado: $(pm2 -v)${NC}"
fi

# ==============================================================================
# FASE 2: IMPLANTAÇÃO DOS ARQUIVOS
# ==============================================================================
echo -e "\n${YELLOW}[2/7] Copiando/Baixando arquivos do projeto...${NC}"

# Detectar pasta atual
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Criar pasta de destino nativa se não existir
run_as_root mkdir -p "$TARGET_DIR"

if [ "$FILE_SOURCE_OPTION" = "2" ]; then
    echo -e "${YELLOW}Copiando arquivos locais desta pasta para $TARGET_DIR...${NC}"
    run_as_root cp -r "$SCRIPT_DIR"/* "$TARGET_DIR/"
    run_as_root rm -rf "$TARGET_DIR/backend/node_modules"
    run_as_root rm -rf "$TARGET_DIR/frontend/node_modules"
else
    echo -e "${YELLOW}Clonando o repositório do GitHub...${NC}"
    if [ -d "$TARGET_DIR/.git" ]; then
        echo -e "${YELLOW}Repositório já clonado. Atualizando código...${NC}"
        cd "$TARGET_DIR" || exit
        run_as_root git pull
    else
        run_as_root rm -rf "$TARGET_DIR"
        run_as_root git clone "https://github.com/sigmamix10/g-tercoa_eventos.git" "$TARGET_DIR"
    fi
fi

# Definir a propriedade para o usuário comum antes de começar a instalar pacotes e compilar
run_as_root chown -R "$SYSTEM_USER:www-data" "$TARGET_DIR"
run_as_root chmod -R 775 "$TARGET_DIR"

# ==============================================================================
# FASE 3: CONFIGURAÇÃO DO BACKEND
# ==============================================================================
echo -e "\n${YELLOW}[3/7] Configurando o Backend e dependências...${NC}"
cd "$TARGET_DIR/backend" || exit
run_as_user npm install --omit=dev

echo -e "${YELLOW}Criando arquivo de variáveis de ambiente (.env)...${NC}"
JWT_GEN_SECRET=$(openssl rand -base64 32)

# Escrever configurações de variáveis
if [ "$USER_NAME" = "$SYSTEM_USER" ]; then
    cat <<EOT > .env
PORT=5000
JWT_SECRET=$JWT_GEN_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
EOT
else
    sudo -u "$SYSTEM_USER" bash -c "cat <<EOT > .env
PORT=5000
JWT_SECRET=$JWT_GEN_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
EOT"
fi

if [ "$USE_REAL_SMTP" = true ]; then
    if [ "$USER_NAME" = "$SYSTEM_USER" ]; then
        cat <<EOT >> .env
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_SECURE=$SMTP_SECURE
EMAIL_FROM="G-TERCOA Eventos <$SMTP_USER>"
EOT
    else
        sudo -u "$SYSTEM_USER" bash -c "cat <<EOT >> .env
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_SECURE=$SMTP_SECURE
EMAIL_FROM=\"G-TERCOA Eventos <$SMTP_USER>\"
EOT"
    fi
fi

# Inicializar o banco de dados
echo -e "${YELLOW}Inicializando tabelas do banco de dados SQLite...${NC}"
run_as_user node -e "const { initPromise } = require('./db.js'); initPromise.then(() => { console.log('Banco de dados inicializado com sucesso.'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });"

# ==============================================================================
# FASE 4: CONFIGURAÇÃO E COMPILAÇÃO DO FRONTEND
# ==============================================================================
echo -e "\n${YELLOW}[4/7] Instalando dependências e compilando o Frontend...${NC}"
cd "$TARGET_DIR/frontend" || exit
run_as_user npm install
run_as_user npm run build

# ==============================================================================
# FASE 5: CONFIGURAÇÃO DO SERVIDOR WEB NGINX
# ==============================================================================
echo -e "\n${YELLOW}[5/7] Configurando o Servidor Web Nginx...${NC}"

NGINX_CONF="/etc/nginx/sites-available/g-tercoa-eventos"

run_as_root bash -c "cat <<EOT > $NGINX_CONF
server {
    listen $HTTP_PORT;
    server_name $SERVER_NAME;

    # Frontend (Arquivos estáticos compilados)
    location / {
        root $TARGET_DIR/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API (Porta 5000 do Express)
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Pasta de uploads (Banners, imagens de convidados, etc) - Servido diretamente pelo Nginx para melhor performance
    location /uploads/ {
        alias $TARGET_DIR/backend/uploads/;
        expires 7d;
        add_header Cache-Control \"public, no-transform\";
    }
}
EOT"

# Habilitar configuração no Nginx
echo -e "${YELLOW}Ativando a nova configuração no Nginx...${NC}"
run_as_root ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/g-tercoa-eventos
run_as_root rm -f /etc/nginx/sites-enabled/default

# Testar, habilitar e reiniciar o Nginx
run_as_root nginx -t
run_as_root systemctl enable nginx &>/dev/null || true
run_as_root service nginx restart || run_as_root systemctl restart nginx

# ==============================================================================
# FASE 6: INICIALIZAR BACKEND COM PM2
# ==============================================================================
echo -e "\n${YELLOW}[6/7] Inicializando serviços de background com PM2...${NC}"
cd "$TARGET_DIR/backend" || exit

# Executar como o usuário de destino
run_as_user pm2 delete gtercoa-backend &> /dev/null || true
run_as_user pm2 start index.js --name "gtercoa-backend"
run_as_user pm2 save

# Gerar inicialização na inicialização do SO
if [ "$SYSTEM_USER" = "root" ]; then
    pm2 startup
else
    pm2_startup_cmd=$(run_as_user pm2 startup | grep "sudo env PATH")
    if [ -n "$pm2_startup_cmd" ]; then
        eval "$pm2_startup_cmd"
    fi
fi

# ==============================================================================
# FASE 7: PERMISSÕES E SSL (HTTPS)
# ==============================================================================
echo -e "\n${YELLOW}[7/7] Ajustando permissões finais e segurança...${NC}"

# Dar permissão de travessia nas homes dos usuários para o Nginx poder ler a pasta dist
if [ "$SYSTEM_USER" != "root" ]; then
    run_as_root chmod 755 "/home/$SYSTEM_USER"
fi
run_as_root chown -R "$SYSTEM_USER:www-data" "$TARGET_DIR"
run_as_root chmod -R 775 "$TARGET_DIR"
run_as_root chmod 664 "$TARGET_DIR/backend/database.db"

# Habilitar Certbot SSL se solicitado
if [ "$INSTALL_SSL" = true ]; then
    echo -e "${YELLOW}Instalando Certbot e obtendo certificado SSL gratuito...${NC}"
    run_as_root apt install -y certbot python3-certbot-nginx
    run_as_root certbot --nginx -d "$SERVER_NAME" --non-interactive --agree-tos --email "$ADMIN_EMAIL" --redirect
fi

echo -e "\n${GREEN}======================================================================${NC}"
echo -e "${GREEN}      Instalação e Configuração Concluídas com Sucesso!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "Acesse o sistema em seu navegador pelo endereço:"
if [ "$INSTALL_SSL" = true ]; then
    echo -e "👉 ${BLUE}https://$SERVER_NAME/${NC}"
else
    if [ "$HTTP_PORT" = "80" ]; then
        echo -e "👉 ${BLUE}http://$SERVER_NAME/${NC}"
    else
        echo -e "👉 ${BLUE}http://$SERVER_NAME:$HTTP_PORT/${NC}"
    fi
fi
echo -e ""
echo -e "Credenciais do Administrador Criadas:"
echo -e "✉️  Email: ${GREEN}$ADMIN_EMAIL${NC}"
echo -e "🔑 Senha: ${GREEN}$ADMIN_PASSWORD${NC}"
echo -e ""
echo -e "Dicas Úteis de Gerenciamento (execute sob o usuário ${BOLD}$SYSTEM_USER${NC}):"
echo -e "- Monitorar backend: ${YELLOW}pm2 status${NC} ou ${YELLOW}pm2 logs gtercoa-backend${NC}"
echo -e "- Reiniciar backend: ${YELLOW}pm2 restart gtercoa-backend${NC}"
echo -e "- Reiniciar Nginx:   ${YELLOW}sudo service nginx restart${NC}"
echo -e "======================================================================"
