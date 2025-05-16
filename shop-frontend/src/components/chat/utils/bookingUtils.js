// src/components/chat/utils/bookingUtils.js
import { addMinutes, isWithinBusinessHours } from './dateUtils';

/**
 * Create an appointment object from booking state
 * @param {Object} bookingState - Current booking state
 * @returns {Object|null} - Appointment object or null if data is incomplete
 */
export function createAppointmentFromBookingState(bookingState) {
  // Validate required fields
  if (
    !bookingState || 
    !bookingState.clientName || 
    !bookingState.selectedService || 
    !bookingState.selectedDate || 
    !bookingState.selectedTime || 
    !bookingState.selectedWorker
  ) {
    return null;
  }
  
  // Create appointment object
  return {
    id: generateAppointmentId(),
    shop_id: bookingState.shop_id,
    client_name: bookingState.clientName,
    service: bookingState.selectedService,
    worker_id: bookingState.selectedWorker.worker_id,
    worker_name: bookingState.selectedWorker.name,
    date: bookingState.selectedDate,
    start_time: bookingState.selectedTime,
    duration: getDurationForService(bookingState.selectedService, bookingState.config),
    status: 'confirmed',
    created_at: new Date().toISOString()
  };
}

/**
 * Generate times for a date based on business hours and appointment duration
 * @param {Object} config - Business configuration with hours and duration
 * @param {string} date - Date string in format YYYY-MM-DD
 * @returns {string[]} - Array of available time slots in format HH:MM
 */
export function generateTimeSlots(config, date) {
  // Extract business config values with defaults
  const openHours = config?.business?.openHours || '09:00';
  const closeHours = config?.business?.closeHours || '18:00';
  const lastAppointmentTime = config?.business?.lastAppointmentTime || '17:00';
  const appointmentDuration = config?.business?.appointmentDuration || 30;
  // Use the chatbot timeInterval if available, otherwise fallback to business appointmentInterval
  const appointmentInterval = config?.chatbot?.timeInterval || config?.business?.appointmentInterval || 15;
  
  // Parse start and end times
  const [startHour, startMinute] = openHours.split(':').map(Number);
  
  // Generate all possible time slots
  const slots = [];
  let currentTime = new Date();
  currentTime.setHours(startHour, startMinute, 0, 0);
  
  // Create time slots at intervals until last appointment time
  let reachedEndTime = false;
  while (!reachedEndTime) {
    const timeStr = currentTime.getHours().toString().padStart(2, '0') + 
                    ':' + 
                    currentTime.getMinutes().toString().padStart(2, '0');
    
    // Check if we've passed the last appointment time
    reachedEndTime = !isWithinBusinessHours(timeStr, openHours, lastAppointmentTime);
    if (reachedEndTime) {
      break;
    }
    
    slots.push(timeStr);
    
    // Add interval for next slot
    currentTime.setMinutes(currentTime.getMinutes() + appointmentInterval);
  }
  
  return slots;
}

/**
 * Filter slots by availability (removes booked slots)
 * @param {string[]} slots - Array of time slots in format HH:MM
 * @param {Object[]} existingAppointments - Array of existing appointments
 * @param {string} date - Date string in format YYYY-MM-DD
 * @param {string} workerId - Worker ID to check appointments for
 * @returns {string[]} - Array of available time slots
 */
export function filterAvailableSlots(slots, existingAppointments, date, workerId) {
  if (!existingAppointments || !existingAppointments.length) {
    return slots;
  }
  
  // Get appointments for this worker and date
  const appointments = existingAppointments.filter(app => 
    app.worker_id === workerId && 
    app.date === date && 
    app.status !== 'cancelled'
  );
  
  if (!appointments.length) {
    return slots; // No appointments, all slots available
  }
  
  // Filter out booked slots
  return slots.filter(slot => {
    // Check for overlap with any existing appointment
    return !appointments.some(app => {
      const appointmentStart = app.start_time;
      const appointmentEnd = addMinutes(app.start_time, app.duration || 30);
      
      // Check if slot is within an existing appointment
      return slot >= appointmentStart && slot < appointmentEnd;
    });
  });
}

/**
 * Generate a unique appointment ID
 * @returns {string} - Unique ID for the appointment
 */
function generateAppointmentId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Get the duration for a service based on configuration
 * @param {string} serviceName - Name of the service
 * @param {Object} config - Application configuration
 * @returns {number} - Duration in minutes
 */
function getDurationForService(serviceName, config) {
  // Check if service exists in configuration
  const service = config?.services?.items?.find(
    item => item.name === serviceName
  );
  
  // Return service duration or default
  return service?.duration || config?.business?.appointmentDuration || 30;
}