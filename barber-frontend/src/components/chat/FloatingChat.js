import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Box, Zoom } from '@mui/material';
import Chatbox from './Chatbox';
import { useConfig } from '../../context/ConfigContext';

export default function FloatingChat({ open, barbers = [], onNewAppointment }) {
  const { config } = useConfig();
  if (!open) return null;

  return (
    <Zoom in={open}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          width: 360,
          height: 550,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: `2px solid ${config?.theme?.primaryColor || '#1976d2'}`
        }}
        aria-hidden={!open}
      >
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Chatbox onNewAppointment={onNewAppointment} barbers={barbers} />
        </Box>
      </Paper>
    </Zoom>
  );
}

FloatingChat.propTypes = {
  open: PropTypes.bool.isRequired,
  barbers: PropTypes.arrayOf(
    PropTypes.shape({
      barber_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  onNewAppointment: PropTypes.func.isRequired,
};