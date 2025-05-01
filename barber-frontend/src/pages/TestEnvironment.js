// src/pages/TestEnvironment.jsx
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AppBar,
  Box,
  Dialog,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import FullCalendar        from '@fullcalendar/react';
import dayGridPlugin       from '@fullcalendar/daygrid';
import timeGridPlugin      from '@fullcalendar/timegrid';
import interactionPlugin   from '@fullcalendar/interaction';

import FloatingChat        from '../components/chat/FloatingChat';
import ChatToggleButton    from '../components/chat/ChatToggleButton';
import AppointmentDialog   from '../components/appointment/AppointmentDialog';

import { useConfig }       from '../context/ConfigContext';
import { useNotification } from '../components/ui/NotificationContext';

import useBarbers          from '../hooks/useBarbers';      // ← NEW HOOK
import {
  fetchAppointments,
  bookAppointment,
} from '../services/api';

/* ─────────────────────────────────────────────────────────── */

export default function TestEnvironment({ open, onClose, isEnterpriseAccount }) {
  /* business config & helpers */
  const { config }          = useConfig();
  const { showNotification} = useNotification();

  /* barbers come from the shared hook */
  const { barbers, loading: loadingBarbers } = useBarbers();

  /* appointments local state */
  const [appointments,   setAppointments]   = useState([]);
  const [loadingAppts,   setLoadingAppts]   = useState(true);

  /* UI state */
  const [isChatOpen,     setIsChatOpen]     = useState(false);
  const [dialogOpen,     setDialogOpen]     = useState(false);
  const [selectedDate,   setSelectedDate]   = useState('');

  /* ── 1. load appointments once ░░░░░░░░░░░░░░░░░░░░░░░░░░ */
  const loadAppointments = async () => {
    setLoadingAppts(true);
    try {
      const data = await fetchAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showNotification('Erro ao carregar agendamentos', 'error');
    } finally {
      setLoadingAppts(false);
    }
  };

  useEffect(() => { loadAppointments(); }, []);

  /* ── 2. helper: colour per barber ░░░░░░░░░░░░░░░░░░░░░░░░ */
  const getColorForBarber = React.useCallback(
    (id) => barbers.find(
      b => String(b.barber_id) === String(id)
    )?.color || '#0099FF',
    [barbers]
  );

  /* ── 3. format events for FullCalendar ░░░░░░░░░░░░░░░░░░░░ */
  const calendarEvents = useMemo(() => {
    const groups = {};   // key = 2025-04-30T09:00

    /* group same-time appointments first */
    appointments.forEach(a => {
      const k = `${a.date}T${a.start_time}`;
      (groups[k] = groups[k] || []).push(a);
    });

    return appointments.map((a) => {
      const start  = new Date(`${a.date}T${a.start_time}`);
      const end    = new Date(start.getTime() +
                    (a.duration || config.business.appointmentDuration) * 60_000);

      const same   = groups[`${a.date}T${a.start_time}`];
      const idx    = same.indexOf(a);

      const barber = barbers.find(b => String(b.barber_id) === String(a.barber_id));
      const title  = `${barber?.name || 'Profissional'}: ${a.client_name}`;

      return ({
        id:            a.id || `${a.date}-${a.start_time}-${a.barber_id}`,
        title,
        start,
        end,
        backgroundColor: getColorForBarber(a.barber_id),
        borderColor:     getColorForBarber(a.barber_id),
        extendedProps: {
          offsetIndex:    idx,
          totalSameTime:  same.length,
        },
      });
    });
  }, [appointments, barbers, getColorForBarber, config.business]);

  /* ── 4. booking from Chat / Dialog ░░░░░░░░░░░░░░░░░░░░░░░ */
  const handleNewAppointment = async (data) => {
    const res = await bookAppointment(data);
    if (res?.success) {
      // 1) create a calendar-ready object
      const newAppt = {
        ...data,
        id: res.id || `${data.date}-${data.start_time}-${data.barber_id}`,
        duration: config.business.appointmentDuration,   // if your API doesn’t return it
      };
  
      // 2) append to existing appointments
      setAppointments(prev => [...prev, newAppt]);
  
      showNotification('Agendamento criado com sucesso!', 'success');
      return { success: true };
    }
    return { error: res.error || 'Erro ao agendar' };
  };
  

  /* ── 5. render helpers ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ */
  const renderEventContent = ({ event, view }) => (
    <div style={{
      background: event.backgroundColor,
      padding:    '2px 4px',
      borderLeft: `4px solid ${event.backgroundColor}`,
      borderRadius: 3,
      color: '#fff',
      fontSize: view.type === 'dayGridMonth' ? '0.75rem' : '0.85rem',
    }}>
      {view.type === 'dayGridMonth'
        ? <>{event.title}</>
        : <strong>{event.title}</strong>}
    </div>
  );

  const busy = loadingBarbers || loadingAppts;

  /* ───────────────────────────────────────────────────────── */

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      {/* App bar */}
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <Typography sx={{ flex: 1 }} variant="h6">
            Ambiente de Teste – {isEnterpriseAccount ? 'Modo Empresarial' : 'Modo Individual'}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Body */}
      <Box sx={{ position:'relative', height:'calc(100vh - 64px)' }}>
        {busy ? (
          /* little spinner */
          <Box sx={{
            height:'100%', display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <Box sx={{
              width:40, height:40, borderRadius:'50%',
              border:'3px solid', borderColor: config.theme.primaryColor,
              borderTopColor:'transparent',
              animation:'spin 1s linear infinite',
              '@keyframes spin': { '100%':{ transform:'rotate(360deg)' } }
            }}/>
          </Box>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin,timeGridPlugin,interactionPlugin]}
            initialView="dayGridMonth"
            height="100%"
            headerToolbar={{
              left:'prev,next today',
              center:'title',
              right:'dayGridMonth,timeGridWeek,timeGridDay',
            }}
            events={calendarEvents}
            slotMinTime="07:00:00"
            slotMaxTime="19:00:00"
            dateClick={(info)=>{ setSelectedDate(info.dateStr); setDialogOpen(true);} }
            eventContent={renderEventContent}
            buttonText={{ today:'Hoje', month:'Mês', week:'Semana', day:'Dia' }}
          />
        )}

        {/* chat & dialogs */}
        <ChatToggleButton onClick={()=>setIsChatOpen(p=>!p)}/>
        <FloatingChat
          open={isChatOpen}
          onClose={()=>setIsChatOpen(false)}
          onNewAppointment={handleNewAppointment}
          barbers={barbers}
          isEnterpriseAccount={isEnterpriseAccount}
        />
        <AppointmentDialog
          open={dialogOpen}
          onClose={()=>setDialogOpen(false)}
          dateTime={selectedDate}
          refreshAppointments={loadAppointments}
          barbers={barbers}
        />
      </Box>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────── */
TestEnvironment.propTypes = {
  open:               PropTypes.bool.isRequired,
  onClose:            PropTypes.func.isRequired,
  isEnterpriseAccount:PropTypes.bool,
};
