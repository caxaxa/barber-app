import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  Alert,
} from '@mui/material';
import { useConfig } from '../../../context/ConfigContext';

export default function SecurityConfig() {
  const { config, updateConfig } = useConfig();

  // Handler for auth settings changes
  const handleAuthChange = (field, value) => {
    updateConfig({
      ...config,
      auth: {
        ...(config.auth || {}),
        [field]: value
      }
    });
  };

  return (
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
            value={config?.auth?.username || ''}
            onChange={(e) => handleAuthChange('username', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Senha"
            type="password"
            fullWidth
            value={config?.auth?.password || ''}
            onChange={(e) => handleAuthChange('password', e.target.value)}
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
  );
}