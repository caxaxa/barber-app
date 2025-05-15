// src/components/chat/NewChatbox.js
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { useConfig } from '../../context/config';
import { useChatState } from './hooks/useChatState';
import { useBookingState } from './hooks/useBookingState';
import { useGuidedMode } from './hooks/useGuidedMode';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { QuickReplyOptions } from './components/QuickReplyOptions';
import { useNotification } from '../ui/NotificationContext';
import { chatStyles } from './styles/chatStyles';

/**
 * Chatbox component that allows users to book appointments via a chat interface
 * This is a refactored version with better component separation and hook usage
 * with responsive design for both web and mobile
 */
export default function Chatbox({ onNewAppointment, workers, freeModeAllowed }) {
  const { config, getUserRole } = useConfig();
  const { showNotification } = useNotification();
  const isEnterpriseAccount = getUserRole() === 'enterprise';

  // Initialize chat state
  const {
    visibleMessages,
    input,
    loading,
    messagesEndRef,
    addUserMessage,
    addAssistantMessage,
    resetChat,
    sendMessage,
    handleInputChange,
    handleKeyPress
  } = useChatState(onNewAppointment);

  // Initialize booking state for guided mode
  const {
    bookingState,
    processGuidedMessage,
    handleServiceSelect,
    handleWorkerSelect,
    handleDateSelect,
    handleTimeSelect,
    handleConfirmation,
    resetBookingState,
    startBookingFlow,
    getAvailableServices
  } = useBookingState(workers, onNewAppointment, addAssistantMessage);

  // Initialize guided mode state
  const {
    isGuidedMode,
    availableDates,
    availableTimes
  } = useGuidedMode(bookingState, workers);

  // Handle message sending with appropriate processing based on mode
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const text = input.trim();
    addUserMessage(text);
    
    if (isGuidedMode) {
      // Process with guided mode logic
      processGuidedMessage(text);
    } else {
      // Process with free mode (API)
      await sendMessage(text);
    }
  };

  // Reset chat when chat mode changes
  useEffect(() => {
    resetChat();
    resetBookingState();
    
    // If in guided mode, start the booking flow
    if (isGuidedMode) {
      startBookingFlow();
    }
  }, [config?.chatbot?.guidedMode, isEnterpriseAccount, resetChat, resetBookingState, isGuidedMode, startBookingFlow]);

  // Update workers in booking state when they change
  useEffect(() => {
    if (
      isGuidedMode &&
      isEnterpriseAccount &&
      bookingState.step === 3 &&
      workers.length > 0
    ) {
      // Send worker options message
      addAssistantMessage(
        'Escolha um profissional digitando o número correspondente:\n\n' +
        workers.map((worker, index) => {
          const specialties = worker.specialties && worker.specialties.length > 0 
            ? ` (${worker.specialties.join(', ')})` 
            : '';
          return `${index + 1}. ${worker.name}${specialties}`;
        }).join('\n')
      );
    }
  }, [workers.length, isEnterpriseAccount, bookingState.step, isGuidedMode, addAssistantMessage]);

  // Get assistant and business info from config for header
  const assistantName = config?.assistant?.name || 'Amanda';
  const assistantTitle = config?.assistant?.title || 'Assistente Virtual';
  const businessName = config?.business?.name || 'Barbearia Elite';

  return (
    <Box 
      sx={{
        ...chatStyles.container,
        bgcolor: config?.theme?.chatBubbleColor || '#f5f5f5',
      }}
    >
      {/* Chat Header */}
      <ChatHeader 
        assistantName={assistantName}
        assistantTitle={assistantTitle}
        businessName={businessName}
      />
      
      {/* Messages Area */}
      <MessageList 
        messages={visibleMessages}
        loading={loading}
        messagesEndRef={messagesEndRef}
        config={config}
      />
      
      {/* Quick Reply Options (for guided mode) */}
      {isGuidedMode && (
        <QuickReplyOptions
          step={bookingState.step}
          services={getAvailableServices()}
          workers={workers}
          dates={availableDates}
          times={availableTimes}
          onServiceSelect={handleServiceSelect}
          onWorkerSelect={handleWorkerSelect}
          onDateSelect={handleDateSelect}
          onTimeSelect={handleTimeSelect}
          onConfirm={handleConfirmation}
          loading={loading}
        />
      )}
      
      {/* Input Area */}
      <ChatInput
        input={input}
        loading={loading}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        onSend={handleSendMessage}
      />
    </Box>
  );
}

Chatbox.propTypes = {
  onNewAppointment: PropTypes.func,
  workers: PropTypes.array,
  freeModeAllowed: PropTypes.bool
};

Chatbox.defaultProps = {
  workers: [],
  freeModeAllowed: true
};