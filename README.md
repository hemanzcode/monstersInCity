# Cyberpunk Survival

Um jogo 3D de sobrevivência em um ambiente cyberpunk, construído com **Three.js** e **Socket.IO**. O jogo é executado no navegador e permite que múltiplos jogadores interajam no mesmo mundo através de salas privadas.

## Sobre o Jogo

O objetivo em **Cyberpunk Survival** é sobreviver em uma cidade futurista gerada proceduralmente. Lute contra monstros, encontre suprimentos e jogue com amigos para ver quem sobrevive por mais tempo.

## Funcionalidades

- **Gráficos 3D:** O mundo do jogo é renderizado em 3D usando a biblioteca Three.js.
- **Modo Multiplayer:** Crie salas privadas e jogue com amigos.
- **Sincronização em Tempo Real:** As posições dos jogadores são sincronizadas em tempo real usando WebSockets (Socket.IO).
- **Colisão entre Jogadores:** Jogadores não podem atravessar uns aos outros.
- **Mundo Gerado Proceduralmente:** A cidade é gerada de forma diferente a cada nova partida.
- **Sistema de Sobrevivência:** Gerencie seus pontos de **Vida** e **Stamina**.
- **Itens e Armas:** Encontre suprimentos para recuperar vida, stamina ou obter uma arma.

## Como Jogar

Este projeto requer um servidor Node.js para gerenciar o modo multiplayer.

1.  **Instale as dependências:** No terminal, na pasta do projeto, execute:
    ```
    npm install
    ```
2.  **Inicie o servidor:** Em seguida, execute:
    ```
    node server.js
    ```
3.  **Abra o jogo:** Abra seu navegador e acesse `http://localhost:3000`.
4.  **Jogue com amigos:**
    - Um jogador deve clicar em "Criar Sala". Um ID de sala será exibido.
    - Outros jogadores podem usar esse ID para entrar na mesma sala.

### Controles

-   **Movimento:** `WASD`
-   **Pular:** `Barra de Espaço`
-   **Atirar:** `Clique do Mouse`