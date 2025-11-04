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

  const sendMessage = () => {
    if (!message.trim()) return;

    // Adiciona a mensagem localmente
    setMessages(prev => [...prev, { sender: playerName, text: message, isMe: true }]);

    // Envia para o oponente
    socket.emit('chat-message', { text: message, sender: playerName, to: opponentId });
    setMessage('');
  }

  // Receber o ID do socket ao conectar
  useEffect(() => {
    socket.on('your-id', (id: string) => {
      setMyId(id);
      console.log('Meu ID:', id);
    });

    // Receber todos os jogadores já conectados ao entrar
    socket.on('all-players', (players: Record<string, { role?: string }>) => {
      console.log('Todos os jogadores:', players);
      const formattedPlayers: Record<string, { role?: string }> = {};
      for (const id in players) {
        formattedPlayers[id] = {
          role: players[id].role
        };
      }
      setOtherPlayers(formattedPlayers);
    });

    // Receber notificação de novo jogador conectado
    socket.on('new-player', (data: { id: string; role?: string }) => {
      console.log('Novo jogador conectado:', data);
      setOtherPlayers(prev => ({
        ...prev,
        [data.id]: { role: data.role }
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
    socket.on('game-started', (data: { role: string; opponent: string; opponentId: string; gameId: number; currentTurn: string; message: string }) => {
      console.log('Jogo iniciado!', data);
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

    // Quando é seu turno
    socket.on('your-turn', (data: { message: string; disabledGrids: number[]; attempts: number }) => {
      console.log('Seu turno!', data);
      setCurrentTurn(playerRole);
      setGameMessage(data.message);
      setDisabledGrids(data.disabledGrids);
      setAttempts(data.attempts);
    });

    // Quando não é seu turno
    socket.on('wait-turn', (data: { message: string }) => {
      console.log('Aguarde seu turno', data);
      setCurrentTurn(playerRole === 'pokemon' ? 'trainer' : 'pokemon');
      setGameMessage(data.message);
    });

    // Quando pokemon seleciona posição com sucesso
    socket.on('position-selected', (data: { success: boolean }) => {
      console.log('Posição selecionada!', data);
      setGameMessage('Posição escolhida! Aguarde o treinador...');
    });

    // Quando trainer erra
    socket.on('wrong-guess', (data: { guessedPosition: number; disabledGrids: number[]; attempts: number; message: string }) => {
      console.log('Palpite errado', data);
      setDisabledGrids(data.disabledGrids);
      setAttempts(data.attempts);
      setGameMessage(data.message);
      setCurrentTurn('pokemon');
    });

    // Quando o jogo termina
    socket.on('game-over', (data: { result: 'win' | 'lose'; attempts: number; position: number; message: string }) => {
      console.log('Jogo finalizado!', data);
      setGameOver(true);
      setGameResult({ result: data.result, message: data.message });
      setAttempts(data.attempts);
    });

    // Quando o jogo termina por desconexão
    socket.on('game-ended', (data: { reason: string }) => {
      console.log('Jogo encerrado:', data);
      alert(`O jogo terminou: ${data.reason === 'opponent-disconnected' ? 'Oponente desconectou' : data.reason}`);
      setGameStatus('waiting');
      setOpponentName('');
      setOpponentId('');
      setGameOver(false);
      setGameResult(null);
    });

    // Quando há um erro
    socket.on('error', (data: { message: string }) => {
      console.error('Erro:', data);
      alert(data.message);
    });

    // Quando recebe uma mensagem do chat
    socket.on('chat-message', (data: { sender: string; text: string }) => {
      console.log('Mensagem recebida:', data);
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

  // Função para clicar em um retângulo da grid
  const handleGridClick = (gridNumber: number) => {
    if (gameOver) {
      alert('O jogo já terminou!');
      return;
    }

    // Verifica se é o turno do jogador
    if (currentTurn !== playerRole) {
      alert('Não é o seu turno!');
      return;
    }

    // Verifica se a grid está desabilitada
    if (disabledGrids.includes(gridNumber)) {
      alert('Esta posição já foi tentada!');
      return;
    }

    console.log(`Clicou no retângulo ${gridNumber}`);

    // Envia a jogada de acordo com o papel do jogador
    if (playerRole === 'pokemon') {
      socket.emit('pokemon-select-position', { gridNumber });
    } else {
      socket.emit('trainer-guess', { gridNumber });
    }
  };

  // Função passada para o Menu
  const handleStart = (name: string, role: 'pokemon' | 'trainer') => {
    setPlayerName(name);
    setPlayerRole(role);
    setStarted(true);
    setGameStatus('waiting');
  };

  // Função para jogar novamente: reseta variáveis do jogo e volta para estado de waiting/loading
  const handlePlayAgain = () => {
    // Resetar estados do jogo
    setGameOver(false);
    setGameResult(null);
    setAttempts(0);
    setDisabledGrids([]);
    setGameMessage('Procurando oponente...');

    // Define status para waiting (mostra a tela de loading)
    setGameStatus('waiting');

    // Emite novamente o papel/nome para o servidor para buscar um novo oponente
    socket.emit('select-role', { name: playerName, role: playerRole });
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

  // Tela de game over
  if (gameOver && gameResult) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 20,
        background: gameResult.result === 'win' ? 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)' : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
        color: '#fff'
      }}>
        <div style={{
          fontSize: 56,
          fontWeight: 'bold',
          marginBottom: 20
        }}>
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

        <div style={{
          display: 'flex',
          gap: 20,
          marginTop: 30,
          justifyContent: 'center'
        }}>
          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              padding: '15px 30px',
              fontSize: 20,
              borderRadius: 8,
              border: 'none',
              background: 'white',
              color: '#333',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: 20
            }}
            >
            Sair
          </button>
          <button
            onClick={handlePlayAgain}
            style={{
              padding: '15px 30px',
              fontSize: 20,
              borderRadius: 8,
              border: 'none',
              background: 'white',
              color: '#333',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: 20
            }}
            >
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
      background: '#1a1a2e',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 30px',
        background: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        borderBottom: '2px solid #533483',
        minHeight: '80px',
        zIndex: 10
      }}>
        {/* Info da Partida */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Você</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: playerRole === 'trainer' ? '#3498db' : '#f39c12'
              }}></div>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>
                {playerName}
              </span>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '10px',
                background: playerRole === 'trainer' ? 'rgba(52, 152, 219, 0.2)' : 'rgba(243, 156, 18, 0.2)',
                color: playerRole === 'trainer' ? '#3498db' : '#f39c12',
                border: `1px solid ${playerRole === 'trainer' ? '#3498db' : '#f39c12'}`
              }}>
                {playerRole === 'trainer' ? 'Treinador' : 'Pokémon'}
              </span>
            </div>
          </div>

          <div style={{ width: '2px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Oponente</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: playerRole === 'trainer' ? '#f39c12' : '#3498db'
              }}></div>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffeb3b' }}>
                {opponentName}
              </span>
            </div>
          </div>
        </div>

        {/* Status do Turno e Tentativas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            padding: '8px 20px',
            borderRadius: '20px',
            background: currentTurn === playerRole ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
            border: `2px solid ${currentTurn === playerRole ? '#2ecc71' : '#e74c3c'}`,
            fontWeight: 'bold',
            fontSize: '14px',
            color: currentTurn === playerRole ? '#2ecc71' : '#e74c3c'
          }}>
            {currentTurn === playerRole ? '🎮 SEU TURNO' : '⏳ AGUARDE'}
          </div>

          <div style={{
            padding: '8px 20px',
            borderRadius: '20px',
            background: 'rgba(233, 69, 96, 0.15)',
            border: '2px solid #e94560',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#e94560'
          }}>
            Tentativas: {attempts}
          </div>

          {disabledGrids.length > 0 && (
            <div style={{
              padding: '8px 20px',
              borderRadius: '20px',
              background: 'rgba(170, 170, 170, 0.15)',
              border: '2px solid #aaa',
              fontSize: '13px',
              color: '#aaa'
            }}>
              Eliminadas: {disabledGrids.length}/8
            </div>
          )}
        </div>

        {/* Botão Chat */}
        <button
          onClick={() => setShowChat(!showChat)}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: showChat ? '#e94560' : 'rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e94560'}
          onMouseLeave={(e) => e.currentTarget.style.background = showChat ? '#e94560' : 'rgba(255,255,255,0.1)'}
        >
          💬 Chat
          {messages.filter(m => !m.isMe).length > 0 && !showChat && (
            <span style={{
              background: '#2ecc71',
              borderRadius: '50%',
              width: '8px',
              height: '8px',
              display: 'inline-block'
            }}></span>
          )}
        </button>
      </div>

      {/* Mensagem do Jogo */}
      {gameMessage && (
        <div style={{
          padding: '12px 30px',
          background: 'rgba(233, 69, 96, 0.1)',
          borderBottom: '1px solid rgba(233, 69, 96, 0.3)',
          color: '#fff',
          fontSize: '14px',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {gameMessage}
        </div>
      )}

      {/* Container principal com Grid e Chat */}
      <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Grid de 8 retângulos */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 0
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
            const isDisabled = disabledGrids.includes(num);
            const isMyTurn = currentTurn === playerRole;

            return (
              <div
                key={num}
                onClick={() => !isDisabled && handleGridClick(num)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  fontWeight: 'bold',
                  color: isDisabled ? '#555' : '#fff',
                  background: isDisabled ? '#2c2c2c' : (num % 2 === 0 ? '#16213e' : '#0f3460'),
                  border: `2px solid ${isDisabled ? '#444' : '#533483'}`,
                  cursor: isDisabled || !isMyTurn ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  opacity: isDisabled ? 0.4 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled && isMyTurn) {
                    e.currentTarget.style.background = '#e94560';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.background = num % 2 === 0 ? '#16213e' : '#0f3460';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {isDisabled ? '❌' : num}
              </div>
            );
          })}
        </div>

        {/* Chat lateral */}
        {showChat && (
          <div style={{
            width: '350px',
            background: '#16213e',
            borderLeft: '2px solid #533483',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-2px 0 10px rgba(0,0,0,0.3)'
          }}>
            {/* Header do Chat */}
            <div style={{
              padding: '15px',
              background: '#0f3460',
              borderBottom: '2px solid #533483',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '16px' }}>💬 Chat</span>
              <button
                onClick={() => setShowChat(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#aaa',
                  cursor: 'pointer',
                  fontSize: '20px',
                  padding: '0 5px'
                }}
              >
                ×
              </button>
            </div>

            {/* Mensagens */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '15px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  marginTop: '50px',
                  fontSize: '14px'
                }}>
                  Nenhuma mensagem ainda...
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: msg.isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      background: msg.isMe ? '#e94560' : 'rgba(255,255,255,0.1)',
                      padding: '10px 14px',
                      borderRadius: msg.isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                      color: '#fff'
                    }}>
                      <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
                        {msg.sender}
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input de mensagem */}
            <div style={{
              padding: '15px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: '8px'
            }}>
              <input
                placeholder='Digite uma mensagem...'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  outline: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#e94560',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
