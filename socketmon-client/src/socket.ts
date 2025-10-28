import { io } from 'socket.io-client';

// Configuração otimizada para baixa latência (UDP-like)
const socket = io('http://localhost:3001', {
    transports: ['websocket'], // Força websocket para menor latência
    upgrade: false,
    rememberUpgrade: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 1000,
    timeout: 10000
});

export default socket;