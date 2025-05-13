import axios from 'axios';
import { handleMessage, getSuggestedOptions } from '@barber-app/booking-fsm';
import { buildContext } from './fsm-wrapper.js';

const EVO_BASE   = process.env.EVO_BASE_URL;
const EVO_KEY    = process.env.EVO_API_KEY;
const PUBLIC_URL = process.env.PUBLIC_API_URL;
const PUBLIC_KEY = process.env.PUBLIC_API_KEY;

/**
 * Evolution-API webhook handler
 * POST body is: { instanceId, data: { from, body, ... } }
 */
export const handler = async (event) => {
  try {
    const payload = JSON.parse(event.body);
    const from  = payload.data?.from;
    const text  = payload.data?.body?.text ?? '';

    // ---- fetch config/workers for this tenant -----------------
    const shopId = payload.instanceId;             // we’ll use instanceId === shop_id
    const headers = { 'x-api-key': PUBLIC_KEY };

    const [cfgRes, workersRes] = await Promise.all([
      axios.get(`${PUBLIC_URL}/public/config`,   { headers, params: { shop_id: shopId } }),
      axios.get(`${PUBLIC_URL}/public/workers`, { headers, params: { shop_id: shopId } })
    ]);

    // ---- run FSM ---------------------------------------------
    const ctx = buildContext(shopId, cfgRes.data, workersRes.data.workers);
    const { reply, context, appointment } = handleMessage(text, ctx);

    // book automatically if FSM produced one
    if (appointment) {
      await axios.post(`${PUBLIC_URL}/public/appointments/book`, appointment, { headers });
    }

    // ---- send reply back to WhatsApp -------------------------
    await axios.post(`${EVO_BASE}/message/send`, {
      instanceId : payload.instanceId,
      message    : reply,
      chatId     : from
    }, { headers: { apiKey: EVO_KEY } });

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

