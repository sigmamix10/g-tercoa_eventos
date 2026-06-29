# Walkthrough: SMTP, React Router, Coordenação de Eixos, Controle de Frequência e Quiosque

Todas as melhorias no backend (e-mails reais, variáveis de ambiente, coordenação de eixos, blind review, APIs de frequência) e no frontend (landing pages com rotas limpas, telas de coordenação, sigilo de autoria, e acompanhamento em tempo real de frequência do participante e painel de credenciamento do admin) foram implementadas e verificadas com sucesso!

---

## Parte 1: Configuração de E-mails via SMTP e Arquivos `.env`

### Mudanças Realizadas
* **Dependências do Backend**: Adicionadas as bibliotecas `nodemailer` e `dotenv`.
* **[NEW] [.env.example](file:///d:/g-tercoa_eventos/backend/.env.example)**: Criado modelo de variáveis para porta do servidor, segredo JWT e conexão SMTP.
* **[MODIFY] [index.js](file:///d:/g-tercoa_eventos/backend/index.js)**: Configurada a carga do `.env` e leitura de portas e segredos de forma dinâmica.
* **[MODIFY] [email.js](file:///d:/g-tercoa_eventos/backend/email.js)**: Implementada a lógica SMTP com fallback automático para simulação em arquivos locais caso não esteja configurado.

---

## Parte 2: Roteamento Limpo de Eventos (React Router)

### Mudanças Realizadas
* **[MODIFY] [main.jsx](file:///d:/g-tercoa_eventos/frontend/src/main.jsx)**: Envolvido o app `<App />` no componente `<BrowserRouter>` para habilitar roteamento HTML5.
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**: 
  * Importados os hooks e componentes do `react-router-dom` (`Routes`, `Route`, `Link`, `useNavigate`, `useParams`, `Navigate`).
  * Removidos os estados obsoletos de navegação (`activeView`, `currentEventSlug`, `currentEvent`).
  * Configurado o cabeçalho e links de navegação para usar caminhos reais (`/`, `/verify`, `/dashboard`).
  * Implementadas as definições de rotas com proteção simples para o `/dashboard`.
  * Adaptado o componente `HomeView` para usar `useNavigate` e direcionar o usuário para `/evento/:slug`.
  * Adaptado o componente `EventEditionView` para capturar dinamicamente o parâmetro `:slug` da URL via `useParams()`, buscar os dados do evento de forma independente no backend e renderizar telas de carregamento/erro apropriadas.

---

## Parte 3: Coordenação de Eixos Temáticos e Avaliação às Cegas (Blind Review)

### Mudanças Realizadas

#### 1. Banco de Dados e API do Backend
* **[MODIFY] [db.js](file:///d:/g-tercoa_eventos/backend/db.js)**: Criada a tabela `event_assignments` para registrar as funções de coordenador de eixo ou avaliador geral por evento.
* **[MODIFY] [index.js](file:///d:/g-tercoa_eventos/backend/index.js)**:
  * Criadas as rotas de gerência do admin: listar, designar e remover coordenadores (por eixo temático) e avaliadores.
  * Criadas as rotas para o coordenador de eixo: `GET /api/coordination/submissions` (lista submissões do eixo sem expor autoria) e alocação de avaliadores por submissão (`POST /api/submissions/:id/assign-evaluator`).
  * Criada a rota de tomada de decisão final do coordenador de eixo (`POST /api/submissions/:id/coordinator-decision`).
  * Atualizadas as rotas de trabalhos a avaliar (`GET /api/submissions/to-review`) e de listagem do participante (`GET /api/submissions/my-submissions`) para omitir dados confidenciais de autoria e revisão, garantindo o sigilo absoluto às cegas.

#### 2. Interface do Frontend
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Workspace do Admin**: Adicionada a aba "Comissão & Avaliadores" na gerência de eventos, permitindo designar avaliadores gerais e associar coordenadores a eixos específicos do evento.
  * **Menu da Dashboard**: Adicionado o link "Coordenação de Eixos" na barra lateral para avaliadores e administradores.
  * **[NEW] Componente `CoordinatorSubmissionsView`**: Desenvolvido do zero para exibir a lista de artigos submetidos no eixo do coordenador logado. Permite ao coordenador baixar o documento, alocar um dos avaliadores cadastrados no evento e dar o parecer final (aceito, rejeitado, ressalvas).
  * **[MODIFY] Componente `EvaluatorReviewsView`**: Removida a exibição do nome do autor principal e coautores para que o parecerista técnico faça a revisão às cegas.

---

## Parte 4: Frequência em Atividades e Painel do Participante

### Mudanças Realizadas

#### 1. Banco de Dados e APIs do Backend
* **[MODIFY] [db.js](file:///d:/g-tercoa_eventos/backend/db.js)**: Criada a tabela `activity_presences` para registrar de maneira única e associada a presença de usuários em atividades específicas.
* **[MODIFY] [index.js](file:///d:/g-tercoa_eventos/backend/index.js)**:
  * Criada a rota de estatísticas de frequência do participante logado: `GET /api/events/:id/my-frequency` para retornar a contagem de atividades, presenças, o percentual acumulado e a lista detalhada.
  * Criadas as rotas de gerenciamento para o admin: `GET /api/activities/:activityId/presences` para listar presentes, `POST /api/activities/:activityId/checkin` para atualizar presenças e `POST /api/activities/:activityId/checkin-kiosk` para registrar presença automática via CPF/Credencial no Modo Quiosque.

#### 2. Interface do Frontend
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Painel do Admin (`AdminCheckinView`)**: Adicionada a seleção de atividades no dropdown "Tipo de Controle / Chamada". Ao selecionar uma atividade, todo o painel, estatísticas ao vivo, modo quiosque de autoatendimento, QR Code scanner e listagem de participantes passam a registrar presença para a atividade em questão.
  * **Painel do Participante (`ParticipantRegistrationCard`)**: Integrada a exibição visual da frequência acumulada. Se a frequência for menor que 75%, ela é exibida em vermelho/laranja. Se atingir 75% ou mais, fica verde e exibe o selo de requisito atingido. Permite também expandir o detalhamento para ver o status "Presente/Ausente" de cada atividade.

---

## Verificação e Testes Realizados

A funcionalidade de controle de frequências foi testada ponta a ponta e validada visualmente na interface do participante:

1. **Frequência a 67% (Menor que 75%)**: 
   Ao registrar a presença do participante em 2 de 3 atividades do evento, o painel do participante atualizou instantaneamente para exibir **67%** de frequência acumulada e a barra de progresso em vermelho/laranja sinalizando que os requisitos mínimos de certificado ainda não foram cumpridos.
   
   ![Frequência de 67%](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/freq_67_percent_1782229952136.png)

2. **Frequência a 100% (Atingida)**: 
   Após registrar a presença do participante na terceira atividade, a interface atualizou em tempo real para exibir **100%** de frequência acumulada, a barra de progresso em verde e a indicação de **Requisito de Certificado Atingido**, com todas as três atividades listadas como **Presente**.
   
   ![Frequência de 100%](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/freq_100_percent_1782230173707.png)

---

## Parte 5: Nova Aba "Excluir Evento" (Danger Zone) com Formulário de Justificativa

### Mudanças Realizadas

#### 1. Interface do Usuário (Frontend)
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Remoção de botões flutuantes**: O botão vermelho de exclusão rápida (lixeira) foi retirado do lado do botão "Gerenciar" no grid de eventos para prevenir acidentes.
  * **Nova Aba**: Adicionada a aba vermelha estilizada **Excluir Evento** na interface de gerenciamento de edições de eventos.
  * **Formulário de Confirmação**: Desenvolvida a view do formulário contendo:
    * Menu de seleção obrigatória com motivos comuns de exclusão ("Cancelamento do evento", "Erro de cadastro", "Outro").
    * Validação dupla de segurança: o usuário deve marcar uma caixa de confirmação de termos irreversíveis e digitar exatamente o nome do evento atual para desbloquear o botão de exclusão.
    * Processo livre de popups do navegador (`window.confirm`). A confirmação é totalmente embutida na UI.

#### 2. Processamento e Logs (Backend)
* **[MODIFY] [index.js](file:///d:/g-tercoa_eventos/backend/index.js)**:
  * O endpoint `DELETE /api/events/:id` agora lê a justificativa/motivo da exclusão enviado no body da requisição (`req.body.reason`) e o registra de forma permanente nos logs do servidor.

---

## Verificação e Testes Realizados

1. **Aba Danger Zone (Excluir Evento)**:
   A nova aba foi renderizada no painel de gerenciamento exibindo a explicação detalhada do impacto da exclusão e os campos de validação.
   
   ![Nova Aba de Excluir Evento](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/delete_event_tab_1782235650952.png)

2. **Remoção de Botões Rápidos**:
   A lista de eventos do Workspace não possui mais o ícone de lixeira, necessitando que o administrador clique explicitamente em "Gerenciar" e passe pela "Danger Zone".
   
   ![Visual do Grid sem Lixeiras](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/event_deletion_success_1782235567878.png)

---

## Parte 6: Capa do Evento por meio de Envio de Arquivos (PNG/JPG) e Integração de Upload

### Mudanças Realizadas
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Novo Controle de Upload**: No painel de gerenciamento de edições de eventos, na aba "Ajustes Adicionais & Banner", foi inserido um campo de upload de arquivo (`PNG`, `JPG`, etc.) para a capa do evento.
  * **Valores e Fallbacks Dinâmicos**: A URL da imagem continua aceitando URLs externas para imagens hospedadas em outros serviços, garantindo total flexibilidade ao usuário.
  * **Helper `getImageUrl`**: Adicionada a função auxiliar `getImageUrl` que detecta dinamicamente se a imagem está hospedada externamente (URL absoluta) ou localmente no servidor backend (caminho relativo como `/uploads/imagem.png`), resolvendo o endereço correto.
  * **Adequação Global**: Atualizados todos os pontos de exibição de imagens (capas na home, detalhes do evento, fotos dos palestrantes e logos dos apoiadores) para usarem a função `getImageUrl`, evitando links quebrados quando arquivos locais são enviados.

### Verificação Visual

A integração do novo formulário de capa com upload de arquivos PNG/JPG foi testada e documentada:

1. **Interface de Upload de Capa**:
   O painel agora contém o botão de envio de arquivo juntamente com a opção de link manual, ambos sincronizados com o backend.

   ![Ajustes de Banner e Upload](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/adjustments_banner_card_1782416691968.png)

---

## Parte 7: Link de Transmissão por Atividade na Programação

### Mudanças Realizadas

#### 1. Banco de Dados e API do Backend
* **[MODIFY] [db.js](file:///d:/g-tercoa_eventos/backend/db.js)**: Adicionada a coluna `transmission_link` à tabela `activities`. Criada a rotina de migração automática para bases de dados existentes.
* **[MODIFY] [index.js](file:///d:/g-tercoa_eventos/backend/index.js)**: Atualizados os endpoints `POST /api/events/:id/activities` e `PUT /api/activities/:id` para receber, validar e salvar o link de transmissão da atividade.

#### 2. Interface do Frontend
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Formulário de Atividades**: Adicionado o campo "Link de Transmissão (YouTube/Meet/etc.)" no cadastro de atividades do painel de administração.
  * **Tabela de Atividades (Admin)**: Exibição do botão/link de transmissão na tabela de atividades cadastradas.
  * **Página de Detalhes do Evento (Público)**: Exibição dinâmica do botão com ícone de câmera de vídeo `<Video />` e link "Link de Transmissão / Vídeo" na listagem de programação do evento para o participante, caso a atividade possua link de transmissão.

### Verificação Visual

A funcionalidade foi testada de ponta a ponta e validada visualmente na programação do evento:

1. **Link de Transmissão na Programação**:
   A atividade cadastrada exibe o botão estilizado com o link fornecido para direcionar os participantes para a transmissão ao vivo ou gravação.

   ![Link de Transmissão na Programação](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/transmission_link_1782417810519.png)

---

## Parte 8: Recursos de Acessibilidade (Tamanho da Fonte, Alto Contraste e VLibras do Governo Federal)

### Mudanças Realizadas

#### 1. Estrutura HTML (Vite Core)
* **[MODIFY] [index.html](file:///d:/g-tercoa_eventos/frontend/index.html)**: Integrado o script e marcação do **VLibras Widget**, ferramenta oficial de acessibilidade digital do Governo Federal brasileiro para tradução automática em tempo real para a Língua Brasileira de Sinais (LIBRAS).

#### 2. Folhas de Estilo (CSS)
* **[MODIFY] [index.css](file:///d:/g-tercoa_eventos/frontend/src/index.css)**:
  * **Barra de Acessibilidade**: Adicionado o estilo da nova barra superior contendo atalhos e botões para controles de tamanho de fonte e contraste.
  * **Tema de Alto Contraste**: Implementada a classe global `.contrast-mode` que sobrescreve variáveis de cores CSS para preto e amarelo/branco de alta visibilidade, em conformidade com as diretrizes do eMAG (Modelo de Acessibilidade em Governo Eletrônico).
  * **Teclado e Acessibilidade Visual**: Definidos focos visuais claros (`*:focus-visible`) com contornos violetas bem demarcados para melhor visualização na navegação por teclado.

#### 3. Logística e Layout do Frontend
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Barra Superior de Controles**: Adicionada a barra superior de acessibilidade contendo o link de atalho "Ir para o conteúdo [1]" e botões para ativar "Alto Contraste", "Aumentar Fonte (A+)", "Diminuir Fonte (A-)" e "Resetar Fonte (A Padrão)".
  * **Gerenciamento de Estado**: Adicionados hooks `useEffect` e variáveis de controle no localStorage para manter as preferências de tamanho de fonte e contraste ativas entre atualizações de página ou sessões do navegador.
  * **Ajuste Proporcional**: A variação do tamanho da fonte altera dinamicamente a propriedade `fontSize` do elemento raiz (`html`), garantindo que todos os elementos dimensionados com unidades `rem` escalem de forma perfeita e responsiva.

---

### Verificação Visual

1. **Ativação do Modo de Alto Contraste**:
   Ao selecionar "Alto Contraste", todos os cards, formulários e textos da plataforma mudam dinamicamente para cores contrastantes sob fundo preto absoluto.

   ![Modo de Alto Contraste Ativo](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/high_contrast_active_1782418212523.png)

2. **Tradutor de LIBRAS (VLibras) Carregado**:
   O assistente virtual de LIBRAS é carregado na borda direita da tela, permitindo tradução simultânea ao clicar em qualquer texto.

   ![VLibras Carregado na Lateral](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/vlibras_widget_open_1782418248167.png)

---

## Parte 9: Reorganização de Layout, Edição de Atividades e Exclusão Inline Segura

### Mudanças Realizadas

#### 1. Layout Stacked (Vertical)
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Reorganização de Tabs**: Removido o grid multi-colunas que espremia as áreas de cadastro de convidado, cadastro de atividade e tabela de programação.
  * **Empilhamento Limpo**: Reconfigurado os estilos de container para `flex-direction: column`, alinhando os blocos "Cadastrar Convidado", "Criar/Editar Atividade" e "Programação Cadastrada" verticalmente um abaixo do outro com espaçamento uniforme.

#### 2. Fluxo de Edição de Atividades
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Controle de Estado de Edição**: Introduzido a variável `editingActivityId` para gerenciar a atividade em foco de edição.
  * **Integração de Formulário**: Ao clicar em "Editar" na listagem, o formulário de cadastro é preenchido com todos os campos existentes da atividade e o título muda para "Editar Atividade". O botão principal se converte em "Salvar Alterações" e é adicionado o botão "Cancelar Edição".
  * **Comunicação com Servidor**: Modificado `handleSubmitActivity` para realizar chamada `PUT` para o endpoint `/api/activities/:id` caso esteja em modo de edição.

#### 3. Exclusão Inline Segura (Sem Popups)
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Remoção de Popup do Navegador**: Eliminada a chamada a `window.confirm` que gerava janelas bloqueantes no navegador.
  * **Confirmação em UI**: Ao clicar em "Remover", a linha da tabela substitui as ações por botões inline de "Sim" (confirmar exclusão) e "Não" (cancelar operação).

---

### Verificação Visual

1. **Formulário de Edição de Atividade**:
   O formulário carrega os valores para alteração, atualizando o cabeçalho e exibindo o controle de cancelamento.

   ![Formulário de Edição](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/edit_activity_form_1782419855035.png)

2. **Botões de Confirmação Inline**:
   Confirmação de remoção exibida inline na linha da atividade selecionada.

   ![Confirmação Inline de Remoção](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/inline_delete_confirmation_1782420050130.png)

---

## Parte 10: Separação das Abas de Convidados e Programação

### Mudanças Realizadas
* **[MODIFY] [App.jsx](file:///d:/g-tercoa_eventos/frontend/src/App.jsx)**:
  * **Divisão de Módulo**: Dividida a aba "Convidados & Programação" em duas abas totalmente independentes e dedicadas: **Convidados** e **Programação**.
  * **Aba Convidados**: Renders `renderGuestsTab()`, contendo apenas o formulário de cadastro de palestrantes/mediadores e a listagem de convidados do evento atual.
  * **Aba Programação**: Renders `renderActivitiesTab()`, contendo apenas o formulário de cadastro/edição de atividades e a tabela com a programação geral do evento.
  * **Navegação de Tabs**: Adicionados ícones apropriados e links de controle para selecionar de forma modular cada uma das abas.

---

### Verificação Visual

A separação das abas foi verificada no dashboard do administrador:

1. **Aba de Convidados Separada**:
   Exibe exclusivamente o painel de cadastro de convidados e a listagem de palestrantes/mediadores vinculados à edição.

   ![Aba de Convidados](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/convidados_tab_1782420449284.png)

2. **Aba de Programação Separada**:
   Exibe exclusivamente o painel de criação/edição de atividades e a tabela da programação com links de transmissão e botões de exclusão inline.

   ![Aba de Programação](C:/Users/profr/.gemini/antigravity-ide/brain/53161561-0d59-44a2-931c-1a921af30537/programacao_tab_1782420477936.png)

---

## Parte 11: Correção na Criação de Eventos (Mapeamento SQL e WSL Sync)

### Mudanças Realizadas
* **[MODIFY] [index.js](file:///d:/g-tercoa_eventos/backend/index.js)**:
  * Corrigida a consulta SQL `INSERT INTO events` no endpoint de criação de eventos (`POST /api/events`). O mapeamento anterior continha um desalinhamento entre o número de colunas (28 colunas no cabeçalho) e o número de parâmetros fornecidos no array (30 valores, incluindo os novos campos `cert_bg_front_url` e `cert_bg_back_url`).
  * Adicionadas as colunas ausentes `cert_bg_front_url` e `cert_bg_back_url` à lista do `INSERT` e adicionados mais dois placeholders `?` para coincidir com os 30 parâmetros fornecidos.
* **[MODIFY] [test_db.js](file:///d:/g-tercoa_eventos/backend/test_db.js)**:
  * Sincronizadas as credenciais do admin nos testes de integração do banco de dados de `admin@gtercoa.org` (com senha `admin`) para `tercoa.monitoria@gmail.com` (com senha `G-tercoaufc@2024`), correspondendo aos valores reais semeados por padrão no arquivo `db.js`.
* **Sincronização com WSL**:
  * Os arquivos alterados foram copiados para o sistema de arquivos nativo do WSL Ubuntu (`~/g-tercoa_eventos/backend/`) e o serviço no PM2 (`gtercoa-backend`) foi reiniciado para aplicar as correções no banco de dados MySQL externo.
