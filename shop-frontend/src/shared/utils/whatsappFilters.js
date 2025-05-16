/**
 * WhatsApp filters utility for consistent filtering in frontend and backend
 */

/**
 * Check if a phone number should be allowed based on whitelist/blacklist configuration
 * 
 * @param {string} number - The phone number to check (e.g., +123456789 or 123456789@c.us)
 * @param {Object} whatsappConfig - The WhatsApp integration configuration 
 * @returns {Object} Result object with allowed status and reason if blocked
 */
export function checkNumberFilter(number, whatsappConfig) {
  // If WhatsApp integration is not enabled or config is missing, allow all
  if (!whatsappConfig?.enabled) return { allowed: true };
  
  // Check if it's a group message
  const isGroup = number.includes('@g.us');
  if (isGroup && whatsappConfig.disableGroups) {
    return { allowed: false, reason: 'group' };
  }
  
  // Apply number filtering based on whitelist/blacklist
  const filterMode = whatsappConfig.filterMode || 'whitelist';
  const filterNumbers = whatsappConfig.filterNumbers || [];
  
  // Check if filtering should be applied
  if (filterNumbers.length > 0) {
    // Normalize phone number for comparison
    const normalizedNumber = number.replace(/[^0-9+]/g, '');
    
    // Check if the number is in the filter list
    const isInList = filterNumbers.some(num => {
      const normalizedFilterNumber = num.replace(/[^0-9+]/g, '');
      return normalizedNumber.includes(normalizedFilterNumber) || 
            normalizedFilterNumber.includes(normalizedNumber);
    });
    
    // For whitelist: block if NOT in list
    // For blacklist: block if IN list
    const shouldBlock = (filterMode === 'whitelist') ? !isInList : isInList;
    
    if (shouldBlock) {
      return { allowed: false, reason: filterMode };
    }
  } else if (filterMode === 'whitelist' && filterNumbers.length === 0) {
    // Empty whitelist means block all (unless it's just not configured)
    return { allowed: false, reason: 'emptyWhitelist' };
  }
  
  return { allowed: true };
}

/**
 * Format a phone number for consistent comparison
 * 
 * @param {string} phoneNumber - The phone number to format 
 * @returns {string} Normalized phone number
 */
export function normalizePhoneNumber(phoneNumber) {
  // Remove any non-numeric characters except +
  return phoneNumber.replace(/[^0-9+]/g, '');
}

/**
 * Check if a phone number is in a list (for whitelist/blacklist)
 * 
 * @param {string} phoneNumber - The phone number to check 
 * @param {Array<string>} phoneList - List of phone numbers to check against
 * @returns {boolean} True if the number is in the list
 */
export function isPhoneNumberInList(phoneNumber, phoneList) {
  if (!phoneList || phoneList.length === 0) return false;
  
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  
  return phoneList.some(num => {
    const normalizedListNumber = normalizePhoneNumber(num);
    // Check if either number contains the other to handle partial matches
    return normalizedNumber.includes(normalizedListNumber) || 
           normalizedListNumber.includes(normalizedNumber);
  });
}

/**
 * Create a human-readable message explaining why a message was blocked
 * 
 * @param {string} reason - The reason code why a message was blocked
 * @returns {string} Human-readable explanation
 */
export function getBlockReasonMessage(reason) {
  switch (reason) {
    case 'group':
      return 'A mensagem foi bloqueada porque veio de um grupo do WhatsApp e o atendimento em grupos está desativado.';
    case 'whitelist':
      return 'Este número não está na lista de números permitidos (whitelist).';
    case 'blacklist':
      return 'Este número está na lista de números bloqueados (blacklist).';
    case 'emptyWhitelist':
      return 'Nenhum número está configurado na lista de permissões (whitelist vazia).';
    default:
      return 'A mensagem foi bloqueada por regras de filtragem.';
  }
}