import React from 'react';
import PropTypes from 'prop-types';
import { Fab, Box, Typography, Zoom } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import { useConfig } from '../../context/ConfigContext';

export default function ChatToggleButton({ onClick }) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const { config } = useConfig();
  
  // Show the tooltip after 1 second
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(true);
      
      // Hide the tooltip after 5 seconds
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);
      
      return () => clearTimeout(hideTimer);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
      <Zoom in={showTooltip}>
        <Box
          sx={{
            position: 'absolute',
            bottom: 70,
            right: 0,
            bgcolor: 'common.white',
            boxShadow: 2,
            p: 1.5,
            borderRadius: 2,
            maxWidth: 220,
            mb: 1,
            '&:after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              right: 16,
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid white',
            }
          }}
        >
          <Typography variant="body2">
            Precisa de ajuda com agendamento? Fale com {config?.assistant?.name || 'Amanda'}, {config?.assistant?.title?.toLowerCase() || 'assistente virtual'}!
          </Typography>
        </Box>
      </Zoom>
      
      <Fab
        onClick={onClick}
        aria-label="toggle chat"
        size="large"
        sx={{
          bgcolor: config?.theme?.primaryColor || '#1976d2',
          color: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          '&:hover': {
            bgcolor: config?.theme?.primaryColor || '#1976d2',
            filter: 'brightness(0.9)',
            transform: 'scale(1.05)',
            transition: 'transform 0.2s'
          }
        }}
      >
        <ChatIcon fontSize="medium" />
      </Fab>
    </Box>
  );
}

ChatToggleButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};