import { useState, useEffect, useRef } from 'react';
import './App.css'
import socket from './socket';
import Menu from './menu';

function App() {

  const [message, setMessage] = useState('');
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [myId, setMyId] = useState('');
  const [otherPlayers, setOtherPlayers] = useState<Record<string, { x: number; y: number; role?: string }>>({});
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const lastEmitTime = useRef<number>(0);
  const EMIT_THROTTLE = 16; // ~60 updates por segundo

  // Adicione estado para controlar início e papel
  const [started, setStarted] = useState(false);
  const [playerRole, setPlayerRole] = useState<'pokemon' | 'trainer'>('trainer');
  const [playerName, setPlayerName] = useState('');
  const [gameStatus, setGameStatus] = useState<'menu' | 'waiting' | 'playing'>('menu');
  const [opponentName, setOpponentName] = useState('');
  const [opponentId, setOpponentId] = useState('');

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
    socket.on('all-players', (players: Record<string, { position: { x: number; y: number }; role?: string }>) => {
      console.log('Todos os jogadores:', players);
      const formattedPlayers: Record<string, { x: number; y: number; role?: string }> = {};
      for (const id in players) {
        formattedPlayers[id] = {
          x: players[id].position.x,
          y: players[id].position.y,
          role: players[id].role
        };
      }
      setOtherPlayers(formattedPlayers);
    });

    // Receber notificação de novo jogador conectado
    socket.on('new-player', (data: { id: string; position: { x: number; y: number }; role?: string }) => {
      console.log('Novo jogador conectado:', data);
      setOtherPlayers(prev => ({
        ...prev,
        [data.id]: { x: data.position.x, y: data.position.y, role: data.role }
      }));
    });

    // Receber movimentos de outros jogadores
    socket.on('player-move', (data: { id: string; position: { x: number; y: number } }) => {
      console.log('Movimento recebido:', data);
      setOtherPlayers(prev => ({
        ...prev,
        [data.id]: { ...prev[data.id], x: data.position.x, y: data.position.y }
      }));
    });

    // Receber atualização de role de outros jogadores
    socket.on('player-role-update', (data: { id: string; role: string }) => {
      console.log('Role atualizada:', data);
      setOtherPlayers(prev => ({
        ...prev,
        [data.id]: { ...prev[data.id], role: data.role }
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

    // Quando o jogo começa
    socket.on('game-started', (data: { role: string; opponent: string; opponentId: string; gameId: number }) => {
      console.log('Jogo iniciado!', data);
      setOpponentName(data.opponent);
      setOpponentId(data.opponentId);
      setGameStatus('playing');
    });

    // Quando o jogo termina
    socket.on('game-ended', (data: { reason: string }) => {
      console.log('Jogo encerrado:', data);
      alert(`O jogo terminou: ${data.reason === 'opponent-disconnected' ? 'Oponente desconectou' : data.reason}`);
      setGameStatus('waiting');
      setOpponentName('');
      setOpponentId('');
    });

    return () => {
      socket.off('your-id');
      socket.off('all-players');
      socket.off('new-player');
      socket.off('player-move');
      socket.off('player-disconnected');
      socket.off('player-role-update');
      socket.off('game-started');
      socket.off('game-ended');
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
    setGameStatus('waiting');
  };

  if (!started) {
    return <Menu onStart={handleStart} />;
  }

  // Tela de aguardando oponente
  if (gameStatus === 'waiting') {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 20,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff'
      }}>
        <div style={{
          fontSize: 48,
          fontWeight: 'bold',
          marginBottom: 20
        }}>
          Aguardando Oponente...
        </div>

        <div style={{
          fontSize: 20,
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px 40px',
          borderRadius: 10,
          backdropFilter: 'blur(10px)'
        }}>
          <div>Jogador: <strong>{playerName}</strong></div>
          <div>Papel: <strong>{playerRole === 'trainer' ? 'Treinador' : 'Pokémon'}</strong></div>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 20
        }}>
          <div className="loading-dot" style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'white',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '0s'
          }}></div>
          <div className="loading-dot" style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'white',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '0.16s'
          }}></div>
          <div className="loading-dot" style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'white',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: '0.32s'
          }}></div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            } 40% {
              transform: scale(1.0);
            }
          }
        `}</style>
      </div>
    );
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

      {/* Outros jogadores - mostrar apenas oponente se for pokemon */}
      {Object.entries(otherPlayers).map(([id, player]) => {
        // Só renderiza se for o oponente e se ele for pokemon
        if (id === opponentId && player.role === 'pokemon') {
          return (
            <div key={id} style={{
              position: 'absolute',
              top: `${player.y}px`,
              left: `${player.x}px`,
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
              transition: 'all 0.05s linear'
            }}>
              {opponentName.slice(0, 4)}
            </div>
          );
        }
        return null;
      })}

      <div style={{ position: 'absolute', bottom: '20px', left: '20px' }}>
        <input placeholder='Mensagem...' value={message} onChange={(e) => setMessage(e.target.value)} />
        <button type='button' onClick={sendMessage}>Enviar Mensagem</button>
      </div>

      <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', background: 'rgba(0,0,0,0.7)', padding: '10px', borderRadius: '5px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
          {playerName} ({playerRole === 'trainer' ? 'Treinador' : 'Pokémon'})
        </div>
        {opponentName && (
          <div style={{ marginBottom: '5px', color: '#ffeb3b' }}>
            Oponente: {opponentName}
          </div>
        )}
        <div style={{ margin: '8px 0', borderTop: '1px solid rgba(255,255,255,0.3)' }}></div>
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
