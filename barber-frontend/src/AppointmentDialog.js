import React, { useState } from 'react';
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

export default function AppointmentDialog({
  open,
  onClose,
  dateTime,
  apiEndpoint,
  refreshAppointments,
  barbers = [],
}) {
  const initialDate = dateTime || '';
  const [formData, setFormData] = useState({
    barber_id: '',
    date: initialDate,
    start_time: '',
    duration: 40,
    client_name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.start_time || !formData.barber_id) {
      alert('Please fill in barber, date, and start time.');
      return;
    }
    try {
      const res = await fetch(`${apiEndpoint}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Appointment booked successfully!');
        onClose();
        refreshAppointments();
      } else {
        alert('Error booking appointment: ' + data.message);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Book Appointment</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Typography>Date</Typography>
          <TextField
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            fullWidth
            margin="dense"
          />

          <Typography>Start Time</Typography>
          <TextField
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
            fullWidth
            margin="dense"
          />

          <Typography>Barber</Typography>
          <Select
            name="barber_id"
            value={formData.barber_id}
            onChange={handleChange}
            fullWidth
            required
            sx={{ mt: 1, mb: 2 }}
          >
            {barbers.map((barber) => (
              <MenuItem key={barber.barber_id} value={barber.barber_id}>
                {barber.name}
              </MenuItem>
            ))}
          </Select>

          <Typography>Client Name</Typography>
          <TextField
            type="text"
            name="client_name"
            value={formData.client_name}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" color="primary" type="submit">
            Book
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
