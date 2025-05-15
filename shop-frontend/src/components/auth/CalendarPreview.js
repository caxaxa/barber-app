// src/components/auth/CalendarPreview.js
import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { useCalendar } from '../../hooks/useCalendar';
import { loginStyles } from '../../styles/loginStyles';

export function CalendarPreview() {
  const { monthName, today, availableDays } = useCalendar();

  return (
    <Box sx={loginStyles.calendarPreview}>
      {/* Available Days Indicator */}
      <Box sx={loginStyles.calendarCard}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            fontSize: { xs: '0.85rem', sm: '1rem' }
          }}
        >
          Disponível Hoje
        </Typography>
        <Box sx={{ 
          fontSize: { xs: '1.75rem', sm: '2rem' }, 
          fontWeight: 700, 
          color: '#00a86b',
          bgcolor: 'rgba(0, 168, 107, 0.1)',
          width: { xs: '50px', sm: '60px' },
          height: { xs: '50px', sm: '60px' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: '2px solid rgba(0, 168, 107, 0.2)'
        }}>
          {today}
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            fontSize: { xs: '0.7rem', sm: '0.8rem' }
          }}
        >
          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
        </Typography>
      </Box>
      
      {/* Next Available */}
      <Box sx={loginStyles.calendarCard}>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            fontWeight: 600, 
            color: 'primary.main',
            fontSize: { xs: '0.85rem', sm: '1rem' }
          }}
        >
          Horários Livres
        </Typography>
        <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }}>
          {availableDays.slice(0, 3).map((day) => (
            <Box key={day} sx={{ 
              fontSize: { xs: '1rem', sm: '1.2rem' }, 
              fontWeight: 600, 
              color: '#00a86b',
              bgcolor: 'rgba(0, 168, 107, 0.1)',
              width: { xs: '30px', sm: '35px' },
              height: { xs: '30px', sm: '35px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: '1px solid rgba(0, 168, 107, 0.2)'
            }}>
              {day}
            </Box>
          ))}
        </Stack>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            fontSize: { xs: '0.7rem', sm: '0.8rem' }
          }}
        >
          +{availableDays.length - 3} dias disponíveis
        </Typography>
      </Box>
    </Box>
  );
}