import { useState, useEffect, useRef } from 'react';
import './App.css'
import { io } from 'socket.io-client';
import Menu from './menu';

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


function App() {

  const [message, setMessage] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [myId, setMyId] = useState('');
  const [otherPlayers, setOtherPlayers] = useState<Record<string, { x: number; y: number }>>({});
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const lastEmitTime = useRef<number>(0);
  const EMIT_THROTTLE = 16; // ~60 updates por segundo

  // Adicione estado para controlar início e papel
  const [started, setStarted] = useState(false);
  const [playerRole, setPlayerRole] = useState<'pokemon' | 'trainer'>('trainer');
  const [playerName, setPlayerName] = useState('');

  const sendMessage = () => {
    // Lógica para enviar a mensagem
    socket.emit('message', message)
    setMessage('');
  }

  // Receber o ID do socket ao conectar
  useEffect(() => {
    socket.on('your-id', (id: string) => {
      setMyId(id);
      console.log('Meu ID:', id);
    });

    // Receber todos os jogadores já conectados ao entrar
    socket.on('all-players', (players: Record<string, { x: number; y: number }>) => {
      console.log('Todos os jogadores:', players);
      // O servidor já filtra o próprio jogador, então só precisamos atualizar o estado
      setOtherPlayers(players);
    });

    // Receber notificação de novo jogador conectado
    socket.on('new-player', (data: { id: string; position: { x: number; y: number } }) => {
      console.log('Novo jogador conectado:', data);
      setOtherPlayers(prev => ({
        ...prev,
        [data.id]: data.position
      }));
    });

    // Receber movimentos de outros jogadores
    socket.on('player-move', (data: { id: string; position: { x: number; y: number } }) => {
      console.log('Movimento recebido:', data);
      setOtherPlayers(prev => ({
        ...prev,
        [data.id]: data.position
      }));
    });

    // Remover jogadores desconectados
    socket.on('player-disconnected', (id: string) => {
      console.log('Jogador desconectado:', id);
      setOtherPlayers(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    });

    return () => {
      socket.off('your-id');
      socket.off('all-players');
      socket.off('new-player');
      socket.off('player-move');
      socket.off('player-disconnected');
    };
  }, []);

  // Sistema de controle de teclas pressionadas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const validKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
      if (validKeys.includes(key)) {
        setKeysPressed(prev => new Set(prev).add(key));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Loop de movimento suave e rápido
  useEffect(() => {
    if (keysPressed.size === 0) return;

    const speed = 4;
    const interval = setInterval(() => {
      setPosition(prevPosition => {
        let deltaX = 0;
        let deltaY = 0;

        // Movimento vertical
        if (keysPressed.has('w') || keysPressed.has('arrowup')) {
          deltaY -= speed;
        }
        if (keysPressed.has('s') || keysPressed.has('arrowdown')) {
          deltaY += speed;
        }

        // Movimento horizontal
        if (keysPressed.has('a') || keysPressed.has('arrowleft')) {
          deltaX -= speed;
        }
        if (keysPressed.has('d') || keysPressed.has('arrowright')) {
          deltaX += speed;
        }

        // Normalizar movimento diagonal para manter velocidade constante
        if (deltaX !== 0 && deltaY !== 0) {
          const diagonal = Math.sqrt(2);
          deltaX = deltaX / diagonal;
          deltaY = deltaY / diagonal;
        }

        const newPosition = {
          x: Math.max(0, Math.min(window.innerWidth - 50, prevPosition.x + deltaX)),
          y: Math.max(0, Math.min(window.innerHeight - 50, prevPosition.y + deltaY))
        };

        // Throttle de emissão para ~60 updates/segundo
        const now = Date.now();
        if (newPosition.x !== prevPosition.x || newPosition.y !== prevPosition.y) {
          if (now - lastEmitTime.current >= EMIT_THROTTLE) {
            socket.emit('player-move', newPosition);
            lastEmitTime.current = now;
          }
        }

        return newPosition;
      });
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, [keysPressed]);

  // Função passada para o Menu
  const handleStart = (name: string, role: 'pokemon' | 'trainer') => {
    setPlayerName(name);
    setPlayerRole(role);
    setStarted(true);
  };

  if (!started) {
    return <Menu onStart={handleStart} />;
  }

  return (
    <>
      {/* Meu jogador */}
      <div style={{
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: '50px',
        height: '50px',
        backgroundColor: '#3498db',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold',
        transition: 'none' // Remove transição para movimento instantâneo
      }}>
        Você
      </div>

      {/* Outros jogadores */}
      {Object.entries(otherPlayers).map(([id, pos]) => (
        <div key={id} style={{
          position: 'absolute',
          top: `${pos.y}px`,
          left: `${pos.x}px`,
          width: '50px',
          height: '50px',
          backgroundColor: '#e74c3c',
          borderRadius: '5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '10px',
          transition: 'all 0.05s linear' // Transição rápida para outros jogadores
        }}>
          {id.slice(0, 4)}
        </div>
      ))}

      <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
        <input placeholder='Mensagem...' value={message} onChange={(e) => setMessage(e.target.value)} />
        <button type='button' onClick={sendMessage}>Enviar Mensagem</button>
      </div>

      <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
        Use WASD ou Setas para mover
        <br />
        Posição: X:{position.x} Y:{position.y}
        <br />
        Meu ID: {myId.slice(0, 8)}...
        <br />
        Jogadores online: {Object.keys(otherPlayers).length + 1}
      </div>
    </>
  )
}

export default App
