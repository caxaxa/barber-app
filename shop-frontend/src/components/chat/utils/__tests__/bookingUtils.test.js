import {
  createAppointmentFromBookingState,
  generateTimeSlots,
  filterAvailableSlots
} from '../bookingUtils';

// Mock the dateUtils dependency
jest.mock('../dateUtils', () => ({
  addMinutes: jest.fn((timeStr, minutes) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0);
    return date.getHours().toString().padStart(2, '0') + ':' + 
           date.getMinutes().toString().padStart(2, '0');
  }),
  isWithinBusinessHours: jest.fn((timeStr, openHours, lastAppointmentTime) => {
    const [timeHour, timeMin] = timeStr.split(':').map(Number);
    const [openHour, openMin] = openHours.split(':').map(Number);
    const [lastHour, lastMin] = lastAppointmentTime.split(':').map(Number);
    
    const timeInMinutes = timeHour * 60 + timeMin;
    const openInMinutes = openHour * 60 + openMin;
    const lastInMinutes = lastHour * 60 + lastMin;
    
    return timeInMinutes >= openInMinutes && timeInMinutes <= lastInMinutes;
  })
}));

describe('bookingUtils', () => {
  describe('createAppointmentFromBookingState', () => {
    it('creates an appointment object from booking state', () => {
      const bookingState = {
        shop_id: 'test-shop',
        clientName: 'Test Client',
        selectedService: 'Haircut',
        selectedDate: '2025-05-15',
        selectedTime: '10:00',
        selectedWorker: {
          worker_id: 'worker-1',
          name: 'Worker 1'
        },
        config: {
          business: {
            appointmentDuration: 30
          }
        }
      };
      
      const appointment = createAppointmentFromBookingState(bookingState);
      
      expect(appointment).toEqual(expect.objectContaining({
        shop_id: 'test-shop',
        client_name: 'Test Client',
        service: 'Haircut',
        worker_id: 'worker-1',
        worker_name: 'Worker 1',
        date: '2025-05-15',
        start_time: '10:00',
        duration: 30,
        status: 'confirmed'
      }));
      
      // id and created_at are generated dynamically, so we just check they exist
      expect(appointment.id).toBeDefined();
      expect(appointment.created_at).toBeDefined();
    });
    
    it('returns null when booking state is incomplete', () => {
      const incompleteState = {
        shop_id: 'test-shop',
        clientName: 'Test Client',
        // Missing selectedService, selectedDate, selectedTime, or selectedWorker
      };
      
      expect(createAppointmentFromBookingState(incompleteState)).toBeNull();
    });
  });
  
  describe('generateTimeSlots', () => {
    it('generates time slots based on business hours', () => {
      const config = {
        business: {
          openHours: '09:00',
          closeHours: '17:00',
          lastAppointmentTime: '16:00',
          appointmentDuration: 30,
          appointmentInterval: 30
        }
      };
      
      const date = '2025-05-15'; // A Thursday
      
      const slots = generateTimeSlots(config, date);
      
      // Expected slots from 9:00 to 16:00 at 30 minute intervals
      const expectedSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00'
      ];
      
      expect(slots).toEqual(expectedSlots);
    });
    
    it('uses chatbot timeInterval if available', () => {
      const config = {
        business: {
          openHours: '09:00',
          closeHours: '11:00', // Short day for testing
          lastAppointmentTime: '10:30',
          appointmentDuration: 30,
          appointmentInterval: 30
        },
        chatbot: {
          timeInterval: 15 // Override with 15-minute intervals
        }
      };
      
      const date = '2025-05-15';
      
      const slots = generateTimeSlots(config, date);
      
      // Expected slots from 9:00 to 10:30 at 15 minute intervals
      const expectedSlots = [
        '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30'
      ];
      
      expect(slots).toEqual(expectedSlots);
    });
  });
  
  describe('filterAvailableSlots', () => {
    it('filters out booked slots', () => {
      const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00'];
      const date = '2025-05-15';
      const workerId = 'worker-1';
      
      const appointments = [
        {
          worker_id: 'worker-1',
          date: '2025-05-15',
          start_time: '09:30',
          duration: 30,
          status: 'confirmed'
        },
        {
          worker_id: 'worker-1',
          date: '2025-05-15',
          start_time: '10:30',
          duration: 30,
          status: 'confirmed'
        }
      ];
      
      const availableSlots = filterAvailableSlots(timeSlots, appointments, date, workerId);
      
      // Slots at 9:30 and 10:30 should be filtered out because they're booked
      expect(availableSlots).toEqual(['09:00', '10:00', '11:00']);
    });
    
    it('returns all slots when there are no appointments', () => {
      const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00'];
      const date = '2025-05-15';
      const workerId = 'worker-1';
      
      // Empty appointments array
      const appointments = [];
      
      const availableSlots = filterAvailableSlots(timeSlots, appointments, date, workerId);
      
      // All slots should be available
      expect(availableSlots).toEqual(timeSlots);
    });
    
    it('filters appointments for the specific worker and date', () => {
      const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00'];
      const date = '2025-05-15';
      const workerId = 'worker-1';
      
      const appointments = [
        // Different worker, same date - should not affect availability
        {
          worker_id: 'worker-2',
          date: '2025-05-15',
          start_time: '09:00',
          duration: 30,
          status: 'confirmed'
        },
        // Same worker, different date - should not affect availability
        {
          worker_id: 'worker-1',
          date: '2025-05-16',
          start_time: '09:30',
          duration: 30,
          status: 'confirmed'
        },
        // Same worker, same date - should be filtered out
        {
          worker_id: 'worker-1',
          date: '2025-05-15',
          start_time: '10:00',
          duration: 30,
          status: 'confirmed'
        }
      ];
      
      const availableSlots = filterAvailableSlots(timeSlots, appointments, date, workerId);
      
      // Only 10:00 should be filtered out
      expect(availableSlots).toEqual(['09:00', '09:30', '10:30', '11:00']);
    });
    
    it('handles cancelled appointments correctly', () => {
      const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00'];
      const date = '2025-05-15';
      const workerId = 'worker-1';
      
      const appointments = [
        // Cancelled appointment - should not affect availability
        {
          worker_id: 'worker-1',
          date: '2025-05-15',
          start_time: '09:00',
          duration: 30,
          status: 'cancelled'
        },
        // Confirmed appointment - should be filtered out
        {
          worker_id: 'worker-1',
          date: '2025-05-15',
          start_time: '10:00',
          duration: 30,
          status: 'confirmed'
        }
      ];
      
      const availableSlots = filterAvailableSlots(timeSlots, appointments, date, workerId);
      
      // Only 10:00 should be filtered out, cancelled appointment at 9:00 should remain available
      expect(availableSlots).toEqual(['09:00', '09:30', '10:30', '11:00']);
    });
  });
});