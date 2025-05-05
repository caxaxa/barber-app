import React, { useState, useEffect } from 'react';
import { Button, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import LoginDialog from './LoginDialog';
import ConfigPage from './ConfigPage';
import WorkerProfilePage from './WorkerProfilePage';
import { useConfig } from '../../context/ConfigContext';

export default function AdminButton() {
  const { isAuthenticated, config } = useConfig();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [configPageOpen, setConfigPageOpen] = useState(false);
  const [workerProfileOpen, setWorkerProfileOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  // Check for existing role on mount
  useEffect(() => {
    if (isAuthenticated) {
      const storedRole = sessionStorage.getItem('userRole');
      setUserRole(storedRole);
    }
  }, [isAuthenticated]);

  const handleLoginClick = () => {
    setLoginDialogOpen(true);
  };

  const handleLoginClose = (role) => {
    setLoginDialogOpen(false);
    
    // Store the role if provided
    if (role) {
      setUserRole(role);
      
      // Open the appropriate page based on role
      if (role === 'admin') {
        setConfigPageOpen(true);
      } else if (role === 'worker') {
        setWorkerProfileOpen(true);
      }
    }
  };

  const handleConfigClose = () => {
    setConfigPageOpen(false);
  };
  
  const handleWorkerProfileClose = () => {
    setWorkerProfileOpen(false);
  };
  
  const handleButtonClick = () => {
    if (!isAuthenticated) {
      handleLoginClick();
      return;
    }
    
    // Open the appropriate page based on stored role
    if (userRole === 'admin') {
      setConfigPageOpen(true);
    } else if (userRole === 'worker') {
      setWorkerProfileOpen(true);
    }
  };
  
  // Determine button icon and text based on role
  const buttonIcon = userRole === 'worker' ? <PersonIcon /> : <SettingsIcon />;
  const buttonText = userRole === 'worker' ? 'Meu Perfil' : 'Admin';

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
          startIcon={buttonIcon}
          onClick={handleButtonClick}
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
          {buttonText}
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
      
      {workerProfileOpen && (
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
          <WorkerProfilePage onBack={handleWorkerProfileClose} />
        </Box>
      )}
    </>
  );
}