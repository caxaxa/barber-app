// src/components/chat/hooks/useChatState.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useConfig } from '../../../context/config';
import { callChatApi } from '../../../services/api';
import { createSystemPrompt } from '../utils/chatUtils';

/**
 * Custom hook to manage chat state and interactions
 * @param {Function} onAppointmentCreated - Callback when appointment is created
 * @returns {Object} Chat state and methods
 */
export function useChatState(onAppointmentCreated) {
  const { config } = useConfig();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize chat with system message
  useEffect(() => {
    if (messages.length === 0) {
      const systemPrompt = createSystemPrompt(config, config?.business || {});
      setMessages([{ role: 'system', content: systemPrompt }]);
    }
  }, [config, messages.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Add a message from the user
  const addUserMessage = useCallback((text) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
  }, []);

  // Add a message from the assistant
  const addAssistantMessage = useCallback((text) => {
    setMessages(prev => [...prev, { role: 'assistant', content: text }]);
  }, []);

  // Reset the chat to initial state
  const resetChat = useCallback(() => {
    const systemPrompt = createSystemPrompt(config, config?.business || {});
    setMessages([{ role: 'system', content: systemPrompt }]);
    setInput('');
    setLoading(false);
  }, [config]);

  // Process a message in free mode (using API)
  const processMessageWithAPI = useCallback(async (text) => {
    try {
      setLoading(true);
      
      // Filter out system messages for the API call
      const messagesForApi = messages.filter(m => m.role !== 'system');
      
      // Make API call
      const responseData = await callChatApi([
        ...messagesForApi,
        { role: 'user', content: text }
      ]);
      
      // Check if the response contains a valid appointment
      if (responseData.appointment) {
        onAppointmentCreated?.(responseData.appointment);
      }
      
      // Check if we got a successful response
      if (!responseData.success && responseData.reply) {
        // Add an info message about guided mode
        const guidedModeMessage = 
          "Você pode utilizar o modo guiado para fazer um agendamento de forma fácil e rápida.";
        
        addAssistantMessage(responseData.reply + "\n\n" + guidedModeMessage);
      } else {
        // Add assistant response
        addAssistantMessage(responseData.reply || 'Desculpe, não consegui processar sua solicitação.');
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in chat API call:', error);
      const errorMessage = 'Desculpe, tive um problema ao processar sua mensagem. Tente usar o modo guiado para agendamento.';
      addAssistantMessage(errorMessage);
      return {
        reply: errorMessage,
        success: false
      };
    } finally {
      setLoading(false);
    }
  }, [messages, addAssistantMessage, onAppointmentCreated]);

  // Send a message
  const sendMessage = useCallback(async (messageText = null) => {
    const text = messageText || input;
    if (!text.trim()) return;
    
    setInput(''); // Clear input field
    
    // Don't add user message here - it's already added in the Chatbox component
    
    // Process the message using the API
    return await processMessageWithAPI(text);
  }, [input, processMessageWithAPI]);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  // Handle key press (Enter to send)
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  // Return visible messages (exclude system messages)
  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  return {
    messages,
    visibleMessages,
    input,
    loading,
    messagesEndRef,
    setInput,
    addUserMessage,
    addAssistantMessage,
    resetChat,
    sendMessage,
    handleInputChange,
    handleKeyPress
  };
}