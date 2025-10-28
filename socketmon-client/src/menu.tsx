import { useState } from 'react';
import socket from './socket';
import bg from '../public/assets/menu-bg.png';
import logo from '../public/assets/Logo Retrô do SocketMon.png';


type Role = 'pokemon' | 'trainer';
type Props = {
  onStart: (playerName: string, role: Role) => void;
};

export default function Menu({ onStart }: Props) {
  const [screen, setScreen] = useState<'main' | 'play' | 'credits'>('main');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('trainer');

  const start = () => {
    const finalName = (name || (selectedRole === 'trainer' ? 'Treinador' : 'Pokémon')).trim();
    onStart(finalName, selectedRole);
    socket.emit('select-role', { name: finalName, role: selectedRole });
  };

  if (screen === 'play') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#f8f8f8' }}>
        <h1>Escolha seu papel</h1>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setSelectedRole('trainer')}
            style={{ padding: 10, background: selectedRole === 'trainer' ? '#2ecc71' : '#ddd' }}
          >
            Treinador
          </button>

          <button
            onClick={() => setSelectedRole('pokemon')}
            style={{ padding: 10, background: selectedRole === 'pokemon' ? '#f39c12' : '#ddd' }}
          >
            Pokémon
          </button>
        </div>

        <input
          placeholder="Digite seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: 8, fontSize: 16, marginTop: 12 }}
        />

        <div style={{ marginTop: 10 }}>
          <button onClick={start} style={{ marginRight: 8, padding: '8px 12px' }}>
            Começar
          </button>
          <button onClick={() => setScreen('main')} style={{ padding: '8px 12px' }}>
            Voltar
          </button>
        </div>
      </div>
    );
  }





  
  if (screen === 'credits') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          color: '#fff',
          overflow: 'hidden',
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.45)',
            padding: 40,
            borderRadius: 8,
            textAlign: 'center',
            transform: 'translateY(-180px)',
            fontFamily: "'Press Start 2P', monospace, 'Courier New'",
            imageRendering: 'pixelated',
            color: '#fff',
            maxWidth: 720,
            width: '90%'
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14 }}>Créditos</h2>

          <p style={{ maxWidth: 600, margin: '12px auto 0', textAlign: 'center', fontSize: 12, lineHeight: 1.4 }}>
            Desenvolvido por: Seu Nome Aqui
            <br />
            Música/Assets: (lista de fontes)
            <br />
            Agradecimentos: (coloque nomes)
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            <button
              onClick={() => setScreen('main')}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                const t = e.currentTarget;
                t.style.transform = 'translateY(-4px)';
                t.style.boxShadow = '0 10px 0 #8d6e00';
                t.style.filter = 'brightness(1.03)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                const t = e.currentTarget;
                t.style.transform = 'translateY(0)';
                t.style.boxShadow = '0 6px 0 #8d6e00';
                t.style.filter = 'none';
              }}
              style={{
                background: 'linear-gradient(#ffd54f, #ffb300)',
                color: '#2b2b2b',
                border: '4px solid #2b2b2b',
                padding: '10px 18px',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'transform .08s ease, box-shadow .08s ease, filter .08s',
                boxShadow: '0 6px 0 #8d6e00',
                borderRadius: 4,
                fontFamily: 'inherit',
                userSelect: 'none'
              }}
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }








  // main screen
  return (
    <div
      style={{
        position: 'fixed',    // ocupa a viewport inteira
        inset: 0,             // top:0; right:0; bottom:0; left:0;
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 16,
        color: '#fff',
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflow: 'hidden',   // remove scroll
      }}
    >
      {/* overlay para garantir leitura */}
      <img
        src={logo}
        alt="Socketmon"
        style={{
          width: 700,
          maxWidth: '80vw',
          height: 'auto',
          display: 'block',
          margin: '0 auto',
          transform: 'translateY(-150px)', // negative => sobe; ajuste o valor conforme necessário
        }}
      />
      <div
        style={{
          background: 'rgba(0,0,0,0.45)',
          padding: 40,
          borderRadius: 8,
          textAlign: 'center',
          transform: 'translateY(-180px)',
          fontFamily: "'Press Start 2P', monospace, 'Courier New'",
          imageRendering: 'pixelated'
        }}
      >
        <p
          style={{
            maxWidth: 600,
            margin: '8px auto 0',
            textAlign: 'center',
            color: '#fff',
            fontSize: 12,
            lineHeight: 1.4,
            textShadow: '1px 1px 0 rgba(0,0,0,0.7)'
          }}
        >
          Bem-vindo ao Socketmon.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
          <button
            onClick={() => setScreen('play')}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(-4px)';
              t.style.boxShadow = '0 10px 0 #8d6e00';
              t.style.filter = 'brightness(1.03)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(0)';
              t.style.boxShadow = '0 6px 0 #8d6e00';
              t.style.filter = 'none';
            }}
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(0)';
              t.style.boxShadow = '0 3px 0 #8d6e00';
            }}
            onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(-4px)';
              t.style.boxShadow = '0 10px 0 #8d6e00';
            }}
            style={{
              background: 'linear-gradient(#ffd54f, #ffb300)',
              color: '#2b2b2b',
              border: '4px solid #2b2b2b',
              padding: '10px 18px',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'transform .08s ease, box-shadow .08s ease, filter .08s',
              boxShadow: '0 6px 0 #8d6e00',
              borderRadius: 4,
              fontFamily: 'inherit',
              userSelect: 'none'
            }}
          >
            Jogar
          </button>

          <button
            onClick={() => setScreen('credits')}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(-4px)';
              t.style.boxShadow = '0 10px 0 #8d6e00';
              t.style.filter = 'brightness(1.03)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(0)';
              t.style.boxShadow = '0 6px 0 #8d6e00';
              t.style.filter = 'none';
            }}
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(0)';
              t.style.boxShadow = '0 3px 0 #8d6e00';
            }}
            onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(-4px)';
              t.style.boxShadow = '0 10px 0 #8d6e00';
            }}
            style={{
              background: 'linear-gradient(#90caf9, #42a5f5)',
              color: '#042034',
              border: '4px solid #042034',
              padding: '10px 18px',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'transform .08s ease, box-shadow .08s ease, filter .08s',
              boxShadow: '0 6px 0 #0b4a66',
              borderRadius: 4,
              fontFamily: 'inherit',
              userSelect: 'none'
            }}
          >
            Créditos
          </button>
        </div>
      </div>
    </div>
  );
}