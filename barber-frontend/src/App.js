import React, { useEffect, useState } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop';
import '@schedule-x/theme-default/dist/index.css';
import Chatbox from './Chatbox';

const CalendarApp = () => {
  const [events, setEvents] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

  // Instantiate plugins.
  const eventsService = createEventsServicePlugin();
  const dragAndDropPlugin = createDragAndDropPlugin();

  // Initialize the calendar application.
  const calendar = useCalendarApp({
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    events,
    plugins: [eventsService, dragAndDropPlugin],
  });

  // Simple event click handler (for existing appointments)
  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    alert(`Clicked on: ${event.title}`);
  };

  // Fetch barbers and appointments when the component mounts.
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available barbers.
        const barbersResponse = await fetch(`${backendUrl}/barbers`);
        const barbersData = await barbersResponse.json();
        setBarbers(barbersData.barbers);

        // Fetch appointments for a fixed date (you may change this as needed).
        const appointmentsResponse = await fetch(
          `${backendUrl}/appointments?date=2024-12-19`
        );
        const appointmentsData = await appointmentsResponse.json();

        // Map appointments to calendar events.
        const mappedEvents = appointmentsData.appointments.map((appt) => {
          const barber =
            barbersData.barbers.find((b) => b.barber_id === appt.barber_id) ||
            { name: 'Unknown' };
          const startTime = new Date(`${appt.date}T${appt.start_time}`).toISOString();
          const endTime = new Date(
            new Date(startTime).getTime() + appt.duration * 60000
          ).toISOString();
          return {
            id: `${appt.barber_id}-${appt.date}-${appt.start_time}`,
            title: `Appointment with ${barber.name}`,
            start: startTime,
            end: endTime,
            onClick: () => handleEventClick({ title: `Appointment with ${barber.name}` }),
          };
        });
        console.log('Mapped events:', mappedEvents);
        setEvents(mappedEvents);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [backendUrl]);

  // Callback to update the calendar when a new appointment is booked.
  const handleNewAppointment = (newAppointment) => {
    const barber =
      barbers.find((b) => b.barber_id === newAppointment.barber_id) ||
      { name: 'Unknown' };
    const startTime = new Date(`${newAppointment.date}T${newAppointment.start_time}`).toISOString();
    const endTime = new Date(
      new Date(startTime).getTime() + newAppointment.duration * 60000
    ).toISOString();
    const newEvent = {
      id: `${newAppointment.barber_id}-${newAppointment.date}-${newAppointment.start_time}`,
      title: `Appointment with ${barber.name}`,
      start: startTime,
      end: endTime,
      onClick: () => handleEventClick({ title: `Appointment with ${barber.name}` }),
    };
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  // Manual booking: when a user clicks on a date, prompt for a start time,
  // then call the booking API and update the calendar on success.
  const handleDateClick = (date) => {
    // Assume "date" is a Date object; format it as YYYY-MM-DD.
    const formattedDate = date.toISOString().split('T')[0];
    const startTime = prompt(`Enter start time (HH:MM) for appointment on ${formattedDate}:`);
    if (startTime) {
      const newAppointment = {
        barber_id: 1, // Default to barber 1 (or allow selection)
        date: formattedDate,
        start_time: startTime,
        duration: 40, // Fixed duration; adjust as needed.
        client_name: 'Manual Booking',
      };
      fetch(`${backendUrl}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            handleNewAppointment(data.appointment);
          } else {
            alert('Error booking appointment: ' + data.message);
          }
        })
        .catch((error) => {
          console.error('Error calling booking API:', error);
          alert('Error calling booking API');
        });
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1, padding: '20px' }}>
        {/* The onDateClick prop is assumed to be supported.
            Please verify with the ScheduleXCalendar docs. */}
        <ScheduleXCalendar 
          calendarApp={calendar}
          onDateClick={handleDateClick}
        />
      </div>
      <div style={{ width: '300px', marginLeft: '20px' }}>
        <Chatbox onNewAppointment={handleNewAppointment} />
      </div>
    </div>
  );
};

export default CalendarApp;
