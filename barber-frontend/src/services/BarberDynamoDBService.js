/**
 * Service for handling barber-specific appointments in DynamoDB
 */

// Import base API functions
import { fetchAppointments as fetchShopAppointments } from './api';

// Constants
const BARBER_TABLE = 'arn:aws:dynamodb:us-east-2:002938753233:table/barber';
const API_ENDPOINT = '';

/**
 * Fetch all appointments for a specific barber
 * @param {string} barberId - The barber's ID
 * @returns {Promise<Array>} appointments data
 */
export const fetchBarberAppointments = async (barberId) => {
  try {
    // For the prototype, we'll use the general fetchAppointments and filter client-side
    // In a real implementation, this would call a specific API endpoint for the barber table
    console.log('Fetching appointments for barber ID:', barberId);
    const allAppointments = await fetchShopAppointments();
    
    // Filter for just this barber's appointments
    return allAppointments.filter(appt => appt.barber_id?.toString() === barberId);
  } catch (error) {
    console.error('Error fetching barber appointments:', error);
    throw error;
  }
};

/**
 * Book a new appointment in the barber-specific table
 * @param {Object} appointmentData - The appointment data
 * @returns {Promise<Object>} booking result
 */
export const bookBarberAppointment = async (appointmentData) => {
  try {
    // The barber-specific table doesn't need barber_id
    const { date, start_time, client_name, phone, email, duration = 40 } = appointmentData;
    
    // Validate required fields
    if (!date || !start_time || !client_name) {
      throw new Error('Missing required appointment information');
    }
    
    // Create a unique appointment ID
    const appointment_id = `${date}-${start_time}`;
    
    // The appointment object for the barber-specific table
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
    
    console.log('Booking appointment in barber-specific table:', newAppointment);
    console.log('This would be stored in the barber table:', BARBER_TABLE);
    
    // In a real implementation, this would make a request to a specific endpoint
    // For the prototype, we'll just mock the successful response
    
    // For testing purposes, store in localStorage to simulate persistence
    const existingAppointments = JSON.parse(localStorage.getItem('barberAppointments') || '[]');
    existingAppointments.push(newAppointment);
    localStorage.setItem('barberAppointments', JSON.stringify(existingAppointments));
    
    return {
      success: true,
      message: 'Appointment booked successfully in barber-specific table',
      appointment: newAppointment
    };
  } catch (error) {
    console.error('Error booking barber appointment:', error);
    throw error;
  }
};

/**
 * Check for appointment conflicts in the barber's schedule
 * @param {string} date - The appointment date
 * @param {string} start_time - The appointment start time
 * @param {number} duration - The appointment duration in minutes
 * @returns {Promise<boolean>} true if there's a conflict, false otherwise
 */
export const checkBarberAppointmentConflict = async (date, start_time, duration = 40) => {
  try {
    // Get existing appointments from localStorage (for prototype)
    const existingAppointments = JSON.parse(localStorage.getItem('barberAppointments') || '[]');
    
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
  fetchBarberAppointments,
  bookBarberAppointment,
  checkBarberAppointmentConflict
};