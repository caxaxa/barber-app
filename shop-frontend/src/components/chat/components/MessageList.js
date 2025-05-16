// src/components/chat/components/MessageList.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, CircularProgress } from '@mui/material';
import { MessageItem } from './MessageItem';
import { chatStyles } from '../styles/chatStyles';

/**
 * Message list component that displays all messages in the chat
 */
export function MessageList({ messages, loading = false, messagesEndRef, config }) {
  return (
    <Box sx={chatStyles.messageList}>
      {/* Message items */}
      {messages.map((message, index) => (
        <MessageItem 
          key={index} 
          message={message} 
          config={config}
        />
      ))}
      
      {/* Loading indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: { xs: 1, sm: 2 } }}>
          <CircularProgress size={24} color="primary" />
        </Box>
      )}
      
      {/* Empty div for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </Box>
  );
}

MessageList.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired
    })
  ).isRequired,
  loading: PropTypes.bool,
  messagesEndRef: PropTypes.object.isRequired,
  config: PropTypes.object
};

