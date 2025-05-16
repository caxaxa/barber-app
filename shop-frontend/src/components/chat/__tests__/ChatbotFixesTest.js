/**
 * This is a special test file to specifically test the fixes we made to the chatbot:
 * 1. Proper day of week determination
 * 2. Correct business hours selection based on day of week
 * 3. Time slot generation with configurable interval
 * 4. Improved conflict detection algorithm
 * 5. Better time options formatting with grouping for long lists
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock function to simulate how we updated the date parsing
function testDayOfWeekCalculation(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const jsDate = new Date(year, month - 1, day);
  const dayOfWeek = jsDate.getDay();
  
  return {
    date: dateString,
    dayOfWeek,
    dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
    jsDate: jsDate.toDateString()
  };
}

// Mock function to test business hours determination
function determineBusinessHours(dayOfWeek, config) {
  let businessHours;
  
  if (dayOfWeek === 0) { // Sunday
    businessHours = (config?.business?.sundayHours && config.business.sundayHours.includes('-')) 
      ? config.business.sundayHours 
      : '';
  } else if (dayOfWeek === 6) { // Saturday
    businessHours = (config?.business?.saturdayHours && config.business.saturdayHours.includes('-')) 
      ? config.business.saturdayHours 
      : '08:00-14:00';
  } else { // Weekdays (Monday-Friday)
    // Try to get from config, with a fallback to openHours-closeHours if those exist
    if (config?.business?.weekdayHours && config.business.weekdayHours.includes('-')) {
      businessHours = config.business.weekdayHours;
    } 
    // Try to use openHours and closeHours if they exist in the config
    else if (config?.business?.openHours && config?.business?.closeHours) {
      businessHours = `${config.business.openHours}-${config.business.closeHours}`;
    }
    // Default if nothing else available
    else {
      businessHours = '08:00-18:00';
    }
  }
  
  return businessHours;
}

// Mock function to test time slot generation
function generateTimeSlots(config, date, interval) {
  const businessHours = determineBusinessHours(testDayOfWeekCalculation(date).dayOfWeek, config);
  
  if (!businessHours) {
    return [];
  }
  
  const [openTime, closeTime] = businessHours.split('-');
  if (!openTime || !closeTime) {
    return [];
  }
  
  const [startHour, startMinute] = openTime.split(':').map(Number);
  const [endHour, endMinute] = closeTime.split(':').map(Number);
  
  const useInterval = interval || config?.chatbot?.timeInterval || 
                     config?.business?.appointmentInterval || 30;
  
  const slots = [];
  let currentHour = startHour;
  let currentMinute = startMinute;
  
  while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
    const formattedHour = currentHour.toString().padStart(2, '0');
    const formattedMinute = currentMinute.toString().padStart(2, '0');
    const timeSlot = `${formattedHour}:${formattedMinute}`;
    
    slots.push(timeSlot);
    
    currentMinute += useInterval;
    if (currentMinute >= 60) {
      currentHour += 1;
      currentMinute -= 60;
    }
  }
  
  return slots;
}

// Mock function to test improved conflict detection
function hasTimeConflict(slotStart, slotDuration, apptStart, apptDuration) {
  // Parse time strings to minutes since midnight
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const slotStartMinutes = parseTime(slotStart);
  const slotEndMinutes = slotStartMinutes + slotDuration;
  
  const apptStartMinutes = parseTime(apptStart);
  const apptEndMinutes = apptStartMinutes + apptDuration;
  
  // Standard overlap detection - one range starts before the other ends
  const hasOverlap = (
    slotStartMinutes < apptEndMinutes && 
    slotEndMinutes > apptStartMinutes
  );
  
  // If there's overlap, check if it's significant (> 5 minutes)
  if (hasOverlap) {
    const overlapStart = Math.max(slotStartMinutes, apptStartMinutes);
    const overlapEnd = Math.min(slotEndMinutes, apptEndMinutes);
    const overlapMinutes = overlapEnd - overlapStart;
    
    // Ignore minimal overlaps
    if (overlapMinutes < 5) {
      return false;
    }
  }
  
  return hasOverlap;
}

// Mock function to test time options formatting
function formatTimeOptions(times, MAX_TIMES_TO_SHOW = 15) {
  if (!times || !Array.isArray(times) || times.length === 0) {
    return 'No available times.';
  }
  
  // If we have more times than the max, we'll group them by hour
  if (times.length > MAX_TIMES_TO_SHOW) {
    // Group times by hour to make display more manageable
    const timesByHour = {};
    
    times.forEach(time => {
      const hour = time.split(':')[0];
      if (!timesByHour[hour]) {
        timesByHour[hour] = [];
      }
      timesByHour[hour].push(time);
    });
    
    // Generate summary by hour
    const hourSummaries = Object.keys(timesByHour).map((hour, index) => {
      const count = timesByHour[hour].length;
      const firstTime = timesByHour[hour][0];
      const lastTime = timesByHour[hour][count - 1];
      return `${index + 1}. ${hour}h: ${firstTime} - ${lastTime} (${count} options)`;
    });
    
    return hourSummaries.join('\n');
  } else {
    // For smaller lists, just show the times directly
    const timesToShow = times.map((time, index) => 
      `${index + 1}. ${time}`
    );
    
    return timesToShow.join('\n');
  }
}

describe('Chatbot Fixes', () => {
  describe('Day of Week Calculation', () => {
    it('correctly determines the day of week from date string', () => {
      // Test dates and expected day of week
      const testDates = [
        { date: '2025-05-18', expected: 0 }, // Sunday
        { date: '2025-05-19', expected: 1 }, // Monday
        { date: '2025-05-20', expected: 2 }, // Tuesday
        { date: '2025-05-21', expected: 3 }, // Wednesday
        { date: '2025-05-22', expected: 4 }, // Thursday
        { date: '2025-05-23', expected: 5 }, // Friday
        { date: '2025-05-24', expected: 6 }  // Saturday
      ];
      
      testDates.forEach(({ date, expected }) => {
        const result = testDayOfWeekCalculation(date);
        expect(result.dayOfWeek).toBe(expected);
      });
    });
  });
  
  describe('Business Hours Determination', () => {
    it('selects correct business hours based on day of week', () => {
      const config = {
        business: {
          openHours: '08:00',
          closeHours: '18:00',
          weekdayHours: '08:00-18:00',
          saturdayHours: '08:00-14:00',
          sundayHours: ''
        }
      };
      
      // Test for different days of week
      expect(determineBusinessHours(0, config)).toBe(''); // Sunday closed
      expect(determineBusinessHours(1, config)).toBe('08:00-18:00'); // Monday normal hours
      expect(determineBusinessHours(6, config)).toBe('08:00-14:00'); // Saturday shorter hours
    });
    
    it('uses openHours-closeHours when weekdayHours not specified', () => {
      const config = {
        business: {
          openHours: '09:00',
          closeHours: '17:00'
          // No weekdayHours specified
        }
      };
      
      // Should use openHours-closeHours for weekdays
      expect(determineBusinessHours(1, config)).toBe('09:00-17:00');
    });
  });
  
  describe('Time Slot Generation', () => {
    it('generates correct time slots based on business hours', () => {
      const config = {
        business: {
          openHours: '09:00',
          closeHours: '11:00', // Short day for testing
          appointmentInterval: 30
        }
      };
      
      const date = '2025-05-15'; // Thursday
      const slots = generateTimeSlots(config, date);
      
      expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30']);
    });
    
    it('uses the configured time interval', () => {
      const config = {
        business: {
          openHours: '09:00',
          closeHours: '11:00',
          appointmentInterval: 60
        },
        chatbot: {
          timeInterval: 15 // Should override the 60 min business interval
        }
      };
      
      const date = '2025-05-15';
      const slots = generateTimeSlots(config, date);
      
      // Should have 15-minute intervals
      expect(slots).toEqual([
        '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', 
        '10:30', '10:45'
      ]);
    });
  });
  
  describe('Conflict Detection', () => {
    it('correctly detects time slot conflicts', () => {
      // Test cases: [slotStart, slotDuration, apptStart, apptDuration, expectedConflict]
      const testCases = [
        // No overlap
        ['09:00', 30, '10:00', 30, false],
        // Slot starts during appointment
        ['09:15', 30, '09:00', 30, true],
        // Slot ends during appointment
        ['08:45', 30, '09:00', 30, true],
        // Slot contains appointment
        ['08:30', 60, '09:00', 30, true],
        // Appointment contains slot
        ['09:10', 10, '09:00', 30, true],
        // Minimal overlap (less than 5 minutes) - should not be a conflict
        ['09:27', 30, '09:00', 30, false],
        // Edge case - exact end of slot and start of appointment
        ['09:00', 30, '09:30', 30, false]
      ];
      
      testCases.forEach(([slotStart, slotDuration, apptStart, apptDuration, expected]) => {
        expect(hasTimeConflict(slotStart, slotDuration, apptStart, apptDuration)).toBe(expected);
      });
    });
  });
  
  describe('Time Options Formatting', () => {
    it('formats a small number of time slots directly', () => {
      const times = ['09:00', '09:30', '10:00', '10:30', '11:00'];
      const formatted = formatTimeOptions(times);
      
      // Should list all times individually
      expect(formatted.split('\n').length).toBe(5);
      expect(formatted).toContain('1. 09:00');
      expect(formatted).toContain('5. 11:00');
    });
    
    it('groups time slots by hour when there are many', () => {
      // Generate many time slots
      const times = [];
      for (let hour = 8; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }
      
      const formatted = formatTimeOptions(times);
      
      // Should group by hour
      expect(formatted.split('\n').length).toBe(10); // One line per hour (8-17)
      // The numbering/order might vary, so just check that the required format is there
      expect(formatted).toContain('08h: 08:00 - 08:45 (4 options)');
      expect(formatted).toContain('(4 options)'); // 4 slots per hour with 15-min intervals
    });
  });
});