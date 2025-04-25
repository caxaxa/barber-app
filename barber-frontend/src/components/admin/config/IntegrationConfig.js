import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Box
} from '@mui/material';
import { useConfig } from '../../../context/ConfigContext';

export default function IntegrationConfig() {
  const { config, updateConfig } = useConfig();

  // Handler for OpenAI integration changes
  const handleOpenAIChange = (field, value) => {
    updateConfig({
      ...config,
      openai: {
        ...(config.openai || {}),
        [field]: value
      }
    });
  };
  
  // Handler for chatbot settings
  const handleChatbotSettingChange = (field, value) => {
    updateConfig({
      ...config,
      chatbot: {
        ...(config.chatbot || {}),
        [field]: value
      }
    });
  };
  
  // Handler for WhatsApp integration changes
  const handleWhatsAppIntegrationChange = (field, value) => {
    updateConfig({
      ...config,
      messaging: {
        ...(config.messaging || {}),
        whatsappIntegration: {
          ...(config.messaging?.whatsappIntegration || {}),
          [field]: value
        }
      }
    });
  };
  
  // Handler for Google Calendar integration changes
  const handleCalendarIntegrationChange = (field, value) => {
    updateConfig({
      ...config,
      messaging: {
        ...(config.messaging || {}),
        googleCalendarIntegration: {
          ...(config.messaging?.googleCalendarIntegration || {}),
          [field]: value
        }
      }
    });
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Integração e Sincronização
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure as integrações com WhatsApp, Google Calendar e OpenAI.
      </Typography>
      <Divider sx={{ my: 3 }} />
      
      {/* OpenAI Integration Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Integração OpenAI
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config?.openai?.enabled || false}
                  onChange={(e) => handleOpenAIChange('enabled', e.target.checked)}
                />
              }
              label="Ativar integração com OpenAI"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="API Key OpenAI"
              fullWidth
              type="password"
              value={config?.openai?.apiKey || ''}
              onChange={(e) => handleOpenAIChange('apiKey', e.target.value)}
              margin="normal"
              disabled={!config?.openai?.enabled}
              helperText="Chave de API do OpenAI (https://platform.openai.com/api-keys)"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Modelo</InputLabel>
              <Select
                value={config?.openai?.model || 'gpt-4'}
                onChange={(e) => handleOpenAIChange('model', e.target.value)}
                disabled={!config?.openai?.enabled}
                label="Modelo"
              >
                <MenuItem value="gpt-4">GPT-4</MenuItem>
                <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
              </Select>
              <FormHelperText>Selecione o modelo do OpenAI a ser utilizado</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Configurações do Chatbot
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={config?.chatbot?.guidedMode !== false}
                  onChange={(e) => handleChatbotSettingChange('guidedMode', e.target.checked)}
                />
              }
              label="Modo Guiado (fluxo estruturado passo a passo)"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No modo guiado, o chat segue um fluxo estruturado de nome → serviço → profissional → data → hora. 
              No modo livre, o usuário pode interagir com a IA de forma mais conversacional.
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                A integração com o OpenAI é necessária para o funcionamento do assistente virtual. Você precisará de uma conta no OpenAI e uma chave de API válida.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Box>
      
      {/* WhatsApp Integration Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Integração WhatsApp
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config?.messaging?.whatsappIntegration?.enabled || false}
                  onChange={(e) => handleWhatsAppIntegrationChange('enabled', e.target.checked)}
                />
              }
              label="Ativar integração com WhatsApp"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Número de WhatsApp Business"
              fullWidth
              value={config?.messaging?.whatsappIntegration?.phoneNumber || ''}
              onChange={(e) => handleWhatsAppIntegrationChange('phoneNumber', e.target.value)}
              margin="normal"
              disabled={!config?.messaging?.whatsappIntegration?.enabled}
              helperText="Formato: +5511999999999"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Provedor de API</InputLabel>
              <Select
                value={config?.messaging?.whatsappIntegration?.provider || 'twilio'}
                onChange={(e) => handleWhatsAppIntegrationChange('provider', e.target.value)}
                disabled={!config?.messaging?.whatsappIntegration?.enabled}
                label="Provedor de API"
              >
                <MenuItem value="twilio">Twilio</MenuItem>
                <MenuItem value="whatsapp-business">WhatsApp Business API</MenuItem>
              </Select>
              <FormHelperText>Selecione o provedor de integração com WhatsApp</FormHelperText>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="API Key"
              fullWidth
              type="password"
              value={config?.messaging?.whatsappIntegration?.apiKey || ''}
              onChange={(e) => handleWhatsAppIntegrationChange('apiKey', e.target.value)}
              margin="normal"
              disabled={!config?.messaging?.whatsappIntegration?.enabled}
              helperText="Chave de API do provedor selecionado"
            />
          </Grid>
        </Grid>
      </Box>
      
      {/* Google Calendar Integration */}
      <Box>
        <Typography variant="h6" gutterBottom color="primary">
          Integração com Google Calendar
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={config?.messaging?.googleCalendarIntegration?.enabled || false}
                  onChange={(e) => handleCalendarIntegrationChange('enabled', e.target.checked)}
                />
              }
              label="Ativar sincronização com Google Calendar"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="ID do Calendário Google"
              fullWidth
              value={config?.messaging?.googleCalendarIntegration?.calendarId || ''}
              onChange={(e) => handleCalendarIntegrationChange('calendarId', e.target.value)}
              margin="normal"
              disabled={!config?.messaging?.googleCalendarIntegration?.enabled}
              helperText="Exemplo: example@gmail.com ou o ID do calendário"
            />
          </Grid>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Para conectar com o Google Calendar, você precisará autorizar o acesso usando uma conta Google. 
                As instruções detalhadas estão disponíveis na documentação de integração.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}