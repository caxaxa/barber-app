// src/App.js

import React, { useEffect, useState } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewMonthGrid,
  createViewWeek,
  createViewDay
} from '@schedule-x/calendar';

import '@schedule-x/theme-default/dist/index.css';

import Chatbox from './Chatbox';
import AppointmentModal from './AppointmentModal';

// ----------------------------------------------------------
// 1) Helper: Convert JS Date -> "YYYY-MM-DD HH:mm"
// ----------------------------------------------------------
function toScheduleXString(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const mm = String(dateObj.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

// ----------------------------------------------------------
// 2) Convert one DynamoDB "appointment" to a schedule-x event
// e.g. appt = { date, start_time, duration, barber_id, client_name, ... }
// ----------------------------------------------------------
function mapAppointmentToEvent(appt) {
  // Build start date
  const [yyyy, MM, dd] = appt.date.split('-');
  const [hh, mi] = appt.start_time.split(':');

  const startDate = new Date(
    Number(yyyy),
    Number(MM) - 1,  // 0-based month
    Number(dd),
    Number(hh),
    Number(mi)
  );

  // Add duration
  const dur = appt.duration || 40; 
  const endDate = new Date(startDate.getTime() + dur * 60000);

  // Convert to "YYYY-MM-DD HH:mm"
  const startStr = toScheduleXString(startDate);
  const endStr   = toScheduleXString(endDate);

  // Return event object
  return {
    id: `apt-${appt.barber_id}-${appt.date}-${appt.start_time}`,
    title: appt.client_name
      ? `Barber ${appt.barber_id}: ${appt.client_name}`
      : `Barber ${appt.barber_id}`,
    start: startStr,
    end: endStr,
    color: '#0099FF',
  };
}

function App() {
  // ----------------------------------------------------------------
  // React state
  // ----------------------------------------------------------------
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  // ----------------------------------------------------------------
  // 3) Hardcoded test event
  // ----------------------------------------------------------------
  const testEvent = {
    id: 1,
    title: 'Event 1',
    start: '2025-02-19 14:00',
    end: '2025-02-19 17:00',
    resourceId: '1',
  };
  const testEvent2 = {
    id: 2,
    title: 'Event 2',
    start: '2025-02-21 13:00',
    end: '2025-02-21 15:00',
    resourceId: '2',
  };
  

  // ----------------------------------------------------------------
  // 4) Define built-in views (Month/Week/Day)
  // ----------------------------------------------------------------
  const views = [
    createViewMonthGrid(),
    createViewWeek(),
    createViewDay(),
  ];

  // ----------------------------------------------------------------
  // 5) Create the schedule-x calendar instance
  // ----------------------------------------------------------------
  // We'll combine the single "testEvent" with our fetched "events".
  // We'll also add some console logs at the end to compare them.
  const finalEvents = [testEvent2, testEvent];

  // PRINT the final arrays to compare
  console.log('Hardcoded test event:', testEvent);
  console.log('Fetched real events:', events);
  console.log('Final array of all events (test + real):', finalEvents);

  const calendarApp = useCalendarApp({
    initialDate: '2025-02-18 08:00',
    events: finalEvents,
    views,
    callbacks: {
      onClickDate(dateString) {
        console.log('Clicked date cell:', dateString);
        setSelectedDateTime(dateString);
        setModalVisible(true);
      },
      onClickDateTime(dateTimeString) {
        console.log('Clicked time slot:', dateTimeString);
        setSelectedDateTime(dateTimeString);
        setModalVisible(true);
      },
    },
  });

  // ----------------------------------------------------------------
  // 6) Fetch appointments from the backend
  // ----------------------------------------------------------------
  async function fetchAllAppointments() {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = process.env.REACT_APP_BACKEND_URL;
      if (!baseUrl) {
        throw new Error('REACT_APP_BACKEND_URL is not set in .env');
      }

      const resp = await fetch(`${baseUrl}/appointments/all`);
      if (!resp.ok) {
        throw new Error(`GET /appointments/all failed with status ${resp.status}`);
      }

      const data = await resp.json();
      console.log('Fetched data:', data);

      // Convert each item to schedule-x event
      const mapped = data.appointments.map(mapAppointmentToEvent);
      console.log('Mapped events from the server:', mapped);

      setEvents(mapped);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // On mount, fetch appointments
  useEffect(() => {
    fetchAllAppointments();
  }, []);

  // ----------------------------------------------------------------
  // 7) Book a new appointment
  // ----------------------------------------------------------------
  const handleNewAppointment = async (appointmentData) => {
    setBookingError(null);

    try {
      console.log('Booking appointment:', appointmentData);

      const baseUrl = process.env.REACT_APP_BACKEND_URL;
      if (!baseUrl) {
        throw new Error('REACT_APP_BACKEND_URL is not set in .env');
      }

      const resp = await fetch(`${baseUrl}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      });

      if (!resp.ok) {
        if (resp.status === 409) {
          throw new Error('Time slot already booked. Please choose another time.');
        }
        throw new Error(`POST /appointments/book failed with status ${resp.status}`);
      }

      const result = await resp.json();
      console.log('Booking response:', result);

      // Build the event object from appointmentData
      const newEvent = mapAppointmentToEvent(appointmentData);

      // Add it to local state
      setEvents((prev) => [...prev, newEvent]);

      // Re-fetch to confirm with DB
      await fetchAllAppointments();
      setModalVisible(false);
    } catch (err) {
      console.error('Booking error:', err);
      setBookingError(err.message);
    }
  };

  // ----------------------------------------------------------------
  // 8) Render
  // ----------------------------------------------------------------
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Calendar (left) */}
      <div style={{ flex: 1, padding: '20px' }}>
        {loading && <div>Loading appointments...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}

        {!loading && !error && (
          // Force re-render if finalEvents length changes
          <ScheduleXCalendar
            calendarApp={calendarApp}
            key={finalEvents.length}
          />
        )}
      </div>

      {/* Chatbox (right) */}
      <div style={{ width: '300px', borderLeft: '1px solid #ccc' }}>
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

      {/* Booking Error */}
      {bookingError && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            backgroundColor: '#ffe6e6',
            padding: '8px',
            borderRadius: '5px'
          }}
        >
          <strong style={{ color: 'red' }}>Booking Error:</strong> {bookingError}
        </div>
      )}
    </div>
  );
}

export default App;
