# Guia de Desenvolvimento - Cyberpunk Survival

Este documento serve como um guia técnico completo para o desenvolvimento do projeto, detalhando sua arquitetura, arquivos principais e como continuar a implementação de novas funcionalidades.

## 1. Visão Geral do Projeto

**Cyberpunk Survival** é um jogo 3D de sobrevivência multiplayer, construído com as seguintes tecnologias:

-   **Frontend (Cliente):** HTML, CSS e JavaScript puro, utilizando a biblioteca **Three.js** para toda a renderização e lógica 3D.
-   **Backend (Servidor):** **Node.js** com a biblioteca **Socket.IO** para gerenciar a comunicação em tempo real (WebSockets) e a lógica de salas privadas do modo multiplayer.

## 2. Estrutura de Arquivos

-   `index.html`: A estrutura principal da página, contendo os elementos da UI (tela de sala, HUD, tela de Game Over) e o container para o canvas do jogo.
-   `css/style.css`: Contém todos os estilos visuais do projeto, incluindo a UI e os elementos do jogo.
-   `js/main.js`: **O arquivo mais importante.** Contém toda a lógica do lado do cliente, incluindo a renderização 3D, controle do jogador, IA dos inimigos, física e a comunicação com o servidor multiplayer.
-   `server.js`: O servidor backend. É responsável por criar e gerenciar as salas, e por retransmitir as informações de posição dos jogadores para que eles se vejam em tempo real.
-   `package.json`: Define as dependências do servidor Node.js (Express e Socket.IO).

## 3. Como Executar o Projeto

1.  **Instale as dependências do servidor:** Abra um terminal na pasta raiz do projeto e execute:
    ```bash
    npm install
    ```
2.  **Inicie o servidor:** No mesmo terminal, execute:
    ```bash
    node server.js
    ```
3.  **Abra o Jogo:** Abra um navegador (Chrome, Firefox, etc.) e acesse o endereço `http://localhost:3000`.
4.  **Teste o Multiplayer:** Abra uma segunda janela ou aba do navegador no mesmo endereço para simular um segundo jogador.

## 4. Arquitetura e Conceitos

### Lógica do Cliente (`js/main.js`)

-   **Inicialização:** O jogo **não** começa imediatamente. A lógica de UI em `DOMContentLoaded` espera o jogador criar ou entrar em uma sala. Uma vez que o servidor confirma a entrada em uma sala (via evento de socket), a função `startGame()` é chamada.
-   **`startGame()` -> `init()` -> `animate()`:** Esta é a sequência de inicialização correta. `startGame` chama `init()`, que constrói toda a cena 3D (jogador, mundo, luzes, etc.). Apenas no final de `init()`, a função `animate()` é chamada para iniciar o loop de renderização, evitando a tela preta.
-   **Game Loop:** `animate()` usa `requestAnimationFrame` para executar a função `update()` continuamente. `update()` é o coração do jogo, onde toda a lógica de movimento, colisão, IA e interações acontece a cada frame.
-   **Geração de Mundo:** A função `generateWorld()` é responsável por criar proceduralmente todos os elementos do cenário. Ela primeiro limpa os objetos antigos e depois gera novos.

### Lógica do Servidor (`server.js`)

-   **Gerenciamento de Salas:** O servidor utiliza a funcionalidade de `rooms` do Socket.IO. Ele não possui uma lógica de jogo, atuando apenas como um retransmissor de mensagens.
-   **Eventos de Socket:**
    -   `createRoom`: Cria uma sala com um ID aleatório.
    -   `joinRoom`: Adiciona um jogador a uma sala existente.
    -   `playerUpdate`: Recebe os dados de um jogador e envia para todos os outros na mesma sala.
    -   `disconnect`: Limpa o jogador da sala quando ele se desconecta.

## 5. Como Continuar o Desenvolvimento

-   **Para Modificar a Aparência de um Objeto:** Encontre sua função de criação (ex: `createDino`, `createPlayer`) e altere os parâmetros da geometria (`BoxGeometry`) ou do material (`MeshStandardMaterial`).

-   **Para Modificar uma Mecânica de Jogo (ex: pulo, velocidade):** A maioria da lógica de interações está na função `update()`. Localize o bloco de código relevante (ex: o bloco que processa o input `keys['KeyW']` para o movimento) e ajuste os valores.

-   **Para Adicionar Novos Itens ou Inimigos:**
    1.  Crie uma nova função `create...()` para construir o modelo 3D do objeto.
    2.  Em `generateWorld()`, chame sua nova função dentro de um loop para adicionar múltiplos desses objetos à cena e ao seu respectivo array (ex: `pickups.push(...)`).
    3.  Em `update()`, adicione um loop `forEach` para o array do seu novo objeto para definir seu comportamento a cada frame.

-   **Para Adicionar Novas Funcionalidades Multiplayer (ex: sincronizar vida dos inimigos):**
    1.  **Servidor (`server.js`):** O servidor precisaria se tornar a "fonte da verdade". Ele precisaria controlar a vida do inimigo. Crie um novo evento de socket (ex: `socket.on('enemy_hit', ...)`).
    2.  **Cliente (`js/main.js`):** Quando o jogador atirar em um inimigo, em vez de diminuir a vida localmente, ele deve emitir o evento para o servidor (ex: `socket.emit('enemy_hit', { enemyId: ..., damage: ... })`).
    3.  **Servidor (`server.js`):** Ao receber o evento, o servidor atualizaria a vida do inimigo e enviaria uma mensagem de volta para **todos** os clientes na sala (ex: `io.to(roomId).emit('enemy_state_update', ...)`), informando a nova vida do inimigo.
