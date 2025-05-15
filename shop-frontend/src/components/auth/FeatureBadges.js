// src/components/auth/FeatureBadges.js
import React from 'react';
import { Box, Typography } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { loginStyles } from '../../styles/loginStyles';

export function FeatureBadges() {
  return (
    <Box sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
      <Typography 
        variant="body1" 
        sx={{ 
          mb: { xs: 1, sm: 1.5 },
          color: 'text.primary',
          fontSize: { xs: '0.85rem', sm: '0.95rem' },
          lineHeight: 1.4
        }}
      >
        Organize sua agenda de forma eficiente com nossa plataforma
      </Typography>
      
      {/* Features as chips */}
      <Box sx={loginStyles.featuresContainer}>
        <Box sx={loginStyles.featureBadge}>
          <EventAvailableIcon sx={{ mr: 0.5, fontSize: { xs: '0.875rem', sm: '1rem' } }} />
          Agendamentos Fáceis
        </Box>
        <Box sx={loginStyles.featureBadge}>
          <AccessTimeIcon sx={{ mr: 0.5, fontSize: { xs: '0.875rem', sm: '1rem' } }} />
          Notificações
        </Box>
      </Box>
    </Box>
  );
}