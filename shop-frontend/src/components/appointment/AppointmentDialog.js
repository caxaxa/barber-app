import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Select,
  MenuItem,
} from '@mui/material';
import { bookAppointment } from '../../services/api';
import { useNotification } from '../ui/NotificationContext';
import { useConfig } from '../../context/ConfigContext';

export default function AppointmentDialog({
  open,
  onClose,
  dateTime = '',
  refreshAppointments,
  workers = [],
}) {
  const initialDate = dateTime || '';
  const { showNotification } = useNotification();
  const { config } = useConfig();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    worker_id: '',
    date: initialDate,
    start_time: '',
    duration: config?.business?.appointmentDuration || 40,
    client_name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.start_time || !formData.worker_id) {
      showNotification('Please fill in worker, date, and start time.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add worker_name to the appointment data for better error messages
      const selectedWorker = workers.find(w => w.worker_id === formData.worker_id);
      const appointmentWithWorkerName = {
        ...formData,
        worker_name: selectedWorker?.name || ''
      };
      
      await bookAppointment(appointmentWithWorkerName);
      showNotification('Appointment booked successfully!', 'success');
      onClose();
      refreshAppointments();
    } catch (error) {
      showNotification(error.message || 'Error booking appointment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      worker_id: '',
      date: initialDate,
      start_time: '',
      duration: config?.business?.appointmentDuration || 40,
      client_name: '',
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 500
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: config?.theme?.primaryColor || '#1976d2', 
        color: 'white',
        py: 2,
        fontSize: '1.5rem'
      }}>
        Agendar Novo Horário
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Data
            </Typography>
            <TextField
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              fullWidth
              margin="dense"
              inputProps={{ 'aria-label': 'appointment date' }}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Horário
            </Typography>
            <TextField
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
              fullWidth
              margin="dense"
              inputProps={{ 'aria-label': 'appointment time', step: 600 }}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              helperText={`Os horários são disponíveis a cada ${config?.business?.appointmentInterval || 10} minutos`}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {config?.professionals?.[0]?.singular || 'Profissional'}
            </Typography>
            <Select
              name="worker_id"
              value={formData.worker_id}
              onChange={handleChange}
              fullWidth
              required
              displayEmpty
              sx={{ 
                mt: 1, 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
              inputProps={{ 'aria-label': 'select worker' }}
            >
              <MenuItem disabled value="">
                <em>Selecione um {config?.professionals?.[0]?.singular?.toLowerCase() || 'profissional'}</em>
              </MenuItem>
              {workers.map((worker) => (
                <MenuItem key={worker.worker_id || worker.worker_id} value={worker.worker_id || worker.worker_id}>
                  {worker.name}
                </MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Seu Nome
            </Typography>
            <TextField
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              placeholder="Digite seu nome completo"
              inputProps={{ 'aria-label': 'client name' }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleClose} 
            disabled={isSubmitting}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            type="submit"
            disabled={isSubmitting}
            sx={{ 
              borderRadius: 2, 
              px: 3,
              boxShadow: 2,
              bgcolor: config?.theme?.primaryColor || '#1976d2',
              '&:hover': {
                bgcolor: config?.theme?.primaryColor || '#1976d2',
                filter: 'brightness(0.9)'
              }
            }}
          >
            {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

AppointmentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dateTime: PropTypes.string,
  refreshAppointments: PropTypes.func.isRequired,
  workers: PropTypes.arrayOf(
    PropTypes.shape({
      worker_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string.isRequired,
    })
  ),
};