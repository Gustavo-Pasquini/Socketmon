import { useState } from 'react';
import socket from './socket';
import bg from '../public/assets/menu-bg.png';
import logo from '../public/assets/Logo Retrô do SocketMon.png';
import henrique from '../public/assets/henrique.png';
import gustavo from '../public/assets/gustavo.png';


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
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          padding: 20,
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.45)',
            padding: '28px',
            borderRadius: 10,
            textAlign: 'center',
            fontFamily: "'Press Start 2P', monospace, 'Courier New'",
            color: '#fff',
            boxSizing: 'border-box',
            minWidth: 360,
            maxWidth: 'min(92%, 720px)'
          }}
        >
          <h1
            style={{
              margin: '0 0 16px',
              fontSize: 'clamp(22px, 4.5vw, 40px)',
              color: '#ffb300',
              fontWeight: 700,
              letterSpacing: '0.4px',
              textShadow: '1px 1px 0 rgba(0,0,0,0.6)'
            }}
          >
            Escolha seu papel
          </h1>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
            <button
              onClick={() => setSelectedRole('trainer')}
              style={{
                padding: 10,
                minWidth: 120,
                background: selectedRole === 'trainer' ? 'linear-gradient(#ffd54f, #ffb300)' : 'rgba(255,255,255,0.08)',
                color: selectedRole === 'trainer' ? '#2b2b2b' : '#fff',
                border: selectedRole === 'trainer' ? '4px solid #2b2b2b' : '2px solid rgba(255,255,255,0.06)',
                boxShadow: selectedRole === 'trainer' ? '0 6px 0 #8d6e00' : 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Treinador
            </button>

            <button
              onClick={() => setSelectedRole('pokemon')}
              style={{
                padding: 10,
                minWidth: 120,
                background: selectedRole === 'pokemon' ? 'linear-gradient(#90caf9, #42a5f5)' : 'rgba(255,255,255,0.08)',
                color: selectedRole === 'pokemon' ? '#042034' : '#fff',
                border: selectedRole === 'pokemon' ? '4px solid #042034' : '2px solid rgba(255,255,255,0.06)',
                boxShadow: selectedRole === 'pokemon' ? '0 6px 0 #0b4a66' : 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Pokémon
            </button>
          </div>

          <input
            placeholder="Digite seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => {
              const t = e.currentTarget;
              t.style.boxShadow = '0 12px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)';
              t.style.border = '2px solid rgba(255,255,255,0.32)';
              t.style.background = 'rgba(255,255,255,0.08)';
              t.style.transform = 'translateY(-1px)';
            }}
            onBlur={(e) => {
              const t = e.currentTarget;
              t.style.boxShadow = '0 6px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.01)';
              t.style.border = '2px solid rgba(255,255,255,0.22)';
              t.style.background = 'rgba(255,255,255,0.06)';
              t.style.transform = 'none';
            }}
            style={{
              padding: 14,
              fontSize: 16,
              width: '100%',
              maxWidth: 520,
              boxSizing: 'border-box',
              borderRadius: 8,
              border: '2px solid rgba(255,255,255,0.22)', // mais visível por padrão
              background: 'rgba(255,255,255,0.06)', // overlay mais forte por padrão
              color: '#fff',
              outline: 'none',
              fontFamily: 'inherit',
              marginTop: 12,
              boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.01)',
              transition: 'box-shadow .12s ease, border .12s ease, background .12s ease, transform .08s'
            }}
          />

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14 }}>
            <button
              onClick={start}
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
              Começar
            </button>

            <button
              onClick={() => setScreen('main')}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                const t = e.currentTarget;
                t.style.transform = 'translateY(-4px)';
                // sombra azul para o Voltar (corrigido)
                t.style.boxShadow = '0 10px 0 #0b4a66';
                t.style.filter = 'brightness(1.03)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                const t = e.currentTarget;
                t.style.transform = 'translateY(0)';
                // sombra azul (corrigido)
                t.style.boxShadow = '0 6px 0 #0b4a66';
                t.style.filter = 'none';
              }}
              onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
                const t = e.currentTarget;
                t.style.transform = 'translateY(0)';
                // sombra azul (corrigido)
                t.style.boxShadow = '0 3px 0 #0b4a66';
              }}
              onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
                const t = e.currentTarget;
                t.style.transform = 'translateY(-4px)';
                // sombra azul (corrigido)
                t.style.boxShadow = '0 10px 0 #0b4a66';
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
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }




  function CreditCard(props: { name: string; role?: string; img: string; linkedin?: string; github?: string }) {
    const { name, role, img, linkedin, github } = props;
    return (
      <div
        style={{
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          background: 'rgba(255,255,255,0.08)',
          padding: '22px 24px',
          borderRadius: 14,
          minWidth: 420,
          maxWidth: 960,
          boxShadow: '0 8px 0 rgba(0,0,0,0.28)',
          flex: '1 1 480px',
          alignSelf: 'stretch'
        }}
      >
        <img
          src={img}
          alt={name}
          style={{
            width: 'clamp(140px, 22vw, 240px)',
            height: 'clamp(140px, 22vw, 240px)',
            objectFit: 'cover',
            borderRadius: '16px',
            border: '5px solid rgba(255,255,255,0.12)',
            flex: '0 0 auto'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <strong style={{ fontSize: 'clamp(18px, 2.2vw, 22px)' }}>{name}</strong>
          {role && <span style={{ fontSize: 'clamp(14px, 1.6vw, 16px)', opacity: 0.95 }}>{role}</span>}

          <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
            {linkedin && (
              <a
                href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  fontSize: 'clamp(14px, 1.6vw, 16px)',
                  color: '#fff',
                  background: 'rgba(0,0,0,0.28)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                LinkedIn
              </a>
            )}

            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: 'none',
                  fontSize: 'clamp(14px, 1.6vw, 16px)',
                  color: '#fff',
                  background: 'rgba(0,0,0,0.28)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // créditos screen (substitui a versão anterior)
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
          padding: 20,
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            background: 'rgba(0,0,0,0.45)',
            padding: '24px',
            borderRadius: 10,
            textAlign: 'center',
            fontFamily: "'Press Start 2P', monospace, 'Courier New'",
            color: '#fff',
            maxWidth: 980,
            width: 'min(96%, 980px)',
            boxSizing: 'border-box'
          }}
        >
          <h2
            style={{
              margin: '0 0 12px',
              fontSize: 'clamp(20px, 4.5vw, 36px)', // maior e responsivo
              color: '#ffb300',
              fontWeight: 700,
              letterSpacing: '0.6px',
              textShadow: '1px 1px 0 rgba(0,0,0,0.6)'
            }}
          >
            Créditos
          </h2>

          

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Ajuste os caminhos das imagens conforme onde você colocar (public/assets/credits/...) */}
            <CreditCard
              name="Henrique Kendi Ikeda"
              role="Desenvolvedor"
              img={henrique}
              linkedin="www.linkedin.com/in/henrique-ikeda-"
              github="https://github.com/Henrique-ikeda"
            />

            <CreditCard
              name="Gustavo Pasquini"
              role="Desenvolvedor"
              img={gustavo}
              linkedin="https://www.linkedin.com/in/gustavo-pasquini-6596082a9/"
              github="https://github.com/Gustavo-Pasquini"
            />
          </div>

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
              // sombra azul para o Créditos (corrigido)
              t.style.boxShadow = '0 10px 0 #0b4a66';
              t.style.filter = 'brightness(1.03)';
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(0)';
              // sombra azul (corrigido)
              t.style.boxShadow = '0 6px 0 #0b4a66';
              t.style.filter = 'none';
            }}
            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(0)';
              // sombra azul (corrigido)
              t.style.boxShadow = '0 3px 0 #0b4a66';
            }}
            onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
              const t = e.currentTarget;
              t.style.transform = 'translateY(-4px)';
              // sombra azul (corrigido)
              t.style.boxShadow = '0 10px 0 #0b4a66';
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