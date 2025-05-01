/*  api.js  – SAM back-end with Cognito auth & mock fallback  */
/* ───────────────────────────────────────────────────────────
   Imports & local mock data
─────────────────────────────────────────────────────────── */
import {
  mockAppointments,
  mockBarbers,
  generateEmptyMockData,
} from './mockData';

import { getSession } from './cognito';

/* ───────────────────────────────────────────────────────────
   Environment + helpers
─────────────────────────────────────────────────────────── */
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

/** Fetch the Cognito JWT and return an Authorization header */
async function authHeader() {
  const session = await getSession();
  return {
    Authorization: session.getIdToken().getJwtToken(),
    'Content-Type': 'application/json'
  };
}

/* ───────────────────────────────────────────────────────────
   1. Config – GET / PUT  (protected by Cognito JWT)
─────────────────────────────────────────────────────────── */
export const fetchConfig = async () => {
  const headers = await authHeader();
  const r = await fetch(`${API_BASE}/config?shop_id=${shopId()}`, { headers });
  if (!r.ok) throw new Error(r.statusText);
  return await r.json();              // might be {}
};

export const saveConfig = async (cfg) => {
  const headers = await authHeader();
  const payload = { ...cfg, shop_id: shopId() };

  const r = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return await r.json();              // { success: true }
};

/* ───────────────────────────────────────────────────────────
   2. Appointments – GET
─────────────────────────────────────────────────────────── */
export const fetchAppointments = async (dateISO) => {
  if (isMockMode()) {
    // mock or offline fallback
    return mockAppointments.filter(a =>
      !dateISO || a.date === dateISO
    );
  }

  const headers = await authHeader();
  const base    = `${API_BASE}/appointments?shop_id=${shopId()}`;
  const url     = dateISO ? `${base}&date=${dateISO}` : base;

  try {
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(r.statusText);
    return (await r.json()).appointments;
  } catch (e) {
    console.error('fetchAppointments → fallback to mock:', e);
    return mockAppointments.filter(a =>
      !dateISO || a.date === dateISO
    );
  }
};

/* ───────────────────────────────────────────────────────────
   3. Barbers – GET
─────────────────────────────────────────────────────────── */
export const fetchBarbers = async () => {
  if (isMockMode()) {
    const empty = getDatabaseConfig().useEmptyData === true;
    return empty ? generateEmptyMockData().barbers : mockBarbers;
  }

  const headers = await authHeader();
  try {
    const r = await fetch(`${API_BASE}/barbers?shop_id=${shopId()}`, { headers });
    if (!r.ok) throw new Error(r.statusText);
    return (await r.json()).barbers;
  } catch (e) {
    console.error('fetchBarbers → fallback to mock:', e);
    const empty = getDatabaseConfig().useEmptyData === true;
    return empty ? generateEmptyMockData().barbers : mockBarbers;
  }
};

/* ───────────────────────────────────────────────────────────
   4. Appointments – POST
─────────────────────────────────────────────────────────── */
export const bookAppointment = async (data) => {
  if (isMockMode()) return legacyMockBook(data);

  const headers = await authHeader();
  const payload = { ...data, shop_id: shopId() };

  try {
    const r = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    return await r.json(); // { success: true, appointment: {…} }
  } catch (e) {
    console.error('bookAppointment → fallback to mock:', e);
    return legacyMockBook(data);
  }
};

/* ───────────────────────────────────────────────────────────
   5. Customers – stub (unchanged)
─────────────────────────────────────────────────────────── */
export const fetchCustomers = async () => {
  // for now just return empty; expand later if needed
  return [];
};

/* ───────────────────────────────────────────────────────────
   6. ChatGPT helper (unchanged)
─────────────────────────────────────────────────────────── */
export const callChatApi = async (messages) => {
  // … (your existing mock + OpenAI logic here, unchanged) …
};

/* ───────────────────────────────────────────────────────────
   7. Legacy mock helper
─────────────────────────────────────────────────────────── */
function legacyMockBook(appt) {
  const withId = {
    ...appt,
    id:
      appt.id ||
      `${appt.date}-${appt.start_time}-${appt.barber_id}-${Date.now()}`,
  };
  mockAppointments.push(withId);
  return Promise.resolve({
    success: true,
    message: 'Appointment saved locally (mock mode)',
    id: withId.id,
  });
}

/* ───────────────────────────────────────────────────────────
   8. Default export
─────────────────────────────────────────────────────────── */
export default {
  fetchConfig,
  saveConfig,
  fetchAppointments,
  fetchBarbers,
  fetchCustomers,
  bookAppointment,
  callChatApi,
};
