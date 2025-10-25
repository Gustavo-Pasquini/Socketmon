import React, { useState } from 'react';

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
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: '#111', color: '#fff' }}>
        <h1>Créditos</h1>
        <div style={{ maxWidth: 600, textAlign: 'center' }}>
          <p>Desenvolvedores:</p>
          <p>Gustavo M. Pasquini</p>
          <p>Henrique K. Ikeda</p>
          <p style={{ marginTop: 16, fontSize: 14 }}>Trabalho avaliativo da matéria de Sistemas Operacionais</p>
        </div>
        <button onClick={() => setScreen('main')} style={{ marginTop: 20, padding: '8px 12px' }}>
          Voltar
        </button>
      </div>
    );
  }

  // main screen
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#4e73df', color: '#fff' }}>
      <h1 style={{ fontSize: 48, margin: 0 }}>Socketmon</h1>
      <p style={{ maxWidth: 600, textAlign: 'center' }}>Bem-vindo ao Socketmon — escolha jogar como Treinador ou Pokémon.</p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => setScreen('play')} style={{ padding: '10px 18px', fontSize: 16 }}>
          Jogar
        </button>

        <button onClick={() => setScreen('credits')} style={{ padding: '10px 18px', fontSize: 16 }}>
          Créditos
        </button>
      </div>
    </div>
  );
}