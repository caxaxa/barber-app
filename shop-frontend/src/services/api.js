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
  
  /* ── env & helpers ────────────────────────────────────────────── */
  const API_BASE = process.env.REACT_APP_BACKEND_URL;
  
  const shopId = () => sessionStorage.getItem('shopId') || 'demo-shop';
  
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
    const token = sessionStorage.getItem('idToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
  
  /* ────────────────────────────────────────────────────────────────
     1)  CONFIG  – GET & PUT (Cognito protected)
     ---------------------------------------------------------------- */
  export async function fetchConfig(shop = shopId()) {
    if (isMockMode()) return {};
    const headers = await authHeader();
    const r = await fetch(`${API_BASE}/config?shop_id=${shop}`, { headers });
    if (!r.ok) throw new Error(r.statusText);
    return r.json(); // {} if nothing saved yet
  }
  
  export async function saveConfig(cfg, shop = shopId()) {
    if (isMockMode()) return;
    const headers = await authHeader();
    const payload = { ...cfg, shop_id: shop }; // partition key for DynamoDB
    const r = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  
  /* ────────────────────────────────────────────────────────────────
     2)  APPOINTMENTS – GET
     ---------------------------------------------------------------- */
  export async function fetchAppointments(dateISO) {
    /* Offline / mock */
    if (isMockMode()) {
      return mockAppointments.filter((a) => !dateISO || a.date === dateISO);
    }
  
    const headers = await authHeader();
    const base = `${API_BASE}/appointments?shop_id=${shopId()}`;
    const url = dateISO ? `${base}&date=${dateISO}` : base;
  
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(r.statusText);
    return (await r.json()).appointments;
  }
  
  /* ────────────────────────────────────────────────────────────────
     3)  WORKERS – GET
     ---------------------------------------------------------------- */
  export async function fetchWorkers() {
    const role = sessionStorage.getItem('userRole');
  
    /* 1) Individual tenant = single “worker” (the shop owner) */
    if (role === 'individual') {
      const ownerId   = sessionStorage.getItem('shopId');
      const ownerName = sessionStorage.getItem('workerName') || ownerId;
      return [{ worker_id: ownerId, name: ownerName }];
    }
  
    /* 2) Mock / offline */
    if (isMockMode()) {
      const empty = getDatabaseConfig().useEmptyData === true;
      return empty ? generateEmptyMockData().workers : mockWorkers;
    }
  
    /* 3) Live call */
    const headers = await authHeader();
    const res     = await fetch(`${API_BASE}/workers`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch workers: ${res.statusText}`);
  
    const { workers = [] } = await res.json();
    return workers.map((w) => ({
      worker_id: w.worker_id,
      name: w.name || w.worker_id,
      ...w,
    }));
  }
  
  /* ────────────────────────────────────────────────────────────────
     4)  APPOINTMENTS – POST
     ---------------------------------------------------------------- */
  export async function bookAppointment(data) {
    if (isMockMode()) return legacyMockBook(data);
  
    const headers = await authHeader();
    const payload = { ...data, shop_id: shopId() };
  
    const r = await fetch(`${API_BASE}/appointments/book`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  
  /* ────────────────────────────────────────────────────────────────
     5)  CUSTOMERS stub (later)
     ---------------------------------------------------------------- */
  export const fetchCustomers = async () => [];
  
  /* ────────────────────────────────────────────────────────────────
     6)  ChatGPT helper (unchanged here)
     ---------------------------------------------------------------- */
  export async function callChatApi(messages) {
    /* left as-is – your existing code goes here */
  }
  
  /* ────────────────────────────────────────────────────────────────
     7)  Legacy local-mock book helper
     ---------------------------------------------------------------- */
  function legacyMockBook(appt) {
    const withId = {
      ...appt,
      id:
        appt.id ||
        `${appt.date}-${appt.start_time}-${appt.worker_id}-${Date.now()}`,
    };
    mockAppointments.push(withId);
    return Promise.resolve({
      success: true,
      message: 'Appointment saved locally (mock mode)',
      id: withId.id,
    });
  }
  
  /* ────────────────────────────────────────────────────────────────
     8)  convenient default export
     ---------------------------------------------------------------- */
  export default {
    fetchConfig,
    saveConfig,
    fetchAppointments,
    fetchWorkers,
    fetchCustomers,
    bookAppointment,
    callChatApi,
  };
  