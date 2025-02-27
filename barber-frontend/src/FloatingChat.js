import React from 'react';
import { Paper, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Chatbox from './Chatbox';

export default function FloatingChat({ open, onClose, barbers, onNewAppointment }) {
  if (!open) return null; // if not open, render nothing

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 80, // slightly above the FAB
        right: 16,
        width: 300,
        height: 400,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Embedding your Chatbox component */}
        <Chatbox onNewAppointment={onNewAppointment} barbers={barbers} />
      </Box>
    </Paper>
  );
}
