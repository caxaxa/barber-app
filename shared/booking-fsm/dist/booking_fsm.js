"use strict";
// booking_fsm.ts
// Pure (framework‑agnostic) finite‑state machine for the GUIDED booking flow.
// ─────────────────────────────────────────────────────────────────────────────
// This module has **zero** dependencies on React or AWS SDK; it only manipulates
// plain objects.  Both the web widget and the WhatsApp Lambda can import it.
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
exports.getSuggestedOptions = getSuggestedOptions;
// Common barber services (could be overridden per‑tenant via config later)
const DEFAULT_SERVICES = [
    'Corte de cabelo',
    'Barba',
    'Corte e barba',
    'Sobrancelha',
    'Hidratação',
];
// Helper ----------------------------------------------------------------
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
// Main reducer -----------------------------------------------------------
function handleMessage(inpTextRaw, ctx) {
    var _a, _b, _c, _d, _e, _f;
    const text = inpTextRaw.trim();
    let c = clone(ctx);
    let reply = '';
    // When we need the single worker in individual mode
    const soloWorker = c.accountType === 'individual'
        ? {
            worker_id: c.shop_id,
            name: ((_b = (_a = c.config) === null || _a === void 0 ? void 0 : _a.business) === null || _b === void 0 ? void 0 : _b.ownerName) || 'Profissional',
        }
        : undefined;
    switch (c.step) {
        case 0: // greeting already sent externally; ask for name
            reply = `Olá! Sou ${((_d = (_c = c.config) === null || _c === void 0 ? void 0 : _c.assistant) === null || _d === void 0 ? void 0 : _d.name) || 'Amanda'}, assistente virtual da ${((_f = (_e = c.config) === null || _e === void 0 ? void 0 : _e.business) === null || _f === void 0 ? void 0 : _f.name) || 'Barbearia'}. Qual é o seu nome, por favor?`;
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
                c.selectedWorker = soloWorker;
                c.step = 4;
                reply = `Para qual data você gostaria de agendar seu ${text} com ${soloWorker.name}?`;
            }
            else {
                reply = `Qual profissional você prefere para o serviço de ${text}?`;
            }
            break;
        case 3: // enterprise only – choose worker
            const candidate = c.workers.find((w) => w.name.toLowerCase() === text.toLowerCase() || String(w.worker_id) === text);
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
            reply = `Para confirmar: ${c.selectedService} com ${c.selectedWorker.name} em ${c.selectedDate} às ${text}. Está correto? (Responda sim para confirmar)`;
            break;
        case 6: // confirmation
            if (/^(sim|s)$/i.test(text)) {
                c.step = 0; // reset for next booking
                reply = '✅ Agendamento confirmado! Obrigado por escolher nossos serviços.';
                return {
                    reply,
                    context: c,
                    appointment: {
                        worker_id: c.selectedWorker.worker_id,
                        date: c.selectedDate,
                        start_time: c.selectedTime,
                        client_name: c.clientName,
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
function getSuggestedOptions(ctx) {
    switch (ctx.step) {
        case 2:
            return DEFAULT_SERVICES;
        case 3:
            return ctx.workers.map((w) => w.name);
        default:
            return [];
    }
}
