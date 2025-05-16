import {
  addMinutes,
  formatDate,
  formatDateBR,
  isWithinBusinessHours,
  generateDateRange,
  getDayNamePT,
  isClosedDay
} from '../dateUtils';

describe('dateUtils', () => {
  describe('addMinutes', () => {
    it('adds minutes to a time string', () => {
      expect(addMinutes('09:00', 30)).toBe('09:30');
      expect(addMinutes('09:30', 30)).toBe('10:00');
      expect(addMinutes('23:45', 30)).toBe('00:15');
    });

    it('handles hour overflow correctly', () => {
      expect(addMinutes('09:45', 30)).toBe('10:15');
      expect(addMinutes('23:45', 30)).toBe('00:15');
    });
  });

  describe('formatDate', () => {
    it('formats a date object to YYYY-MM-DD', () => {
      const date = new Date(2025, 4, 15); // May 15, 2025
      expect(formatDate(date)).toBe('2025-05-15');
    });
  });

  describe('formatDateBR', () => {
    it('formats a date string from YYYY-MM-DD to DD/MM/YYYY', () => {
      expect(formatDateBR('2025-05-15')).toBe('15/05/2025');
    });
  });

  describe('isWithinBusinessHours', () => {
    it('checks if a time is within business hours', () => {
      expect(isWithinBusinessHours('09:30', '09:00', '18:00')).toBe(true);
      expect(isWithinBusinessHours('08:30', '09:00', '18:00')).toBe(false);
      expect(isWithinBusinessHours('18:30', '09:00', '18:00')).toBe(false);
    });

    it('works with time at the boundary', () => {
      expect(isWithinBusinessHours('09:00', '09:00', '18:00')).toBe(true);
      expect(isWithinBusinessHours('18:00', '09:00', '18:00')).toBe(true);
    });
  });

  describe('generateDateRange', () => {
    it('generates a range of dates from today', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const dateRange = generateDateRange(2);
      
      expect(dateRange.length).toBe(2);
      expect(dateRange[0].getDate()).toBe(today.getDate());
      expect(dateRange[1].getDate()).toBe(tomorrow.getDate());
    });

    it('generates the correct number of dates', () => {
      expect(generateDateRange(5).length).toBe(5);
      expect(generateDateRange(10).length).toBe(10);
    });
  });

  describe('getDayNamePT', () => {
    it('returns the correct Portuguese day name', () => {
      // May 11, 2025 is a Sunday
      expect(getDayNamePT(new Date(2025, 4, 11))).toBe('Domingo');
      // May 12, 2025 is a Monday
      expect(getDayNamePT(new Date(2025, 4, 12))).toBe('Segunda');
      // May 13, 2025 is a Tuesday
      expect(getDayNamePT(new Date(2025, 4, 13))).toBe('Terça');
      // May 14, 2025 is a Wednesday
      expect(getDayNamePT(new Date(2025, 4, 14))).toBe('Quarta');
      // May 15, 2025 is a Thursday
      expect(getDayNamePT(new Date(2025, 4, 15))).toBe('Quinta');
      // May 16, 2025 is a Friday
      expect(getDayNamePT(new Date(2025, 4, 16))).toBe('Sexta');
      // May 17, 2025 is a Saturday
      expect(getDayNamePT(new Date(2025, 4, 17))).toBe('Sábado');
    });
  });

  describe('isClosedDay', () => {
    it('correctly identifies if a date is on a closed day', () => {
      const closedDays = ['Domingo', 'Sábado']; // Sundays and Saturdays are closed
      
      // May 11, 2025 is a Sunday
      expect(isClosedDay(new Date(2025, 4, 11), closedDays)).toBe(true);
      // May 17, 2025 is a Saturday
      expect(isClosedDay(new Date(2025, 4, 17), closedDays)).toBe(true);
      // May 15, 2025 is a Thursday
      expect(isClosedDay(new Date(2025, 4, 15), closedDays)).toBe(false);
    });

    it('works with an empty closed days array', () => {
      const closedDays = [];
      
      // May 11, 2025 is a Sunday, but no days are closed
      expect(isClosedDay(new Date(2025, 4, 11), closedDays)).toBe(false);
    });
  });
});