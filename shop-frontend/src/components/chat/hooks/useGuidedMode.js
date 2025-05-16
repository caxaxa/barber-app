// src/components/chat/hooks/useGuidedMode.js
import { useState, useCallback, useEffect } from 'react';
import { useConfig } from '../../../context/config';
import { generateDateRange, formatDate, isClosedDay } from '../utils/dateUtils';
import { generateTimeSlots, filterAvailableSlots } from '../utils/bookingUtils';

/**
 * Hook to manage guided mode chat functionality
 * Handles date/time generation and availability
 */
export function useGuidedMode(bookingState, workers, externalFreeModeAllowed = true) {
  const { config } = useConfig();
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [showWorkerOptions, setShowWorkerOptions] = useState(false);
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  
  // Check if the OpenAI API is properly configured
  const cfg = useConfig().config;
  const freeModeAvailable = !!(cfg?.openai?.enabled && cfg?.openai?.apiKey);
  
  // Check if guided mode is enabled in config
  const isGuidedMode = useCallback(() => {
    // Check the configuration first - this has highest priority
    const configuredGuidedMode = config?.chatbot?.guidedMode;
    
    // If explicitly configured, respect that setting
    if (configuredGuidedMode === true || configuredGuidedMode === false) {
      // But still force guided mode if free mode isn't available
      if (configuredGuidedMode === false && (!freeModeAvailable || !externalFreeModeAllowed)) {
        console.log("Forcing guided mode because free mode not available");
        return true;
      }
      console.log("Using configured guided mode:", configuredGuidedMode);
      return configuredGuidedMode;
    }
    
    // If not explicitly configured:
    
    // If the external freeModeAllowed prop is false, force guided mode
    if (!externalFreeModeAllowed) {
      console.log("Forcing guided mode due to external prop");
      return true;
    }
    
    // If OpenAI API is not configured, force guided mode
    if (!freeModeAvailable) {
      console.log("Forcing guided mode due to no OpenAI config");
      return true;
    }
    
    // Default to guided mode if not explicitly configured
    console.log("Using default guided mode (true)");
    return true;
  }, [config, freeModeAvailable, externalFreeModeAllowed]);

  // Generate available dates based on business configuration
  const generateDateOptions = useCallback(() => {
    // Get dayRange from config or default to 14 days
    const daysToGenerate = config?.chatbot?.dayRange || 14;
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