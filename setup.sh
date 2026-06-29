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

# Função para exibir um menu de seleção interativo com recomendações
# Argumentos:
#   $1 - Título do menu
#   $2 - Descrição
#   $3 - Índice da opção recomendada (1-based)
#   $4 - Nome da variável de retorno
#   Resto - Opções textuais do menu
select_menu() {
    local title="$1"
    local desc="$2"
    local recommended="$3"
    local var_name="$4"
    shift 4
    local options=("$@")
    local num_options=${#options[@]}
    
    echo -e "\n${BLUE}----------------------------------------------------------------------${NC}"
    echo -e "${BOLD}${title}${NC}"
    if [ -n "$desc" ]; then
        echo -e "${desc}"
    fi
    echo -e "${BLUE}----------------------------------------------------------------------${NC}"
    
    for i in "${!options[@]}"; do
        local opt_num=$((i+1))
        if [ "$opt_num" -eq "$recommended" ]; then
            echo -e "  [${opt_num}] ${options[i]} ${GREEN}(Recomendado)${NC}"
        else
            echo -e "  [${opt_num}] ${options[i]}"
        fi
    done
    
    local choice=""
    while true; do
        echo -ne "Selecione uma opção [${YELLOW}${recommended}${NC}]: "
        read -r choice
        if [ -z "$choice" ]; then
            choice="$recommended"
        fi
        if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "$num_options" ]; then
            break
        else
            echo -e "${RED}Opção inválida. Por favor, escolha um número de 1 a ${num_options}.${NC}"
        fi
    done
    
    eval "$var_name=\"$choice\""
}

USE_MIRROR=false

check_connectivity() {
    echo -e "${BLUE}Verificando conexão com a internet...${NC}"
    # Test curl request with timeout
    if ! curl -s --connect-timeout 5 -I https://registry.npmjs.org > /dev/null; then
        echo -e "${YELLOW}Aviso: Não foi possível conectar ao registro do NPM (registry.npmjs.org).${NC}"
        echo -e "Isso pode ser causado por um problema temporário de rede, DNS desconfigurado ou bloqueios de firewall."
        
        select_menu "Soluções de Rede e DNS para a VPS" \
                    "Escolha uma ação para tentar corrigir a conexão e prosseguir:" \
                    "1" \
                    "NET_CHOICE" \
                    "Tentar configurar DNS públicos (Google 8.8.8.8 / Cloudflare 1.1.1.1) automaticamente" \
                    "Usar servidor espelho alternativo do NPM (npmmirror.com)" \
                    "Ignorar e prosseguir mesmo assim"
        
        if [ "$NET_CHOICE" = "1" ]; then
            echo -e "${YELLOW}Configurando servidores de DNS em /etc/resolv.conf...${NC}"
            run_as_root bash -c "echo 'nameserver 8.8.8.8' > /etc/resolv.conf"
            run_as_root bash -c "echo 'nameserver 1.1.1.1' >> /etc/resolv.conf"
            echo -e "${GREEN}DNS configurado. Testando conexão novamente...${NC}"
            if curl -s --connect-timeout 5 -I https://registry.npmjs.org > /dev/null; then
                echo -e "${GREEN}Conexão restabelecida com sucesso!${NC}"
            else
                echo -e "${RED}Conexão ainda falhando. Recomendamos revisar as configurações do seu provedor de nuvem.${NC}"
            fi
        elif [ "$NET_CHOICE" = "2" ]; then
            echo -e "${YELLOW}Configurando o NPM para utilizar o espelho alternativo (npmmirror.com)...${NC}"
            USE_MIRROR=true
        fi
    else
        echo -e "${GREEN}Conexão com a internet OK!${NC}"
    fi
}

# ==============================================================================
# PERGUNTAS DE CONFIGURAÇÃO (INTERATIVO)
# ==============================================================================

# 1. Usuário e Diretório de Destino
# Obter usuários existentes com UID >= 1000
EXISTING_USERS=()
if [ -f /etc/passwd ]; then
    while IFS=: read -r username _ uid _ _ _ _; do
        if [ "$uid" -ge 1000 ] && [ "$uid" -lt 60000 ]; then
            EXISTING_USERS+=("$username")
        fi
    done < /etc/passwd
fi

# Montar opções do menu de usuários
USER_OPTIONS=()
USER_OPTIONS+=("Criar um novo usuário específico para o sistema (ex: sigmamix)")

RECOMMENDED_INDEX=1
CURRENT_USER_OPT_INDEX=-1

for u in "${EXISTING_USERS[@]}"; do
    USER_OPTIONS+=("Usar o usuário existente: '$u'")
    if [ "$u" = "$USER_NAME" ] && [ "$USER_NAME" != "root" ]; then
        CURRENT_USER_OPT_INDEX=$((${#USER_OPTIONS[@]}))
    fi
done

# Opção de usar root (sempre a última)
USER_OPTIONS+=("Usar o usuário 'root' (NÃO RECOMENDADO por segurança)")

if [ "$CURRENT_USER_OPT_INDEX" -ne -1 ]; then
    RECOMMENDED_INDEX=$CURRENT_USER_OPT_INDEX
else
    RECOMMENDED_INDEX=1
fi

select_menu "1. USUÁRIO DO SISTEMA (Dono dos arquivos e processos PM2)" \
            "O sistema deve rodar sob um usuário comum (não root) para maior segurança." \
            "$RECOMMENDED_INDEX" \
            "USER_CHOICE_IDX" \
            "${USER_OPTIONS[@]}"

# Processar a escolha do usuário
CHOICE_VAL="${USER_OPTIONS[$((USER_CHOICE_IDX-1))]}"
if [[ "$CHOICE_VAL" == "Criar um novo usuário"* ]]; then
    prompt_default "Digite o nome do novo usuário a ser criado" "sigmamix" "SYSTEM_USER"
elif [[ "$CHOICE_VAL" == "Usar o usuário 'root'"* ]]; then
    SYSTEM_USER="root"
else
    SYSTEM_USER=$(echo "$CHOICE_VAL" | sed -E "s/Usar o usuário existente: '([^']+)'/\1/")
fi

# Determinar pasta home do usuário escolhido
if [ "$SYSTEM_USER" = "root" ]; then
    USER_HOME="/root"
else
    USER_HOME="/home/$SYSTEM_USER"
fi
prompt_default "Diretório de destino para instalação" "$USER_HOME/g-tercoa_eventos" "TARGET_DIR"

# 2. Fonte dos arquivos
select_menu "2. ORIGEM DOS ARQUIVOS DO PROJETO" \
            "Escolha de onde obter os arquivos-fonte para a instalação:" \
            "1" \
            "FILE_SOURCE_OPTION" \
            "Clonar do repositório remoto GitHub (Recomendado para produção/atualizações)" \
            "Copiar arquivos locais desta pasta atual (Recomendado para desenvolvimento local/offline)"

# 3. Domínio e Rede
echo -e "\n${BLUE}----------------------------------------------------------------------${NC}"
echo -e "${BOLD}3. CONFIGURAÇÕES DE REDE E DOMÍNIO${NC}"
echo -e "Define o endereço de acesso e a porta de rede do servidor Nginx."
echo -e "${BLUE}----------------------------------------------------------------------${NC}"
prompt_default "Domínio ou IP público do servidor (Recomendado: seu domínio registrado, ex: gtercoa.org)" "localhost" "SERVER_NAME"

# Recomendação inteligente de porta baseada no domínio escolhido
DEFAULT_PORT="8080"
if [ "$SERVER_NAME" != "localhost" ] && [ "$SERVER_NAME" != "127.0.0.1" ]; then
    DEFAULT_PORT="80"
fi
prompt_default "Porta HTTP para o Nginx (Recomendado: 80 para produção e SSL)" "$DEFAULT_PORT" "HTTP_PORT"

# 4. Credenciais do Administrador
SUGGESTED_PASS=$(openssl rand -hex 6)
echo -e "\n${BLUE}----------------------------------------------------------------------${NC}"
echo -e "${BOLD}4. CREDENCIAIS DO ADMINISTRADOR DO SISTEMA${NC}"
echo -e "Estes dados serão usados para o primeiro acesso ao painel administrativo."
echo -e "${BLUE}----------------------------------------------------------------------${NC}"
prompt_default "E-mail do administrador (Recomendado: seu e-mail real)" "tercoa.monitoria@gmail.com" "ADMIN_EMAIL"
prompt_default "Senha do administrador (Recomendado: digite uma senha segura)" "$SUGGESTED_PASS" "ADMIN_PASSWORD"

# 5. Configuração de E-mail (SMTP)
select_menu "5. CONFIGURAÇÃO DE ENVIO DE E-MAILS (SMTP)" \
            "O sistema envia comprovantes de inscrição por e-mail. Escolha se deseja configurar agora:" \
            "2" \
            "SMTP_CHOICE" \
            "Configurar SMTP real agora (Recomendado para produção, ex: Gmail/SendGrid)" \
            "Pular e usar simulação/modo de teste (Recomendado para desenvolvimento rápido)"

USE_REAL_SMTP=false
if [ "$SMTP_CHOICE" = "1" ]; then
    USE_REAL_SMTP=true
    echo -e "\n${BOLD}Insira os dados do servidor SMTP:${NC}"
    prompt_default "Servidor SMTP Host (Recomendado: smtp.gmail.com)" "smtp.gmail.com" "SMTP_HOST"
    prompt_default "Porta SMTP (Recomendado: 587 para TLS/STARTTLS)" "587" "SMTP_PORT"
    prompt_default "Usuário/E-mail SMTP" "$ADMIN_EMAIL" "SMTP_USER"
    prompt_default "Senha (ou Senha de Aplicativo/App Password)" "" "SMTP_PASS"
    
    DEFAULT_SECURE="n"
    if [ "$SMTP_PORT" = "465" ]; then
        DEFAULT_SECURE="s"
    fi
    prompt_default "Usar conexão segura (SSL/TLS)? (s/N)" "$DEFAULT_SECURE" "SMTP_SECURE_ANSWER"
    
    SMTP_SECURE="false"
    if [[ "$SMTP_SECURE_ANSWER" =~ ^[Ss]$ ]]; then
        SMTP_SECURE="true"
    fi
fi

# 6. Instalação de SSL com Certbot
echo -e "\n${BLUE}----------------------------------------------------------------------${NC}"
echo -e "${BOLD}6. CERTIFICADO DE SEGURANÇA SSL (HTTPS)${NC}"
echo -e "${BLUE}----------------------------------------------------------------------${NC}"

INSTALL_SSL=false
if [ "$SERVER_NAME" = "localhost" ] || [ "$SERVER_NAME" = "127.0.0.1" ]; then
    echo -e "${YELLOW}Nota: SSL desabilitado automaticamente (não é possível emitir para localhost/IP local).${NC}"
elif [ "$HTTP_PORT" != "80" ]; then
    echo -e "${YELLOW}Nota: SSL desabilitado automaticamente (Certbot requer a porta HTTP 80 para validação).${NC}"
else
    select_menu "Instalação de SSL (HTTPS) via Let's Encrypt/Certbot:" \
                "Recomendado para produção para proteger a transmissão de dados e senhas." \
                "1" \
                "SSL_CHOICE" \
                "Instalar e configurar SSL (HTTPS) automaticamente (Altamente Recomendado)" \
                "Não instalar SSL agora (Usar apenas HTTP inseguro)"
      
    if [ "$SSL_CHOICE" = "1" ]; then
        INSTALL_SSL=true
    fi
fi

# 7. Tipo de Banco de Dados
select_menu "7. BANCO DE DADOS DE PRODUÇÃO" \
            "Escolha o mecanismo de banco de dados para o servidor:" \
            "1" \
            "DB_CHOICE" \
            "Usar SQLite local (arquivo local, sem instalação adicional - Recomendado para sites pequenos)" \
            "Usar MySQL ou MariaDB (Recomendado para produção/alta concorrência)"

DB_TYPE="sqlite"
if [ "$DB_CHOICE" = "2" ]; then
    DB_TYPE="mysql"
    echo -e "\n${BOLD}Insira os dados do banco de dados MySQL/MariaDB:${NC}"
    prompt_default "Host do Banco de Dados" "localhost" "DB_HOST"
    prompt_default "Porta do Banco de Dados" "3306" "DB_PORT"
    prompt_default "Usuário do Banco de Dados" "root" "DB_USER"
    prompt_default "Senha do Banco de Dados" "" "DB_PASSWORD"
    prompt_default "Nome do Banco de Dados" "gtercoa_eventos" "DB_DATABASE"
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
echo -e "• Banco de Dados:            ${GREEN}$DB_TYPE${NC}"
if [ "$DB_TYPE" = "mysql" ]; then
echo -e "  └─ Host:                   ${GREEN}$DB_HOST:$DB_PORT${NC}"
echo -e "  └─ Banco:                  ${GREEN}$DB_DATABASE${NC}"
fi
echo -e "${BLUE}======================================================================${NC}"
echo -ne "Deseja iniciar a instalação com estes parâmetros? (S/n): "
read -r START_INSTALL_ANSWER

if [[ "$START_INSTALL_ANSWER" =~ ^[Nn]$ ]]; then
    echo -e "${RED}Instalação cancelada pelo usuário.${NC}"
    exit 0
fi

check_connectivity

# ==============================================================================
# FASE 1: INSTALAÇÃO DE DEPENDÊNCIAS DO DEBIAN/UBUNTU
# ==============================================================================
echo -e "\n${YELLOW}[1/7] Instalando utilitários do sistema Debian...${NC}"
run_as_root apt update
run_as_root apt install -y curl git nginx sqlite3 build-essential sudo

# Instalar e configurar MariaDB local se for selecionado MySQL no localhost/127.0.0.1
if [ "$DB_TYPE" = "mysql" ] && { [ "$DB_HOST" = "localhost" ] || [ "$DB_HOST" = "127.0.0.1" ]; }; then
    echo -e "${YELLOW}Banco de dados MySQL/MariaDB local detectado como alvo.${NC}"
    echo -e "${YELLOW}Instalando MariaDB Server...${NC}"
    run_as_root apt install -y mariadb-server
    
    echo -e "${YELLOW}Configurando e iniciando serviço MariaDB...${NC}"
    run_as_root systemctl start mariadb || run_as_root systemctl start mysql
    run_as_root systemctl enable mariadb || run_as_root systemctl enable mysql
    
    echo -e "${YELLOW}Configurando banco de dados e privilégios de acesso...${NC}"
    # Criar banco de dados se não existir
    run_as_root mysql -e "CREATE DATABASE IF NOT EXISTS \`$DB_DATABASE\`;"
    
    if [ "$DB_USER" != "root" ]; then
        # Criar usuário específico e dar permissões
        run_as_root mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
        run_as_root mysql -e "GRANT ALL PRIVILEGES ON \`$DB_DATABASE\`.* TO '$DB_USER'@'localhost';"
        run_as_root mysql -e "FLUSH PRIVILEGES;"
        echo -e "${GREEN}Usuário do banco de dados '$DB_USER' criado e configurado com sucesso.${NC}"
    else
        # Se for root e houver senha, configurar autenticação nativa por senha para conexões do Node.js
        if [ -n "$DB_PASSWORD" ]; then
            run_as_root mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('$DB_PASSWORD');" 2>/dev/null || \
            run_as_root mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
            run_as_root mysql -e "FLUSH PRIVILEGES;"
            echo -e "${GREEN}Autenticação de senha para o usuário 'root' configurada.${NC}"
        fi
    fi
fi

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
    
    select_menu "Configuração de Memória Swap para Compilação" \
                "Recomenda-se criar um arquivo Swap temporário ou permanente para evitar que o build trave." \
                "1" \
                "SWAP_CHOICE" \
                "Criar e ativar arquivo Swap de 2GB automaticamente (Altamente Recomendado)" \
                "Ignorar e prosseguir sem Swap (Pode causar falha no build do Frontend)"
                
    if [ "$SWAP_CHOICE" = "1" ]; then
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

# Criar pasta de uploads preventivamente
run_as_root mkdir -p "$TARGET_DIR/backend/uploads"

# Definir a propriedade para o usuário comum antes de começar a instalar pacotes e compilar
run_as_root chown -R "$SYSTEM_USER:www-data" "$TARGET_DIR"
run_as_root chmod -R 775 "$TARGET_DIR"

# Garantir que o Nginx (www-data) consiga atravessar o diretório Home do usuário
if [ "$SYSTEM_USER" != "root" ]; then
    run_as_root chmod +x "/home/$SYSTEM_USER" 2>/dev/null || true
fi

# ==============================================================================
# FASE 3: CONFIGURAÇÃO DO BACKEND
# ==============================================================================
echo -e "\n${YELLOW}[3/7] Configurando o Backend e dependências...${NC}"
cd "$TARGET_DIR/backend" || exit
if [ "$USE_MIRROR" = true ]; then
    echo -e "${YELLOW}Configurando espelho alternativo do NPM no backend...${NC}"
    run_as_user npm config set registry https://registry.npmmirror.com/
fi
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
DB_TYPE=$DB_TYPE
EOT
    if [ "$DB_TYPE" = "mysql" ]; then
        cat <<EOT >> .env
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=$DB_DATABASE
EOT
    fi
else
    sudo -u "$SYSTEM_USER" bash -c "cat <<EOT > .env
PORT=5000
JWT_SECRET=$JWT_GEN_SECRET
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD
DB_TYPE=$DB_TYPE
EOT"
    if [ "$DB_TYPE" = "mysql" ]; then
        sudo -u "$SYSTEM_USER" bash -c "cat <<EOT >> .env
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_DATABASE=$DB_DATABASE
EOT"
    fi
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
echo -e "${YELLOW}Inicializando tabelas do banco de dados ($DB_TYPE)...${NC}"
run_as_user node -e "const { initPromise } = require('./db.js'); initPromise.then(() => { console.log('Banco de dados inicializado com sucesso.'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });"

# ==============================================================================
# FASE 4: CONFIGURAÇÃO E COMPILAÇÃO DO FRONTEND
# ==============================================================================
echo -e "\n${YELLOW}[4/7] Instalando dependências e compilando o Frontend...${NC}"
cd "$TARGET_DIR/frontend" || exit
if [ "$USE_MIRROR" = true ]; then
    echo -e "${YELLOW}Configurando espelho alternativo do NPM no frontend...${NC}"
    run_as_user npm config set registry https://registry.npmmirror.com/
fi
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

    # Limite máximo de upload (necessário para imagens de perfil, banners e PDFs de submissão)
    client_max_body_size 50M;

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
if [ "$DB_TYPE" = "sqlite" ] && [ -f "$TARGET_DIR/backend/database.db" ]; then
    run_as_root chmod 664 "$TARGET_DIR/backend/database.db"
fi

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
