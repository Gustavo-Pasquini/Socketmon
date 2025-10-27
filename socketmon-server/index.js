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

// Armazena as roles dos jogadores
let playerRoles = {}; // {socketId: 'pokemon' | 'trainer'}

// Armazena jogadores aguardando partida por role
let pokemonPlayer = []; // Array de {id: string, name: string}
let trainerPlayer = []; // Array de {id: string, name: string}

// Armazena jogos ativos
let games = []; // Array de {trainer: string, pokemon: string}

io.on("connection", (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);
    conexoes++;
    ids.push(socket.id);
    console.log(`Total de conexões: ${conexoes}`);

    // Inicializa a posição do novo jogador
    playerPositions[socket.id] = { x: 100, y: 100 };

    socket.emit("your-id", socket.id);

    // Envia para o novo cliente todos os jogadores já conectados (exceto ele mesmo)
    const otherPlayers = {};
    for (const id in playerPositions) {
        if (id !== socket.id) {
            otherPlayers[id] = {
                position: playerPositions[id],
                role: playerRoles[id] || null
            };
        }
    }
    socket.emit('all-players', otherPlayers);

    // Notifica todos os outros clientes sobre o novo jogador
    socket.broadcast.emit('new-player', {
        id: socket.id,
        position: playerPositions[socket.id],
        role: playerRoles[socket.id] || null
    });

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

    socket.on("select-role", (data) => {
        console.log(`Jogador ${data.name + ' - ' + socket.id} selecionou o papel: ${data.role}`);

        // Armazena a role do jogador
        playerRoles[socket.id] = data.role;

        // Notifica todos os outros jogadores sobre a role deste jogador
        socket.broadcast.emit('player-role-update', {
            id: socket.id,
            role: data.role
        });

        const playerData = { id: socket.id, name: data.name };

        // Adiciona o jogador na lista correspondente à sua role
        if (data.role === 'pokemon') {
            pokemonPlayer.push(playerData);
            console.log(`Pokemon adicionado: ${data.name}. Total de pokemons aguardando: ${pokemonPlayer.length}`);
        } else if (data.role === 'trainer') {
            trainerPlayer.push(playerData);
            console.log(`Trainer adicionado: ${data.name}. Total de trainers aguardando: ${trainerPlayer.length}`);
        }

        // Verifica se há um trainer e um pokemon disponíveis para criar um jogo
        if (pokemonPlayer.length > 0 && trainerPlayer.length > 0) {
            // Remove o primeiro de cada lista (FIFO)
            const pokemon = pokemonPlayer.shift();
            const trainer = trainerPlayer.shift();

            // Cria um novo jogo
            const newGame = { trainer: trainer.id, pokemon: pokemon.id };
            games.push(newGame);

            console.log(`Novo jogo criado! Trainer: ${trainer.name} (${trainer.id}) vs Pokemon: ${pokemon.name} (${pokemon.id})`);
            console.log(`Total de jogos ativos: ${games.length}`);

            // Notifica os jogadores que o jogo foi criado
            io.to(trainer.id).emit('game-started', { role: 'trainer', opponent: pokemon.name, opponentId: pokemon.id, gameId: games.length - 1 });
            io.to(pokemon.id).emit('game-started', { role: 'pokemon', opponent: trainer.name, opponentId: trainer.id, gameId: games.length - 1 });
        }
    });

    socket.on('disconnect', function () {
        conexoes--;
        ids = ids.filter(id => id !== socket.id);

        // Remove a posição do jogador desconectado
        delete playerPositions[socket.id];
        delete playerRoles[socket.id];

        // Remove o jogador das listas de espera
        const pokemonIndex = pokemonPlayer.findIndex(p => p.id === socket.id);
        if (pokemonIndex !== -1) {
            const removed = pokemonPlayer.splice(pokemonIndex, 1)[0];
            console.log(`Pokemon ${removed.name} removido da lista de espera`);
        }

        const trainerIndex = trainerPlayer.findIndex(t => t.id === socket.id);
        if (trainerIndex !== -1) {
            const removed = trainerPlayer.splice(trainerIndex, 1)[0];
            console.log(`Trainer ${removed.name} removido da lista de espera`);
        }

        // Remove jogos que continham este jogador e notifica o oponente
        const gameIndex = games.findIndex(g => g.trainer === socket.id || g.pokemon === socket.id);
        if (gameIndex !== -1) {
            const game = games[gameIndex];
            const opponentId = game.trainer === socket.id ? game.pokemon : game.trainer;

            // Notifica o oponente que o jogo terminou
            io.to(opponentId).emit('game-ended', { reason: 'opponent-disconnected' });

            games.splice(gameIndex, 1);
            console.log(`Jogo removido devido à desconexão. Jogos ativos: ${games.length}`);
        }

        console.log(`Usuário desconectado: ${socket.id}`);

        // Notifica os outros clientes que este jogador saiu
        socket.broadcast.emit("player-disconnected", socket.id);
    });
})

server.listen(3001, () => {
    console.log("O servidor está ativo!!!");
})