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

export default function TerminologyConfig() {
  const { config, updateConfig } = useConfig();

  // Handler for nested input change (for arrays or objects)
  const handleNestedInputChange = (section, index, field, value) => {
    const updatedSection = [...(config[section] || [])];
    
    // If the section doesn't exist or the index is out of bounds, create it
    if (!updatedSection[index]) {
      updatedSection[index] = {};
    }
    
    updatedSection[index] = {
      ...updatedSection[index],
      [field]: value
    };
    
    updateConfig({
      ...config,
      [section]: updatedSection
    });
  };

  return (
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
              value={config?.professionals?.[0]?.label || 'Profissionais'}
              onChange={(e) => handleNestedInputChange('professionals', 0, 'label', e.target.value)}
              margin="normal"
              helperText="Ex: Profissionais, Barbeiros, Médicos, etc."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Termo no Singular"
              fullWidth
              value={config?.professionals?.[0]?.singular || 'Profissional'}
              onChange={(e) => handleNestedInputChange('professionals', 0, 'singular', e.target.value)}
              margin="normal"
              helperText="Ex: Profissional, Barbeiro, Médico, etc."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Termo no Plural"
              fullWidth
              value={config?.professionals?.[0]?.plural || 'Profissionais'}
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
              value={config?.services?.[0]?.label || 'Serviços'}
              onChange={(e) => handleNestedInputChange('services', 0, 'label', e.target.value)}
              margin="normal"
              helperText="Ex: Serviços, Cortes, Consultas, etc."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Termo no Singular"
              fullWidth
              value={config?.services?.[0]?.singular || 'Serviço'}
              onChange={(e) => handleNestedInputChange('services', 0, 'singular', e.target.value)}
              margin="normal"
              helperText="Ex: Serviço, Corte, Consulta, etc."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Termo no Plural"
              fullWidth
              value={config?.services?.[0]?.plural || 'Serviços'}
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
              value={config?.clients?.[0]?.label || 'Clientes'}
              onChange={(e) => handleNestedInputChange('clients', 0, 'label', e.target.value)}
              margin="normal"
              helperText="Ex: Clientes, Pacientes, Alunos, etc."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Termo no Singular"
              fullWidth
              value={config?.clients?.[0]?.singular || 'Cliente'}
              onChange={(e) => handleNestedInputChange('clients', 0, 'singular', e.target.value)}
              margin="normal"
              helperText="Ex: Cliente, Paciente, Aluno, etc."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Termo no Plural"
              fullWidth
              value={config?.clients?.[0]?.plural || 'Clientes'}
              onChange={(e) => handleNestedInputChange('clients', 0, 'plural', e.target.value)}
              margin="normal"
              helperText="Ex: Clientes, Pacientes, Alunos, etc."
            />
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}