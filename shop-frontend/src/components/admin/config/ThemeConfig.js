import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  Box,
} from '@mui/material';
import { useConfig } from '../../../context/ConfigContext';

export default function ThemeConfig() {
  const { config, updateConfig } = useConfig();

  // Handler for theme settings changes
  const handleThemeChange = (field, value) => {
    updateConfig({
      ...config,
      theme: {
        ...(config.theme || {}),
        [field]: value
      }
    });
  };

  return (
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
            value={config?.theme?.primaryColor || '#1976d2'}
            onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
            margin="normal"
            helperText="Cor principal (formato hex: #1976d2)"
            InputProps={{
              endAdornment: (
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1,
                    bgcolor: config?.theme?.primaryColor || '#1976d2',
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
            value={config?.theme?.secondaryColor || '#dc004e'}
            onChange={(e) => handleThemeChange('secondaryColor', e.target.value)}
            margin="normal"
            helperText="Cor secundária (formato hex: #dc004e)"
            InputProps={{
              endAdornment: (
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1,
                    bgcolor: config?.theme?.secondaryColor || '#dc004e',
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
            value={config?.theme?.chatBubbleColor || '#f5f5f5'}
            onChange={(e) => handleThemeChange('chatBubbleColor', e.target.value)}
            margin="normal"
            helperText="Cor de fundo do chat"
            InputProps={{
              endAdornment: (
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1,
                    bgcolor: config?.theme?.chatBubbleColor || '#f5f5f5',
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
            value={config?.theme?.userMessageColor || '#1976d2'}
            onChange={(e) => handleThemeChange('userMessageColor', e.target.value)}
            margin="normal"
            helperText="Cor das mensagens do usuário"
            InputProps={{
              endAdornment: (
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1,
                    bgcolor: config?.theme?.userMessageColor || '#1976d2',
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
            value={config?.theme?.assistantMessageColor || '#f5f5f5'}
            onChange={(e) => handleThemeChange('assistantMessageColor', e.target.value)}
            margin="normal"
            helperText="Cor das mensagens do assistente"
            InputProps={{
              endAdornment: (
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 1,
                    bgcolor: config?.theme?.assistantMessageColor || '#f5f5f5',
                    border: '1px solid #ccc' 
                  }} 
                />
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
            Visualização
          </Typography>
          <Box sx={{ 
            p: 2, 
            border: '1px solid #ddd', 
            borderRadius: 2,
            bgcolor: config?.theme?.chatBubbleColor || '#f5f5f5',
            minHeight: 150
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              mb: 2
            }}>
              <Box sx={{
                p: 1.5,
                borderRadius: '18px 18px 18px 4px',
                bgcolor: config?.theme?.assistantMessageColor || '#f5f5f5',
                maxWidth: '80%',
                boxShadow: 1
              }}>
                <Typography>Olá! Como posso ajudar?</Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-end'
            }}>
              <Box sx={{
                p: 1.5,
                borderRadius: '18px 18px 4px 18px',
                bgcolor: config?.theme?.userMessageColor || '#1976d2',
                color: 'white',
                maxWidth: '80%',
                boxShadow: 1
              }}>
                <Typography>Gostaria de agendar um horário</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}