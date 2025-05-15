// src/components/chat/components/ChatInput.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, TextField, Button, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { chatStyles } from '../styles/chatStyles';

/**
 * Chat input component with text field and send button
 */
export function ChatInput({ input, loading, onChange, onKeyPress, onSend }) {
  return (
    <Box sx={chatStyles.inputContainer}>
      <TextField
        variant="outlined"
        fullWidth
        placeholder="Digite sua mensagem..."
        value={input}
        onChange={onChange}
        onKeyPress={onKeyPress}
        multiline
        maxRows={3}
        disabled={loading}
        sx={chatStyles.inputField}
        size="small"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={onSend}
        disabled={loading || !input.trim()}
        sx={chatStyles.sendButton}
        aria-label="Enviar mensagem"
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          <SendIcon fontSize="small" />
        )}
      </Button>
    </Box>
  );
}

ChatInput.propTypes = {
  input: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onKeyPress: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired
};

ChatInput.defaultProps = {
  loading: false
};