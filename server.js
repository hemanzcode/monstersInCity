const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve os arquivos estáticos da pasta raiz
app.use(express.static(__dirname));

const rooms = {};

io.on('connection', (socket) => {
    console.log('Um jogador se conectou:', socket.id);

    socket.on('createRoom', () => {
        let roomId = Math.random().toString(36).substring(2, 7);
        while (rooms[roomId]) {
            roomId = Math.random().toString(36).substring(2, 7);
        }
        socket.join(roomId);
        rooms[roomId] = { players: { [socket.id]: {} } };
        socket.emit('roomCreated', roomId);
        console.log(`Sala ${roomId} criada por ${socket.id}`);
    });

    socket.on('joinRoom', (roomId) => {
        if (rooms[roomId]) {
            socket.join(roomId);
            const playersInRoom = rooms[roomId].players;
            socket.emit('joinedRoom', playersInRoom); // Envia os jogadores existentes para o novo jogador

            rooms[roomId].players[socket.id] = { position: {x: 0, y: 2, z: 0}, rotation: {x: 0, y: 0, z: 0} }; // Posição inicial
            
            // Notifica os outros jogadores na sala sobre o novo jogador
            socket.to(roomId).emit('playerJoined', { id: socket.id, position: rooms[roomId].players[socket.id].position });
            console.log(`${socket.id} entrou na sala ${roomId}`);
        } else {
            socket.emit('error', 'Sala não encontrada');
        }
    });

    socket.on('playerUpdate', (data) => {
        const roomId = Object.keys(socket.rooms).find(r => r !== socket.id);
        if (roomId) {
            socket.to(roomId).broadcast.emit('playerUpdate', { id: socket.id, ...data });
        }
    });

    socket.on('playerShoot', (data) => {
        const roomId = Object.keys(socket.rooms).find(r => r !== socket.id);
        if (roomId) {
            socket.to(roomId).broadcast.emit('playerShot', { id: socket.id, ...data });
        }
    });

    socket.on('disconnect', () => {
        console.log('Um jogador se desconectou:', socket.id);
        const roomId = Object.keys(socket.rooms).find(r => r !== socket.id);
        if (roomId && rooms[roomId]) {
            delete rooms[roomId].players[socket.id];
            io.to(roomId).emit('playerLeft', socket.id);
            if (Object.keys(rooms[roomId].players).length === 0) {
                delete rooms[roomId];
                console.log(`Sala ${roomId} está vazia e foi removida.`);
            }
        }
    });
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

module.exports = { server, io, rooms };
