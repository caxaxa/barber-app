// booking_fsm.ts
// Pure (framework‑agnostic) finite‑state machine for the GUIDED booking flow.
// ─────────────────────────────────────────────────────────────────────────────
// This module has **zero** dependencies on React or AWS SDK; it only manipulates
// plain objects.  Both the web widget and the WhatsApp Lambda can import it.

export type AccountType = 'individual' | 'enterprise';

export interface Worker {
  worker_id: string | number;
  name: string;
  specialties?: string[];
}

export interface BookingContext {
  shop_id: string;
  accountType: AccountType;
  workers: Worker[];           // empty → individual account auto‑fills later
  config: any;                 // raw tenant config blob (needed for greetings etc.)

  // mutable session state -----------------------------------------------
  step: number;                // 0‑6 as in the original Chatbox
  clientName?: string;
  selectedService?: string;
  selectedWorker?: Worker;
  selectedDate?: string;       // YYYY‑MM‑DD
  selectedTime?: string;       // HH:MM
}

export interface FSMResult {
  reply: string;               // text to send back to the user
  context: BookingContext;     // mutated copy (immutability for safety)
  appointment?: {              // present only when user confirmed (step 6 → "sim")
    worker_id: string | number;
    date: string;
    start_time: string;
    client_name: string;
  };
}

// Common barber services (could be overridden per‑tenant via config later)
const DEFAULT_SERVICES = [
  'Corte de cabelo',
  'Barba',
  'Corte e barba',
  'Sobrancelha',
  'Hidratação',
];

// Helper ----------------------------------------------------------------
function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Main reducer -----------------------------------------------------------
export function handleMessage(inpTextRaw: string, ctx: BookingContext): FSMResult {
  const text = inpTextRaw.trim();
  let c = clone(ctx);
  let reply = '';

  // When we need the single worker in individual mode
  const soloWorker: Worker | undefined =
    c.accountType === 'individual'
      ? {
          worker_id: c.shop_id,
          name: c.config?.business?.ownerName || 'Profissional',
        }
      : undefined;

  switch (c.step) {
    case 0: // greeting already sent externally; ask for name
      reply = `Olá! Sou ${c.config?.assistant?.name || 'Amanda'}, assistente virtual da ${c.config?.business?.name || 'Barbearia'}. Qual é o seu nome, por favor?`;
      c.step = 1;
      break;

    case 1: // got the name
      c.clientName = text;
      c.step = 2;
      reply = `Olá ${text}! Qual serviço você gostaria de agendar?`;
      break;

    case 2: // expect a service
      c.selectedService = text;
      c.step = 3;

      if (c.accountType === 'individual') {
        c.selectedWorker = soloWorker!;
        c.step = 4;
        reply = `Para qual data você gostaria de agendar seu ${text} com ${soloWorker!.name}?`;
      } else {
        reply = `Qual profissional você prefere para o serviço de ${text}?`;
      }
      break;

    case 3: // enterprise only – choose worker
      const candidate = c.workers.find(
        (w) => w.name.toLowerCase() === text.toLowerCase() || String(w.worker_id) === text
      );
      if (!candidate) {
        reply = 'Não encontrei esse profissional. Poderia escolher um da lista disponível?';
        break;
      }
      c.selectedWorker = candidate;
      c.step = 4;
      reply = `Perfeito! Qual data você prefere para agendar com ${candidate.name}?`;
      break;

    case 4: // date (very light validation – YYYY‑MM‑DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        reply = 'Formato de data inválido. Use AAAA-MM-DD, por favor.';
        break;
      }
      c.selectedDate = text;
      c.step = 5;
      reply = `Qual horário você prefere no dia ${text}?`;
      break;

    case 5: // time HH:MM
      if (!/^\d{2}:\d{2}$/.test(text)) {
        reply = 'Formato de horário inválido. Use HH:MM, por favor.';
        break;
      }
      c.selectedTime = text;
      c.step = 6;
      reply = `Para confirmar: ${c.selectedService} com ${c.selectedWorker!.name} em ${c.selectedDate} às ${text}. Está correto? (Responda sim para confirmar)`;
      break;

    case 6: // confirmation
      if (/^(sim|s)$/i.test(text)) {
        c.step = 0; // reset for next booking
        reply = '✅ Agendamento confirmado! Obrigado por escolher nossos serviços.';
        return {
          reply,
          context: c,
          appointment: {
            worker_id: c.selectedWorker!.worker_id,
            date: c.selectedDate!,
            start_time: c.selectedTime!,
            client_name: c.clientName!,
          },
        };
      }
      // if user says no → go back to service selection
      c.step = 2;
      reply = 'Tudo bem, vamos tentar novamente. Qual serviço você gostaria de agendar?';
      break;

    default:
      reply = 'Desculpe, não entendi. Poderia repetir?';
  }

  return { reply, context: c };
}

// Utility – list of quick‑reply options for the current step (UI helpers)
export function getSuggestedOptions(ctx: BookingContext): string[] {
  switch (ctx.step) {
    case 2:
      return DEFAULT_SERVICES;
    case 3:
      return ctx.workers.map((w) => w.name);
    default:
      return [];
  }
}
