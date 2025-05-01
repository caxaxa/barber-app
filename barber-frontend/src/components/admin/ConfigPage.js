import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Grid,
  Divider,
  Alert,
  IconButton,
  AppBar,
  Toolbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import { useConfig } from '../../context/ConfigContext';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
};

function ConfigPage({ onBack }) {
  const { config, updateConfig, resetConfig, logout } = useConfig();
  // Ensure messaging defaults are properly merged with existing config
  const ensureMessagingDefaults = (cfg) => {
    const defaultMessaging = {
      enabled: true,
      whatsappIntegration: {
        enabled: true,
        phoneNumber: '+5511999999999',
        provider: 'twilio',
        apiKey: '',
      },
      templates: {
        birthdayMessage: {
          enabled: true,
          title: 'Mensagem de Aniversário',
          text: 'Olá {nome}! A {empresa} deseja um feliz aniversário! Como presente especial, oferecemos {desconto}% de desconto em qualquer serviço até o final do mês. Agende seu horário respondendo esta mensagem!',
          discountPercent: 15,
          sendTime: '10:00',
        },
        followupMessage: {
          enabled: true,
          title: 'Mensagem de Retorno',
          text: 'Olá {nome}! Já faz {dias} dias desde seu último {servico} na {empresa}. Que tal agendar um novo horário? Responda esta mensagem para mais informações!',
          daysSince: 30,
          discountPercent: 10, 
          sendTime: '14:00',
        },
        appointmentConfirmation: {
          enabled: true,
          title: 'Confirmação de Agendamento',
          text: 'Olá {nome}! Seu agendamento na {empresa} está confirmado para {data} às {hora} com {profissional}. Deseja receber lembretes e ofertas especiais no seu aniversário?',
          sendTime: 'immediate',
        }
      },
      optIn: {
        birthdayPrompt: 'Podemos te enviar uma oferta especial no seu aniversário?',
        followupPrompt: 'Podemos te avisar quando estiver na hora de agendar novamente?',
        birthdayDatePrompt: 'Qual é a data do seu aniversário? (DD/MM)',
      },
      googleCalendarIntegration: {
        enabled: false,
        calendarId: '',
      }
    };

    return {
      ...cfg,
      messaging: cfg.messaging ? {
        ...defaultMessaging,
        ...cfg.messaging,
        whatsappIntegration: {
          ...defaultMessaging.whatsappIntegration,
          ...(cfg.messaging.whatsappIntegration || {})
        },
        templates: {
          ...defaultMessaging.templates,
          ...(cfg.messaging.templates || {}),
          birthdayMessage: {
            ...defaultMessaging.templates.birthdayMessage,
            ...(cfg.messaging.templates?.birthdayMessage || {})
          },
          followupMessage: {
            ...defaultMessaging.templates.followupMessage,
            ...(cfg.messaging.templates?.followupMessage || {})
          },
          appointmentConfirmation: {
            ...defaultMessaging.templates.appointmentConfirmation,
            ...(cfg.messaging.templates?.appointmentConfirmation || {})
          }
        },
        optIn: {
          ...defaultMessaging.optIn,
          ...(cfg.messaging.optIn || {})
        },
        googleCalendarIntegration: {
          ...defaultMessaging.googleCalendarIntegration,
          ...(cfg.messaging.googleCalendarIntegration || {})
        }
      } : defaultMessaging
    };
  };

  const [currentConfig, setCurrentConfig] = useState(ensureMessagingDefaults({ ...config }));
  const [tabValue, setTabValue] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handler for input change
  const handleInputChange = (section, field, value) => {
    setCurrentConfig({
      ...currentConfig,
      [section]: {
        ...currentConfig[section],
        [field]: value
      }
    });
  };

  // Handler for nested input change (for arrays or objects)
  const handleNestedInputChange = (section, index, field, value) => {
    const updatedSection = [...currentConfig[section]];
    updatedSection[index] = {
      ...updatedSection[index],
      [field]: value
    };
    
    setCurrentConfig({
      ...currentConfig,
      [section]: updatedSection
    });
  };
  
  // Handler for messaging template changes
  const handleNestedTemplateChange = (template, field, value) => {
    setCurrentConfig({
      ...currentConfig,
      messaging: {
        ...(currentConfig.messaging || {}),
        templates: {
          ...(currentConfig.messaging?.templates || {}),
          [template]: {
            ...(currentConfig.messaging?.templates?.[template] || {}),
            [field]: value
          }
        }
      }
    });
  };

  // Handler for messaging opt-in changes
  const handleNestedOptInChange = (field, value) => {
    setCurrentConfig({
      ...currentConfig,
      messaging: {
        ...(currentConfig.messaging || {}),
        optIn: {
          ...(currentConfig.messaging?.optIn || {}),
          [field]: value
        }
      }
    });
  };
  
  // Handler for WhatsApp integration changes
  const handleWhatsAppIntegrationChange = (field, value) => {
    setCurrentConfig({
      ...currentConfig,
      messaging: {
        ...(currentConfig.messaging || {}),
        whatsappIntegration: {
          ...(currentConfig.messaging?.whatsappIntegration || {}),
          [field]: value
        }
      }
    });
  };
  
  // Handler for Google Calendar integration changes
  const handleCalendarIntegrationChange = (field, value) => {
    setCurrentConfig({
      ...currentConfig,
      messaging: {
        ...(currentConfig.messaging || {}),
        googleCalendarIntegration: {
          ...(currentConfig.messaging?.googleCalendarIntegration || {}),
          [field]: value
        }
      }
    });
  };
  
  // Handler for OpenAI integration changes
  const handleOpenAIChange = (field, value) => {
    setCurrentConfig({
      ...currentConfig,
      openai: {
        ...(currentConfig.openai || {}),
        [field]: value
      }
    });
  };
  
  // Handler for chatbot settings
  const handleChatbotSettingChange = (field, value) => {
    setCurrentConfig({
      ...currentConfig,
      chatbot: {
        ...(currentConfig.chatbot || {}),
        [field]: value
      }
    });
  };
  
  // Handler for database configuration changes
  const handleDatabaseTypeChange = (value) => {
    setCurrentConfig({
      ...currentConfig,
      database: {
        ...(currentConfig.database || {}),
        type: value
      }
    });
  };
  
  // Handle save button click
  const handleSave = () => {
    updateConfig(ensureMessagingDefaults(currentConfig));
    setSaveSuccess(true);
  };

  // Handle reset confirmation
  const handleResetConfirm = () => {
    resetConfig();
    setCurrentConfig(ensureMessagingDefaults({ ...config })); // Reset local state to the default config
    setResetDialogOpen(false);
    setSaveSuccess(true);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onBack}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Configurações do Sistema
          </Typography>
          <Button 
            color="primary" 
            startIcon={<SaveIcon />}
            variant="contained"
            onClick={handleSave}
            sx={{ mr: 2 }}
          >
            Salvar
          </Button>
          <Button 
            color="secondary" 
            startIcon={<RestoreIcon />}
            variant="outlined"
            onClick={() => setResetDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Resetar
          </Button>
          <IconButton
            color="inherit"
            onClick={logout}
            aria-label="logout"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Empresa" />
          <Tab label="Assistente" />
          <Tab label="Tema" />
          <Tab label="Terminologia" />
          <Tab label="Mensagens" />
          <Tab label="Integração" />
          <Tab label="Segurança" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 120px)' }}>
        {/* Business Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Informações da Empresa
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure as informações básicas e horários de funcionamento.
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nome da Empresa"
                  fullWidth
                  value={currentConfig.business.name}
                  onChange={(e) => handleInputChange('business', 'name', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tipo de Negócio"
                  fullWidth
                  value={currentConfig.business.type}
                  onChange={(e) => handleInputChange('business', 'type', e.target.value)}
                  margin="normal"
                  helperText="Ex: Barbearia, Salão de Beleza, Consultório, etc."
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Horário de Abertura"
                  type="time"
                  fullWidth
                  value={currentConfig.business.openHours}
                  onChange={(e) => handleInputChange('business', 'openHours', e.target.value)}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Horário de Fechamento"
                  type="time"
                  fullWidth
                  value={currentConfig.business.closeHours}
                  onChange={(e) => handleInputChange('business', 'closeHours', e.target.value)}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Último Horário Disponível"
                  type="time"
                  fullWidth
                  value={currentConfig.business.lastAppointmentTime}
                  onChange={(e) => handleInputChange('business', 'lastAppointmentTime', e.target.value)}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Último horário disponível para marcação"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Dias Fechados"
                  fullWidth
                  value={currentConfig.business.closedDays.join(', ')}
                  onChange={(e) => handleInputChange('business', 'closedDays', e.target.value.split(', '))}
                  margin="normal"
                  helperText="Separe os dias por vírgula. Ex: Domingo, Feriados"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Duração do Atendimento (minutos)"
                  type="number"
                  fullWidth
                  value={currentConfig.business.appointmentDuration}
                  onChange={(e) => handleInputChange('business', 'appointmentDuration', parseInt(e.target.value))}
                  margin="normal"
                  InputProps={{ inputProps: { min: 5, step: 5 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Intervalo de Horários (minutos)"
                  type="number"
                  fullWidth
                  value={currentConfig.business.appointmentInterval}
                  onChange={(e) => handleInputChange('business', 'appointmentInterval', parseInt(e.target.value))}
                  margin="normal"
                  InputProps={{ inputProps: { min: 5, step: 5 } }}
                  helperText="Intervalo entre os horários disponíveis"
                />
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Assistant Settings Tab */}
        <TabPanel value={tabValue} index={1}>
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
                  value={currentConfig.assistant.name}
                  onChange={(e) => handleInputChange('assistant', 'name', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Título do Assistente"
                  fullWidth
                  value={currentConfig.assistant.title}
                  onChange={(e) => handleInputChange('assistant', 'title', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Título Completo"
                  fullWidth
                  value={currentConfig.assistant.fullTitle}
                  onChange={(e) => handleInputChange('assistant', 'fullTitle', e.target.value)}
                  margin="normal"
                  helperText="Título completo usado no prompt do assistente"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mensagem de Boas-vindas"
                  fullWidth
                  value={currentConfig.assistant.greeting}
                  onChange={(e) => handleInputChange('assistant', 'greeting', e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Prompt do Assistente"
                  fullWidth
                  value={currentConfig.assistant.prompt}
                  onChange={(e) => handleInputChange('assistant', 'prompt', e.target.value)}
                  margin="normal"
                  multiline
                  rows={15}
                  helperText="Instruções detalhadas para o comportamento do assistente"
                />
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Theme Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Tema e Cores
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Personalize as cores e aparência do sistema.
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Cor Primária"
                  fullWidth
                  value={currentConfig.theme.primaryColor}
                  onChange={(e) => handleInputChange('theme', 'primaryColor', e.target.value)}
                  margin="normal"
                  helperText="Cor principal (formato hex: #1976d2)"
                  InputProps={{
                    endAdornment: (
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 1,
                          bgcolor: currentConfig.theme.primaryColor,
                          border: '1px solid #ccc' 
                        }} 
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Cor Secundária"
                  fullWidth
                  value={currentConfig.theme.secondaryColor}
                  onChange={(e) => handleInputChange('theme', 'secondaryColor', e.target.value)}
                  margin="normal"
                  helperText="Cor secundária (formato hex: #dc004e)"
                  InputProps={{
                    endAdornment: (
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 1,
                          bgcolor: currentConfig.theme.secondaryColor,
                          border: '1px solid #ccc' 
                        }} 
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Cor do Chat"
                  fullWidth
                  value={currentConfig.theme.chatBubbleColor}
                  onChange={(e) => handleInputChange('theme', 'chatBubbleColor', e.target.value)}
                  margin="normal"
                  helperText="Cor de fundo do chat"
                  InputProps={{
                    endAdornment: (
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 1,
                          bgcolor: currentConfig.theme.chatBubbleColor,
                          border: '1px solid #ccc' 
                        }} 
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Cor das Mensagens do Usuário"
                  fullWidth
                  value={currentConfig.theme.userMessageColor}
                  onChange={(e) => handleInputChange('theme', 'userMessageColor', e.target.value)}
                  margin="normal"
                  helperText="Cor das mensagens do usuário"
                  InputProps={{
                    endAdornment: (
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 1,
                          bgcolor: currentConfig.theme.userMessageColor,
                          border: '1px solid #ccc' 
                        }} 
                      />
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Cor das Mensagens do Assistente"
                  fullWidth
                  value={currentConfig.theme.assistantMessageColor}
                  onChange={(e) => handleInputChange('theme', 'assistantMessageColor', e.target.value)}
                  margin="normal"
                  helperText="Cor das mensagens do assistente"
                  InputProps={{
                    endAdornment: (
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: 1,
                          bgcolor: currentConfig.theme.assistantMessageColor,
                          border: '1px solid #ccc' 
                        }} 
                      />
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Terminology Settings Tab */}
        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Terminologia
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Personalize os termos utilizados no sistema para se adequar ao seu tipo de negócio.
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Profissionais
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Título da Seção"
                    fullWidth
                    value={currentConfig.professionals[0].label}
                    onChange={(e) => handleNestedInputChange('professionals', 0, 'label', e.target.value)}
                    margin="normal"
                    helperText="Ex: Profissionais, Barbeiros, Médicos, etc."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Termo no Singular"
                    fullWidth
                    value={currentConfig.professionals[0].singular}
                    onChange={(e) => handleNestedInputChange('professionals', 0, 'singular', e.target.value)}
                    margin="normal"
                    helperText="Ex: Profissional, Barbeiro, Médico, etc."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Termo no Plural"
                    fullWidth
                    value={currentConfig.professionals[0].plural}
                    onChange={(e) => handleNestedInputChange('professionals', 0, 'plural', e.target.value)}
                    margin="normal"
                    helperText="Ex: Profissionais, Barbeiros, Médicos, etc."
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Serviços
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Título da Seção"
                    fullWidth
                    value={currentConfig.services[0].label}
                    onChange={(e) => handleNestedInputChange('services', 0, 'label', e.target.value)}
                    margin="normal"
                    helperText="Ex: Serviços, Cortes, Consultas, etc."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Termo no Singular"
                    fullWidth
                    value={currentConfig.services[0].singular}
                    onChange={(e) => handleNestedInputChange('services', 0, 'singular', e.target.value)}
                    margin="normal"
                    helperText="Ex: Serviço, Corte, Consulta, etc."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Termo no Plural"
                    fullWidth
                    value={currentConfig.services[0].plural}
                    onChange={(e) => handleNestedInputChange('services', 0, 'plural', e.target.value)}
                    margin="normal"
                    helperText="Ex: Serviços, Cortes, Consultas, etc."
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box>
              <Typography variant="h6" gutterBottom color="primary">
                Clientes
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Título da Seção"
                    fullWidth
                    value={currentConfig.clients[0].label}
                    onChange={(e) => handleNestedInputChange('clients', 0, 'label', e.target.value)}
                    margin="normal"
                    helperText="Ex: Clientes, Pacientes, Alunos, etc."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Termo no Singular"
                    fullWidth
                    value={currentConfig.clients[0].singular}
                    onChange={(e) => handleNestedInputChange('clients', 0, 'singular', e.target.value)}
                    margin="normal"
                    helperText="Ex: Cliente, Paciente, Aluno, etc."
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Termo no Plural"
                    fullWidth
                    value={currentConfig.clients[0].plural}
                    onChange={(e) => handleNestedInputChange('clients', 0, 'plural', e.target.value)}
                    margin="normal"
                    helperText="Ex: Clientes, Pacientes, Alunos, etc."
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </TabPanel>
        
        {/* Messages Tab */}
        <TabPanel value={tabValue} index={4}>
          <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Mensagens Automáticas
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure o conteúdo das mensagens automáticas enviadas aos clientes.
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            {/* Message Templates Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Modelos de Mensagem
              </Typography>
              
              {/* Birthday Message Template */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Mensagem de Aniversário</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={currentConfig.messaging?.templates?.birthdayMessage?.enabled || false}
                            onChange={(e) => handleNestedTemplateChange('birthdayMessage', 'enabled', e.target.checked)}
                          />
                        }
                        label="Ativar mensagens de aniversário"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Título da Mensagem"
                        fullWidth
                        value={currentConfig.messaging?.templates?.birthdayMessage?.title || 'Mensagem de Aniversário'}
                        onChange={(e) => handleNestedTemplateChange('birthdayMessage', 'title', e.target.value)}
                        margin="normal"
                        disabled={!currentConfig.messaging?.templates?.birthdayMessage?.enabled}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Texto da Mensagem"
                        fullWidth
                        multiline
                        rows={4}
                        value={currentConfig.messaging?.templates?.birthdayMessage?.text || 'Olá {nome}! A {empresa} deseja um feliz aniversário! Como presente especial, oferecemos {desconto}% de desconto em qualquer serviço até o final do mês. Agende seu horário respondendo esta mensagem!'}
                        onChange={(e) => handleNestedTemplateChange('birthdayMessage', 'text', e.target.value)}
                        margin="normal"
                        disabled={!currentConfig.messaging?.templates?.birthdayMessage?.enabled}
                        helperText="Use {nome}, {empresa}, {desconto} como variáveis"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Porcentagem de Desconto"
                        type="number"
                        fullWidth
                        value={currentConfig.messaging?.templates?.birthdayMessage?.discountPercent || 15}
                        onChange={(e) => handleNestedTemplateChange('birthdayMessage', 'discountPercent', parseInt(e.target.value))}
                        margin="normal"
                        disabled={!currentConfig.messaging?.templates?.birthdayMessage?.enabled}
                        InputProps={{ inputProps: { min: 0, max: 100 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Horário de Envio"
                        type="time"
                        fullWidth
                        value={currentConfig.messaging?.templates?.birthdayMessage?.sendTime || '10:00'}
                        onChange={(e) => handleNestedTemplateChange('birthdayMessage', 'sendTime', e.target.value)}
                        margin="normal"
                        disabled={!currentConfig.messaging?.templates?.birthdayMessage?.enabled}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Follow-up Message Template */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Mensagem de Retorno</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={currentConfig.messaging?.templates?.followupMessage?.enabled || false}
                            onChange={(e) => handleNestedTemplateChange('followupMessage', 'enabled', e.target.checked)}
                          />
                        }
                        label="Ativar mensagens de retorno"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Título da Mensagem"
                        fullWidth
                        value={currentConfig.messaging?.templates?.followupMessage?.title || 'Mensagem de Retorno'}
                        onChange={(e) => handleNestedTemplateChange('followupMessage', 'title', e.target.value)}
                        margin="normal"
                        disabled={!currentConfig?.messaging?.templates.followupMessage.enabled}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Texto da Mensagem"
                        fullWidth
                        multiline
                        rows={4}
                        value={currentConfig?.messaging?.templates.followupMessage.text}
                        onChange={(e) => handleNestedTemplateChange('followupMessage', 'text', e.target.value)}
                        margin="normal"
                        disabled={!currentConfig?.messaging?.templates.followupMessage.enabled}
                        helperText="Use {nome}, {empresa}, {dias}, {servico}, {desconto} como variáveis"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Dias Após Agendamento"
                        type="number"
                        fullWidth
                        value={currentConfig?.messaging?.templates.followupMessage.daysSince}
                        onChange={(e) => handleNestedTemplateChange('followupMessage', 'daysSince', parseInt(e.target.value))}
                        margin="normal"
                        disabled={!currentConfig?.messaging?.templates.followupMessage.enabled}
                        InputProps={{ inputProps: { min: 1, max: 365 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Porcentagem de Desconto"
                        type="number"
                        fullWidth
                        value={currentConfig?.messaging?.templates.followupMessage.discountPercent}
                        onChange={(e) => handleNestedTemplateChange('followupMessage', 'discountPercent', parseInt(e.target.value))}
                        margin="normal"
                        disabled={!currentConfig?.messaging?.templates.followupMessage.enabled}
                        InputProps={{ inputProps: { min: 0, max: 100 } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        label="Horário de Envio"
                        type="time"
                        fullWidth
                        value={currentConfig?.messaging?.templates.followupMessage.sendTime}
                        onChange={(e) => handleNestedTemplateChange('followupMessage', 'sendTime', e.target.value)}
                        margin="normal"
                        disabled={!currentConfig?.messaging?.templates.followupMessage.enabled}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Appointment Confirmation Template */}
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>Mensagem de Confirmação de Agendamento</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={currentConfig?.messaging?.templates.appointmentConfirmation.enabled}
                            onChange={(e) => handleNestedTemplateChange('appointmentConfirmation', 'enabled', e.target.checked)}
                          />
                        }
                        label="Ativar mensagens de confirmação"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Título da Mensagem"
                        fullWidth
                        value={currentConfig?.messaging?.templates.appointmentConfirmation.title}
                        onChange={(e) => handleNestedTemplateChange('appointmentConfirmation', 'title', e.target.value)}
                        margin="normal"
                        disabled={!currentConfig?.messaging?.templates.appointmentConfirmation.enabled}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Texto da Mensagem"
                        fullWidth
                        multiline
                        rows={4}
                        value={currentConfig?.messaging?.templates.appointmentConfirmation.text}
                        onChange={(e) => handleNestedTemplateChange('appointmentConfirmation', 'text', e.target.value)}
                        margin="normal"
                        disabled={!currentConfig?.messaging?.templates.appointmentConfirmation.enabled}
                        helperText="Use {nome}, {empresa}, {data}, {hora}, {profissional} como variáveis"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Box>
            
            {/* Opt-in Settings */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Configurações de Opt-in
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Pergunta para Oferta de Aniversário"
                    fullWidth
                    value={currentConfig?.messaging?.optIn?.birthdayPrompt || 'Podemos te enviar uma oferta especial no seu aniversário?'}
                    onChange={(e) => handleNestedOptInChange('birthdayPrompt', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Pergunta para Lembrete de Retorno"
                    fullWidth
                    value={currentConfig?.messaging?.optIn?.followupPrompt || 'Podemos te avisar quando estiver na hora de agendar novamente?'}
                    onChange={(e) => handleNestedOptInChange('followupPrompt', e.target.value)}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Pergunta para Data de Aniversário"
                    fullWidth
                    value={currentConfig?.messaging?.optIn?.birthdayDatePrompt || 'Qual é a data do seu aniversário? (DD/MM)'}
                    onChange={(e) => handleNestedOptInChange('birthdayDatePrompt', e.target.value)}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Box>
            
          </Paper>
        </TabPanel>
        
        {/* Integration Tab */}
        <TabPanel value={tabValue} index={5}>
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
                        checked={currentConfig?.openai?.enabled || false}
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
                    value={currentConfig?.openai?.apiKey || ''}
                    onChange={(e) => handleOpenAIChange('apiKey', e.target.value)}
                    margin="normal"
                    disabled={!currentConfig?.openai?.enabled}
                    helperText="Chave de API do OpenAI (https://platform.openai.com/api-keys)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Modelo</InputLabel>
                    <Select
                      value={currentConfig?.openai?.model || 'gpt-4'}
                      onChange={(e) => handleOpenAIChange('model', e.target.value)}
                      disabled={!currentConfig?.openai?.enabled}
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
                        checked={currentConfig?.chatbot?.guidedMode !== false}
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
                        checked={currentConfig?.messaging?.whatsappIntegration?.enabled || false}
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
                    value={currentConfig?.messaging?.whatsappIntegration?.phoneNumber || ''}
                    onChange={(e) => handleWhatsAppIntegrationChange('phoneNumber', e.target.value)}
                    margin="normal"
                    disabled={!currentConfig?.messaging?.whatsappIntegration?.enabled}
                    helperText="Formato: +5511999999999"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Provedor de API</InputLabel>
                    <Select
                      value={currentConfig?.messaging?.whatsappIntegration?.provider || 'twilio'}
                      onChange={(e) => handleWhatsAppIntegrationChange('provider', e.target.value)}
                      disabled={!currentConfig?.messaging?.whatsappIntegration?.enabled}
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
                    value={currentConfig?.messaging?.whatsappIntegration?.apiKey || ''}
                    onChange={(e) => handleWhatsAppIntegrationChange('apiKey', e.target.value)}
                    margin="normal"
                    disabled={!currentConfig?.messaging?.whatsappIntegration?.enabled}
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
                        checked={currentConfig?.messaging?.googleCalendarIntegration?.enabled || false}
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
                    value={currentConfig?.messaging?.googleCalendarIntegration?.calendarId || ''}
                    onChange={(e) => handleCalendarIntegrationChange('calendarId', e.target.value)}
                    margin="normal"
                    disabled={!currentConfig?.messaging?.googleCalendarIntegration?.enabled}
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
        </TabPanel>
        
        {/* Database Tab */}
        <TabPanel value={tabValue} index={6}>
          <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Configuração do Banco de Dados
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure o tipo de banco de dados e suas respectivas configurações.
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            {/* Database Type Selection */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Tipo de Banco de Dados
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Tipo de Banco de Dados</InputLabel>
                    <Select
                      value={currentConfig?.database?.type || 'dynamodb'}
                      onChange={(e) => handleDatabaseTypeChange(e.target.value)}
                      label="Tipo de Banco de Dados"
                    >
                      <MenuItem value="dynamodb">AWS DynamoDB</MenuItem>
                      <MenuItem value="local">Arquivo JSON Local</MenuItem>
                    </Select>
                    <FormHelperText>Escolha entre usar o DynamoDB na AWS ou armazenar dados localmente</FormHelperText>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
            
            {/* DynamoDB Configuration */}
            {currentConfig?.database?.type === 'dynamodb' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Configuração do AWS DynamoDB
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Região AWS"
                      fullWidth
                      value={currentConfig?.database?.dynamodb?.region || 'us-east-2'}
                      onChange={(e) => handleDynamoDBChange('region', e.target.value)}
                      margin="normal"
                      helperText="Região da AWS onde o DynamoDB está localizado (ex: us-east-1)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nome da Tabela de Agendamentos"
                      fullWidth
                      value={currentConfig?.database?.dynamodb?.appointmentsTable || 'Appointments'}
                      onChange={(e) => handleDynamoDBChange('appointmentsTable', e.target.value)}
                      margin="normal"
                      helperText="Nome da tabela de agendamentos no DynamoDB"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Nome da Tabela de Profissionais"
                      fullWidth
                      value={currentConfig?.database?.dynamodb?.barbersTable || 'Barbers'}
                      onChange={(e) => handleDynamoDBChange('barbersTable', e.target.value)}
                      margin="normal"
                      helperText="Nome da tabela de profissionais no DynamoDB"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Para usar o DynamoDB, você precisará configurar as credenciais da AWS no servidor backend.
                        As tabelas devem ser criadas previamente com a estrutura correta.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Local Database Configuration */}
            {currentConfig?.database?.type === 'local' && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Configuração de Banco de Dados Local
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={currentConfig?.database?.local?.enabled || false}
                          onChange={(e) => handleLocalDBChange('enabled', e.target.checked)}
                        />
                      }
                      label="Ativar armazenamento local"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Dados de Profissionais
                    </Typography>
                    <TextField
                      label="JSON de Profissionais"
                      fullWidth
                      multiline
                      rows={10}
                      value={JSON.stringify(currentConfig?.database?.local?.barbers || [], null, 2)}
                      onChange={(e) => {
                        try {
                          handleLocalDBChange('barbers', JSON.parse(e.target.value));
                        } catch (error) {
                          // Ignore JSON parse errors while typing
                        }
                      }}
                      margin="normal"
                      disabled={!currentConfig?.database?.local?.enabled}
                      helperText="JSON de profissionais no formato: [{'barber_id': '1', 'name': 'Nome', 'specialties': []}]"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      Dados de Agendamentos
                    </Typography>
                    <TextField
                      label="JSON de Agendamentos"
                      fullWidth
                      multiline
                      rows={10}
                      value={JSON.stringify(currentConfig?.database?.local?.appointments || [], null, 2)}
                      onChange={(e) => {
                        try {
                          handleLocalDBChange('appointments', JSON.parse(e.target.value));
                        } catch (error) {
                          // Ignore JSON parse errors while typing
                        }
                      }}
                      margin="normal"
                      disabled={!currentConfig?.database?.local?.enabled}
                      helperText="JSON de agendamentos no formato: [{'appointment_id': '1', 'date': '2023-01-01', 'barber_id': '1', 'client_name': 'Nome'}]"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        O armazenamento local salva os dados no navegador do usuário. Isso é útil para testes
                        ou ambientes onde não é possível usar o DynamoDB. Os dados serão perdidos se o usuário
                        limpar o cache do navegador.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </TabPanel>
        
        {/* Security Settings Tab */}
        <TabPanel value={tabValue} index={7}>
          <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Segurança
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure as credenciais de acesso à área administrativa.
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nome de Usuário"
                  fullWidth
                  value={currentConfig.auth.username}
                  onChange={(e) => handleInputChange('auth', 'username', e.target.value)}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Senha"
                  type="password"
                  fullWidth
                  value={currentConfig.auth.password}
                  onChange={(e) => handleInputChange('auth', 'password', e.target.value)}
                  margin="normal"
                />
              </Grid>
            </Grid>
            
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                Importante: Lembre-se de guardar essas credenciais em um local seguro. Elas são necessárias para acessar
                a área administrativa e fazer alterações no sistema.
              </Typography>
            </Alert>
          </Paper>
        </TabPanel>
      </Container>
      
      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>Resetar Configurações</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja resetar todas as configurações para os valores padrão?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleResetConfirm} color="error" variant="contained">
            Resetar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Save Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={6000}
        onClose={() => setSaveSuccess(false)}
        message="Configurações salvas com sucesso!"
      />
    </Box>
  );
}

ConfigPage.propTypes = {
  onBack: PropTypes.func.isRequired
};

export default ConfigPage;