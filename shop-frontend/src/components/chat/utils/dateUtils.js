// src/components/chat/utils/dateUtils.js

/**
 * Add minutes to a time string (HH:MM)
 * @param {string} timeStr - Time string in format HH:MM
 * @param {number} minutes - Minutes to add
 * @returns {string} - Resulting time string in format HH:MM
 */
export function addMinutes(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0);
  return date.getHours().toString().padStart(2, '0') + ':' + 
         date.getMinutes().toString().padStart(2, '0');
}

/**
 * Format a date object to YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} - Formatted date string
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Format a date string from YYYY-MM-DD to DD/MM/YYYY (Brazilian format)
 * @param {string} dateStr - Date string in format YYYY-MM-DD
 * @returns {string} - Formatted date string in format DD/MM/YYYY
 */
export function formatDateBR(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Check if a time string is within business hours
 * @param {string} timeStr - Time string in format HH:MM
 * @param {string} openHours - Business open hours in format HH:MM
 * @param {string} closeHours - Business close hours in format HH:MM
 * @returns {boolean} - True if time is within business hours
 */
export function isWithinBusinessHours(timeStr, openHours, closeHours) {
  const [timeHours, timeMins] = timeStr.split(':').map(Number);
  const [openHours_, openMins] = openHours.split(':').map(Number);
  const [closeHours_, closeMins] = closeHours.split(':').map(Number);
  
  const timeMinutes = timeHours * 60 + timeMins;
  const openMinutes = openHours_ * 60 + openMins;
  const closeMinutes = closeHours_ * 60 + closeMins;
  
  return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
}

/**
 * Generate a range of dates from today
 * @param {number} days - Number of days to generate
 * @returns {Date[]} - Array of Date objects
 */
export function generateDateRange(days) {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
}

/**
 * Get day name from date in Portuguese
 * @param {Date} date - Date object
 * @returns {string} - Day name in Portuguese
 */
export function getDayNamePT(date) {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[date.getDay()];
}

/**
 * Check if a date is closed (Sunday or holiday)
 * @param {Date} date - Date object
 * @param {string[]} closedDays - Array of closed day names in Portuguese
 * @returns {boolean} - True if the date is on a closed day
 */
export function isClosedDay(date, closedDays) {
  const dayName = getDayNamePT(date);
  return closedDays.includes(dayName);
}