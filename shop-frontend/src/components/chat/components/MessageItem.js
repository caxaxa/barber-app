// src/components/chat/components/MessageItem.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Paper } from '@mui/material';
import { chatStyles } from '../styles/chatStyles';

/**
 * Individual message item component
 * Renders a single message with appropriate styling based on the sender
 */
export function MessageItem({ message, config }) {
  const isUser = message.role === 'user';
  
  // Get theme colors from config or use defaults
  const userMessageColor = config?.theme?.userMessageColor || '#1976d2';
  const assistantMessageColor = config?.theme?.assistantMessageColor || '#f5f5f5';
  const userTextColor = 'white';
  const assistantTextColor = 'text.primary';
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: { xs: 0.5, sm: 1 },
        mx: { xs: 0.5, sm: 1 }
      }}
    >
      <Paper
        elevation={isUser ? 1 : 0}
        sx={isUser ? 
          { ...chatStyles.userMessage, bgcolor: userMessageColor, color: userTextColor } : 
          { ...chatStyles.assistantMessage, bgcolor: assistantMessageColor, color: assistantTextColor }
        }
      >
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontWeight: 400,
            fontSize: { xs: '0.85rem', sm: '0.95rem' },
            lineHeight: 1.5
          }}
        >
          {formatMessageContent(message.content)}
        </Typography>
      </Paper>
    </Box>
  );
}

/**
 * Format message content to handle newlines and basic formatting
 * @param {string} content - Raw message content
 * @returns {string|array} - Formatted content with preserved formatting
 */
function formatMessageContent(content) {
  if (!content) return '';
  
  // Support for numbered lists with line breaks
  if (content.includes('\n')) {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  }
  
  return content;
}

MessageItem.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired
  }).isRequired,
  config: PropTypes.object
};