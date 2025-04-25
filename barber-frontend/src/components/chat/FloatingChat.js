import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Chatbox from './Chatbox';

export default function FloatingChat({ open, onClose, onNewAppointment, barbers = [], isEnterpriseAccount = true }) {
  if (!open) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 80,
        right: 20,
        width: { xs: '90%', sm: 400 },
        height: 500,
        overflow: 'hidden',
        borderRadius: 3,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ position: 'absolute', top: 5, right: 5, zIndex: 100 }}>
        <IconButton size="small" aria-label="close chat" onClick={() => onClose()}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Chatbox 
        onNewAppointment={onNewAppointment} 
        barbers={barbers}
        isEnterpriseAccount={isEnterpriseAccount}
      />
    </Paper>
  );
}

FloatingChat.propTypes = {
  open: PropTypes.bool.isRequired,
  onNewAppointment: PropTypes.func.isRequired,
  barbers: PropTypes.array,
  isEnterpriseAccount: PropTypes.bool,
  onClose: PropTypes.func
};