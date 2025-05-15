// src/components/auth/LoginHeader.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { loginStyles } from '../../styles/loginStyles';

export function LoginHeader() {
  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mb: { xs: 1.5, sm: 2 },
      position: 'relative'
    }}>
      <CalendarMonthIcon 
        color="primary" 
        sx={loginStyles.icon}
      />
      <Box>
        <Typography 
          variant="h4" 
          align="left" 
          sx={{ 
            fontWeight: 800, 
            color: 'primary.main',
            lineHeight: 1,
            letterSpacing: '-0.5px',
            fontSize: { xs: '1.6rem', sm: '2rem' }
          }}
        >
          Agendamentos
        </Typography>
        <Typography 
          variant="subtitle1" 
          align="left" 
          sx={{ 
            fontWeight: 400, 
            color: 'text.secondary',
            fontSize: { xs: '0.8rem', sm: '0.9rem' }
          }}
        >
          simples e eficientes
        </Typography>
      </Box>
    </Box>
  );
}