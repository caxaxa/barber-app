import React, { useState } from 'react';
import './Chatbox.css';

const Chatbox = ({ sendMessage }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = { sender: 'user', text: message };
    setChatHistory((prev) => [...prev, newMessage]);

    // Call the parent `sendMessage` function
    sendMessage(message);

    // Clear the input
    setMessage('');
  };

  const addResponse = (responseText) => {
    const newMessage = { sender: 'bot', text: responseText };
    setChatHistory((prev) => [...prev, newMessage]);
  };

  return (
    <div className="chatbox-container">
      <div className="chatbox-messages">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`chatbox-message ${
              msg.sender === 'user' ? 'chatbox-user' : 'chatbox-bot'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="chatbox-input-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Chatbox;
