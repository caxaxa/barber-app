/**
 * WhatsApp filters utility for consistent filtering in frontend and backend
 */

/**
 * Check if a phone number should be allowed based on whitelist/blacklist configuration
 * 
 * @param {string} number - The phone number to check (e.g., +123456789 or 123456789@c.us or 123456789@s.whatsapp.net)
 * @param {Object} whatsappConfig - The WhatsApp integration configuration 
 * @returns {Object} Result object with allowed status and reason if blocked
 */
export function checkNumberFilter(number, whatsappConfig) {
  // If WhatsApp integration is not enabled or config is missing, allow all
  if (!whatsappConfig?.enabled) return { allowed: true };
  
  // Debug logging
  console.log(`Checking filter for number: ${number}`);
  
  // Check if it's a group message
  const isGroup = number.includes('@g.us');
  if (isGroup && whatsappConfig.disableGroups) {
    console.log('Message blocked: Group message');
    return { allowed: false, reason: 'group' };
  }
  
  // TEMPORARY: Log the number for debugging
  console.log(`WEBHOOK FILTER CHECK - Number: ${number}, FilterMode: ${whatsappConfig.filterMode}, FilterNumbers: ${JSON.stringify(whatsappConfig.filterNumbers)}`);
  
  // Apply number filtering based on whitelist/blacklist
  const filterMode = whatsappConfig.filterMode || 'whitelist';
  const filterNumbers = whatsappConfig.filterNumbers || [];
  
  console.log(`Filter mode: ${filterMode}, Filter numbers count: ${filterNumbers.length}`);
  
  // Special handling for the Twilio test number
  if (number.includes('14155238886')) {
    console.log('TWILIO TEST NUMBER DETECTED - ALLOWING');
    return { allowed: true, twilio: true };
  }
  
  // Check if filtering should be applied
  if (filterNumbers.length > 0) {
    // Normalize phone number for comparison - handle @c.us and @s.whatsapp.net formats
    let normalizedNumber = number;
    if (normalizedNumber.includes('@')) {
      normalizedNumber = normalizedNumber.split('@')[0]; // Remove @c.us or @s.whatsapp.net
    }
    
    // Remove any non-numeric characters except +
    normalizedNumber = normalizedNumber.replace(/[^0-9+]/g, '');
    
    console.log(`Normalized number for comparison: ${normalizedNumber}`);
    
    // Check if the number is in the filter list
    const isInList = filterNumbers.some(num => {
      let normalizedFilterNumber = num.replace(/[^0-9+]/g, '');
      
      // Handle country code variations (with or without +)
      if (normalizedFilterNumber.startsWith('+') && !normalizedNumber.startsWith('+')) {
        normalizedFilterNumber = normalizedFilterNumber.substring(1);
      } else if (!normalizedFilterNumber.startsWith('+') && normalizedNumber.startsWith('+')) {
        normalizedFilterNumber = '+' + normalizedFilterNumber;
      }
      
      // Check for exact match or if one contains the other (for cases with/without country code)
      const match = normalizedNumber === normalizedFilterNumber || 
                   normalizedNumber.endsWith(normalizedFilterNumber) ||
                   normalizedFilterNumber.endsWith(normalizedNumber);
      
      console.log(`Comparing with: ${normalizedFilterNumber}, Match: ${match}`);
      
      return match;
    });
    
    // For whitelist: block if NOT in list
    // For blacklist: block if IN list
    const shouldBlock = (filterMode === 'whitelist') ? !isInList : isInList;
    
    if (shouldBlock) {
      console.log(`Message blocked: Number ${isInList ? 'is' : 'is not'} in ${filterMode}`);
      return { allowed: false, reason: filterMode };
    }
  } else if (filterMode === 'whitelist' && filterNumbers.length === 0) {
    // TEMPORARY FIX: Allow all numbers if whitelist is empty during testing
    console.log('WEBHOOK ALLOWED: Whitelist is empty - allowing all numbers');
    return { allowed: true };
    
    // Original behavior: Empty whitelist means block all
    // return { allowed: false, reason: 'emptyWhitelist' };
  }
  
  console.log('Message allowed: Passed all filtering checks');
  return { allowed: true };
}

/**
 * Format a phone number for consistent comparison
 * 
 * @param {string} phoneNumber - The phone number to format 
 * @returns {string} Normalized phone number
 */
export function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  
  // Handle WhatsApp number formats (@c.us or @s.whatsapp.net suffix)
  let normalizedNumber = phoneNumber;
  if (normalizedNumber.includes('@')) {
    normalizedNumber = normalizedNumber.split('@')[0];
  }
  
  // Remove any non-numeric characters except +
  normalizedNumber = normalizedNumber.replace(/[^0-9+]/g, '');
  
  // Ensure consistent format with country code
  if (normalizedNumber.length > 10 && !normalizedNumber.startsWith('+')) {
    // Add + for international format if missing
    normalizedNumber = '+' + normalizedNumber;
  }
  
  return normalizedNumber;
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
  if (!phoneNumber) return false;
  
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  console.log(`Checking if ${normalizedNumber} is in list`);
  
  return phoneList.some(num => {
    const normalizedListNumber = normalizePhoneNumber(num);
    
    // Handle country code variations
    let withoutPlusNumber = normalizedNumber;
    let withoutPlusListNumber = normalizedListNumber;
    
    if (normalizedNumber.startsWith('+')) {
      withoutPlusNumber = normalizedNumber.substring(1);
    }
    
    if (normalizedListNumber.startsWith('+')) {
      withoutPlusListNumber = normalizedListNumber.substring(1);
    }
    
    // Do a more thorough comparison:
    // 1. Exact match with or without + sign
    // 2. One number ends with the other (handles country code variations)
    const isMatch = normalizedNumber === normalizedListNumber ||
                   withoutPlusNumber === withoutPlusListNumber ||
                   normalizedNumber.endsWith(withoutPlusListNumber) ||
                   normalizedListNumber.endsWith(withoutPlusNumber);
    
    console.log(`Comparing with ${normalizedListNumber}: ${isMatch ? 'MATCH' : 'no match'}`);
    
    return isMatch;
  });
}

/**
 * Create a human-readable message explaining why a message was blocked
 * 
 * @param {string} reason - The reason code why a message was blocked
 * @param {string} phoneNumber - The phone number that was blocked (optional)
 * @returns {string} Human-readable explanation
 */
export function getBlockReasonMessage(reason, phoneNumber = '') {
  const formattedNumber = phoneNumber ? ` (${normalizePhoneNumber(phoneNumber)})` : '';
  
  switch (reason) {
    case 'group':
      return `A mensagem foi bloqueada porque veio de um grupo do WhatsApp e o atendimento em grupos está desativado.${formattedNumber}`;
    case 'whitelist':
      return `Este número não está na lista de números permitidos (whitelist).${formattedNumber}`;
    case 'blacklist':
      return `Este número está na lista de números bloqueados (blacklist).${formattedNumber}`;
    case 'emptyWhitelist':
      return `Nenhum número está configurado na lista de permissões (whitelist vazia).${formattedNumber}`;
    default:
      return `A mensagem foi bloqueada por regras de filtragem.${formattedNumber}`;
  }
}