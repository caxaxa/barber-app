import React, { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useConfig } from '../../context/ConfigContext';
import { fetchAppointments, fetchBarbers, bookAppointment } from '../../services/api';
import { useNotification } from '../ui/NotificationContext';

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`barber-tabpanel-${index}`}
      aria-labelledby={`barber-tab-${index}`}
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

function BarberProfilePage({ onBack }) {
  const { logout } = useConfig();
  const { showNotification } = useNotification();
  const [tabValue, setTabValue] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameField, setNameField] = useState('');
  const [phoneField, setPhoneField] = useState('');
  const [emailField, setEmailField] = useState('');
  
  // Get barber information from session storage
  const barberId = sessionStorage.getItem('barberId');
  const barberName = sessionStorage.getItem('barberName');
  
  // Fetch barber appointments
  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would filter by the logged-in barber's ID
        const appointmentsData = await fetchAppointments();
        // Filter appointments for just this barber
        const barberAppointments = appointmentsData.filter(appt => 
          appt.barber_id?.toString() === barberId
        );
        setAppointments(barberAppointments);
      } catch (error) {
        console.error('Failed to load appointments:', error);
        showNotification('Error loading appointments', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadAppointments();
  }, [barberId, showNotification]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleLogout = () => {
    logout();
    onBack();
  };
  
  const handleNewAppointment = async () => {
    if (!nameField) {
      showNotification('Por favor, informe o nome do cliente', 'error');
      return;
    }
    
    // Open a date picker dialog
    const date = prompt('Informe a data do agendamento (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    
    // Open a time picker dialog
    const time = prompt('Informe o horário do agendamento (HH:MM):', '09:00');
    if (!time) return;
    
    // Create appointment data - using the individual barber's ID
    const appointmentData = {
      date,
      start_time: time,
      client_name: nameField,
      phone: phoneField,
      email: emailField,
      // For the individual barber table, we don't need barber_id
      // Instead, we'll use a custom bookBarberAppointment API function
    };
    
    try {
      // For the prototype, we'll use the standard API call but log that we would use a different table
      console.log('Booking appointment in barber-specific table:', appointmentData);
      
      // In a real implementation, this would call a specific API endpoint for individual barber appointments
      // For now, we'll use the regular function but add barber_id
      const result = await bookAppointment({
        ...appointmentData,
        barber_id: parseInt(barberId, 10),
      });
      
      showNotification('Appointment booked successfully!', 'success');
      
      // Reload appointments
      const appointmentsData = await fetchAppointments();
      const barberAppointments = appointmentsData.filter(appt => 
        appt.barber_id?.toString() === barberId
      );
      setAppointments(barberAppointments);
      
      // Clear form fields
      setNameField('');
      setPhoneField('');
      setEmailField('');
    } catch (error) {
      console.error('Error booking appointment:', error);
      showNotification(error.message || 'Error booking appointment', 'error');
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <AppBar position="fixed" color="primary" sx={{ top: 0, left: 0, right: 0 }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onBack}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Perfil do Profissional: {barberName}
          </Typography>
          <IconButton color="inherit" onClick={handleLogout} aria-label="logout">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
          sx={{ bgcolor: 'primary.dark' }}
        >
          <Tab label="Meus Agendamentos" icon={<CalendarMonthIcon />} id="barber-tab-0" aria-controls="barber-tabpanel-0" />
          <Tab label="Meu Perfil" icon={<AccountCircleIcon />} id="barber-tab-1" aria-controls="barber-tabpanel-1" />
        </Tabs>
      </AppBar>
      
      <Box sx={{ mt: 10 }}>
        {/* My Appointments Tab */}
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Meus Agendamentos
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Visualize e gerencie seus próximos agendamentos.
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            {/* New Appointment Form */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Adicionar Novo Agendamento
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Nome do Cliente"
                    fullWidth
                    value={nameField}
                    onChange={(e) => setNameField(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Telefone"
                    fullWidth
                    value={phoneField}
                    onChange={(e) => setPhoneField(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Email"
                    fullWidth
                    value={emailField}
                    onChange={(e) => setEmailField(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    onClick={handleNewAppointment}
                    disabled={!nameField}
                  >
                    Adicionar Agendamento
                  </Button>
                </Grid>
              </Grid>
            </Paper>
            
            {/* Appointments Table */}
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell>Data</TableCell>
                    <TableCell>Horário</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Duração</TableCell>
                    <TableCell>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">Carregando agendamentos...</TableCell>
                    </TableRow>
                  ) : appointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">Nenhum agendamento encontrado</TableCell>
                    </TableRow>
                  ) : (
                    appointments.map((appointment) => (
                      <TableRow key={appointment.appointment_id || `${appointment.date}-${appointment.start_time}`}>
                        <TableCell>{formatDate(appointment.date)}</TableCell>
                        <TableCell>{appointment.start_time}</TableCell>
                        <TableCell>{appointment.client_name}</TableCell>
                        <TableCell>{appointment.duration || 40} minutos</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => {
                              // In a real implementation, this would call an API to cancel the appointment
                              showNotification('Esta funcionalidade será implementada em breve', 'info');
                            }}
                          >
                            Cancelar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </TabPanel>
        
        {/* My Profile Tab */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Meu Perfil
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Gerencie suas informações pessoais e preferências.
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nome Completo"
                  fullWidth
                  defaultValue={barberName}
                  margin="normal"
                  disabled
                  helperText="Para alterar seu nome, contate o administrador do sistema"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="ID do Profissional"
                  fullWidth
                  defaultValue={barberId}
                  margin="normal"
                  disabled
                  helperText="Identificador único no sistema"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  fullWidth
                  defaultValue="carlos.silva@exemplo.com"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Telefone"
                  fullWidth
                  defaultValue="(11) 98765-4321"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Especialidades"
                  fullWidth
                  defaultValue="Cabelo, Barba"
                  margin="normal"
                  helperText="Separe as especialidades por vírgula"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Biografia"
                  fullWidth
                  multiline
                  rows={4}
                  defaultValue="Profissional especializado em cortes modernos e barba tradicional. Mais de 5 anos de experiência no setor."
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary">
                  Salvar Alterações
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>
      </Box>
    </Container>
  );
}

BarberProfilePage.propTypes = {
  onBack: PropTypes.func.isRequired
};

export default BarberProfilePage;