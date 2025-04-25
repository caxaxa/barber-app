import React from 'react';
import PropTypes from 'prop-types';
import { Box, Dialog, IconButton, Toolbar, AppBar, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import FloatingChat from '../components/chat/FloatingChat';
import ChatToggleButton from '../components/chat/ChatToggleButton';
import AppointmentDialog from '../components/appointment/AppointmentDialog';
import { useConfig } from '../context/ConfigContext';
import { useState, useEffect } from 'react';
import { fetchAppointments, fetchBarbers, bookAppointment } from '../services/api';
import { useNotification } from '../components/ui/NotificationContext';

export default function TestEnvironment({ open, onClose, isEnterpriseAccount }) {
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
      
      // Make sure we have valid appointment data
      if (Array.isArray(appointmentsData)) {
        setAppointments(appointmentsData);
      } else {
        console.error('Received invalid appointments data', appointmentsData);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
      showNotification('Error loading appointments', 'error');
      setAppointments([]);
    }
  };

  // Fetch barber data
  const loadBarbers = async () => {
    try {
      console.log('Loading barbers...');
      const barbersData = await fetchBarbers();
      
      // Make sure we have valid barber data
      if (!Array.isArray(barbersData)) {
        console.error('Received invalid barbers data', barbersData);
        setBarbers([]);
        return;
      }
      
      // Filter barbers for individual account (only show the owner)
      let filteredBarbers = barbersData;
      if (!isEnterpriseAccount) {
        // For individual accounts, only show the first barber (owner)
        const ownerId = sessionStorage.getItem('barberId') || '1';
        filteredBarbers = barbersData.filter(b => b.barber_id.toString() === ownerId.toString());
        
        if (filteredBarbers.length === 0 && barbersData.length > 0) {
          // Fallback to first barber if no match found
          filteredBarbers = [barbersData[0]];
        }
      }
      
      console.log('Barbers loaded:', filteredBarbers);
      setBarbers(filteredBarbers);
    } catch (error) {
      console.error('Failed to load barbers:', error);
      showNotification('Error loading barbers', 'error');
      setBarbers([]);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([loadAppointments(), loadBarbers()]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Toggle chat popup
  const toggleChat = () => setIsChatOpen(prev => !prev);

  // Function to handle new appointment (from chat or modal)
  const handleNewAppointment = async (appointmentData) => {
    console.log("handleNewAppointment called with data:", appointmentData);
    
    try {
      // Validate required fields
      if (!appointmentData.barber_id || !appointmentData.date || !appointmentData.start_time || !appointmentData.client_name) {
        console.error("Missing required appointment data:", appointmentData);
        throw new Error("Missing required appointment information");
      }
      
      // Ensure barber_id is a number
      let barberId = appointmentData.barber_id;
      if (typeof barberId === 'string') {
        barberId = parseInt(barberId, 10);
        if (isNaN(barberId)) {
          throw new Error("Invalid barber ID format");
        }
      }
      
      // Find the barber object from our available barbers
      const selectedBarber = barbers.find(b => {
        const barberIdNum = typeof b.barber_id === 'string' ? parseInt(b.barber_id, 10) : b.barber_id;
        return barberIdNum === barberId;
      });
      
      // Add barber name to appointment data for better error messages
      const appointmentWithBarberName = {
        ...appointmentData,
        barber_id: barberId, // Make sure we use the numeric version
        barber_name: selectedBarber?.name || 'Unknown Barber'
      };
      
      console.log("Booking appointment with data:", appointmentWithBarberName);
      const result = await bookAppointment(appointmentWithBarberName);
      
      showNotification('Appointment booked successfully!', 'success');
      await loadAppointments(); // Refresh appointments after booking
      return { success: true };
    } catch (error) {
      console.error("Error booking appointment:", error);
      showNotification(error.message || 'Error booking appointment', 'error');
      return { error: error.message };
    }
  };

  // Get color for barber - handles both string and number IDs
  const getColorForBarber = (barber_id) => {
    // Convert to number if it's a string
    const idToFind = typeof barber_id === 'string' ? parseInt(barber_id, 10) : barber_id;
    
    // Find barber accounting for possible string/number type differences
    const found = barbers.find(b => {
      const bId = typeof b.barber_id === 'string' ? parseInt(b.barber_id, 10) : b.barber_id;
      return bId === idToFind;
    });
    
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

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
    >
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Ambiente de Teste - {isEnterpriseAccount ? 'Modo Empresarial' : 'Modo Individual'}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      <Box
        sx={{
          width: '100%',
          height: 'calc(100vh - 64px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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
          onClose={toggleChat}
          onNewAppointment={handleNewAppointment}
          barbers={barbers}
          isEnterpriseAccount={isEnterpriseAccount}
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
    </Dialog>
  );
}

TestEnvironment.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isEnterpriseAccount: PropTypes.bool
};