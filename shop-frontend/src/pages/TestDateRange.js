import React, { useState, useEffect } from 'react';
import { Paper, Typography, Button, Box, Divider, Grid } from '@mui/material';
import { useConfig } from '../context/config';

export default function TestDateRange() {
  const { config } = useConfig();
  const [dates, setDates] = useState([]);
  
  const generateDateOptions = () => {
    console.log("Generating date options with config:", config?.chatbot);
    
    const dates = [];
    const today = new Date();
    const specificHolidays = config?.business?.specificHolidays || [];
    
    // Get the configured number of days to display (default 14)
    const dayRange = config?.chatbot?.dayRange || 14;
    console.log("Using dayRange:", dayRange);
    
    // Try to get up to 10 available days within the configured dayRange
    let daysToCheck = Math.max(40, dayRange * 2);
    let availableDaysFound = 0;
    
    for (let i = 0; i < daysToCheck && availableDaysFound < 10 && i < dayRange; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      // Get date components in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Get day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = date.getDay();
      
      // Check if business is open on this day (simplified for testing)
      let isOpen = true;
      
      // Only include day if business is open
      if (isOpen) {
        availableDaysFound++;
        
        // Format date as YYYY-MM-DD
        const formattedDate = `${year}-${month}-${day}`;
        
        const displayDate = date.toLocaleDateString('pt-BR', { 
          weekday: 'short', 
          day: '2-digit', 
          month: '2-digit' 
        });
        
        // Also include Brazilian format for matching
        const brFormat = `${day}/${month}/${year}`;
        
        dates.push({
          value: formattedDate,
          display: displayDate,
          brFormat: brFormat,
          dayOfWeek: dayOfWeek
        });
      }
    }
    
    console.log(`Total dates generated: ${dates.length}`);
    console.log("Generated dates:", dates);
    
    setDates(dates);
  };
  
  useEffect(() => {
    generateDateOptions();
  }, [config?.chatbot?.dayRange]);
  
  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Teste de Configuração de Datas
      </Typography>
      
      <Typography variant="body1" paragraph>
        Configuração atual de dias: <strong>{config?.chatbot?.dayRange || 14}</strong> dias
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={generateDateOptions}
        sx={{ mb: 3 }}
      >
        Regenerar Datas
      </Button>
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" gutterBottom>
        Datas Geradas: {dates.length}
      </Typography>
      
      <Grid container spacing={2}>
        {dates.map((date, index) => (
          <Grid item xs={12} sm={6} md={4} key={date.value}>
            <Box 
              sx={{ 
                p: 2, 
                border: '1px solid #ddd', 
                borderRadius: 1,
                display: 'flex',
                flexDirection: 'column' 
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                {index + 1}. {date.display}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ISO: {date.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                BR: {date.brFormat}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}