const express = require('express');
const http    = require('http');

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
        pingInterval: 10 * 60 * 1000,
        pingTimeout: 5 * 60 * 1000, 
})

let conexoes = 0;

let ids = []

io.on("connection", (socket) => {   
    console.log(`Usuário conectado: ${socket.id}`);
    conexoes++;
    ids.push(socket.id);
    console.log(`Total de conexões: ${conexoes}`);

    socket.on("message", (data) => {
        console.log(`Mensagem recebida: ${data}`);
    })

    socket.on('disconnect', function () {
        conexoes--;
        ids.forEach((value, idx) => {
            if(value === socket.id){
                ids[idx] = '';
            }
        })
        console.log(`Usuário desconectado: ${socket.id}`);
    });
})

server.listen(3001, () => {
    console.log("O servidor está ativo!!!");
})