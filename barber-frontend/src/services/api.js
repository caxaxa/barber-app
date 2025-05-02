/* api.js – SAM back-end with Cognito auth & mock fallback */

/* ── imports & local mock data ─────────────────────────── */
import {
  mockAppointments,
  mockBarbers,
  generateEmptyMockData,
} from './mockData';

/* ── env & helpers ─────────────────────────────────────── */
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3002';
const shopId   = () => sessionStorage.getItem('shopId') || 'demo-shop';

const isMockMode = () =>
  !API_BASE ||
  (API_BASE.startsWith('http://localhost') && !navigator.onLine);

const getDatabaseConfig = () => {
  try {
    const cfg = JSON.parse(localStorage.getItem('appConfig') || '{}');
    return cfg.database || {};
  } catch {
    return {};
  }
};

/** Build headers with the JWT we stored after Hosted-UI login */
async function authHeader() {
  const token = sessionStorage.getItem('idToken')
  return { 
    "Authorization": `Bearer ${token}`, 
    "Content-Type": "application/json" 
  }
}

/* ── 1) Config – GET & PUT (protected) ───────────────── */
export const fetchConfig = async () => {
  const headers = authHeader();
  const r = await fetch(`${API_BASE}/config?shop_id=${shopId()}`, { headers });
  if (!r.ok) throw new Error(r.statusText);
  return r.json();
};

export const saveConfig = async (cfg) => {
  const headers = authHeader();
  const payload = { ...cfg, shop_id: shopId() };
  const r = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

/* ── 2) Appointments – GET ─────────────────────────────── */
export const fetchAppointments = async (dateISO) => {
  if (isMockMode()) {
    return mockAppointments.filter(a => !dateISO || a.date === dateISO);
  }
  const headers = authHeader();
  const base = `${API_BASE}/appointments?shop_id=${shopId()}`;
  const url = dateISO ? `${base}&date=${dateISO}` : base;
  try {
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(r.statusText);
    return (await r.json()).appointments;
  } catch (e) {
    console.error('fetchAppointments → fallback to mock:', e);
    return mockAppointments.filter(a => !dateISO || a.date === dateISO);
  }
};

/* ── 3) Barbers – GET ─────────────────────────────────── */
export const fetchBarbers = async () => {
  const headers = await authHeader()
  const r = await fetch(`${API_BASE}/barbers`, { headers })
  const role = sessionStorage.getItem('userRole')
  if (role === 'individual') {
    // only the owner themself
    return [
      { 
        barber_id: sessionStorage.getItem('shopId'),
        name: sessionStorage.getItem('barberName')    // you set this at login
      }
    ]
  }
  if (isMockMode()) {
     const empty = getDatabaseConfig().useEmptyData === true;
     return empty ? generateEmptyMockData().barbers : mockBarbers;
  }
  if (!r.ok) throw new Error(r.statusText)
  return (await r.json()).barbers
}

/* ── 4) Appointments – POST ────────────────────────────── */
export const bookAppointment = async (data) => {
  if (isMockMode()) return legacyMockBook(data);
  const headers = authHeader();
  const payload = { ...data, shop_id: shopId() };
  try {
    const r = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  } catch (e) {
    console.error('bookAppointment → fallback to mock:', e);
    return legacyMockBook(data);
  }
};

/* ── 5) Customers stub ────────────────────────────────── */
export const fetchCustomers = async () => {
  return [];
};

/* ── 6) ChatGPT helper (if you have one) ───────────── */
export const callChatApi = async (messages) => {
  // unchanged
};

/* ── 7) Legacy mock helper ───────────────────────────── */
function legacyMockBook(appt) {
  const withId = {
    ...appt,
    id: appt.id || `${appt.date}-${appt.start_time}-${appt.barber_id}-${Date.now()}`,
  };
  mockAppointments.push(withId);
  return Promise.resolve({
    success: true,
    message: 'Appointment saved locally (mock mode)',
    id: withId.id,
  });
}

/* ── 8) default export ───────────────────────────────── */
export default {
  fetchConfig,
  saveConfig,
  fetchAppointments,
  fetchBarbers,
  fetchCustomers,
  bookAppointment,
  callChatApi,
};
