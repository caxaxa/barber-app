import React, { useEffect, useState } from 'react';
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react';
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop'; // Drag-and-Drop Plugin
import { createEventModalPlugin } from '@schedule-x/event-modal'; // Event Modal Plugin

import '@schedule-x/theme-default/dist/index.css';
import Chatbox from './Chatbox'; // Import the Chatbox component

function CalendarApp() {
  const eventsService = useState(() => createEventsServicePlugin())[0];
  const dragAndDropPlugin = useState(() => createDragAndDropPlugin())[0];
  
  const [events, setEvents] = useState([]);
  const [barbers, setBarbers] = useState([]);

  const calendar = useCalendarApp({
    views: [createViewDay(), createViewWeek(), createViewMonthGrid(), createViewMonthAgenda()],
    events: [
      {
        id: 1,
        title: 'Barbeiro com Cliente',
        start: '2024-12-19 10:05',
        end: '2024-12-19 10:35',
        description: 'Cabelo e Barba',
      }],
    plugins: [eventsService, dragAndDropPlugin], // Added plugins
  });
  useEffect(() => {
    // Fetch barbers
    fetch('http://3.144.27.5:3001/barbers') // Use the Public EC2 IPV4
      .then((response) => response.json())
      .then((data) => {
        console.log('Barbers:', data.barbers); // Debugging
        setBarbers(data.barbers);
      })
      .catch((error) => console.error('Error fetching barbers:', error));

    // Fetch appointments
    fetch('http://3.144.27.5:3001/appointments?date=2024-12-19') // Test with a fixed date for now
      .then((response) => response.json())
      .then((data) => {
        console.log('Appointments:', data.appointments); // Debugging

        // Map appointments to events
        const mappedEvents = data.appointments.map((appt) => {
          const barber = barbers.find((b) => b.barber_id === appt.barber_id) || { name: 'Unknown' };

          // Parse `start_time` and calculate `end_time` as ISO strings
          const startTime = new Date(`${appt.date}T${appt.start_time}`).toISOString();
          const endTime = new Date(new Date(startTime).getTime() + appt.duration * 60000).toISOString();

          return {
            id: `${appt.barber_id}-${appt.date}-${appt.start_time}`,
            title: `Appointment with ${barber.name}`,
            start: startTime, // Valid ISO 8601 start time
            end: endTime,     // Valid ISO 8601 end time
          };
        });

        console.log('Mapped Events:', JSON.stringify(mappedEvents, null, 2)); // Debugging
        setEvents(mappedEvents);
      })
      .catch((error) => console.error('Error fetching appointments:', error));
  }, [barbers]);

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1, padding: '20px' }}>
        <ScheduleXCalendar calendarApp={calendar} />
      </div>
      <div style={{ width: '300px', marginLeft: '20px' }}>
        <Chatbox />
      </div>
    </div>
  );
}

export default CalendarApp;
