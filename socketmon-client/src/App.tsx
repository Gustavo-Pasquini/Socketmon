import { useState, useEffect } from 'react';
import './App.css'
import socket from './socket';
import Menu from './menu';

function App() {
  const [message, setMessage] = useState('');
  const [myId, setMyId] = useState('');
  const [otherPlayers, setOtherPlayers] = useState<Record<string, { role?: string }>>({});

  // Adicione estado para controlar início e papel
  const [started, setStarted] = useState(false);
  const [playerRole, setPlayerRole] = useState<'pokemon' | 'trainer'>('trainer');
  const [playerName, setPlayerName] = useState('');
  const [gameStatus, setGameStatus] = useState<'menu' | 'waiting' | 'playing'>('menu');
  const [opponentName, setOpponentName] = useState('');
  const [opponentId, setOpponentId] = useState('');

  // Estados do jogo
  const [currentTurn, setCurrentTurn] = useState<'pokemon' | 'trainer' | null>(null);
  const [disabledGrids, setDisabledGrids] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [gameMessage, setGameMessage] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<{ result: 'win' | 'lose'; message: string } | null>(null);

  // Estados do chat
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; isMe: boolean }>>([]);
  const [showChat, setShowChat] = useState(false);

  // caminhos das imagens (encodeURI para nomes com espaço/virgula)
  const pokeBallSrc = encodeURI('/poke ball.png');
  const gameBgSrc = encodeURI('/assets/ChatGPT Image 10 de nov. de 2025, 14_04_44.png');

  // novas imagens para vitória/derrota
  const winBgSrc = encodeURI('/assets/generated-image (2).png');
  const loseBgSrc = encodeURI('/assets/generated-image (4).png');

  // tamanho da pokebola em pixels — ajuste aqui
  const ballSize = 200;
  
  const sendMessage = () => {
    if (!message.trim()) return;

    // Adiciona a mensagem localmente
    setMessages(prev => [...prev, { sender: playerName, text: message, isMe: true }]);

    // Envia para o oponente
    socket.emit('chat-message', { text: message, sender: playerName, to: opponentId });
    setMessage('');
  }

  useEffect(() => {
    socket.on('your-id', (id: string) => {
      setMyId(id);
    });

    socket.on('all-players', (players: Record<string, { role?: string }>) => {
      const formattedPlayers: Record<string, { role?: string }> = {};
      for (const id in players) {
        formattedPlayers[id] = { role: players[id].role };
      }
      setOtherPlayers(formattedPlayers);
    });

    socket.on('new-player', (data: { id: string; role?: string }) => {
      setOtherPlayers(prev => ({ ...prev, [data.id]: { role: data.role } }));
    });

    socket.on('player-role-update', (data: { id: string; role: string }) => {
      setOtherPlayers(prev => ({ ...prev, [data.id]: { ...prev[data.id], role: data.role } }));
    });

    socket.on('player-disconnected', (id: string) => {
      setOtherPlayers(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    });

    socket.on('game-started', (data: { role: string; opponent: string; opponentId: string; gameId: number; currentTurn: string; message: string }) => {
      setOpponentName(data.opponent);
      setOpponentId(data.opponentId);
      setGameStatus('playing');
      setCurrentTurn(data.currentTurn as 'pokemon' | 'trainer');
      setGameMessage(data.message);
      setDisabledGrids([]);
      setAttempts(0);
      setGameOver(false);
      setGameResult(null);
    });

    socket.on('your-turn', (data: { message: string; disabledGrids: number[]; attempts: number }) => {
      setCurrentTurn(playerRole);
      setGameMessage(data.message);
      setDisabledGrids(data.disabledGrids);
      setAttempts(data.attempts);
    });

    socket.on('wait-turn', (data: { message: string }) => {
      setCurrentTurn(playerRole === 'pokemon' ? 'trainer' : 'pokemon');
      setGameMessage(data.message);
    });

    socket.on('position-selected', () => {
      setGameMessage('Posição escolhida! Aguarde o treinador...');
    });

    socket.on('wrong-guess', (data: { guessedPosition: number; disabledGrids: number[]; attempts: number; message: string }) => {
      setDisabledGrids(data.disabledGrids);
      setAttempts(data.attempts);
      setGameMessage(data.message);
      setCurrentTurn('pokemon');
    });

    socket.on('game-over', (data: { result: 'win' | 'lose'; attempts: number; position: number; message: string }) => {
      setGameOver(true);
      setGameResult({ result: data.result, message: data.message });
      setAttempts(data.attempts);
    });

    socket.on('game-ended', (data: { reason: string }) => {
      alert(`O jogo terminou: ${data.reason === 'opponent-disconnected' ? 'Oponente desconectou' : data.reason}`);
      setGameStatus('waiting');
      setOpponentName('');
      setOpponentId('');
      setGameOver(false);
      setGameResult(null);
    });

    socket.on('error', (data: { message: string }) => {
      alert(data.message);
    });

    socket.on('chat-message', (data: { sender: string; text: string }) => {
      setMessages(prev => [...prev, { sender: data.sender, text: data.text, isMe: false }]);
    });

    return () => {
      socket.off('your-id');
      socket.off('all-players');
      socket.off('new-player');
      socket.off('player-disconnected');
      socket.off('player-role-update');
      socket.off('game-started');
      socket.off('game-ended');
      socket.off('your-turn');
      socket.off('wait-turn');
      socket.off('position-selected');
      socket.off('wrong-guess');
      socket.off('game-over');
      socket.off('error');
      socket.off('chat-message');
    };
  }, [playerRole]);

  const handleGridClick = (gridNumber: number) => {
    if (gameOver) {
      alert('O jogo já terminou!');
      return;
    }

    if (currentTurn !== playerRole) {
      alert('Não é o seu turno!');
      return;
    }

    if (disabledGrids.includes(gridNumber)) {
      alert('Esta posição já foi tentada!');
      return;
    }

    if (playerRole === 'pokemon') {
      socket.emit('pokemon-select-position', { gridNumber });
    } else {
      socket.emit('trainer-guess', { gridNumber });
    }
  };

  const handleStart = (name: string, role: 'pokemon' | 'trainer') => {
    setPlayerName(name);
    setPlayerRole(role);
    setStarted(true);
    setGameStatus('waiting');
  };

  const handlePlayAgain = () => {
    setGameOver(false);
    setGameResult(null);
    setAttempts(0);
    setDisabledGrids([]);
    setGameMessage('Procurando oponente...');
    setGameStatus('waiting');
    socket.emit('select-role', { name: playerName, role: playerRole });
  };

  if (!started) return <Menu onStart={handleStart} />;

  if (gameStatus === 'waiting') {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 20,
        /* changed code */
        background: `linear-gradient(135deg, rgba(102,126,234,0.6) 0%, rgba(118,75,162,0.6) 100%), url(${gameBgSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff'
        /* changed code */
      }}>
        {/* changed code */}
        <div className="menu-title" style={{ marginBottom: 20 }}>
          Aguardando Oponente...
        </div>

        <div className="menu-info">
          <div>Jogador: <strong>{playerName}</strong></div>
          <div>Papel: <strong>{playerRole === 'trainer' ? 'Treinador' : 'Pokémon'}</strong></div>
        </div>
        {/* changed code */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <div className="loading-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'white', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0s' }}></div>
          <div className="loading-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'white', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }}></div>
          <div className="loading-dot" style={{ width: 12, height: 12, borderRadius: '50%', background: 'white', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }}></div>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
          }
        `}</style>
      </div>
    );
  }

  if (gameOver && gameResult) {
    const bgUrl = gameResult.result === 'win' ? winBgSrc : loseBgSrc;
    const overlay = gameResult.result === 'win'
      ? 'linear-gradient(135deg, rgba(46,204,113,0.60) 0%, rgba(39,174,96,0.60) 100%)'
      : 'linear-gradient(135deg, rgba(231,76,60,0.60) 0%, rgba(192,57,43,0.60) 100%)';

    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 20,
        backgroundImage: `${overlay}, url("${bgUrl}")`,
        backgroundSize: 'auto, cover',              // garante que a imagem ocupe toda a tela
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundPosition: 'center center, center center',
        color: '#fff'
      }}>
        <div style={{ fontSize: 56, fontWeight: 'bold', marginBottom: 20 }}>
          {gameResult.result === 'win' ? '🎉 VITÓRIA!' : '😢 DERROTA'}
        </div>

        <div style={{
          fontSize: 24,
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '30px 50px',
          borderRadius: 10,
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          {gameResult.message}
          <div style={{ marginTop: 20, fontSize: 20 }}>
            Tentativas: <strong>{attempts}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 30, justifyContent: 'center' }}>
          <button onClick={() => window.location.reload()} style={{ padding: '15px 30px', fontSize: 20, borderRadius: 8, border: 'none', background: 'white', color: '#333', cursor: 'pointer', fontWeight: 'bold', marginTop: 20 }}>
            Sair
          </button>
          <button onClick={handlePlayAgain} style={{ padding: '15px 30px', fontSize: 20, borderRadius: 8, border: 'none', background: 'white', color: '#333', cursor: 'pointer', fontWeight: 'bold', marginTop: 20 }}>
            Jogar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a1a2e',
      backgroundImage: `url(${gameBgSrc})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        background: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)',
        boxShadow: 'none',
        borderBottom: 'none',
        minHeight: '80px',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Você</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: playerRole === 'trainer' ? '#3498db' : '#f39c12' }}></div>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{playerName}</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                background: playerRole === 'trainer' ? 'rgba(52, 152, 219, 0.12)' : 'rgba(243, 156, 18, 0.12)',
                color: playerRole === 'trainer' ? '#3498db' : '#f39c12',
                border: 'none'
              }}>{playerRole === 'trainer' ? 'Treinador' : 'Pokémon'}</span>
            </div>
          </div>

          <div style={{ width: '2px', height: '40px', background: 'transparent' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Oponente</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: playerRole === 'trainer' ? '#f39c12' : '#3498db' }}></div>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffeb3b' }}>{opponentName}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            padding: '8px 20px',
            borderRadius: '20px',
            background: currentTurn === playerRole ? 'rgba(46, 204, 113, 0.12)' : 'rgba(231, 76, 60, 0.12)',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
            color: currentTurn === playerRole ? '#2ecc71' : '#e74c3c'
          }}>{currentTurn === playerRole ? '🎮 SEU TURNO' : '⏳ AGUARDE'}</div>

          <div style={{
            padding: '8px 20px',
            borderRadius: '20px',
            background: 'rgba(233, 69, 96, 0.12)',
            border: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#e94560'
          }}>Tentativas: {attempts}</div>

          {disabledGrids.length > 0 && (
            <div style={{
              padding: '8px 20px',
              borderRadius: '20px',
              background: 'rgba(170, 170, 170, 0.12)',
              border: 'none',
              fontSize: '13px',
              color: '#aaa'
            }}>Eliminadas: {disabledGrids.length}/8</div>
          )}
        </div>

        <button
          onClick={() => setShowChat(!showChat)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: showChat ? '#e94560' : 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e94560'}
          onMouseLeave={(e) => e.currentTarget.style.background = showChat ? '#e94560' : 'transparent'}
        >
          💬 Chat
          {messages.filter(m => !m.isMe).length > 0 && !showChat && (
            <span style={{ background: '#2ecc71', borderRadius: '50%', width: '8px', height: '8px', display: 'inline-block' }}></span>
          )}
        </button>
      </div>

      {gameMessage && (
        <div style={{
          padding: '12px 30px',
          background: 'rgba(233, 69, 96, 0.08)',
          borderBottom: 'none',
          color: '#fff',
          fontSize: '14px',
          textAlign: 'center',
          fontWeight: '500'
        }}>{gameMessage}</div>
      )}

      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 12,
          padding: 12,
          boxSizing: 'border-box'
        }}>
          {[1,2,3,4,5,6,7,8].map((num) => {
            const isDisabled = disabledGrids.includes(num);
            const isMyTurn = currentTurn === playerRole;
            return (
              <div
                key={num}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  cursor: isDisabled || !isMyTurn ? 'not-allowed' : 'pointer',
                  userSelect: 'none',
                  padding: 0,
                  boxSizing: 'border-box'
                }}
              >
                {isDisabled ? (
                  <div style={{
                    width: ballSize,
                    height: ballSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 34,
                    color: '#fff'
                  }}>❌</div>
                ) : (
                  <button
                    onClick={() => isMyTurn && handleGridClick(num)}
                    disabled={!isMyTurn}
                    style={{
                      width: ballSize,
                      height: ballSize,
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isMyTurn ? 'pointer' : 'not-allowed',
                      transition: 'transform 0.12s ease'
                    }}
                    onMouseEnter={(e) => { if (isMyTurn) e.currentTarget.style.transform = 'scale(1.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <img
                      src={pokeBallSrc}
                      alt="pokeball"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {showChat && (
          <div style={{
            width: '350px',
            background: '#16213e',
            borderLeft: 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '15px',
              background: '#0f3460',
              borderBottom: 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>💬 Chat</span>
              <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '20px', padding: '0 5px' }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '50px', fontSize: '14px' }}>Nenhuma mensagem ainda...</div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: msg.isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', background: msg.isMe ? '#e94560' : 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: msg.isMe ? '12px 12px 0 12px' : '12px 12px 12px 0', color: '#fff' }}>
                      <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>{msg.sender}</div>
                      <div style={{ fontSize: '14px' }}>{msg.text}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '15px', borderTop: 'none', display: 'flex', gap: '8px' }}>
              <input
                placeholder='Digite uma mensagem...'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '14px' }}
              />
              <button onClick={sendMessage} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Enviar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
