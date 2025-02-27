import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import ChatToggleButton from './ChatToggleButton';
import FloatingChat from './FloatingChat';
import AppointmentDialog from './AppointmentDialog';  // <-- Import your dialog

const API_ENDPOINT = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // State for the appointment dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_ENDPOINT}/appointments/all`);
      const data = await res.json();
      if (data?.appointments) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  // Fetch barbers
  const fetchBarbers = async () => {
    try {
      const res = await fetch(`${API_ENDPOINT}/barbers`);
      const data = await res.json();
      if (data?.barbers) {
        setBarbers(data.barbers);
      }
    } catch (error) {
      console.error('Error fetching barbers:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchBarbers();
  }, []);

  // Toggle for chat popup
  const toggleChat = () => setIsChatOpen(prev => !prev);

  // Function to handle new appointment (from chat GPT or modal)
  const handleNewAppointment = async (appointmentData) => {
    try {
      const res = await fetch(`${API_ENDPOINT}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert('Error booking appointment: ' + errorData.message);
      } else {
        alert('Appointment booked successfully!');
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
      alert('Error booking appointment.');
    }
  };

  // If barbers have a "color" field, fetch the color for each appointment
  const getColorForBarber = (barber_id) => {
    const found = barbers.find(b => b.barber_id === barber_id);
    return found?.color || '#0099FF';
  };

  // dateClick for FullCalendar -> open the AppointmentDialog
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);  // store clicked date
    setDialogOpen(true);            // open the modal
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Full screen calendar */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={appointments.map((item) => {
          const start = new Date(`${item.date}T${item.start_time}`);
          const color = getColorForBarber(item.barber_id);
          return {
            id: `${item.date}-${item.start_time}-${item.barber_id}`,
            title: item.client_name,
            start,
            end: new Date(start.getTime() + (item.duration || 40) * 60000),
            backgroundColor: color,
            borderColor: color,
          };
        })}
        height="100%"
        dateClick={handleDateClick}  // <-- important!
      />

      {/* Floating chat toggle button */}
      <ChatToggleButton onClick={toggleChat} />

      {/* Popup chat window */}
      <FloatingChat
        open={isChatOpen}
        onClose={toggleChat}
        onNewAppointment={handleNewAppointment}
        barbers={barbers}
      />

      {/* The modal for manual booking */}
      <AppointmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        dateTime={selectedDate}
        apiEndpoint={API_ENDPOINT}
        refreshAppointments={fetchAppointments}
        barbers={barbers}
      />
    </Box>
  );
}
