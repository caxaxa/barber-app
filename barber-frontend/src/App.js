import React, { useEffect, useState } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import { createViewMonthGrid, createViewWeek, createViewDay } from '@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';

import Chatbox from './Chatbox';
import AppointmentModal from './AppointmentModal';




const App = () => {
  // --------------------------------------------------------------------------
  // State variables
  // --------------------------------------------------------------------------
  const [events, setEvents] = useState([]);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  // --------------------------------------------------------------------------
  // Define available views (Month/Week/Day) for the built-in switcher
  // --------------------------------------------------------------------------
  const views = [
    createViewMonthGrid(),
    createViewWeek(),
    createViewDay()
  ];

  // --------------------------------------------------------------------------
  // Create the calendar app instance (with built-in top-right controls)
  // --------------------------------------------------------------------------
  const calendar = useCalendarApp({
    initialDate: new Date('2025-02-18T00:00:00'),
    views,
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

  // --------------------------------------------------------------------------
  // Function to fetch all appointments from the backend
  // --------------------------------------------------------------------------
  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const baseUrl = process.env.REACT_APP_BACKEND_URL || '';
      if (!baseUrl) {
        throw new Error('REACT_APP_BACKEND_URL is not set in .env');
      }
      const res = await fetch(`${baseUrl}/appointments/all`);
      if (!res.ok) {
        throw new Error(`GET /appointments/all failed with status ${res.status}`);
      }
      const data = await res.json();
      console.log('Fetched appointments:', data.appointments);

      const mappedEvents = data.appointments.map((appt) => {
        const startDate = new Date(`${appt.date}T${appt.start_time}:00`);
        const endDate = new Date(startDate.getTime() + (appt.duration || 40) * 60000);
        return {
          id: `${appt.barber_id}-${appt.date}-${appt.start_time}`,
          title: `Appointment with Barber ${appt.barber_id}`,
          start: startDate,
          end: endDate,
          color: '#0099FF',
        };
      });
      console.log('Mapped events:', mappedEvents);
      setEvents(mappedEvents);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  // --------------------------------------------------------------------------
  // Function to book a new appointment (POST to backend) and update the calendar
  // --------------------------------------------------------------------------
  const handleNewAppointment = async (appointmentData) => {
    setBookingError(null);
    try {
      console.log('Booking appointment:', appointmentData);
      const baseUrl = process.env.REACT_APP_BACKEND_URL || '';
      if (!baseUrl) {
        throw new Error('REACT_APP_BACKEND_URL is not set in .env');
      }
      const res = await fetch(`${baseUrl}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error('Time slot already booked. Please choose another time.');
        }
        throw new Error(`POST /appointments/book failed with status ${res.status}`);
      }
      const data = await res.json();
      console.log('Backend response after booking:', data);

      // Optionally, update local events immediately:
      const startDate = new Date(`${appointmentData.date}T${appointmentData.start_time}:00`);
      const endDate = new Date(startDate.getTime() + (appointmentData.duration || 40) * 60000);
      const newEvent = {
        id: `${appointmentData.barber_id}-${appointmentData.date}-${appointmentData.start_time}`,
        title: `Appointment with Barber ${appointmentData.barber_id}`,
        start: startDate,
        end: endDate,
        color: '#0099FF',
      };
      setEvents((prev) => [...prev, newEvent]);

      // Re-fetch appointments to ensure consistency
      await fetchAllAppointments();
      setModalVisible(false);
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err.message);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Left Column: Calendar */}
      <div style={{ flex: 1, padding: '20px' }}>
        {loading && <div>Loading appointments...</div>}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        {!loading && !error && (
          // Force a re-render of the calendar by changing the key based on events.length.
          <ScheduleXCalendar calendarApp={calendar} key={events.length} />
        )}
      </div>

      {/* Right Column: Chatbox */}
      <div style={{ width: '300px', marginLeft: '20px' }}>
        <Chatbox onNewAppointment={handleNewAppointment} />
      </div>

      {/* Appointment Modal */}
      {modalVisible && (
        <AppointmentModal
          dateTime={selectedDateTime}
          onClose={() => setModalVisible(false)}
          onSubmit={handleNewAppointment}
        />
      )}

      {/* Booking Error Feedback */}
      {bookingError && (
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          backgroundColor: '#ffe6e6', padding: '8px', borderRadius: '5px'
        }}>
          <strong style={{ color: 'red' }}>Booking Error:</strong> {bookingError}
        </div>
      )}
    </div>
  );
};

export default App;
