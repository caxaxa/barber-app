import React, { useState } from 'react';

const Chatbox = ({ onNewAppointment }) => {
  const initialMessages = [
    {
      role: 'system',
      content:
        'Hoje é a data atual do calendário. Você marca consultas em uma barbearia. ' +
        'Quando um usuário solicitar uma consulta, responda com um objeto JSON contendo as chaves: barber_id (número), date (AAAA-MM-DD) e start_time (HH:MM). ' +
        'Use o banco de dados para verificar quem são os barbeiros e quais são os horários disponíveis. ' +
        'Se nenhuma consulta for solicitada, responda normalmente.'
    }
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;
    setErrorMsg('');
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
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
        setErrorMsg(`ChatGPT API error: ${errorData.error?.message || 'Unknown error'}`);
        console.error('ChatGPT API error:', errorData);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);

      // Attempt to parse appointment JSON from assistant's reply
      const appointmentData = parseAppointment(assistantMessage.content);
      if (appointmentData) {
        await onNewAppointment(appointmentData);
      }
    } catch (error) {
      console.error('Error communicating with ChatGPT:', error);
      setErrorMsg('Error communicating with ChatGPT.');
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
          console.log('Parsed appointment data:', data);
          return data;
        }
      }
    } catch (error) {
      console.error('Failed to parse appointment details:', error);
    }
    return null;
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ margin: '5px 0', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong> {msg.content}
          </div>
        ))}
        {errorMsg && <div style={{ color: 'red' }}>{errorMsg}</div>}
      </div>
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleInputKeyPress}
          style={{ flexGrow: 1, marginRight: '5px' }}
          disabled={loading}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default Chatbox;
