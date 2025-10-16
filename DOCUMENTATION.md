# Documentação Técnica - Cyberpunk Survival

Este documento detalha as funções principais do projeto, incluindo o cliente (`js/main.js`) e o servidor (`server.js`).

## Arquivo do Cliente (`js/main.js`)

Controla toda a lógica executada no navegador do jogador.

### Funções Principais de Jogo

#### `init()`
- **Propósito:** Inicializa todos os componentes essenciais do jogo. É chamada uma única vez quando o jogo começa.
- **Ações:**
    - Cria a cena 3D, luzes, câmera e renderizador.
    - Cria o jogador local (`createPlayer`).
    - Gera o mundo do jogo (`generateWorld`).
    - Configura todos os event listeners para os controles do jogador (teclado e mouse).
    - Inicia o loop de animação (`animate`) **após** tudo estar pronto.

#### `animate()`
- **Propósito:** Controla o loop de renderização principal (`requestAnimationFrame`).
- **Ações:**
    - Chama a função `update()` a cada frame se o jogo tiver começado.
    - Renderiza a cena 3D.

#### `update()`
- **Propósito:** Atualiza o estado de todos os elementos do jogo a cada frame.
- **Ações:**
    - Processa inputs do jogador para movimento.
    - Atualiza a posição do jogador, verificando colisões (`checkCollision`).
    - Controla a animação de caminhada.
    - Gerencia a física de pulo e gravidade.
    - Atualiza a IA e a posição dos inimigos.
    - **Anima a mordida do dinossauro** quando próximo ao jogador.
    - Verifica se um inimigo foi atingido por um projétil.
    - Atualiza a posição dos veículos e verifica colisão com o jogador.
    - Verifica se o jogador coletou algum item (`pickups`).
    - Envia os dados de posição do jogador para o servidor a cada 100ms.
    - Atualiza a interface (HUD).

### Funções de Geração de Mundo

#### `generateWorld()`
- **Propósito:** Cria e posiciona todos os objetos que compõem o cenário do jogo.
- **Ações:** Limpa objetos antigos e gera novos: chão, ruas, prédios, veículos, itens e inimigos.

#### `createPlayer()`
- **Propósito:** Função de fábrica que cria o modelo 3D para um jogador, composto por várias geometrias básicas.

#### `createDino()`
- **Propósito:** Cria o modelo 3D para o dinossauro. O modelo inclui um corpo, cabeça, cauda, pernas, olhos e uma **mandíbula inferior separada** (`lowerJaw`) para permitir a animação de mordida.

### Funções de Lógica e UI

#### `checkCollision(x, z)`
- **Propósito:** Verifica se uma coordenada colide com prédios, veículos ou outros jogadores.

#### `startGame()`
- **Propósito:** Inicia o jogo após o jogador criar ou entrar em uma sala.

---

## Arquivo do Servidor (`server.js`)

Controla a comunicação multiplayer usando Node.js, Express e Socket.IO.

### `io.on('connection', ...)`
- **Propósito:** Evento principal que gerencia todas as novas conexões de jogadores.

#### `socket.on('createRoom', ...)`
- **Propósito:** Acionado quando um jogador pede para criar uma sala. Gera um ID de sala único, inscreve o socket do jogador nela e envia o ID de volta para o jogador.

#### `socket.on('joinRoom', ...)`
- **Propósito:** Acionado quando um jogador tenta entrar em uma sala com um ID. Verifica se a sala existe, inscreve o jogador nela e notifica os outros jogadores da sala sobre o novo participante.

#### `socket.on('playerUpdate', ...)`
- **Propósito:** Recebe os dados de posição e rotação de um jogador e os retransmite para todos os outros jogadores na mesma sala.

#### `socket.on('disconnect', ...)`
- **Propósito:** Acionado quando um jogador se desconecta. Remove o jogador da sua sala e notifica os participantes restantes.