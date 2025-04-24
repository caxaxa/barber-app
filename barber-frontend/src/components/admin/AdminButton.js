import React, { useState } from 'react';
import { Button, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginDialog from './LoginDialog';
import ConfigPage from './ConfigPage';
import { useConfig } from '../../context/ConfigContext';

export default function AdminButton() {
  const { isAuthenticated, config } = useConfig();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [configPageOpen, setConfigPageOpen] = useState(false);

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  const handleLoginClose = () => {
    setLoginDialogOpen(false);
    // Check if authenticated after login dialog closes
    if (isAuthenticated) {
      setConfigPageOpen(true);
    }
  };

  const handleConfigClose = () => {
    setConfigPageOpen(false);
  };

  return (
    <>
      <Box sx={{ 
        position: 'absolute', 
        bottom: 16, 
        left: 16, 
        zIndex: 1000
      }}>
        <Button
          variant="contained"
          startIcon={<SettingsIcon />}
          onClick={isAuthenticated ? () => setConfigPageOpen(true) : handleLoginClick}
          size="small"
          sx={{ 
            boxShadow: 3,
            opacity: 0.9,
            bgcolor: config?.theme?.primaryColor || '#1976d2',
            color: 'white',
            '&:hover': {
              bgcolor: config?.theme?.primaryColor || '#1976d2',
              filter: 'brightness(0.9)',
              opacity: 1,
              boxShadow: 5
            }
          }}
        >
          Admin
        </Button>
      </Box>

      <LoginDialog
        open={loginDialogOpen}
        onClose={handleLoginClose}
      />

      {configPageOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            bgcolor: 'background.default',
            zIndex: 9999,
          }}
        >
          <ConfigPage onBack={handleConfigClose} />
        </Box>
      )}
    </>
  );
}