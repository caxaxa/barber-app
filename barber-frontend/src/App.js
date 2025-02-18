import React, { useEffect, useState } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import { createViewMonthGrid } from '@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';
import Chatbox from './Chatbox';
import AppointmentModal from './AppointmentModal';

const App = () => {
  const [events, setEvents] = useState([]);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Function to add a new appointment to the calendar state
  const handleNewAppointment = (appointmentData) => {
    const startIso = new Date(`${appointmentData.date}T${appointmentData.start_time}`).toISOString();
    const endIso = new Date(new Date(`${appointmentData.date}T${appointmentData.start_time}`).getTime() + (appointmentData.duration || 40) * 60000).toISOString();
    const newEvent = {
      id: `${appointmentData.barber_id}-${appointmentData.date}-${appointmentData.start_time}`,
      title: `Appointment with Barber ${appointmentData.barber_id}`,
      start: startIso,
      end: endIso,
    };
    setEvents(prev => [...prev, newEvent]);
    setModalVisible(false);
  };

  const calendar = useCalendarApp({
    views: [createViewMonthGrid()],
    events,
    callbacks: {
      onClickDate(date) {
        console.log('Clicked on date:', date);
        setSelectedDateTime(date);
        setModalVisible(true);
      },
      onClickDateTime(dateTime) {
        console.log('Clicked on time slot:', dateTime);
        setSelectedDateTime(dateTime);
        setModalVisible(true);
      },
    },
  });

  // Fetch all appointments from the backend on component mount
  useEffect(() => {
    async function fetchAllAppointments() {
      try {
        const res = await fetch('http://18.217.204.201:3000/appointments/all');
        const data = await res.json();
        const mapped = data.appointments.map((appt) => {
          const startIso = new Date(`${appt.date}T${appt.start_time}`).toISOString();
          const endIso = new Date(new Date(`${appt.date}T${appt.start_time}`).getTime() + (appt.duration || 40) * 60000).toISOString();
          return {
            id: `${appt.barber_id}-${appt.date}-${appt.start_time}`,
            title: `Appointment with Barber ${appt.barber_id}`,
            start: startIso,
            end: endIso,
          };
        });
        setEvents(mapped);
      } catch (err) {
        console.error('Error fetching appointments:', err);
      }
    }
    fetchAllAppointments();
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, padding: '20px' }}>
        <ScheduleXCalendar calendarApp={calendar} />
      </div>
      <div style={{ width: '300px', marginLeft: '20px' }}>
        <Chatbox onNewAppointment={handleNewAppointment} />
      </div>
      {modalVisible && (
        <AppointmentModal
          dateTime={selectedDateTime}
          onClose={() => setModalVisible(false)}
          onSubmit={handleNewAppointment}
        />
      )}
    </div>
  );
};

export default App;
