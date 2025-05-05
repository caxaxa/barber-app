import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
} from '@mui/material';
import { useConfig } from '../../../context/ConfigContext';

export default function AssistantConfig() {
  const { config, updateConfig } = useConfig();

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

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Configurações do Assistente Virtual
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Personalize o comportamento e as mensagens do assistente virtual.
      </Typography>
      <Divider sx={{ my: 3 }} />
      
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
        <Grid item xs={12}>
          <TextField
            label="Prompt do Assistente"
            fullWidth
            value={config?.assistant?.prompt || ''}
            onChange={(e) => handleAssistantChange('prompt', e.target.value)}
            margin="normal"
            multiline
            rows={15}
            helperText="Instruções detalhadas para o comportamento do assistente"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}