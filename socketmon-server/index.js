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

// Armazena as roles dos jogadores
let playerRoles = {}; // {socketId: 'pokemon' | 'trainer'}

// Armazena jogadores aguardando partida por role
let pokemonPlayer = []; // Array de {id: string, name: string}
let trainerPlayer = []; // Array de {id: string, name: string}

// Armazena jogos ativos
let games = []; // Array de {trainer: string, pokemon: string, pokemonPosition: number, currentTurn: string, disabledGrids: number[], attempts: number, trainerName: string, pokemonName: string}

io.on("connection", (socket) => {
    console.log(`Usuário conectado: ${socket.id}`);
    conexoes++;
    ids.push(socket.id);
    console.log(`Total de conexões: ${conexoes}`);

    socket.emit("your-id", socket.id);

    // Envia para o novo cliente todos os jogadores já conectados (exceto ele mesmo)
    const otherPlayers = {};
    for (const id of ids) {
        if (id !== socket.id) {
            otherPlayers[id] = {
                role: playerRoles[id] || null
            };
        }
    }
    socket.emit('all-players', otherPlayers);

    // Notifica todos os outros clientes sobre o novo jogador
    socket.broadcast.emit('new-player', {
        id: socket.id,
        role: playerRoles[socket.id] || null
    });

    socket.on("chat-message", (data) => {
        console.log(`Mensagem de chat de ${data.sender}: ${data.text}`);

        // Envia a mensagem para o destinatário específico
        if (data.to) {
            io.to(data.to).emit('chat-message', {
                sender: data.sender,
                text: data.text
            });
        }
    })

    socket.on("pokemon-select-position", (data) => {
        console.log(`Pokemon ${socket.id} selecionou posição: ${data.gridNumber}`);

        // Encontra o jogo onde este socket é o pokemon
        const game = games.find(g => g.pokemon === socket.id);

        if (!game) {
            socket.emit('error', { message: 'Jogo não encontrado' });
            return;
        }

        // Verifica se é o turno do pokemon
        if (game.currentTurn !== 'pokemon') {
            socket.emit('error', { message: 'Não é o seu turno' });
            return;
        }

        // Verifica se a posição já foi desabilitada
        if (game.disabledGrids.includes(data.gridNumber)) {
            socket.emit('error', { message: 'Posição já desabilitada' });
            return;
        }

        // Armazena a posição do pokemon
        game.pokemonPosition = data.gridNumber;
        game.currentTurn = 'trainer'; // Passa o turno para o trainer

        console.log(`Pokemon escondeu-se na posição ${data.gridNumber}. Turno do Trainer.`);

        // Notifica ambos os jogadores
        io.to(game.pokemon).emit('position-selected', { success: true });
        io.to(game.trainer).emit('your-turn', {
            message: 'Sua vez de adivinhar!',
            disabledGrids: game.disabledGrids,
            attempts: game.attempts
        });
        io.to(game.pokemon).emit('wait-turn', { message: 'Aguarde o treinador adivinhar' });
    });

    socket.on("trainer-guess", (data) => {
        console.log(`Trainer ${socket.id} adivinhou posição: ${data.gridNumber}`);

        // Encontra o jogo onde este socket é o trainer
        const game = games.find(g => g.trainer === socket.id);

        if (!game) {
            socket.emit('error', { message: 'Jogo não encontrado' });
            return;
        }

        // Verifica se é o turno do trainer
        if (game.currentTurn !== 'trainer') {
            socket.emit('error', { message: 'Não é o seu turno' });
            return;
        }

        // Verifica se a posição já foi desabilitada
        if (game.disabledGrids.includes(data.gridNumber)) {
            socket.emit('error', { message: 'Posição já foi tentada' });
            return;
        }

        // Incrementa tentativas
        game.attempts++;

        // Verifica se acertou
        if (data.gridNumber === game.pokemonPosition) {
            console.log(`Trainer acertou! Posição: ${data.gridNumber}. Tentativas: ${game.attempts}`);

            // Notifica ambos os jogadores sobre a vitória
            io.to(game.trainer).emit('game-over', {
                result: 'win',
                attempts: game.attempts,
                position: game.pokemonPosition,
                message: `Você venceu! Encontrou o Pokémon em ${game.attempts} tentativa(s)!`
            });
            io.to(game.pokemon).emit('game-over', {
                result: 'lose',
                attempts: game.attempts,
                position: game.pokemonPosition,
                message: `O treinador encontrou você em ${game.attempts} tentativa(s)!`
            });

            // Remove o jogo
            const gameIndex = games.findIndex(g => g.trainer === socket.id);
            games.splice(gameIndex, 1);
            return;
        }

        // Se errou, desabilita a posição
        game.disabledGrids.push(data.gridNumber);
        console.log(`Trainer errou. Posição ${data.gridNumber} desabilitada. Tentativas: ${game.attempts}`);

        // Verifica se só sobrou uma posição (vitória do Pokemon por fuga)
        if (game.disabledGrids.length >= 7) {
            console.log(`Apenas uma posição restante. Pokemon conseguiu fugir!`);

            io.to(game.pokemon).emit('game-over', {
                result: 'win',
                attempts: game.attempts,
                position: game.pokemonPosition,
                message: `Você venceu! Conseguiu fugir do treinador!`
            });
            io.to(game.trainer).emit('game-over', {
                result: 'lose',
                attempts: game.attempts,
                position: game.pokemonPosition,
                message: `O Pokémon conseguiu fugir! Você errou ${game.attempts} vez(es).`
            });

            // Remove o jogo
            const gameIndex = games.findIndex(g => g.trainer === socket.id);
            games.splice(gameIndex, 1);
            return;
        }

        // Passa o turno de volta para o pokemon
        game.currentTurn = 'pokemon';
        game.pokemonPosition = null; // Pokemon precisa escolher nova posição

        // Notifica ambos os jogadores
        io.to(game.trainer).emit('wrong-guess', {
            guessedPosition: data.gridNumber,
            disabledGrids: game.disabledGrids,
            attempts: game.attempts,
            message: 'Errou! Aguarde o Pokémon escolher nova posição.'
        });
        io.to(game.pokemon).emit('your-turn', {
            message: 'Escolha uma nova posição!',
            disabledGrids: game.disabledGrids,
            attempts: game.attempts
        });
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
            const newGame = {
                trainer: trainer.id,
                pokemon: pokemon.id,
                pokemonPosition: null,
                currentTurn: 'pokemon', // Pokemon começa escolhendo onde se esconder
                disabledGrids: [],
                attempts: 0,
                trainerName: trainer.name,
                pokemonName: pokemon.name
            };
            games.push(newGame);

            console.log(`Novo jogo criado! Trainer: ${trainer.name} (${trainer.id}) vs Pokemon: ${pokemon.name} (${pokemon.id})`);
            console.log(`Total de jogos ativos: ${games.length}`);

            // Notifica os jogadores que o jogo foi criado
            io.to(trainer.id).emit('game-started', {
                role: 'trainer',
                opponent: pokemon.name,
                opponentId: pokemon.id,
                gameId: games.length - 1,
                currentTurn: 'pokemon',
                message: 'Aguarde o Pokémon escolher uma posição...'
            });
            io.to(pokemon.id).emit('game-started', {
                role: 'pokemon',
                opponent: trainer.name,
                opponentId: trainer.id,
                gameId: games.length - 1,
                currentTurn: 'pokemon',
                message: 'Escolha onde você quer se esconder!'
            });
        }
    });

    socket.on('disconnect', function () {
        conexoes--;
        ids = ids.filter(id => id !== socket.id);

        // Remove a role do jogador desconectado
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