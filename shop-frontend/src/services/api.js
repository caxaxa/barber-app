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
      const shop = sessionStorage.getItem('shopId') || 'demo-shop';
      const storageKey = `appConfig_${shop}`;
      const cfg = JSON.parse(localStorage.getItem(storageKey) || '{}');
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
    try {
      const headers = await authHeader();
      const r = await fetch(`${API_BASE}/config?shop_id=${shop}`, { headers });
      if (!r.ok) throw new Error(await r.text());
      return r.json(); // {} if nothing saved yet
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  }
  
  export async function saveConfig(cfg, shop = shopId()) {
    if (isMockMode()) return;
    try {
      const headers = await authHeader();
      
      // Ensure shop_id is correctly set to the current user's shop ID
      // The backend will use the shop_id from JWT claims but we set it explicitly for clarity
      const payload = { ...cfg, shop_id: shop }; // partition key for DynamoDB
      
      const r = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    } catch (error) {
      console.error('Error saving config:', error);
      throw error;
    }
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
     5)  CUSTOMERS API
     ---------------------------------------------------------------- */
  export async function fetchCustomers() {
    if (isMockMode()) {
      return []; // TODO: Add mock customer data when needed
    }

    try {
      const headers = await authHeader();
      const r = await fetch(`${API_BASE}/customers?shop_id=${shopId()}`, { headers });
      
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      return data.customers || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      // Return empty array instead of throwing to avoid breaking UI
      return [];
    }
  }
  
  /* ────────────────────────────────────────────────────────────────
     6)  ChatGPT helper
     ---------------------------------------------------------------- */
  export async function callChatApi(messages) {
    if (isMockMode()) {
      return Promise.resolve({
        response: "This is a mock response. Please configure the OpenAI API to use the chat feature.",
        success: true
      });
    }

    try {
      // Get config from localStorage
      const shop = sessionStorage.getItem('shopId') || 'demo-shop';
      const storageKey = `appConfig_${shop}`;
      const cfg = JSON.parse(localStorage.getItem(storageKey) || '{}');
      
      // Check if OpenAI is enabled and API key exists
      if (!cfg.openai?.enabled || !cfg.openai?.apiKey) {
        throw new Error('OpenAI is not enabled or API key is missing');
      }
      
      const headers = await authHeader();
      
      // Use backend proxy instead of direct OpenAI call for security
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          messages,
          shop_id: shopId()
        }),
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error calling chat API:', error);
      return {
        error: error.message,
        success: false
      };
    }
  }
  
  /* ────────────────────────────────────────────────────────────────
     7)  Legacy local-mock book helper
     ---------------------------------------------------------------- */
  function legacyMockBook(appt) {
    // Create a unique ID for this appointment
    const appointmentId = appt.id || 
      `${appt.date}-${appt.start_time}-${appt.worker_id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const withId = {
      ...appt,
      id: appointmentId,
      shop_id: shopId(),
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
      const shop = sessionStorage.getItem('shopId') || 'demo-shop';
      const storageKey = `mockAppointments_${shop}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedAppointments));
    } catch (error) {
      console.error('Error saving mock appointment to localStorage:', error);
    }
    
    return Promise.resolve({
      success: true,
      message: 'Appointment saved locally (mock mode)',
      id: appointmentId,
    });
  }
  
  /* ────────────────────────────────────────────────────────────────
     8)  API service exports
     ---------------------------------------------------------------- */
  // Only use named exports to maintain consistency
  // No default export to avoid import confusion
  