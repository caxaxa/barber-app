/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - The date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Format time to HH:MM
 * @param {Date} date - The date to format
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
  return date.toTimeString().substring(0, 5);
};

/**
 * Parse date and time strings to create a Date object
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:MM format
 * @returns {Date} Combined date and time
 */
export const parseDateTime = (dateStr, timeStr) => {
  return new Date(`${dateStr}T${timeStr}`);
};

/**
 * Add minutes to a date
 * @param {Date} date - The base date
 * @param {number} minutes - Minutes to add
 * @returns {Date} New date with minutes added
 */
export const addMinutes = (date, minutes) => {
  return new Date(date.getTime() + minutes * 60000);
};

/**
 * Check if two time ranges overlap
 * @param {string} start1 - First range start time (HH:MM)
 * @param {string} end1 - First range end time (HH:MM)
 * @param {string} start2 - Second range start time (HH:MM)
 * @param {string} end2 - Second range end time (HH:MM)
 * @returns {boolean} True if ranges overlap
 */
export const timeRangesOverlap = (start1, end1, start2, end2) => {
  // Convert to minutes since midnight for comparison
  const toMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);
  
  return Math.max(s1, s2) < Math.min(e1, e2);
};