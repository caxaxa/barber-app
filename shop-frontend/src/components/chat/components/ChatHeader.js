// src/components/chat/components/ChatHeader.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { chatStyles } from '../styles/chatStyles';

/**
 * Chat header component that displays assistant and business information
 */
export function ChatHeader({ 
  assistantName = 'Amanda', 
  assistantTitle = 'Assistente Virtual', 
  businessName = 'Barbearia Elite' 
}) {
  return (
    <Box sx={chatStyles.header}>
      <Box sx={chatStyles.avatarContainer}>
        {assistantName.charAt(0)}
      </Box>
      <Box>
        <Typography 
          variant="subtitle1" 
          fontWeight="bold"
          sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
        >
          {assistantName} - {assistantTitle}
        </Typography>
        <Typography 
          variant="caption"
          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          {businessName}
        </Typography>
      </Box>
    </Box>
  );
}

ChatHeader.propTypes = {
  assistantName: PropTypes.string,
  assistantTitle: PropTypes.string,
  businessName: PropTypes.string
};