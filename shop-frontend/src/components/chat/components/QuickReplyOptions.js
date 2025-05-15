// src/components/chat/components/QuickReplyOptions.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import { chatStyles } from '../styles/chatStyles';

/**
 * Quick reply options component for guided mode
 */
export function QuickReplyOptions({ 
  step,
  services,
  workers,
  dates,
  times,
  onServiceSelect,
  onWorkerSelect,
  onDateSelect,
  onTimeSelect,
  onConfirm,
  loading
}) {
  // Don't show options if loading
  if (loading) return null;
  
  // Render appropriate options based on current step
  const renderOptions = () => {
    switch (step) {
      case 2: // Service selection
        return renderServiceOptions();
      case 3: // Worker selection
        return renderWorkerOptions();
      case 4: // Date selection
        return renderDateOptions();
      case 5: // Time selection
        return renderTimeOptions();
      case 6: // Confirmation
        return renderConfirmationOptions();
      default:
        return null;
    }
  };
  
  // Render service selection options
  const renderServiceOptions = () => {
    if (!services || services.length === 0) return null;
    
    return (
      <Box>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          Serviços disponíveis:
        </Typography>
        <Box sx={chatStyles.optionsContainer}>
          {services.map((service, index) => (
            <Chip
              key={index}
              label={service}
              onClick={() => onServiceSelect(service)}
              clickable
              color="primary"
              variant="outlined"
              sx={chatStyles.optionChip}
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  };
  
  // Render worker selection options
  const renderWorkerOptions = () => {
    if (!workers || workers.length === 0) return null;
    
    return (
      <Box>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          Profissionais disponíveis:
        </Typography>
        <Box sx={chatStyles.optionsContainer}>
          {workers.map((worker, index) => (
            <Chip
              key={worker.worker_id}
              label={worker.name}
              onClick={() => onWorkerSelect(worker)}
              clickable
              color="primary"
              variant="outlined"
              sx={chatStyles.optionChip}
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  };
  
  // Render date selection options
  const renderDateOptions = () => {
    if (!dates || dates.length === 0) return null;
    
    return (
      <Box>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          Datas disponíveis:
        </Typography>
        <Box sx={chatStyles.optionsContainer}>
          {dates.map((date, index) => (
            <Chip
              key={index}
              label={formatDateDisplay(date)}
              onClick={() => onDateSelect(date)}
              clickable
              color="primary"
              variant="outlined"
              sx={chatStyles.optionChip}
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  };
  
  // Render time selection options
  const renderTimeOptions = () => {
    if (!times || times.length === 0) return null;
    
    return (
      <Box>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mb: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
        >
          Horários disponíveis:
        </Typography>
        <Box sx={chatStyles.optionsContainer}>
          {times.map((time, index) => (
            <Chip
              key={index}
              label={time}
              onClick={() => onTimeSelect(time)}
              clickable
              color="primary"
              variant="outlined"
              sx={chatStyles.optionChip}
              size="small"
            />
          ))}
        </Box>
      </Box>
    );
  };
  
  // Render confirmation options
  const renderConfirmationOptions = () => {
    return (
      <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onConfirm(true)}
          size="small"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.5, sm: 0.75 }
          }}
        >
          Confirmar
        </Button>
        <Button
          variant="outlined"
          onClick={() => onConfirm(false)}
          size="small"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.5, sm: 0.75 }
          }}
        >
          Recomeçar
        </Button>
      </Box>
    );
  };
  
  // Format date for display
  const formatDateDisplay = (dateStr) => {
    try {
      if (!dateStr) return '';
      
      // Convert YYYY-MM-DD to DD/MM
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr;
    }
  };
  
  return (
    <Paper
      elevation={0}
      sx={chatStyles.quickReplyOptions}
    >
      {renderOptions()}
    </Paper>
  );
}

QuickReplyOptions.propTypes = {
  step: PropTypes.number.isRequired,
  services: PropTypes.array,
  workers: PropTypes.array,
  dates: PropTypes.array,
  times: PropTypes.array,
  onServiceSelect: PropTypes.func.isRequired,
  onWorkerSelect: PropTypes.func.isRequired,
  onDateSelect: PropTypes.func.isRequired,
  onTimeSelect: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

QuickReplyOptions.defaultProps = {
  services: [],
  workers: [],
  dates: [],
  times: [],
  loading: false
};