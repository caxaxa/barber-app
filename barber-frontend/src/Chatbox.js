import React, { useState } from 'react';

const Chatbox = ({ onNewAppointment }) => {
  // Initial system message instructs ChatGPT on how to respond.
  const initialMessages = [
    {
      role: 'system',
      content:
        'You are an appointment scheduling assistant for a barber shop. ' +
        'When a user requests an appointment, reply with a JSON object containing keys: barber_id (number), date (YYYY-MM-DD), and start_time (HH:MM). ' +
        'If no appointment is requested, respond normally.'
    }
  ];

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sends a user message and processes the assistant's reply.
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
        setErrorMsg(`Error from ChatGPT API: ${errorData.error?.message || 'Unknown error'}`);
        console.error('ChatGPT API error:', errorData);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;
      const newMessages = [...updatedMessages, assistantMessage];
      setMessages(newMessages);

      // Parse appointment details from the assistant's reply.
      const appointmentData = parseAppointment(assistantMessage.content);
      if (appointmentData) {
        await bookAppointment(appointmentData);
      }
    } catch (error) {
      console.error('Error communicating with ChatGPT:', error);
      setErrorMsg('Error communicating with ChatGPT.');
    }
    setLoading(false);
  };

  // Attempts to extract JSON with appointment details from text.
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

  // Calls the backend to book the appointment.
  const bookAppointment = async (appointmentData) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://18.226.251.93:3000';
      const response = await fetch(`${backendUrl}/appointments/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      const result = await response.json();
      if (response.ok) {
        console.log('Appointment booked successfully:', result.appointment);
        if (onNewAppointment) {
          onNewAppointment(result.appointment);
        }
      } else {
        console.error('Error booking appointment:', result.message);
        setErrorMsg(`Booking error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error calling booking API:', error);
      setErrorMsg('Error calling booking API.');
    }
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          marginBottom: '10px',
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              margin: '5px 0',
              textAlign: msg.role === 'user' ? 'right' : 'left',
            }}
          >
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
