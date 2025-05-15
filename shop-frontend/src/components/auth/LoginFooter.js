// src/components/auth/LoginFooter.js
import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { loginStyles } from '../../styles/loginStyles';

export function LoginFooter() {
  return (
    <>
      <Box sx={loginStyles.footer}>
        <Typography 
          variant="body2" 
          className="legalText-customizable"
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.8rem' },
            color: 'text.secondary'
          }}
        >
          Acesse sua conta ou crie uma nova na próxima tela
        </Typography>
      </Box>
      
      <Divider sx={{ mt: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }} />
      
      <Box 
        sx={{ 
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: { xs: 0.5, sm: 1 }
        }}
      >
        <Box
          component="img"
          src="/images/logo.png"
          alt="Aisol Logo"
          sx={{
            height: { xs: '16px', sm: '20px' },
            filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' // Green tint
          }}
        />
        <Typography 
          variant="caption" 
          className="legalText-customizable" 
          sx={{ 
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            color: 'text.secondary'
          }}
        >
          Powered by Aisol© 2025
        </Typography>
      </Box>
    </>
  );
}