import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Chatbox from "../components/chat/Chatbox";
import { useNotification } from "../components/ui/NotificationContext";
import { handleMessage } from "@barber-app/booking-fsm";

/**
 * Minimal wrapper that:
 *  • fetches workers + config for the shop_id in the URL
 *  • reuses Chatbox in guided mode only
 */
export default function BookingWidget() {
  const { shop_id } = useParams();
  const { showNotification } = useNotification();

  const [config,   setConfig]   = useState(null);
  const [workers,  setWorkers]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  // ── fetch public data on mount ─────────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      try {
        // reuse existing API for now (your dev stack)
        const cfg = await fetch(
          `/Prod/config?shop_id=${shop_id}`
        ).then(r => r.json());
        setConfig(cfg);

        // enterprise only – ignore 404 for individual accounts
        const wks = await fetch(
          `/Prod/workers?shop_id=${shop_id}`
        ).then(r => r.ok ? r.json() : { workers: [] });
        setWorkers(wks.workers || []);

      } catch (err) {
        showNotification(`Erro ao carregar dados públicos: ${err}`, "error");
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [shop_id, showNotification]);

  if (loading) return <p style={{textAlign:"center"}}>Carregando…</p>;

  return (
    <div style={{maxWidth:420, margin:"0 auto"}}>
      <Chatbox
        onNewAppointment={async (payload) => {
          const res = await fetch("/Prod/appointments/book", {
            method: "POST",
            headers: { 'x-api-key': '<value-from-stack-outputs>' },
            body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(await res.text());
        }}
        workers={workers}
        freeModeAllowed={false}   // always guided in public widget
      />
    </div>
  );
}
