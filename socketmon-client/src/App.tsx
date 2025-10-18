import { useState } from 'react';
import './App.css'
import { io } from 'socket.io-client';
const socket = io('http://localhost:3001');


function App() {

  const [message, setMessage] = useState('');

  const sendMessage = () => {
    // Lógica para enviar a mensagem
    socket.emit('message', message)
    setMessage('');
  }

  return (
    <>
      <input placeholder='Mensagem...' value={message} onChange={(e) => setMessage(e.target.value)}/>
      <button type='button' onClick={sendMessage}>Enviar Mensagem</button>
    </>
  )
}

export default App
