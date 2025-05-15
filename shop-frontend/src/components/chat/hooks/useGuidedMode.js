// src/components/chat/hooks/useGuidedMode.js
import { useState, useCallback, useEffect } from 'react';
import { useConfig } from '../../../context/config';
import { generateDateRange, formatDate, isClosedDay } from '../utils/dateUtils';
import { generateTimeSlots, filterAvailableSlots } from '../utils/bookingUtils';

/**
 * Hook to manage guided mode chat functionality
 * Handles date/time generation and availability
 */
export function useGuidedMode(bookingState, workers) {
  const { config } = useConfig();
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [showWorkerOptions, setShowWorkerOptions] = useState(false);
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  
  // Check if guided mode is enabled in config
  const isGuidedMode = useCallback(() => {
    const guidedMode = config?.chatbot?.guidedMode !== false; // default: guided
    return guidedMode;
  }, [config]);

  // Generate available dates based on business configuration
  const generateDateOptions = useCallback(() => {
    // Default to 14 days from today
    const daysToGenerate = 14;
    const closedDays = config?.business?.closedDays || ['Domingo'];
    
    // Generate date range
    const dateRange = generateDateRange(daysToGenerate);
    
    // Filter out closed days
    const availableDates = dateRange
      .filter(date => !isClosedDay(date, closedDays))
      .map(date => formatDate(date));
    
    // Update available dates state
    setAvailableDates(availableDates);
    
    return availableDates;
  }, [config]);

  // Generate available times based on business configuration and selected date
  const generateTimeOptions = useCallback((date) => {
    if (!date) return [];
    
    // Generate time slots based on business hours
    const slots = generateTimeSlots(config, date);
    
    // TODO: Filter out booked slots based on existing appointments
    const filteredSlots = slots;
    
    // Update available times state
    setAvailableTimes(filteredSlots);
    
    return filteredSlots;
  }, [config]);

  // Update options visibility based on booking state
  useEffect(() => {
    if (!isGuidedMode()) {
      // Hide all options in free mode
      setShowServiceOptions(false);
      setShowWorkerOptions(false);
      setShowDateOptions(false);
      setShowTimeOptions(false);
      return;
    }
    
    // Update options visibility based on current step
    switch (bookingState.step) {
      case 2: // Service selection
        setShowServiceOptions(true);
        setShowWorkerOptions(false);
        setShowDateOptions(false);
        setShowTimeOptions(false);
        break;
        
      case 3: // Worker selection
        setShowServiceOptions(false);
        setShowWorkerOptions(true);
        setShowDateOptions(false);
        setShowTimeOptions(false);
        break;
        
      case 4: // Date selection
        setShowServiceOptions(false);
        setShowWorkerOptions(false);
        setShowDateOptions(true);
        setShowTimeOptions(false);
        
        // Generate date options if not already available
        if (availableDates.length === 0) {
          generateDateOptions();
        }
        break;
        
      case 5: // Time selection
        setShowServiceOptions(false);
        setShowWorkerOptions(false);
        setShowDateOptions(false);
        setShowTimeOptions(true);
        
        // Generate time options for the selected date
        if (bookingState.selectedDate) {
          generateTimeOptions(bookingState.selectedDate);
        }
        break;
        
      default:
        setShowServiceOptions(false);
        setShowWorkerOptions(false);
        setShowDateOptions(false);
        setShowTimeOptions(false);
    }
  }, [bookingState.step, bookingState.selectedDate, isGuidedMode, generateDateOptions, generateTimeOptions, availableDates.length]);

  return {
    isGuidedMode: isGuidedMode(),
    showServiceOptions,
    showWorkerOptions,
    showDateOptions,
    showTimeOptions,
    availableDates,
    availableTimes,
    generateDateOptions,
    generateTimeOptions
  };
}