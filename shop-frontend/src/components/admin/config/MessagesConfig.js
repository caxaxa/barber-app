import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useConfig } from '../../../context/ConfigContext';

export default function MessagesConfig() {
  const { config, updateConfig } = useConfig();

  // Handler for messaging template changes
  const handleNestedTemplateChange = (template, field, value) => {
    updateConfig({
      ...config,
      messaging: {
        ...(config.messaging || {}),
        templates: {
          ...(config.messaging?.templates || {}),
          [template]: {
            ...(config.messaging?.templates?.[template] || {}),
            [field]: value
          }
        }
      }
    });
  };

  // Handler for messaging opt-in changes
  const handleNestedOptInChange = (field, value) => {
    updateConfig({
      ...config,
      messaging: {
        ...(config.messaging || {}),
        optIn: {
          ...(config.messaging?.optIn || {}),
          [field]: value
        }
      }
    });
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Mensagens Automáticas
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure o conteúdo das mensagens automáticas enviadas aos clientes.
      </Typography>
      <Divider sx={{ my: 3 }} />
      
      {/* Message Templates Section */}
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
                    checked={config?.messaging?.templates?.birthdayMessage?.enabled || false}
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
                value={config?.messaging?.templates?.birthdayMessage?.title || 'Mensagem de Aniversário'}
                onChange={(e) => handleNestedTemplateChange('birthdayMessage', 'title', e.target.value)}
                margin="normal"
                disabled={!config?.messaging?.templates?.birthdayMessage?.enabled}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Texto da Mensagem"
                fullWidth
                multiline
                rows={4}
                value={config?.messaging?.templates?.birthdayMessage?.text || 'Olá {nome}! A {empresa} deseja um feliz aniversário! Como presente especial, oferecemos {desconto}% de desconto em qualquer serviço até o final do mês. Agende seu horário respondendo esta mensagem!'}
                onChange={(e) => handleNestedTemplateChange('birthdayMessage', 'text', e.target.value)}
                margin="normal"
                disabled={!config?.messaging?.templates?.birthdayMessage?.enabled}
                helperText="Use {nome}, {empresa}, {desconto} como variáveis"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Porcentagem de Desconto"
                type="number"
                fullWidth
                value={config?.messaging?.templates?.birthdayMessage?.discountPercent || 15}
                onChange={(e) => handleNestedTemplateChange('birthdayMessage', 'discountPercent', parseInt(e.target.value))}
                margin="normal"
                disabled={!config?.messaging?.templates?.birthdayMessage?.enabled}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Horário de Envio"
                type="time"
                fullWidth
                value={config?.messaging?.templates?.birthdayMessage?.sendTime || '10:00'}
                onChange={(e) => handleNestedTemplateChange('birthdayMessage', 'sendTime', e.target.value)}
                margin="normal"
                disabled={!config?.messaging?.templates?.birthdayMessage?.enabled}
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
                    checked={config?.messaging?.templates?.followupMessage?.enabled || false}
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
                value={config?.messaging?.templates?.followupMessage?.title || 'Mensagem de Retorno'}
                onChange={(e) => handleNestedTemplateChange('followupMessage', 'title', e.target.value)}
                margin="normal"
                disabled={!config?.messaging?.templates?.followupMessage?.enabled}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Texto da Mensagem"
                fullWidth
                multiline
                rows={4}
                value={config?.messaging?.templates?.followupMessage?.text || 'Olá {nome}! Já faz {dias} dias desde seu último {servico} na {empresa}. Que tal agendar um novo horário? Responda esta mensagem para mais informações!'}
                onChange={(e) => handleNestedTemplateChange('followupMessage', 'text', e.target.value)}
                margin="normal"
                disabled={!config?.messaging?.templates?.followupMessage?.enabled}
                helperText="Use {nome}, {empresa}, {dias}, {servico}, {desconto} como variáveis"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Dias Após Agendamento"
                type="number"
                fullWidth
                value={config?.messaging?.templates?.followupMessage?.daysSince || 30}
                onChange={(e) => handleNestedTemplateChange('followupMessage', 'daysSince', parseInt(e.target.value))}
                margin="normal"
                disabled={!config?.messaging?.templates?.followupMessage?.enabled}
                InputProps={{ inputProps: { min: 1, max: 365 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Porcentagem de Desconto"
                type="number"
                fullWidth
                value={config?.messaging?.templates?.followupMessage?.discountPercent || 10}
                onChange={(e) => handleNestedTemplateChange('followupMessage', 'discountPercent', parseInt(e.target.value))}
                margin="normal"
                disabled={!config?.messaging?.templates?.followupMessage?.enabled}
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Horário de Envio"
                type="time"
                fullWidth
                value={config?.messaging?.templates?.followupMessage?.sendTime || '14:00'}
                onChange={(e) => handleNestedTemplateChange('followupMessage', 'sendTime', e.target.value)}
                margin="normal"
                disabled={!config?.messaging?.templates?.followupMessage?.enabled}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Appointment Confirmation Template */}
      <Accordion sx={{ mb: 4 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Mensagem de Confirmação de Agendamento</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config?.messaging?.templates?.appointmentConfirmation?.enabled || true}
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
                value={config?.messaging?.templates?.appointmentConfirmation?.title || 'Confirmação de Agendamento'}
                onChange={(e) => handleNestedTemplateChange('appointmentConfirmation', 'title', e.target.value)}
                margin="normal"
                disabled={!config?.messaging?.templates?.appointmentConfirmation?.enabled}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Texto da Mensagem"
                fullWidth
                multiline
                rows={4}
                value={config?.messaging?.templates?.appointmentConfirmation?.text || 'Olá {nome}! Seu agendamento na {empresa} está confirmado para {data} às {hora} com {profissional}. Deseja receber lembretes e ofertas especiais no seu aniversário?'}
                onChange={(e) => handleNestedTemplateChange('appointmentConfirmation', 'text', e.target.value)}
                margin="normal"
                disabled={!config?.messaging?.templates?.appointmentConfirmation?.enabled}
                helperText="Use {nome}, {empresa}, {data}, {hora}, {profissional} como variáveis"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Opt-in Settings */}
      <Typography variant="h6" gutterBottom color="primary">
        Configurações de Opt-in
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="Pergunta para Oferta de Aniversário"
            fullWidth
            value={config?.messaging?.optIn?.birthdayPrompt || 'Podemos te enviar uma oferta especial no seu aniversário?'}
            onChange={(e) => handleNestedOptInChange('birthdayPrompt', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Pergunta para Lembrete de Retorno"
            fullWidth
            value={config?.messaging?.optIn?.followupPrompt || 'Podemos te avisar quando estiver na hora de agendar novamente?'}
            onChange={(e) => handleNestedOptInChange('followupPrompt', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Pergunta para Data de Aniversário"
            fullWidth
            value={config?.messaging?.optIn?.birthdayDatePrompt || 'Qual é a data do seu aniversário? (DD/MM)'}
            onChange={(e) => handleNestedOptInChange('birthdayDatePrompt', e.target.value)}
            margin="normal"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}