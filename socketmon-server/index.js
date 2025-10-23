const express = require('express');
const http = require('http');

const app = express();

const { Server } = require('socket.io');
const cors = require('cors');
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Alterar depois de acordo com a porta
        methods: ['GET', 'POST']
    },
    // Configurações otimizadas para baixa latência (UDP-like)
    pingInterval: 25000,
    pingTimeout: 60000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6,
    transports: ['websocket', 'polling'], // Websocket primeiro para menor latência
    allowUpgrades: true,
    perMessageDeflate: false, // Desabilita compressão para menor latência
    httpCompression: false
})

let conexoes = 0;

let ids = []

// Armazena as posições de todos os jogadores
let playerPositions = {};

io.on("connection", (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);
    conexoes++;
    ids.push(socket.id);
    console.log(`Total de conexões: ${conexoes}`);

    // Inicializa a posição do novo jogador
    playerPositions[socket.id] = { x: 100, y: 100 };

    socket.emit("your-id", socket.id);

    // Envia para o novo cliente todos os jogadores já conectados (exceto ele mesmo)
    const otherPlayers = { ...playerPositions };
    delete otherPlayers[socket.id];
    socket.emit('all-players', otherPlayers);

    // Notifica todos os outros clientes sobre o novo jogador
    socket.broadcast.emit('new-player', { id: socket.id, position: playerPositions[socket.id] });

    socket.on("message", (data) => {
        console.log(`Mensagem recebida: ${data}`);
    })

    socket.on("player-move", (position) => {
        // Atualiza a posição do jogador no servidor
        playerPositions[socket.id] = position;

        // Remove log para melhor performance
        // Broadcast sem acknowledgement para menor latência (UDP-like)
        socket.volatile.broadcast.emit("player-move", { id: socket.id, position })
    })

    socket.on('disconnect', function () {
        conexoes--;
        ids = ids.filter(id => id !== socket.id);

        // Remove a posição do jogador desconectado
        delete playerPositions[socket.id];

        console.log(`Usuário desconectado: ${socket.id}`);

        // Notifica os outros clientes que este jogador saiu
        socket.broadcast.emit("player-disconnected", socket.id);
    });
})

server.listen(3001, () => {
    console.log("O servidor está ativo!!!");
})