import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useConfig } from '../../../context/ConfigContext';

export default function BusinessConfig() {
  const { config, updateConfig, getUserRole } = useConfig();
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    duration: 40,
    price: 0
  });
  const [serviceError, setServiceError] = useState('');
  
  // Get user role to check service limits
  const userRole = getUserRole();
  const isFreeTier = userRole === 'free' || userRole === 'individual';
  const maxServices = config?.services?.maxItems || 10;
  const currentServices = config?.services?.items || [];

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
  
  // Handler for services changes
  const handleServicesChange = (updatedServices) => {
    updateConfig({
      ...config,
      services: {
        ...(config.services || {}),
        items: updatedServices
      }
    });
  };
  
  // Open the service dialog for adding a new service
  const handleAddService = () => {
    setEditingService(null);
    setServiceFormData({
      name: '',
      duration: config?.business?.appointmentDuration || 40,
      price: 0
    });
    setServiceError('');
    setServiceDialogOpen(true);
  };
  
  // Open the service dialog for editing an existing service
  const handleEditService = (service) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name,
      duration: service.duration,
      price: service.price
    });
    setServiceError('');
    setServiceDialogOpen(true);
  };
  
  // Delete a service
  const handleDeleteService = (serviceId) => {
    const updatedServices = currentServices.filter(service => service.id !== serviceId);
    handleServicesChange(updatedServices);
  };
  
  // Handle changes to the service form
  const handleServiceFormChange = (field, value) => {
    setServiceFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Save a service (new or edited)
  const handleSaveService = () => {
    // Validate form data
    if (!serviceFormData.name.trim()) {
      setServiceError('O nome do serviço é obrigatório');
      return;
    }
    
    if (serviceFormData.duration <= 0) {
      setServiceError('A duração deve ser maior que zero');
      return;
    }
    
    if (serviceFormData.price < 0) {
      setServiceError('O preço não pode ser negativo');
      return;
    }
    
    let updatedServices;
    
    if (editingService) {
      // Edit existing service
      updatedServices = currentServices.map(service => 
        service.id === editingService.id 
          ? { ...service, ...serviceFormData }
          : service
      );
    } else {
      // Add new service
      if (isFreeTier && currentServices.length >= maxServices) {
        setServiceError(`Sua conta permite no máximo ${maxServices} serviços. Faça upgrade para adicionar mais.`);
        return;
      }
      
      // Generate a new ID
      const newId = Date.now().toString();
      updatedServices = [
        ...currentServices,
        {
          id: newId,
          ...serviceFormData
        }
      ];
    }
    
    handleServicesChange(updatedServices);
    setServiceDialogOpen(false);
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
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Horário de Funcionamento
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Segunda a Sexta"
            fullWidth
            value={config?.business?.weekdayHours || '07:00-19:00'}
            onChange={(e) => handleBusinessChange('weekdayHours', e.target.value)}
            margin="normal"
            helperText="Formato: HH:MM-HH:MM. Exemplo: 08:00-18:00 (em branco = fechado)"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Sábado"
            fullWidth
            value={config?.business?.saturdayHours || '08:00-14:00'}
            onChange={(e) => handleBusinessChange('saturdayHours', e.target.value)}
            margin="normal"
            helperText="Formato: HH:MM-HH:MM. Exemplo: 08:00-14:00 (em branco = fechado)"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Domingo"
            fullWidth
            value={config?.business?.sundayHours || ''}
            onChange={(e) => handleBusinessChange('sundayHours', e.target.value)}
            margin="normal"
            helperText="Formato: HH:MM-HH:MM. Exemplo: 09:00-13:00 (em branco = fechado)"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Feriados"
            fullWidth
            value={config?.business?.holidayHours || ''}
            onChange={(e) => handleBusinessChange('holidayHours', e.target.value)}
            margin="normal"
            helperText="Formato: HH:MM-HH:MM. Deixe em branco para fechado em feriados"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            label="Feriados Específicos"
            fullWidth
            value={config?.business?.specificHolidays?.join(', ') || '25/12, 01/01'}
            onChange={(e) => handleBusinessChange('specificHolidays', e.target.value.split(', '))}
            margin="normal"
            helperText="Liste os feriados no formato DD/MM separados por vírgula"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Intervalo de Agendamentos (minutos)"
            type="number"
            fullWidth
            value={config?.business?.appointmentInterval || 30}
            onChange={(e) => handleBusinessChange('appointmentInterval', parseInt(e.target.value))}
            margin="normal"
            InputProps={{ inputProps: { min: 15, step: 5 } }}
            helperText="Intervalo mínimo entre agendamentos"
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

      {/* Serviços Disponíveis Section */}
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h5" gutterBottom>
        Serviços Disponíveis
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure os serviços oferecidos pelo seu negócio.
        {isFreeTier && ` Contas ${userRole === 'free' ? 'gratuitas' : 'individuais'} podem ter até ${maxServices} serviços.`}
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            {currentServices.length} {currentServices.length === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddService}
            disabled={isFreeTier && currentServices.length >= maxServices}
            sx={{ borderRadius: 2 }}
          >
            Adicionar Serviço
          </Button>
        </Box>
        
        {isFreeTier && currentServices.length >= maxServices && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Você atingiu o limite de serviços para sua conta. Considere fazer upgrade para adicionar mais serviços.
          </Alert>
        )}
        
        <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, boxShadow: 1 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Nome do Serviço</TableCell>
                <TableCell align="center">Duração (min)</TableCell>
                <TableCell align="center">Preço (R$)</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      Nenhum serviço cadastrado. Clique em Adicionar Serviço para começar.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                currentServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell align="center">{service.duration}</TableCell>
                    <TableCell align="center">R$ {service.price.toFixed(2)}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="primary" 
                        size="small" 
                        onClick={() => handleEditService(service)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        size="small" 
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* Add/Edit Service Dialog */}
      <Dialog 
        open={serviceDialogOpen} 
        onClose={() => setServiceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Nome do Serviço"
                fullWidth
                value={serviceFormData.name}
                onChange={(e) => handleServiceFormChange('name', e.target.value)}
                margin="normal"
                autoFocus
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Duração (minutos)"
                type="number"
                fullWidth
                value={serviceFormData.duration}
                onChange={(e) => handleServiceFormChange('duration', parseInt(e.target.value) || 0)}
                margin="normal"
                InputProps={{ inputProps: { min: 5, step: 5 } }}
                required
              />
              <FormHelperText>
                Tempo de duração do serviço em minutos
              </FormHelperText>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Preço (R$)"
                type="number"
                fullWidth
                value={serviceFormData.price}
                onChange={(e) => handleServiceFormChange('price', parseFloat(e.target.value) || 0)}
                margin="normal"
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                required
              />
              <FormHelperText>
                Valor cobrado pelo serviço
              </FormHelperText>
            </Grid>
            {serviceError && (
              <Grid item xs={12}>
                <Alert severity="error">{serviceError}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setServiceDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveService} 
            variant="contained"
            color="primary"
          >
            {editingService ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}