import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import ChatToggleButton from './components/chat/ChatToggleButton';
import FloatingChat from './components/chat/FloatingChat';
import AppointmentDialog from './components/appointment/AppointmentDialog';
import AdminButton from './components/admin/AdminButton';
import { NotificationProvider, useNotification } from './components/ui/NotificationContext';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import { fetchAppointments, fetchBarbers, bookAppointment } from './services/api';

function AppContent() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotification();
  const { config } = useConfig();

  // Fetch appointment data
  const loadAppointments = async () => {
    try {
      console.log('Loading appointments...');
      const appointmentsData = await fetchAppointments();
      console.log('Appointments loaded:', appointmentsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      showNotification('Error loading appointments', 'error');
    }
  };

  // Fetch barber data
  const loadBarbers = async () => {
    try {
      console.log('Loading barbers...');
      const barbersData = await fetchBarbers();
      console.log('Barbers loaded:', barbersData);
      setBarbers(barbersData);
    } catch (error) {
      console.error('Failed to load barbers:', error);
      showNotification('Error loading barbers', 'error');
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadAppointments(), loadBarbers()]);
        console.log('Data loaded successfully. Barbers:', barbers);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    // We're intentionally only running this on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // We'll move this useEffect after resources and formattedEvents are defined
  
  // Update document title with business name
  useEffect(() => {
    document.title = `${config.business.name} - Agendamento`;
  }, [config.business.name]);

  // Toggle chat popup
  const toggleChat = () => setIsChatOpen(prev => !prev);

  // Function to handle new appointment (from chat GPT or modal)
  const handleNewAppointment = async (appointmentData) => {
    console.log("handleNewAppointment called with data:", appointmentData);
    
    try {
      // Validate required fields
      if (!appointmentData.barber_id || !appointmentData.date || !appointmentData.start_time || !appointmentData.client_name) {
        console.error("Missing required appointment data:", appointmentData);
        throw new Error("Missing required appointment information");
      }
      
      // Add barber_name to the appointment data for better error messages
      const selectedBarber = barbers.find(b => b.barber_id === appointmentData.barber_id);
      
      if (!selectedBarber) {
        console.error("Barber not found for ID:", appointmentData.barber_id);
        console.log("Available barbers:", barbers);
        throw new Error(`Barber with ID ${appointmentData.barber_id} not found`);
      }
      
      const appointmentWithBarberName = {
        ...appointmentData,
        barber_name: selectedBarber?.name || ''
      };
      
      console.log("Booking appointment with data:", appointmentWithBarberName);
      const result = await bookAppointment(appointmentWithBarberName);
      console.log("Booking result:", result);
      
      showNotification('Appointment booked successfully!', 'success');
      await loadAppointments();
      return { success: true };
    } catch (error) {
      console.error("Error booking appointment:", error);
      showNotification(error.message || 'Error booking appointment', 'error');
      return { error: error.message };
    }
  };

  // Get color for barber
  const getColorForBarber = (barber_id) => {
    const found = barbers.find(b => b.barber_id === barber_id);
    return found?.color || '#0099FF';
  };

  // Handle calendar date click to open appointment dialog
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setDialogOpen(true);
  };
  
  // Custom event rendering to handle multiple appointments at the same time
  const renderEventContent = (eventInfo) => {
    const { event, timeText, view } = eventInfo;
    const { offsetIndex, totalSameTime, barber_name } = event.extendedProps;
    
    // Calculate vertical offset for events at the same time
    let styleObj = {};
    if (totalSameTime > 1 && offsetIndex !== undefined) {
      const offsetPercent = (offsetIndex * 100) / totalSameTime;
      // Set a min-height to ensure visibility
      styleObj = {
        position: 'relative',
        height: `${Math.max(30, 100 / totalSameTime)}%`,
        top: `${offsetPercent}%`,
        marginTop: offsetIndex > 0 ? '2px' : 0,
        zIndex: 10 + offsetIndex,
        backgroundColor: event.backgroundColor,
        borderLeft: `4px solid ${event.backgroundColor}`,
        padding: '2px 4px',
        borderRadius: '3px',
        color: '#fff',
        width: '100%'
      };
    } else {
      styleObj = {
        backgroundColor: event.backgroundColor,
        borderLeft: `4px solid ${event.backgroundColor}`,
        padding: '2px 4px',
        borderRadius: '3px',
        color: '#fff',
        width: '100%'
      };
    }

    // Different rendering for month view vs time view
    const isMonthView = view.type === 'dayGridMonth';
    
    return (
      <div style={styleObj}>
        {isMonthView ? (
          <>
            <div style={{ fontWeight: 'bold', fontSize: '0.9em', marginBottom: '2px' }}>
              {timeText && <span>{timeText} - </span>}
              {event.title}
            </div>
          </>
        ) : (
          <>
            <b>{event.title}</b>
          </>
        )}
      </div>
    );
  };

  // Format appointments for FullCalendar with a custom offset for simultaneous appointments
  const formattedEvents = React.useMemo(() => {
    // First group appointments by date and time
    const appointmentGroups = {};
    
    appointments.forEach(item => {
      const key = `${item.date}T${item.start_time}`;
      if (!appointmentGroups[key]) {
        appointmentGroups[key] = [];
      }
      appointmentGroups[key].push(item);
    });
    
    // Then create events with vertical offset for visual separation
    return appointments.map((item) => {
      const start = new Date(`${item.date}T${item.start_time}`);
      const color = getColorForBarber(item.barber_id);
      const barber = barbers.find(b => b.barber_id === item.barber_id);
      const barberName = barber?.name || 'Profissional';
      
      // Get index of this appointment in its time group to calculate offset
      const key = `${item.date}T${item.start_time}`;
      const sameTimeAppts = appointmentGroups[key];
      const index = sameTimeAppts.findIndex(appt => 
        appt.barber_id === item.barber_id && 
        appt.date === item.date && 
        appt.start_time === item.start_time &&
        appt.client_name === item.client_name
      );
      
      // Only add offset if there are multiple appointments at the same time
      const shouldOffset = sameTimeAppts.length > 1;
      
      // Ensure each event has a unique ID including the barber_id
      return {
        id: item.id || `${item.date}-${item.start_time}-${item.barber_id}`,
        title: `${barberName}: ${item.client_name}`,
        start,
        end: new Date(start.getTime() + (item.duration || config.business.appointmentDuration) * 60000),
        backgroundColor: color,
        borderColor: color,
        classNames: shouldOffset ? [`appt-offset-${index}`] : [],
        extendedProps: {
          barber_id: item.barber_id,
          barber_name: barberName,
          offsetIndex: index,
          totalSameTime: sameTimeAppts.length
        }
      };
    });
  }, [appointments, barbers, config.business.appointmentDuration, getColorForBarber]);
  
  // Log formatted events for debugging
  useEffect(() => {
    if (barbers.length > 0) {
      console.log('Formatted events with offsets:', formattedEvents);
      console.log('Appointment display should now show parallel appointments with visual offsets');
    }
  }, [barbers, appointments, formattedEvents]);

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Admin Button */}
      <AdminButton />
      
      {/* Full screen calendar */}
      {isLoading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%' 
        }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '3px solid',
              borderColor: config.theme.primaryColor,
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
        </Box>
      ) : (
        <FullCalendar
          plugins={[
            dayGridPlugin, 
            timeGridPlugin, 
            interactionPlugin
          ]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={formattedEvents}
          height="100%"
          slotDuration="00:30:00"
          slotMinTime="07:00:00"
          slotMaxTime="19:00:00" 
          dateClick={handleDateClick}
          eventContent={renderEventContent}
          displayEventTime={true}
          displayEventEnd={false}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
          }}
        />
      )}

      {/* Floating chat toggle button */}
      <ChatToggleButton onClick={toggleChat} />

      {/* Popup chat window */}
      <FloatingChat
        open={isChatOpen}
        onNewAppointment={handleNewAppointment}
        barbers={barbers}
      />

      {/* The modal for manual booking */}
      <AppointmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        dateTime={selectedDate}
        refreshAppointments={loadAppointments}
        barbers={barbers}
      />
    </Box>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ConfigProvider>
  );
}