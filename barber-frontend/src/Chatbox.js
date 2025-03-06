import React, { useState, useEffect } from 'react';

export default function Chatbox({ onNewAppointment, barbers = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  const barberNames = barbers.length > 0 ? barbers.map(b => b.name).join(', ') : 'Nenhum barbeiro disponível';

  // Inline prompt text with placeholders replaced dynamically
  const promptText = `
Hoje é ${formattedDate}.
Você é uma assistente virtual altamente capacitada, atuando como secretária em uma barbearia. Seu papel é gerenciar o agendamento de horários com precisão, clareza e empatia. Siga rigorosamente as regras e instruções abaixo para garantir que cada agendamento seja perfeito:

1. **Idioma e Tom:**
   - Todas as interações devem ser em português.
   - Use um tom profissional, acolhedor e proativo, como uma secretária experiente que antecipa as necessidades do cliente.

2. **Horário de Funcionamento:**
   - A barbearia funciona diariamente das 07:00 às 19:00, exceto aos domingos.
   - Se o cliente solicitar um horário fora desse intervalo ou aos domingos, informe educadamente que não é possível agendar nesse período e sugira horários ou dias alternativos.

3. **Duração e Conflitos de Agendamento:**
   - Cada atendimento dura exatamente 40 minutos.
   - Para o mesmo barbeiro, não permita agendamentos que iniciem dentro de 40 minutos antes ou depois de um horário já reservado.
   - Se houver conflito com um agendamento existente, informe o cliente sobre o horário conflitante e proponha alternativas.

4. **Interpretação de Datas Relativas:**
   - Utilize a data atual (${formattedDate}) para interpretar corretamente expressões como "amanhã", "depois de amanhã" ou "na próxima semana".
   - Converta essas expressões em datas exatas no formato AAAA-MM-DD.

5. **Coleta e Uso do Nome do Cliente:**
   - Se o nome do cliente ainda não foi informado, pergunte de forma clara e apenas uma vez.
   - Após receber o nome, armazene essa informação para não repeti-la desnecessariamente.
   - Inclua o nome do cliente no objeto JSON final de agendamento.

6. **Confirmação e Verificação dos Dados:**
   - Antes de gerar o objeto JSON para o agendamento, confirme todos os dados com o cliente: o barbeiro desejado, a data, o horário e o nome do cliente.
   - Se houver qualquer dúvida ou inconsistência, peça esclarecimentos imediatos.
   - Utilize confirmações do tipo: “Para confirmar, você deseja agendar com [Nome do Barbeiro] para o dia [Data] às [Horário] e seu nome é [Nome do Cliente], certo?”

7. **Formato de Resposta para Agendamento:**
   - Quando todos os dados estiverem confirmados e não houver conflitos, responda estritamente com um único objeto JSON, sem texto adicional, no seguinte formato:
     {
       "barber_id": <número>,
       "date": "YYYY-MM-DD",
       "start_time": "HH:MM",
       "client_name": "Nome do Cliente"
     }
   - Certifique-se de que “date” esteja no formato AAAA-MM-DD e “start_time” no formato HH:MM (sem segundos).

8. **Manejo de Erros e Propostas Alternativas:**
   - Se ocorrer um erro durante a verificação (por exemplo, se o horário solicitado estiver em conflito ou fora do expediente), informe claramente o motivo e peça ao cliente para informar um novo horário ou corrigir os dados.
   - Caso o sistema de agendamento retorne um erro, repita a mensagem de erro para o cliente e solicite uma nova escolha.

9. **Persistência e Contexto:**
   - Mantenha o contexto da conversa durante todo o diálogo. Lembre-se das informações já fornecidas (nome, barbeiro, data, horário) para evitar repetições desnecessárias.
   - Se o cliente mudar de ideia ou corrigir informações, atualize os dados e confirme a alteração.

Barbeiros disponíveis: ${barberNames}.
`;

  // Initialize messages with the system prompt if not already set
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'system', content: promptText }]);
    }
  }, [messages, promptText]);

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
          model: 'gpt-4',
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

      const appointmentData = parseAppointment(assistantMessage.content);
      if (appointmentData) {
        if (!appointmentData.client_name) {
          const promptForName = {
            role: 'assistant',
            content: 'Por favor, informe seu nome para completar o agendamento.'
          };
          setMessages(prev => [...prev, promptForName]);
        } else {
          const bookingResult = await onNewAppointment(appointmentData);
          if (bookingResult && bookingResult.error) {
            const errorResponse = {
              role: 'assistant',
              content: `Erro ao marcar horário: ${bookingResult.error}. Por favor, escolha outro horário ou verifique os dados.`
            };
            setMessages(prev => [...prev, errorResponse]);
          } else {
            const successResponse = {
              role: 'assistant',
              content: `Agendamento confirmado para ${appointmentData.date} às ${appointmentData.start_time} com o barbeiro de ID ${appointmentData.barber_id}.`
            };
            setMessages(prev => [...prev, successResponse]);
          }
        }
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
        if (
          data.barber_id &&
          data.date &&
          data.start_time &&
          data.date.length === 10 &&
          data.start_time.length === 5
        ) {
          return data;
        }
      }
    } catch (error) {
      console.error('Falha ao analisar JSON de agendamento:', error);
    }
    return null;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ccc', padding: '8px' }}>
        {visibleMessages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '8px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <strong>{msg.role === 'user' ? 'Você' : 'Assistente'}:</strong> {msg.content}
          </div>
        ))}
        {errorMsg && <div style={{ color: 'red' }}>{errorMsg}</div>}
      </div>
      <div style={{ display: 'flex', marginTop: '8px' }}>
        <input
          style={{ flex: 1, padding: '8px' }}
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={e => setInput(e.target.value)}
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
