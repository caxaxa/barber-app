import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useConfig } from '../../../context/config';

export default function AssistantConfig() {
  const { config, updateConfig } = useConfig();
  const [hasOpenAI, setHasOpenAI] = useState(false);

  // Check if OpenAI is configured
  useEffect(() => {
    const isOpenAIConfigured = !!(config?.openai?.enabled && config?.openai?.apiKey);
    setHasOpenAI(isOpenAIConfigured);
  }, [config]);

  // Handler for assistant settings changes
  const handleAssistantChange = (field, value) => {
    updateConfig({
      ...config,
      assistant: {
        ...(config.assistant || {}),
        [field]: value
      }
    });
  };

  // Handler for chatbot settings changes
  const handleChatbotChange = (field, value) => {
    updateConfig({
      ...config,
      chatbot: {
        ...(config.chatbot || {}),
        [field]: value
      }
    });
  };

  // Get default values with fallbacks
  const guidedMode = config?.chatbot?.guidedMode !== false; // default to true
  const dayRange = config?.chatbot?.dayRange || 14; // default to 14 days
  const timeInterval = config?.chatbot?.timeInterval || 15; // default to 15 minutes
  
  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Configurações do Assistente Virtual
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Personalize o comportamento e as mensagens do assistente virtual.
      </Typography>
      <Divider sx={{ my: 3 }} />
      
      {/* Basic Assistant Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Nome do Assistente"
            fullWidth
            value={config?.assistant?.name || ''}
            onChange={(e) => handleAssistantChange('name', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Título do Assistente"
            fullWidth
            value={config?.assistant?.title || ''}
            onChange={(e) => handleAssistantChange('title', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Título Completo"
            fullWidth
            value={config?.assistant?.fullTitle || ''}
            onChange={(e) => handleAssistantChange('fullTitle', e.target.value)}
            margin="normal"
            helperText="Título completo usado no prompt do assistente"
          />
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Greetings */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Mensagem de Boas-vindas"
              fullWidth
              value={config?.assistant?.greeting || ''}
              onChange={(e) => handleAssistantChange('greeting', e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Box>
      
      {/* Guided Mode Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SmartToyIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
          <Typography variant="h6" color="primary" sx={{ mb: 0 }}>
            Modo de Conversação
          </Typography>
        </Box>
        
        <FormControlLabel
          control={
            <Switch
              checked={guidedMode}
              onChange={(e) => handleChatbotChange('guidedMode', e.target.checked)}
              color="primary"
            />
          }
          label="Usar modo guiado para agendamentos"
        />
        <FormHelperText>
          {guidedMode ? 
            "O assistente guiará os usuários de forma estruturada no processo de agendamento." :
            "Os usuários poderão conversar livremente com o assistente para agendar horários."}
        </FormHelperText>
        
        {!hasOpenAI && !guidedMode && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            O modo livre requer configuração da API OpenAI. Sem isso, o sistema usará o modo guiado mesmo com esta opção desativada.
          </Alert>
        )}
      </Box>
      
      {/* Additional Guided Mode Settings */}
      {guidedMode && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TipsAndUpdatesIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
            <Typography variant="h6" color="primary" sx={{ mb: 0 }}>
              Configurações do Modo Guiado
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CalendarMonthIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <FormControl fullWidth>
                  <InputLabel id="days-range-label">Período de Datas Disponíveis</InputLabel>
                  <Select
                    labelId="days-range-label"
                    value={dayRange}
                    label="Período de Datas Disponíveis"
                    onChange={(e) => handleChatbotChange('dayRange', e.target.value)}
                  >
                    <MenuItem value={1}>1 dia</MenuItem>
                    <MenuItem value={3}>3 dias</MenuItem>
                    <MenuItem value={5}>5 dias</MenuItem>
                    <MenuItem value={10}>10 dias</MenuItem>
                    <MenuItem value={15}>15 dias</MenuItem>
                  </Select>
                  <FormHelperText>
                    Período de datas futuras que serão exibidas para agendamento
                  </FormHelperText>
                </FormControl>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTimeIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <FormControl fullWidth>
                  <InputLabel id="time-interval-label">Intervalo de Horários</InputLabel>
                  <Select
                    labelId="time-interval-label"
                    value={timeInterval}
                    label="Intervalo de Horários"
                    onChange={(e) => handleChatbotChange('timeInterval', e.target.value)}
                  >
                    <MenuItem value={5}>5 minutos</MenuItem>
                    <MenuItem value={10}>10 minutos</MenuItem>
                    <MenuItem value={15}>15 minutos</MenuItem>
                    <MenuItem value={20}>20 minutos</MenuItem>
                    <MenuItem value={30}>30 minutos</MenuItem>
                    <MenuItem value={60}>60 minutos</MenuItem>
                  </Select>
                  <FormHelperText>
                    Intervalo entre horários disponíveis para agendamento
                  </FormHelperText>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Prompt Section - only show if OpenAI is configured */}
      {hasOpenAI && (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TipsAndUpdatesIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
            <Typography variant="h6" color="primary" sx={{ mb: 0 }}>
              Configurações do Modo Livre
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Prompt do Assistente"
                fullWidth
                value={config?.assistant?.prompt || ''}
                onChange={(e) => handleAssistantChange('prompt', e.target.value)}
                margin="normal"
                multiline
                rows={15}
                helperText="Instruções detalhadas para o comportamento do assistente (apenas usado no modo livre)"
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}