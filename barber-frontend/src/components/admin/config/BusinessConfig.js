import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
} from '@mui/material';
import { useConfig } from '../../../context/ConfigContext';

export default function BusinessConfig() {
  const { config, updateConfig } = useConfig();

  // Handler for business settings changes
  const handleBusinessChange = (field, value) => {
    updateConfig({
      ...config,
      business: {
        ...(config.business || {}),
        [field]: value
      }
    });
  };

  return (
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
            value={config?.business?.name || ''}
            onChange={(e) => handleBusinessChange('name', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Tipo de Negócio"
            fullWidth
            value={config?.business?.type || ''}
            onChange={(e) => handleBusinessChange('type', e.target.value)}
            margin="normal"
            helperText="Ex: Barbearia, Salão de Beleza, Consultório, etc."
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Horário de Abertura"
            type="time"
            fullWidth
            value={config?.business?.openHours || '07:00'}
            onChange={(e) => handleBusinessChange('openHours', e.target.value)}
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
            value={config?.business?.closeHours || '19:00'}
            onChange={(e) => handleBusinessChange('closeHours', e.target.value)}
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
            value={config?.business?.lastAppointmentTime || '18:20'}
            onChange={(e) => handleBusinessChange('lastAppointmentTime', e.target.value)}
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
            value={config?.business?.closedDays?.join(', ') || 'Domingo'}
            onChange={(e) => handleBusinessChange('closedDays', e.target.value.split(', '))}
            margin="normal"
            helperText="Separe os dias por vírgula. Ex: Domingo, Feriados"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Duração do Atendimento (minutos)"
            type="number"
            fullWidth
            value={config?.business?.appointmentDuration || 40}
            onChange={(e) => handleBusinessChange('appointmentDuration', parseInt(e.target.value))}
            margin="normal"
            InputProps={{ inputProps: { min: 5, step: 5 } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Intervalo de Horários (minutos)"
            type="number"
            fullWidth
            value={config?.business?.appointmentInterval || 10}
            onChange={(e) => handleBusinessChange('appointmentInterval', parseInt(e.target.value))}
            margin="normal"
            InputProps={{ inputProps: { min: 5, step: 5 } }}
            helperText="Intervalo entre os horários disponíveis"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Endereço Completo"
            fullWidth
            multiline
            rows={2}
            value={config?.business?.address || ''}
            onChange={(e) => handleBusinessChange('address', e.target.value)}
            margin="normal"
            helperText="Endereço completo do estabelecimento"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Telefone de Contato"
            fullWidth
            value={config?.business?.phone || ''}
            onChange={(e) => handleBusinessChange('phone', e.target.value)}
            margin="normal"
            helperText="Telefone principal para contato"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="E-mail de Contato"
            fullWidth
            value={config?.business?.email || ''}
            onChange={(e) => handleBusinessChange('email', e.target.value)}
            margin="normal"
            helperText="E-mail para contato"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}