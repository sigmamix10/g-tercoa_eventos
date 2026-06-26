#!/usr/bin/env bash

# ==============================================================================
# Script de Instalação e Configuração Automatizada - G-TERCOA Eventos
# Sistema Operacional Alvo: WSL Ubuntu / Ubuntu Server
# ==============================================================================

# Cores para formatação de logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}        Instalando e Configurando o Sistema G-TERCOA Eventos${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. Obter usuário e caminhos
USER_NAME=$(whoami)
TARGET_DIR="$HOME/g-tercoa_eventos"
REPO_URL="https://github.com/sigmamix10/g-tercoa_eventos.git"

echo -e "${YELLOW}[1/7] Atualizando repositório de pacotes e instalando dependências...${NC}"
sudo apt update
sudo apt install -y curl git nginx sqlite3 build-essential

# 2. Instalar Node.js 20 LTS (caso não exista)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js não encontrado. Instalando Node.js v20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js já instalado: $(node -v)${NC}"
fi

# 3. Instalar PM2 globalmente (caso não exista)
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Instalando PM2 (Gerenciador de processos)...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}PM2 já instalado: $(pm2 -v)${NC}"
fi

# 4. Obter os arquivos do projeto
echo -e "${YELLOW}[2/7] Obtendo arquivos do projeto...${NC}"

# Detectar de onde o script está rodando
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verificar se estamos rodando de dentro do próprio projeto
if [ -f "$SCRIPT_DIR/backend/package.json" ] && [ -f "$SCRIPT_DIR/frontend/package.json" ]; then
    echo -e "${GREEN}Detectado que o script está sendo executado de dentro da pasta do projeto.${NC}"
    
    # Se o diretório atual já for o de destino nativo (~/g-tercoa_eventos)
    if [ "$SCRIPT_DIR" = "$TARGET_DIR" ]; then
        echo -e "${GREEN}O projeto já está na pasta nativa de destino: $TARGET_DIR${NC}"
    else
        # Caso contrário, copia os arquivos locais da pasta atual para a pasta nativa
        echo -e "${YELLOW}Copiando arquivos locais de $SCRIPT_DIR para $TARGET_DIR...${NC}"
        if [ -d "$TARGET_DIR" ]; then
            echo -e "${YELLOW}O diretório $TARGET_DIR já existe. Fazendo backup...${NC}"
            mv "$TARGET_DIR" "${TARGET_DIR}_backup_\$(date +%s)"
        fi
        mkdir -p "$TARGET_DIR"
        cp -r "$SCRIPT_DIR"/* "$TARGET_DIR/"
        # Limpar node_modules copiados
        rm -rf "$TARGET_DIR/backend/node_modules"
        rm -rf "$TARGET_DIR/frontend/node_modules"
    fi
else
    # Se não estiver no projeto, tenta clonar do GitHub
    echo -e "${YELLOW}Script não executado dentro da pasta do projeto. Tentando clonar do GitHub...${NC}"
    if [ -d "$TARGET_DIR" ]; then
        echo -e "${YELLOW}O diretório $TARGET_DIR já existe. Fazendo backup...${NC}"
        mv "$TARGET_DIR" "${TARGET_DIR}_backup_\$(date +%s)"
    fi
    
    # Tenta clonar do GitHub. Se falhar, avisa o usuário e oferece instruções de cópia local.
    if ! git clone "$REPO_URL" "$TARGET_DIR"; then
        echo -e "${RED}Erro: Não foi possível clonar o repositório do GitHub.${NC}"
        echo -e "${YELLOW}Isso pode ocorrer se o repositório for privado ou requerer autenticação.${NC}"
        echo -e ""
        echo -e "Você pode copiar os arquivos manualmente a partir do Windows executando:"
        echo -e "  mkdir -p $TARGET_DIR"
        echo -e "  cp -r /mnt/d/g-tercoa_eventos/* $TARGET_DIR/"
        echo -e ""
        echo -e "Por favor, digite o caminho completo da pasta do projeto no Windows (ex: /mnt/d/g-tercoa_eventos):"
        read -r LOCAL_PATH
        if [ -d "$LOCAL_PATH" ] && [ -f "$LOCAL_PATH/backend/package.json" ]; then
            echo -e "${GREEN}Pasta encontrada! Copiando arquivos...${NC}"
            mkdir -p "$TARGET_DIR"
            cp -r "$LOCAL_PATH"/* "$TARGET_DIR/"
            rm -rf "$TARGET_DIR/backend/node_modules"
            rm -rf "$TARGET_DIR/frontend/node_modules"
        else
            echo -e "${RED}Caminho inválido. Abortando instalação.${NC}"
            exit 1
        fi
    fi
fi
# 5. Configurar o Backend e Inicializar o Banco de Dados
echo -e "${YELLOW}[3/7] Configurando o Backend e dependências...${NC}"
cd "$TARGET_DIR/backend" || exit
npm install --omit=dev

echo -e "${YELLOW}Criando arquivo de variáveis de ambiente (.env)...${NC}"
JWT_GEN_SECRET=$(openssl rand -base64 32)
cat <<EOT > .env
PORT=5000
JWT_SECRET=$JWT_GEN_SECRET
ADMIN_EMAIL=tercoa.monitoria@gmail.com
ADMIN_PASSWORD=G-tercoaufc@2024

# Configurações de e-mail de mentira (salva localmente em sent_emails/)
# Caso queira e-mail real, descomente e preencha as variáveis abaixo
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=tercoa.monitoria@gmail.com
# SMTP_PASS=sua_senha_de_aplicativo_aqui
# SMTP_SECURE=false
# EMAIL_FROM="G-TERCOA Eventos <tercoa.monitoria@gmail.com>"
EOT

# Forçar criação e sincronização inicial do banco de dados executando o script db.js uma vez
echo -e "${YELLOW}Inicializando tabelas do banco de dados SQLite...${NC}"
node -e "const { initPromise } = require('./db.js'); initPromise.then(() => { console.log('Banco de dados inicializado com sucesso.'); process.exit(0); }).catch(err => { console.error(err); process.exit(1); });"

# 6. Compilar o Frontend
echo -e "${YELLOW}[4/7] Instalando dependências e compilando o Frontend...${NC}"
cd "$TARGET_DIR/frontend" || exit
npm install
npm run build

# 7. Configurar Nginx
echo -e "${YELLOW}[5/7] Configurando o Servidor Web Nginx...${NC}"

NGINX_CONF="/etc/nginx/sites-available/g-tercoa-eventos"

sudo bash -c "cat <<EOT > $NGINX_CONF
server {
    listen 80;
    server_name localhost 127.0.0.1;

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

    # Pasta de uploads (Banners, imagens de convidados, etc)
    location /uploads/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}
EOT"

# Habilitar configuração no Nginx
echo -e "${YELLOW}Ativando a nova configuração no Nginx...${NC}"
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/g-tercoa-eventos
sudo rm -f /etc/nginx/sites-enabled/default

# Testar e reiniciar o Nginx
sudo nginx -t
sudo service nginx restart

# 8. Iniciar o Backend com PM2
echo -e "${YELLOW}[6/7] Inicializando serviços de background com PM2...${NC}"
cd "$TARGET_DIR/backend" || exit
pm2 delete gtercoa-backend &> /dev/null || true
pm2 start index.js --name "gtercoa-backend"
pm2 save

# 9. Definir permissões de gravação de arquivos
echo -e "${YELLOW}[7/7] Ajustando permissões de arquivos e banco de dados...${NC}"
sudo chown -R $USER_NAME:www-data "$TARGET_DIR"
sudo chmod -R 775 "$TARGET_DIR"
chmod 664 "$TARGET_DIR/backend/database.db"

echo -e "${GREEN}======================================================================${NC}"
echo -e "${GREEN}      Instalação e Configuração Concluídas com Sucesso!${NC}"
echo -e "${GREEN}======================================================================${NC}"
echo -e "Acesse o sistema em seu navegador pelo endereço:"
echo -e "👉 ${BLUE}http://localhost/${NC}"
echo -e ""
echo -e "Credenciais do Administrador Criadas:"
echo -e "✉️  Email: ${GREEN}tercoa.monitoria@gmail.com${NC}"
echo -e "🔑 Senha: ${GREEN}G-tercoaufc@2024${NC}"
echo -e ""
echo -e "Dicas Úteis de Gerenciamento:"
echo -e "- Monitorar backend: ${YELLOW}pm2 status${NC} ou ${YELLOW}pm2 logs gtercoa-backend${NC}"
echo -e "- Reiniciar backend: ${YELLOW}pm2 restart gtercoa-backend${NC}"
echo -e "- Reiniciar Nginx:   ${YELLOW}sudo service nginx restart${NC}"
echo -e "======================================================================"
