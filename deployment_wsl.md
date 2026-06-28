# Guia de Implantação e Configuração: WSL Ubuntu Server

Este guia contém as instruções completas para transferir, configurar e executar a plataforma **G-TERCOA Eventos** em um ambiente **WSL (Windows Subsystem for Linux) com Ubuntu**.

> [!IMPORTANT]
> **Performance do SQLite no WSL:** 
> Evite executar o banco de dados diretamente de pastas montadas do Windows (como `/mnt/d/...`), pois o sistema de arquivos NTFS montado no WSL não possui total compatibilidade com o mecanismo de travamento de arquivos do SQLite. Sempre copie o projeto para o sistema de arquivos nativo do Linux (como `/home/usuario/`).

---

## ⚡ Método Recomendado: Script Automatizado

Para facilitar a instalação, o repositório contém o script `setup.sh`. Ele executa todos os passos listados neste documento de forma totalmente automatizada e inteligente.

O script detecta se você o está executando de dentro do diretório do projeto. Portanto, você pode executá-lo diretamente a partir da sua pasta montada do Windows no WSL sem a necessidade de autenticação no GitHub:

### Opção A: Executar a partir da pasta local (Sem necessidade de login/token do GitHub)
Se o seu projeto estiver na unidade `D:` do Windows (caminho `/mnt/d/g-tercoa_eventos`):
1. Abra o seu terminal WSL Ubuntu.
2. Navegue até a pasta do projeto no Windows:
   ```bash
   cd /mnt/d/g-tercoa_eventos
   ```
3. Torne o script executável e rode-o:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
   *O script detectará que está na pasta do projeto e copiará todos os arquivos locais automaticamente para a home nativa do Linux (`~/g-tercoa_eventos`).*

### Opção B: Clonar via GitHub (Instalação Direta)
Se preferir clonar o repositório diretamente (pode exigir credenciais de acesso se o repositório for privado):
1. Abra o seu terminal WSL Ubuntu.
2. Baixe e rode o script:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/sigmamix10/g-tercoa_eventos/main/setup.sh -o setup.sh
   chmod +x setup.sh
   ./setup.sh
   ```
   *(Caso sua branch principal seja `master` em vez de `main`, substitua o nome correspondente na URL. Se o clone do GitHub falhar por falta de permissão, o script irá te pedir para digitar o caminho da pasta local no Windows para copiar).*

---

## Índice de Passos Manuais (Caso prefira executar linha por linha)
1. [Preparação do WSL Ubuntu](#1-preparação-do-wsl-ubuntu)
2. [Cópia dos Arquivos para o Linux](#2-cópia-dos-arquivos-para-o-linux)
3. [Configuração do Banco de Dados e Backend](#3-configuração-do-banco-de-dados-e-backend)
4. [Compilação do Frontend](#4-compilação-do-frontend)
5. [Configuração do Servidor Web Nginx](#5-configuração-do-servidor-web-nginx)
6. [Gerenciamento com PM2 e WSL (Background)](#6-gerenciamento-com-pm2-e-wsl-background)
7. [Acesso Externo (Windows e Rede Local)](#7-acesso-externo-windows-e-rede-local)

---

## 1. Preparação do WSL Ubuntu

Abra o seu terminal WSL Ubuntu e instale as dependências essenciais:

```bash
# Atualizar pacotes do sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar Nginx, SQLite3 e ferramentas extras
sudo apt install -y nginx sqlite3 build-essential

# Instalar PM2 globalmente
sudo npm install -g pm2
```

---

## 2. Cópia dos Arquivos para o Linux

Como o WSL consegue ler o sistema de arquivos do Windows, você pode copiar os arquivos do projeto diretamente utilizando o terminal Linux:

```bash
# 1. Criar a pasta do projeto no diretório nativo do usuário (home)
mkdir -p ~/g-tercoa_eventos

# 2. Copiar os arquivos da unidade D: (ou de onde o projeto estiver no Windows)
# Substitua o caminho '/mnt/d/g-tercoa_eventos/' pelo local correspondente
cp -r /mnt/d/g-tercoa_eventos/* ~/g-tercoa_eventos/

# 3. Remover pastas pesadas desnecessárias que possam ter sido copiadas do desenvolvimento
rm -rf ~/g-tercoa_eventos/backend/node_modules
rm -rf ~/g-tercoa_eventos/frontend/node_modules
```

---

## 3. Configuração do Banco de Dados e Backend

```bash
# 1. Acessar a pasta do backend no Linux
cd ~/g-tercoa_eventos/backend

# 2. Instalar as dependências limpas
npm install --omit=dev

# 3. Configurar variáveis de ambiente
cp .env.example .env
nano .env
```

Ajuste as configurações no editor:
```env
PORT=5000
JWT_SECRET=sua_chave_secreta_super_segura

# Se for usar e-mail real, configure seu SMTP
SMTP_HOST=smtp.provedor.com
SMTP_PORT=587
SMTP_USER=seu-email@provedor.com
SMTP_PASS=sua_senha
SMTP_SECURE=false
EMAIL_FROM="G-TERCOA Eventos <seu-email@provedor.com>"
```
Salvar e sair (`Ctrl + O`, `Enter` e `Ctrl + X`).

O banco de dados SQLite (`database.db`) será criado automaticamente no primeiro início da aplicação.

---

## 4. Compilação do Frontend

1. **Ajuste da URL da API:**
   Certifique-se de que no arquivo `~/g-tercoa_eventos/frontend/src/App.jsx` a variável `API_URL` está configurada como string vazia:
   ```javascript
   const API_URL = '';
   ```
   *Isso garante que o frontend use rotas relativas, delegando o roteamento da API diretamente ao proxy reverso do Nginx.*

2. **Instalar dependências e realizar a build:**
   ```bash
   cd ~/g-tercoa_eventos/frontend
   npm install
   npm run build
   ```
   Os arquivos compilados otimizados serão gerados na pasta `~/g-tercoa_eventos/frontend/dist`.

---

## 5. Configuração do Servidor Web Nginx

O Nginx funcionará recebendo o tráfego externo e direcionando para os arquivos estáticos ou para a API em Node.js.

1. **Criar arquivo de configuração:**
   ```bash
   sudo nano /etc/nginx/sites-available/g-tercoa-eventos
   ```

2. **Colar o bloco de configuração:**
   ```nginx
   server {
       listen 80;
       server_name localhost 127.0.0.1;

       # Limite máximo de upload (necessário para imagens de perfil, banners e PDFs de submissão)
       client_max_body_size 50M;

       # Frontend (Arquivos estáticos compilados)
       location / {
           root /home/seu_usuario_wsl/g-tercoa_eventos/frontend/dist; # Substitua 'seu_usuario_wsl' pelo seu usuário Linux real
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Backend API (Porta 5000 do Express)
       location /api/ {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Pasta de uploads (Banners, imagens de convidados, etc)
       location /uploads/ {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
       }
   }
   ```
   *(Nota: para descobrir o seu usuário Linux atual, você pode digitar `whoami` no terminal).*

3. **Ativar o site e reiniciar o Nginx:**
   ```bash
   # Criar link simbólico
   sudo ln -s /etc/nginx/sites-available/g-tercoa-eventos /etc/nginx/sites-enabled/
   
   # Desativar a configuração padrão do Nginx (opcional, para liberar a porta 80)
   sudo rm /etc/nginx/sites-enabled/default
   
   # Testar configuração
   sudo nginx -t
   
   # Reiniciar o Nginx
   sudo service nginx restart
   ```

---

## 6. Gerenciamento com PM2 e WSL (Background)

Inicie o backend com o gerenciador PM2 para mantê-lo rodando de forma persistente:

```bash
cd ~/g-tercoa_eventos/backend
pm2 start index.js --name "gtercoa-backend"
```

### Mantendo o WSL Rodando
Por padrão, o Windows pode desligar a máquina WSL se não houver terminais ativos. 
- Para garantir que os serviços continuem rodando após fechar a janela do terminal, você pode rodar o WSL em segundo plano através do PowerShell do Windows:
  ```powershell
  # Comando no PowerShell para garantir a execução em segundo plano
  wsl --exec dbus-launch true
  ```
- Além disso, lembre-se de que os comandos `systemctl` ou `service` no WSL devem ser iniciados manualmente após reiniciar o Windows (a menos que você configure um script de inicialização do Windows ou use a opção `systemd` habilitada no `/etc/wsl.conf`).

Para ligar tudo manualmente no WSL ao iniciar a máquina:
```bash
sudo service nginx start
pm2 start gtercoa-backend
```

---

## 7. Acesso Externo (Windows e Rede Local)

1. **Acesso do próprio Windows:**
   O WSL compartilha a rede com o Windows Host. Portanto, basta abrir o seu navegador no Windows e acessar:
   `http://localhost/`

2. **Acesso a partir de outros dispositivos na Rede Local (LAN):**
   Para computadores ou celulares na mesma rede Wi-Fi acessarem o sistema, você precisará encontrar o IP do Windows (usando `ipconfig` no prompt de comando do Windows) e criar uma regra de redirecionamento de porta ou ponte de rede, caso o firewall do Windows bloqueie. 
   Normalmente, você pode liberar a porta `80` nas configurações de Entrada do **Firewall do Windows** para permitir conexões externas ao IP do computador hospedeiro.
