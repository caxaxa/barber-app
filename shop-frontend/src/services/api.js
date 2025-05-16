/* ────────────────────────────────────────────────────────────────
   api.js – SAM back-end helper with Cognito auth & mock fallback
   ----------------------------------------------------------------
   – GET /config?shop_id=…         (Cognito-protected)
   – PUT /config                   (Cognito-protected)
   – GET /appointments?shop_id=…
   – POST /appointments/book
   – GET /workers
   ---------------------------------------------------------------- */

import {
  mockAppointments,
  mockWorkers,
  generateEmptyMockData,
} from './mockData';
import {
  apiRequest,
  isMockMode,
  getShopId,
  getUserRole,
  withErrorHandling
} from './apiUtils';

/* ── Local utility functions ──────────────────────────────────── */
const getDatabaseConfig = () => {
  try {
    const shop = getShopId();
    const storageKey = `appConfig_${shop}`;
    const cfg = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return cfg.database || {};
  } catch {
    return {};
  }
};

/* ────────────────────────────────────────────────────────────────
   1)  CONFIG  – GET & PUT (Cognito protected)
   ---------------------------------------------------------------- */
export const fetchConfig = withErrorHandling(
  async (headers, shop = getShopId()) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/config?shop_id=${shop}`, { headers });
    if (!response.ok) {
      console.warn(`API responded with status ${response.status}: ${response.statusText}`);
      return {}; 
    }
    return response.json();
  },
  {},
  'fetchConfig'
);

export async function saveConfig(cfg, shop = getShopId()) {
  if (isMockMode()) return;
  
  return apiRequest(
    '/config',
    {
      method: 'PUT',
      body: JSON.stringify({ ...cfg, shop_id: shop }),
      throwOnError: true
    }
  );
}

/* ────────────────────────────────────────────────────────────────
   2)  APPOINTMENTS – GET
   ---------------------------------------------------------------- */
export const fetchAppointments = withErrorHandling(
  async (headers, dateISO) => {
    const base = `${process.env.REACT_APP_BACKEND_URL}/appointments?shop_id=${getShopId()}`;
    const url = dateISO ? `${base}&date=${dateISO}` : base;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      console.warn(`API responded with status ${response.status}: ${response.statusText}`);
      return []; 
    }
    
    const data = await response.json();
    return data.appointments || [];
  },
  (dateISO) => mockAppointments.filter((a) => !dateISO || a.date === dateISO),
  'fetchAppointments'
);

/* ────────────────────────────────────────────────────────────────
   3)  WORKERS – GET
   ---------------------------------------------------------------- */
export async function fetchWorkers() {
  const role = getUserRole();

  /* 1) Individual tenant = single "worker" (the shop owner) */
  if (role === 'individual') {
    const ownerId   = getShopId();
    const ownerName = sessionStorage.getItem('workerName') || ownerId;
    return [{ worker_id: ownerId, name: ownerName }];
  }

  /* 2) Mock / offline */
  if (isMockMode()) {
    const empty = getDatabaseConfig().useEmptyData === true;
    return empty ? generateEmptyMockData().workers : mockWorkers;
  }

  /* 3) Live call */
  return apiRequest(
    '/workers',
    {
      throwOnError: true
    },
    []
  ).then(response => {
    const { workers = [] } = response;
    return workers.map((w) => ({
      worker_id: w.worker_id,
      name: w.name || w.worker_id,
      ...w,
    }));
  });
}

/* ────────────────────────────────────────────────────────────────
   4)  APPOINTMENTS – POST
   ---------------------------------------------------------------- */
export async function bookAppointment(data) {
  // Generate ICS file content for calendar integration
  const icsContent = generateIcsFile(data);
  
  if (isMockMode()) return legacyMockBook(data, icsContent);

  return apiRequest(
    '/appointments/book',
    {
      method: 'POST',
      body: JSON.stringify({ ...data, shop_id: getShopId() }),
      throwOnError: true
    }
  ).then(responseData => ({
    ...responseData,
    icsContent,
    icsFilename: `appointment_${data.date.replace(/\//g, '')}_${data.start_time.replace(':', '')}.ics`
  }));
}

/* ────────────────────────────────────────────────────────────────
   5)  CUSTOMERS API
   ---------------------------------------------------------------- */
export const fetchCustomers = withErrorHandling(
  async (headers) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/customers?shop_id=${getShopId()}`, { headers });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.customers || [];
  },
  [],
  'fetchCustomers'
);

/* ────────────────────────────────────────────────────────────────
   6)  ChatGPT helper
   ---------------------------------------------------------------- */
export async function callChatApi(messages) {
  if (isMockMode()) {
    return Promise.resolve({
      reply: "Este é um modo de demonstração. Por favor configure a API OpenAI para usar o chat inteligente.",
      success: true
    });
  }

  try {
    // Get config from localStorage
    const shop = getShopId();
    const storageKey = `appConfig_${shop}`;
    const cfg = JSON.parse(localStorage.getItem(storageKey) || '{}');
    
    // Check if OpenAI is enabled and API key exists
    if (!cfg.openai?.enabled || !cfg.openai?.apiKey) {
      // Return a friendly message instead of throwing an error
      return {
        reply: "Modo de chat inteligente não está configurado. Por favor use o modo guiado para agendamentos.",
        success: false
      };
    }
    
    const response = await apiRequest(
      '/chat',
      {
        method: 'POST',
        body: JSON.stringify({ messages, shop_id: getShopId() }),
        throwOnError: true
      }
    );
    
    return response;
  } catch (error) {
    console.error('Error calling chat API:', error);
    return {
      reply: "Desculpe, tive um problema ao processar sua mensagem. Por favor, tente usar o modo guiado.",
      success: false
    };
  }
}

/* ────────────────────────────────────────────────────────────────
   7)  Legacy local-mock book helper
   ---------------------------------------------------------------- */
function legacyMockBook(appt, icsContent) {
  // Create a unique ID for this appointment
  const appointmentId = appt.id || 
    `${appt.date}-${appt.start_time}-${appt.worker_id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  const withId = {
    ...appt,
    id: appointmentId,
    shop_id: getShopId(),
    created_at: new Date().toISOString(),
  };
  
  // Create a new array instead of mutating the existing one
  // This is more thread-safe than directly pushing to the array
  const updatedAppointments = [...mockAppointments, withId];
  
  // Replace the original array with the updated one atomically
  mockAppointments.length = 0; 
  mockAppointments.push(...updatedAppointments);
  
  // Persist to localStorage if available
  try {
    const shop = getShopId();
    const storageKey = `mockAppointments_${shop}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedAppointments));
  } catch (error) {
    console.error('Error saving mock appointment to localStorage:', error);
  }
  
  // Generate ICS filename
  const icsFilename = `appointment_${appt.date.replace(/\//g, '')}_${appt.start_time.replace(':', '')}.ics`;
  
  return Promise.resolve({
    success: true,
    message: 'Appointment saved locally (mock mode)',
    id: appointmentId,
    icsContent, // Include ICS content in the response
    icsFilename // Include ICS filename in the response
  });
}

/* ────────────────────────────────────────────────────────────────
   8)  ICS Calendar file generation
   ---------------------------------------------------------------- */
function generateIcsFile(appointmentData) {
  // Format appointment date and time as YYYYMMDDTHHMMSSZ
  const formatDate = (dateStr, timeStr) => {
    let date;
    
    // Handle both YYYY-MM-DD and DD/MM/YYYY formats
    if (dateStr.includes('-')) {
      // YYYY-MM-DD format
      date = new Date(`${dateStr}T${timeStr}:00`);
    } else if (dateStr.includes('/')) {
      // DD/MM/YYYY format
      const [day, month, year] = dateStr.split('/');
      date = new Date(`${year}-${month}-${day}T${timeStr}:00`);
    } else {
      // Invalid date format
      console.error('Invalid date format:', dateStr);
      // Use current date as fallback
      date = new Date();
    }
    
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  };
  
  // Start date and duration calculation
  const startDate = formatDate(appointmentData.date, appointmentData.start_time);
  
  // Calculate end time based on duration (default to 30 min if not provided)
  const duration = appointmentData.duration || 30;
  const startDateObj = new Date(startDate.substring(0, 4) + '-' + 
                               startDate.substring(4, 6) + '-' + 
                               startDate.substring(6, 8) + 'T' + 
                               startDate.substring(9, 11) + ':' + 
                               startDate.substring(11, 13) + ':00Z');
  const endDateObj = new Date(startDateObj.getTime() + (duration * 60 * 1000));
  const endDate = endDateObj.toISOString().replace(/-|:|\.\d{3}/g, '');
  
  // Get current timestamp for creation date
  const now = new Date().toISOString().replace(/-|:|\.\d{3}/g, '');
  
  // Get business and appointment details
  const config = getDatabaseConfig();
  const businessName = config.business?.name || 'Empresa';
  const businessAddress = config.business?.address || '';
  const serviceName = appointmentData.service_name || 'Consulta';
  const workerName = appointmentData.worker_name || 'Profissional';
  const customerName = appointmentData.customer_name || 'Cliente';
  
  // Generate a unique ID for the calendar event
  const uid = `${appointmentData.id || Date.now()}@${window.location.hostname || 'booking.app'}`;
  
  // Create the ICS content following RFC 5545 standard
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AiSol//WhatsApp Booking//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${serviceName} com ${workerName}`,
    `DESCRIPTION:Atendimento de ${serviceName} com ${workerName} para ${customerName}`,
    `LOCATION:${businessAddress}`,
    `ORGANIZER;CN=${businessName}:mailto:noreply@example.com`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Lembrete',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return icsContent;
}