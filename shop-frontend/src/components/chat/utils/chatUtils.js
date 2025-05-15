// src/components/chat/utils/chatUtils.js

/**
 * Format service options as a numbered list message
 * @param {string[]} services - Array of service names
 * @returns {string} - Formatted message with numbered options
 */
export function formatServiceOptionsMessage(services) {
  if (!services || services.length === 0) return '';
  
  const header = 'Escolha um serviço digitando o número correspondente:';
  const options = services.map((service, index) => 
    `${index + 1}. ${service}`
  ).join('\n');
  
  return `${header}\n\n${options}`;
}

/**
 * Format worker options as a numbered list message
 * @param {Object[]} workers - Array of worker objects
 * @returns {string} - Formatted message with numbered options
 */
export function formatWorkerOptionsMessage(workers) {
  if (!workers || workers.length === 0) return '';
  
  const header = 'Escolha um profissional digitando o número correspondente:';
  const options = workers.map((worker, index) => {
    const specialties = worker.specialties && worker.specialties.length > 0 
      ? ` (${worker.specialties.join(', ')})` 
      : '';
    return `${index + 1}. ${worker.name}${specialties}`;
  }).join('\n');
  
  return `${header}\n\n${options}`;
}

/**
 * Format date options as a numbered list message
 * @param {string[]} dates - Array of date strings in format YYYY-MM-DD
 * @param {function} formatDateFn - Function to format date for display
 * @returns {string} - Formatted message with numbered options
 */
export function formatDateOptionsMessage(dates, formatDateFn) {
  if (!dates || dates.length === 0) return '';
  
  const header = 'Escolha uma data digitando o número correspondente:';
  const options = dates.map((date, index) => {
    const formattedDate = formatDateFn ? formatDateFn(date) : date;
    return `${index + 1}. ${formattedDate}`;
  }).join('\n');
  
  return `${header}\n\n${options}`;
}

/**
 * Format time options as a numbered list message
 * @param {string[]} times - Array of time strings in format HH:MM
 * @returns {string} - Formatted message with numbered options
 */
export function formatTimeOptionsMessage(times) {
  if (!times || times.length === 0) return '';
  
  const header = 'Escolha um horário digitando o número correspondente:';
  const options = times.map((time, index) => 
    `${index + 1}. ${time}`
  ).join('\n');
  
  return `${header}\n\n${options}`;
}

/**
 * Check if a message might contain a number selection
 * @param {string} text - Message text
 * @returns {boolean} - True if the message might be a selection
 */
export function isSelectionMessage(text) {
  // Check if the message is just a number or starts with a number followed by a period or dash
  return /^\d+$/.test(text) || /^\d+[\.\)]/.test(text);
}

/**
 * Extract the selected number from a message
 * @param {string} text - Message text
 * @returns {number|null} - Selected number or null if no valid selection found
 */
export function extractSelectionNumber(text) {
  if (/^\d+$/.test(text)) {
    return parseInt(text, 10);
  }
  
  const match = text.match(/^(\d+)[\.\)]/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

/**
 * Create a system prompt for the chatbot based on config
 * @param {Object} config - Application configuration
 * @param {Object} businessInfo - Business information (name, hours, etc.)
 * @returns {string} - Formatted system prompt
 */
export function createSystemPrompt(config, businessInfo) {
  // Use the assistant prompt from config or fall back to a basic prompt
  if (config?.assistant?.prompt) {
    return config.assistant.prompt;
  }
  
  // Create a basic prompt with business info
  return `
# Sistema de Agendamento: ${businessInfo.name || 'Barbearia'}

## Informações do Negócio
- Nome: ${businessInfo.name || 'Barbearia'}
- Horário de funcionamento: ${businessInfo.openHours || '09:00'} às ${businessInfo.closeHours || '18:00'}
- Dias fechados: ${businessInfo.closedDays?.join(', ') || 'Domingo'}

## Sua função
Você é ${config?.assistant?.name || 'Amanda'}, a assistente virtual especializada em agendamentos.
Seu objetivo é ajudar os clientes a marcarem horários de forma eficiente e amigável.
Sempre mantenha um tom profissional e cordial.

## Regras importantes
- Apenas confirme agendamentos em horários de funcionamento
- Verifique disponibilidade antes de confirmar
- Colete nome do cliente, serviço desejado, data e horário
- Confirme todos os detalhes antes de finalizar
`;
}