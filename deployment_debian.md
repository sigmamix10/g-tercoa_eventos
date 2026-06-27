# Guia de Implantação: Servidor Debian / VPS Limpo

Este guia contém as instruções para implantar e configurar a plataforma **G-TERCOA Eventos** em um servidor **Debian** (ou Ubuntu) limpo, utilizando o script interativo `setup.sh`.

---

## ⚡ Método Rápido (Recomendado)

Se o seu servidor Debian estiver recém-instalado, você pode baixar o script de instalação diretamente do repositório do GitHub e executá-lo.

1. **Acesse o seu servidor Debian via SSH:**
   ```bash
   ssh seu_usuario@ip_do_servidor
   ```

2. **Baixe e execute o script de instalação interativa:**
   ```bash
   # Baixar o script
   curl -fsSL https://raw.githubusercontent.com/sigmamix10/g-tercoa_eventos/main/setup.sh -o setup.sh
   
   # Dar permissão de execução
   chmod +x setup.sh
   
   # Executar o script
   ./setup.sh
   ```
   *(Caso sua branch principal seja `master` em vez de `main`, altere `main` para `master` na URL acima).*

---

## ⚙️ Opções Disponíveis no Instalador Interativo

Ao executar o script `./setup.sh`, ele fará uma série de perguntas para configurar o ambiente ideal:

1. **Usuário do Sistema:**
   - O script perguntará qual usuário será o dono dos arquivos da aplicação (ex: `sigmamix`).
   - *Nota de Segurança:* Evite rodar e configurar o Node.js sob o usuário `root`. É recomendável usar o seu usuário comum (`sigmamix`). **Caso o usuário escolhido não exista, o script o criará e configurará automaticamente.**
2. **Origem dos Arquivos:**
   - `[1] GitHub`: O script clonará a versão mais recente do repositório diretamente para o servidor.
   - `[2] Pasta Local`: Se você já copiou os arquivos do projeto para o servidor via SFTP/SCP, escolha esta opção para usar os arquivos locais existentes.

---

## 🚀 Recursos e Otimizações de Produção Incluídos

O instalador conta com salvaguardas adicionais para garantir que tudo rode sem problemas:

* **Gerenciador de Swap Inteligente**: Em servidores VPS com menos de 1.5GB de RAM livres, o script detectará a falta de memória e oferecerá a criação automática de uma partição Swap de 2GB (`/swapfile`). Isso evita que o processo de compilação do React/Vite aborte com o erro `Killed` por falta de memória.
* **Isolamento e Segurança de Processos**: Toda a compilação do frontend, instalação do npm e o processo do backend pelo PM2 rodam sob o contexto do usuário comum escolhido (e não como `root`), o que previne vulnerabilidades de segurança e problemas com permissões de arquivos no futuro.
* **Entrega Estática via Nginx**: O Nginx foi configurado para servir a pasta `/uploads/` diretamente do disco utilizando cache estático (`alias`), reduzindo a carga no processo Node.js e proporcionando carregamentos ultra-rápidos de banners e mídias de eventos.

---
3. **Domínio ou IP Público:**
   - Digite o seu domínio (ex: `gtercoa.org` ou `eventos.seu-dominio.com`) ou o IP público do servidor. O Nginx usará isso para configurar as rotas.
4. **Porta HTTP:**
   - O padrão agora é a porta `8080` para evitar conflitos com outros servidores web já existentes no sistema. Caso queira rodar em outra porta (como a porta 80), basta alterá-la.
5. **E-mail e Senha Administrativos:**
   - Insira o e-mail e senha padrão do administrador principal do site de eventos. O instalador irá gerar as variáveis de ambiente e popular o banco de dados SQLite automaticamente.
6. **Configuração de SMTP (Opcional):**
   - Escolha se deseja ativar e configurar o envio de e-mails reais de confirmação de inscrições e submissões imediatamente.
7. **Certificado SSL HTTPS Gratuito (Opcional):**
   - Se você digitou um domínio real apontando para o IP do seu servidor, escolha `S` (Sim). O script instalará o `Certbot`, configurará o certificado seguro de forma automática e fará com que o site rode via `https://` redirecionando todo o tráfego HTTP.

---

## 🛠️ Comandos de Gerenciamento Pós-Instalação

Depois que o script terminar com sucesso, a aplicação backend estará rodando via **PM2** e o servidor web via **Nginx**.

Para gerenciar o sistema no dia a dia, conecte-se ao servidor com o usuário configurado (ex: `sigmamix`) e utilize os comandos abaixo:

### Monitoramento do Backend (PM2)
* **Ver o status dos processos:**
  ```bash
  pm2 status
  ```
* **Ver os logs em tempo real (muito útil para depuração):**
  ```bash
  c
  ```
* **Reiniciar a API:**
  ```bash
  pm2 restart gtercoa-backend
  ```
* **Parar a API:**
  ```bash
  pm2 stop gtercoa-backend
  ```

### Gerenciamento do Servidor Web (Nginx)
* **Reiniciar o Nginx (após mudanças de porta ou domínio):**
  ```bash
  sudo systemctl restart nginx
  # ou
  sudo service nginx restart
  ```
* **Verificar erros do Nginx:**
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```
