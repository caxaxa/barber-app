import React, { useState } from 'react';

const Chatbox = ({ onNewAppointment, barbers = [], appointments = [] }) => {
  // Safely build the list of barber names (or a fallback string)
  const barberNames = barbers.length > 0 ? barbers.map(b => b.name).join(', ') : 'Nenhum barbeiro disponível';

  const systemMessage = {
    role: 'system',
    content: `Você é um assistente que gerencia as consultas de uma barbearia.
Os barbeiros disponíveis são: ${barberNames}.
O horário de funcionamento é das 7h às 19h.
Quando um usuário solicitar uma consulta, responda com um objeto JSON contendo as chaves: barber_id (número), date (AAAA-MM-DD) e start_time (HH:MM).
Utilize os dados das consultas para verificar a disponibilidade.
Responda sempre em português.`
  };

  const [messages, setMessages] = useState([systemMessage]);
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
        setErrorMsg(`Erro na API: ${errorData.error?.message || 'Erro desconhecido'}`);
        console.error('Erro na API ChatGPT:', errorData);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);

      // Tenta parsear um objeto JSON de agendamento da resposta do assistente
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
          console.log('Parsed appointment data:', data);
          return data;
        }
      }
    } catch (error) {
      console.error('Falha ao parsear dados de agendamento:', error);
    }
    return null;
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div className="flex flex-col h-full bg-white p-4 rounded-lg shadow">
      <div className="flex-grow overflow-y-auto border border-gray-200 p-2 rounded mb-2">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <strong>{msg.role === 'user' ? 'Você' : 'Assistente'}:</strong> {msg.content}
          </div>
        ))}
        {errorMsg && <div className="text-red-500">{errorMsg}</div>}
      </div>
      <div className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleInputKeyPress}
          className="flex-grow border border-gray-300 rounded-l px-3 py-2 focus:outline-none"
          disabled={loading}
          placeholder="Digite sua mensagem..."
        />
        <button 
          onClick={sendMessage} 
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r"
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
};

export default Chatbox;
