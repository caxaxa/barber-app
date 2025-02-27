import React, { useState } from 'react';

// Example chat code. If you're using @mui/material, you can style it with
// components or just keep your existing logic. 
export default function Chatbox({ onNewAppointment, barbers = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const barberNames = barbers.length > 0
    ? barbers.map((b) => b.name).join(', ')
    : 'Nenhum barbeiro disponível';

  const systemMessage = {
    role: 'system',
    content: `Você é um assistente que gerencia as consultas de uma barbearia.
Os barbeiros disponíveis são: ${barberNames}.
O horário de funcionamento é das 7h às 19h.
Quando um usuário solicitar uma consulta, responda com um objeto JSON contendo as chaves: barber_id (número), date (AAAA-MM-DD) e start_time (HH:MM).
Utilize os dados das consultas para verificar a disponibilidade.
Responda sempre em português.`
  };
  if (messages.length === 0) {
    setMessages([systemMessage]);
  }

  const sendMessage = async () => {
    if (!input.trim()) return;
    setErrorMsg('');

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      // Example GPT call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorMsg(`Erro na API: ${errorData.error?.message || 'Erro desconhecido'}`);
        console.error('Erro na API ChatGPT:', errorData);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);

      // Attempt to parse an appointment
      const appointmentData = parseAppointment(assistantMessage.content);
      if (appointmentData) {
        await onNewAppointment(appointmentData);
      }
    } catch (error) {
      console.error('Erro ao comunicar com ChatGPT:', error);
      setErrorMsg('Erro ao comunicar com ChatGPT.');
    }
    setLoading(false);
  };

  const parseAppointment = (text) => {
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
        if (data.barber_id && data.date && data.start_time) {
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to parse JSON appointment:', error);
    }
    return null;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // For the UI, filter out system messages
  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat display */}
      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ccc', padding: '8px' }}>
        {visibleMessages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '8px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <strong>{msg.role === 'user' ? 'Você' : 'Assistente'}:</strong> {msg.content}
          </div>
        ))}
        {errorMsg && <div style={{ color: 'red' }}>{errorMsg}</div>}
      </div>

      {/* Input + Send button */}
      <div style={{ display: 'flex', marginTop: '8px' }}>
        <input
          style={{ flex: 1, padding: '8px' }}
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading} style={{ padding: '8px 16px' }}>
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}