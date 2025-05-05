/**
 * Service for handling worker-specific appointments in DynamoDB
 */

// Import base API functions
import { fetchAppointments as fetchShopAppointments } from './api';

// Constants
const WORKER_TABLE = 'arn:aws:dynamodb:us-east-2:002938753233:table/worker';
const API_ENDPOINT = '';

/**
 * Fetch all appointments for a specific worker
 * @param {string} workerId - The worker's ID
 * @returns {Promise<Array>} appointments data
 */
export const fetchWorkerAppointments = async (workerId) => {
  try {
    // For the prototype, we'll use the general fetchAppointments and filter client-side
    // In a real implementation, this would call a specific API endpoint for the worker table
    console.log('Fetching appointments for worker ID:', workerId);
    const allAppointments = await fetchShopAppointments();
    
    // Filter for just this worker's appointments
    return allAppointments.filter(appt => appt.worker_id?.toString() === workerId);
  } catch (error) {
    console.error('Error fetching worker appointments:', error);
    throw error;
  }
};

/**
 * Book a new appointment in the worker-specific table
 * @param {Object} appointmentData - The appointment data
 * @returns {Promise<Object>} booking result
 */
export const bookWorkerAppointment = async (appointmentData) => {
  try {
    // The worker-specific table doesn't need worker_id
    const { date, start_time, client_name, phone, email, duration = 40 } = appointmentData;
    
    // Validate required fields
    if (!date || !start_time || !client_name) {
      throw new Error('Missing required appointment information');
    }
    
    // Create a unique appointment ID
    const appointment_id = `${date}-${start_time}`;
    
    // The appointment object for the worker-specific table
    const newAppointment = {
      appointment_id,
      date,
      start_time,
      client_name,
      phone: phone || '', 
      email: email || '',
      duration: duration || 40,
      created_at: new Date().toISOString()
    };
    
    console.log('Booking appointment in worker-specific table:', newAppointment);
    console.log('This would be stored in the worker table:', WORKER_TABLE);
    
    // In a real implementation, this would make a request to a specific endpoint
    // For the prototype, we'll just mock the successful response
    
    // For testing purposes, store in localStorage to simulate persistence
    const existingAppointments = JSON.parse(localStorage.getItem('workerAppointments') || '[]');
    existingAppointments.push(newAppointment);
    localStorage.setItem('workerAppointments', JSON.stringify(existingAppointments));
    
    return {
      success: true,
      message: 'Appointment booked successfully in worker-specific table',
      appointment: newAppointment
    };
  } catch (error) {
    console.error('Error booking worker appointment:', error);
    throw error;
  }
};

/**
 * Check for appointment conflicts in the worker's schedule
 * @param {string} date - The appointment date
 * @param {string} start_time - The appointment start time
 * @param {number} duration - The appointment duration in minutes
 * @returns {Promise<boolean>} true if there's a conflict, false otherwise
 */
export const checkWorkerAppointmentConflict = async (date, start_time, duration = 40) => {
  try {
    // Get existing appointments from localStorage (for prototype)
    const existingAppointments = JSON.parse(localStorage.getItem('workerAppointments') || '[]');
    
    // Convert times to minutes for comparison
    const appointmentStartMinutes = timeToMinutes(start_time);
    const appointmentEndMinutes = appointmentStartMinutes + duration;
    
    // Check for conflicts
    const hasConflict = existingAppointments.some(appointment => {
      // Only check appointments on the same date
      if (appointment.date !== date) return false;
      
      const existingStartMinutes = timeToMinutes(appointment.start_time);
      const existingEndMinutes = existingStartMinutes + (appointment.duration || 40);
      
      // Check if the appointments overlap
      return (
        (appointmentStartMinutes >= existingStartMinutes && appointmentStartMinutes < existingEndMinutes) ||
        (appointmentEndMinutes > existingStartMinutes && appointmentEndMinutes <= existingEndMinutes) ||
        (appointmentStartMinutes <= existingStartMinutes && appointmentEndMinutes >= existingEndMinutes)
      );
    });
    
    return hasConflict;
  } catch (error) {
    console.error('Error checking for appointment conflicts:', error);
    throw error;
  }
};

// Helper function to convert time (HH:MM) to minutes
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

export default {
  fetchWorkerAppointments,
  bookWorkerAppointment,
  checkWorkerAppointmentConflict
};