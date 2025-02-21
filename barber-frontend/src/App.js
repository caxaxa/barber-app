import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Chatbox from './Chatbox';
import AppointmentModal from './AppointmentModal';

const API_ENDPOINT = process.env.REACT_APP_BACKEND_URL;

// Mapping of barber_id to color (update or expand as needed)
const barberColors = {
  1: "#FF5733",
  2: "#33C4FF",
  // Add additional mappings for other barber IDs if necessary
};

const App = () => {
  const [appointments, setAppointments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  // Fetch appointments from the backend and map them to FullCalendar events.
  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${API_ENDPOINT}/appointments/all`);
      const data = await res.json();
      if (data?.appointments) {
        const events = data.appointments.map(item => {
          const start = new Date(`${item.date}T${item.start_time}`);
          return {
            id: `${item.date}-${item.start_time}-${item.barber_id}`,
            title: `Appt: ${item.client_name}`,
            start,
            end: new Date(start.getTime() + (item.duration || 40) * 60000),
            backgroundColor: barberColors[item.barber_id] || "#0099FF",
            borderColor: barberColors[item.barber_id] || "#0099FF",
            extendedProps: { barberId: item.barber_id, status: item.status }
          };
        });
        setAppointments(events);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // When a user clicks a date cell, capture the date and open the booking modal.
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr); // info.dateStr is in YYYY-MM-DD format
    setModalVisible(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Calendar Section */}
      <div className="flex-1 p-4">
        <div className="bg-white shadow rounded-lg p-4">
          <h1 className="text-2xl font-bold mb-4">Barber Appointments</h1>
          <FullCalendar
            plugins={[ dayGridPlugin, timeGridPlugin, interactionPlugin ]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={appointments}
            dateClick={handleDateClick}
          />
        </div>
      </div>
      
      {/* Chatbox Section */}
      <div className="w-80 border-l border-gray-300 p-4">
        <Chatbox onOpenModal={() => setModalVisible(true)} />
      </div>
      
      {/* Appointment Modal */}
      {modalVisible && (
        <AppointmentModal
          dateTime={selectedDate}
          onClose={() => setModalVisible(false)}
          apiEndpoint={API_ENDPOINT}
          refreshAppointments={fetchAppointments}
        />
      )}
    </div>
  );
};

export default App;
