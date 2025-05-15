import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Chip,
  Stack,
  Card,
  CardActionArea,
  CardContent
} from '@mui/material';
import { handleMessage, getSuggestedOptions } from '@barber-app/booking-fsm';
import { BookingContext } from '@barber-app/booking-fsm';
import { callChatApi } from '../../services/api';
import { useNotification } from '../ui/NotificationContext';
import { useConfig } from '../../context/ConfigContext';



/**
 * Chatbox component that allows users to book appointments via a chat interface
 */
export default function Chatbox({ onNewAppointment, workers, freeModeAllowed }) {
  // 1) React hooks at the very top:
  const { config, getUserRole } = useConfig();         // ✅ exactly one useConfig()
  const isEnterpriseAccount     = getUserRole() === 'enterprise';
  const shopId                  = sessionStorage.getItem('shopId');

  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [showWorkerOptions,  setShowWorkerOptions]  = useState(false);
  const [showDateOptions,    setShowDateOptions]    = useState(false);
  const [showTimeOptions,    setShowTimeOptions]    = useState(false);
  const [availableTimes,     setAvailableTimes]     = useState([]);
  const [availableDates,     setAvailableDates]     = useState([]);

  
  
  
  // Track booking flow state
  const [ctx, setCtx] = useState(/** @type {BookingContext} */({
    shop_id: sessionStorage.getItem('shopId'),
    accountType: getUserRole() === 'enterprise' ? 'enterprise' : 'individual',
    workers,
    config,
    step: 0,
    customDuration: 30, // Default 30 minute duration for custom appointments
    lastAppointmentId: null // Track the last booked appointment for calendar download
  }));
  const bookingState = ctx;
  const setBookingState = setCtx;
  const showConfirmOptions = ctx.step === 6;
  const messagesEndRef = useRef(null);
  const { showNotification } = useNotification();


  // Get services from config or use defaults
  const getAvailableServices = () => {
    // Check if services are defined in config
    if (config?.services?.items && config.services.items.length > 0) {
      // Use the services from config
      return config.services.items.map(service => service.name);
    }
    
    // Return a single custom consultation option if no services are configured
    return ["Consulta"];
  };
  
  const commonServices = getAvailableServices();
  
  // Helper function to get guided mode setting from config
  const isGuidedMode = () => {
    if (!freeModeAllowed) return true;
  
    const guidedMode = config?.chatbot?.guidedMode !== false; // default: guided
    return guidedMode;
  };

  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  const workerNames = workers.length > 0 ? workers.map(b => b.name).join(', ') : 'Nenhum profissional disponível';
  
  // Helper function to add minutes to a time string (HH:MM)
  const addMinutes = (timeStr, minutes) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0);
    return date.getHours().toString().padStart(2, '0') + ':' + 
           date.getMinutes().toString().padStart(2, '0');
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset the chat when the chat mode changes
  useEffect(() => {
    resetChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.chatbot?.guidedMode, isEnterpriseAccount]);

  // Initialize prompt with system message
  useEffect(() => {
    if (messages.length === 0) {
      if (isGuidedMode()) {
        console.log("Initializing guided mode chat");
        // In guided mode, start with assistant greeting
        const assistantGreeting = { 
          role: 'assistant', 
          content: "Olá! Sou a " + (config?.assistant?.name || "Amanda") + ", assistente virtual de " + (config?.business?.name || "Barbearia Elite") + ". Para começar, poderia me informar seu nome, por favor?" 
        };
        setMessages([
          { role: 'system', content: getPromptText() },
          assistantGreeting
        ]);
        
        // Set booking state to name collection
        setBookingState(prev => ({
          ...prev,
          step: 1,
          config // Make sure we have the latest config for service checking
        }));
      } else {
        console.log("Initializing free mode chat");
        // In free mode, just set the system message
        setMessages([{ role: 'system', content: getPromptText() }]);
      }
    }
    // We include messages in deps array because we need to check its length,
    // but intentionally omit getPromptText as it would cause unnecessary reruns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, workerNames, formattedDate]);
  useEffect(() => {
    /* run when:
         • you're in guided mode
         • enterprise account
         • you're already at step 3 (service chosen)
         • and workers have finally been fetched (length > 0)
    */
    if (
      isGuidedMode() &&
      isEnterpriseAccount &&
      ctx.step === 3 &&
      workers.length > 0
    ) {
      // Show worker options as a message after a small delay
      setTimeout(() => {
        const workerListMsg = formatWorkerOptionsMessage();
        setMessages(prev => [...prev, { role: 'assistant', content: workerListMsg }]);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workers.length, isEnterpriseAccount, ctx.step]);
  // Helper function to format service options as a numbered list message
  const formatServiceOptionsMessage = () => {
    if (!commonServices || commonServices.length === 0) return '';
    
    const header = 'Escolha um serviço digitando o número correspondente:';
    const options = commonServices.map((service, index) => 
      `${index + 1}. ${service}`
    ).join('\n');
    
    return `${header}\n\n${options}`;
  };
  
  // Helper function to format worker options as a numbered list message
  const formatWorkerOptionsMessage = () => {
    if (!workers || workers.length === 0) return '';
    
    const header = 'Escolha um profissional digitando o número correspondente:';
    const options = workers.map((worker, index) => {
      const specialties = worker.specialties && worker.specialties.length > 0 
        ? ` (${worker.specialties.join(', ')})` 
        : '';
      return `${index + 1}. ${worker.name}${specialties}`;
    }).join('\n');
    
    return `${header}\n\n${options}`;
  };
  
  // Helper function to format date options as a numbered list message
  const formatDateOptionsMessage = () => {
    console.log("Formatting date options message, availableDates:", availableDates?.length || 0);
    
    // If no available dates, generate them immediately
    if (!availableDates || availableDates.length === 0) {
      console.warn("Warning: No available dates available when formatting message! Generating now.");
      // Generate dates directly here to ensure we always have options
      const dates = [];
      const today = new Date();
      
      // Add the next 14 days
      for (let i = 0; i < 14; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        
        // Format date for display
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        
        const displayDate = date.toLocaleDateString('pt-BR', { 
          weekday: 'short', 
          day: '2-digit', 
          month: '2-digit' 
        });
        
        const brFormat = `${day}/${month}/${year}`;
        
        dates.push({
          value: formattedDate,
          display: displayDate,
          brFormat: brFormat,
          jsDate: new Date(date)
        });
      }
      
      // Update state with these dates
      setAvailableDates(dates);
      
      // *** MATCHING WHATSAPP BEHAVIOR ***
      // Since WhatsApp expects YYYY-MM-DD format for dates, we'll change the instruction
      const header = 'Escolha uma data digitando diretamente no formato AAAA-MM-DD:';
      const options = dates.map((date, index) => 
        `${index + 1}. ${date.display} (${date.value})`
      ).join('\n');
      const note = 'IMPORTANTE: Digite a data no formato AAAA-MM-DD (exemplo: 2025-05-15)';
      
      return `${header}\n\n${options}\n\n${note}`;
    }
    
    // *** MATCHING WHATSAPP BEHAVIOR ***
    // Since WhatsApp expects YYYY-MM-DD format for dates, we'll change the instruction
    const header = 'Escolha uma data digitando diretamente no formato AAAA-MM-DD:';
    const options = availableDates.map((date, index) => 
      `${index + 1}. ${date.display} (${date.value})`
    ).join('\n');
    const note = 'IMPORTANTE: Digite a data no formato AAAA-MM-DD (exemplo: 2025-05-15)';
    
    console.log("Generated date options message with", availableDates.length, "options");
    return `${header}\n\n${options}\n\n${note}`;
  };
  
  // Helper function to format time options as a numbered list message
  const formatTimeOptionsMessage = () => {
    // CRITICAL FIX: Make a local copy of availableTimes to prevent race conditions
    const times = [...availableTimes];
    
    // Check if availableTimes is defined and has elements
    if (!times || !Array.isArray(times) || times.length === 0) {
      return 'Nenhum horário disponível.';
    }
    
    // For debugging - log each time entry to see its structure
    if (times.length > 0) {
      console.log("Time entries structure:", 
        typeof times[0], 
        JSON.stringify(times[0]).substring(0, 50),
        `(${times.length} total filtered times)`
      );
    }
    
    // *** MATCHING WHATSAPP BEHAVIOR ***
    // Since WhatsApp expects HH:MM format for times, we'll change the instruction
    // to match that behavior and avoid confusion
    const header = 'Escolha um horário digitando diretamente no formato HH:MM:';
    
    // Simplified approach - just show numbered list of available times
    // This avoids issues with numbering gaps from filtering
    const timesToShow = times.map((time, index) => {
      // Handle both string and object time formats
      const timeStr = typeof time === 'object' && time.formatted ? time.formatted : String(time);
      return `${index + 1}. ${timeStr}`;
    });
    
    const options = timesToShow.join('\n');
    const note = 'IMPORTANTE: Digite o horário no formato HH:MM (exemplo: 14:30)\n\nAlguns horários não estão disponíveis devido a outros agendamentos.';
    
    return `${header}\n\n${options}\n\n${note}`;
  };
  
  // Use the config from the component scope
  const getPromptText = () => {
    // Use the config already defined at the component level
    // No need to call useConfig() again
    
    const businessType = config?.business?.type?.toUpperCase() || 'BARBEARIA';
    const businessName = config?.business?.name || 'Barbearia Elite';
    const assistantName = config?.assistant?.name?.toUpperCase() || 'AMANDA';
    const assistantFullTitle = config?.assistant?.fullTitle || 'Assistente Virtual';
    
    // Modify the prompt slightly for individual accounts
    const isEnterpriseAccountLocal = getUserRole() === 'enterprise';
    const isIndividual = !isEnterpriseAccountLocal;
    
    // Get worker names from the workers prop
    const workerNamesText = workers.length > 0 ? workers.map(w => w.name).join(', ') : 'Nenhum profissional disponível';
    
    const individualModifier = isIndividual ? `
    ## Configuração de Conta Individual
    - Nesta configuração, há apenas um profissional disponível
    - NUNCA pergunte ao cliente qual profissional ele deseja
    - AUTOMATICAMENTE agende com o único profissional disponível: ${workerNamesText}
    - Pule a etapa de escolha de profissional no fluxo de agendamento` : '';
    
    return ` `;
  };
  // Function to generate available dates (next 14 days, simple list only)
  const generateDateOptions = () => {
    console.log("Generating date options with config:", config?.business);
    const dates = [];
    const today = new Date();
    const specificHolidays = config?.business?.specificHolidays || [];
    
    // Try to get up to 10 available days
    let daysToCheck = 30; // Increase the search range to find enough available days
    let availableDaysFound = 0;
    
    for (let i = 0; i < daysToCheck && availableDaysFound < 10; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      // Get date components in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      // Get day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = date.getDay();
      
      // Check if business is open on this day
      let isOpen = false;
      
      // Check if it's a specific holiday
      const dateKey = `${day}/${month}`;
      const isHoliday = specificHolidays.includes(dateKey);
      
      if (isHoliday) {
        // Check if business operates on holidays
        isOpen = config?.business?.holidayHours && config.business.holidayHours.includes('-');
      } else if (dayOfWeek === 0) { // Sunday
        // Check if business is open on Sundays
        isOpen = config?.business?.sundayHours && config.business.sundayHours.includes('-');
      } else if (dayOfWeek === 6) { // Saturday
        // Check if business is open on Saturdays (default to open)
        isOpen = config?.business?.saturdayHours ? config.business.saturdayHours.includes('-') : true;
      } else { // Weekday (Monday-Friday)
        // Always open on weekdays by default
        isOpen = config?.business?.weekdayHours ? config.business.weekdayHours.includes('-') : true;
      }
      
      // Only include day if business is open
      if (isOpen) {
        availableDaysFound++;
        
        // Format date as YYYY-MM-DD without using toISOString() to avoid timezone issues
        const formattedDate = `${year}-${month}-${day}`;
        
        const displayDate = date.toLocaleDateString('pt-BR', { 
          weekday: 'short', 
          day: '2-digit', 
          month: '2-digit' 
        });
        
        // Also include Brazilian format for matching
        const brFormat = `${day}/${month}/${year}`;
        
        dates.push({
          value: formattedDate,
          display: displayDate,
          brFormat: brFormat, // Add Brazilian date format for matching 
          jsDate: new Date(date), // Store a copy of the JS Date object for reliable formatting
          dayOfWeek: dayOfWeek // Store day of week for debugging
        });
        
        console.log(`Added available date: ${displayDate} (${dayOfWeek === 0 ? 'Sunday' : dayOfWeek === 6 ? 'Saturday' : 'Weekday'})`);
      } else {
        console.log(`Skipped closed date: ${day}/${month} (${dayOfWeek === 0 ? 'Sunday' : dayOfWeek === 6 ? 'Saturday' : 'Holiday'})`);
      }
    }
    
    console.log(`Total dates generated: ${dates.length}`);
    
    // Set the dates in state and make sure options are shown
    setAvailableDates(dates);
    setShowDateOptions(true);
    
    // ALWAYS EXPLICITLY show date options message
    // This is critical to ensure the date list is always visible
    if (dates.length > 0 && ctx.step === 4) {
      const dateOptionsMsg = formatDateOptionsMessage();
      
      setTimeout(() => {
        setMessages(prev => {
          // Make sure we're not adding a duplicate date options list
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant' && 
              lastMsg.content.includes('Escolha uma data digitando o número correspondente')) {
            // Update the last message instead of adding a new one
            return [...prev.slice(0, -1), { role: 'assistant', content: dateOptionsMsg }];
          }
          return [...prev, { role: 'assistant', content: dateOptionsMsg }];
        });
      }, 100);
    }
    
    return dates; // Return the dates for immediate use
  };

  // Generate time options for a specific date and worker
  const generateTimeOptions = async (workerId, date) => {
    // IMPORTANT: Set an empty array right away to clear any previous times
    // This prevents showing unfiltered times while filtering is in progress
    setAvailableTimes([]);
    
    // Get the day of the week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(date).getDay();
    
    // Determine business hours based on day of week
    let businessHours;
    
    if (dayOfWeek === 0) { // Sunday
      // If no valid Sunday hours format, use empty string (closed)
      businessHours = (config?.business?.sundayHours && config.business.sundayHours.includes('-')) 
        ? config.business.sundayHours 
        : '';
      console.log("Sunday hours:", businessHours);
    } else if (dayOfWeek === 6) { // Saturday
      // If no valid Saturday hours format, use default
      businessHours = (config?.business?.saturdayHours && config.business.saturdayHours.includes('-')) 
        ? config.business.saturdayHours 
        : '08:00-14:00';
      console.log("Saturday hours:", businessHours);
    } else { // Weekdays (Monday-Friday)
      // If no valid weekday hours format, use default
      businessHours = (config?.business?.weekdayHours && config.business.weekdayHours.includes('-')) 
        ? config.business.weekdayHours 
        : '07:00-19:00';
      console.log("Weekday hours:", businessHours);
    }
    
    // Check if it's a specific holiday
    const jsDate = new Date(date);
    const day = jsDate.getDate().toString().padStart(2, '0');
    const month = (jsDate.getMonth() + 1).toString().padStart(2, '0');
    const dateKey = `${day}/${month}`;
    
    const specificHolidays = config?.business?.specificHolidays || ['25/12', '01/01'];
    if (specificHolidays.includes(dateKey)) {
      businessHours = config?.business?.holidayHours || '';
      console.log("Holiday hours:", businessHours, "for", dateKey);
    }
    
    // If no business hours defined, the business is closed
    if (!businessHours) {
      console.log("No business hours defined for", date);
      setAvailableTimes([]);
      return [];
    }
    
    // Parse business hours (format: "07:00-19:00")
    const [openTime, closeTime] = businessHours.split('-');
    if (!openTime || !closeTime) {
      console.log("Invalid business hours format:", businessHours);
      setAvailableTimes([]);
      return [];
    }
    
    const [startHour, startMinute] = openTime.split(':').map(Number);
    const [endHour, endMinute] = closeTime.split(':').map(Number);
    // Force 10-minute intervals to reduce the number of options
    // This is only for generating time slots - actual conflict detection will use service duration
    const interval = 10;
    
    // Check if timeSlotCache already has times for this day/worker combo
    const cacheKey = `${workerId}-${date}`;
    const cachedTimes = timeSlotCache.current[cacheKey];
    
    // Start with previously cached times if available (they already have correct formatting)
    const baseTimeslots = cachedTimes || [];
    
    // Get existing appointments for this worker and date
    try {
      // Import needed on top of file
      const { fetchAppointments } = await import('../../services/api');
      const appointments = await fetchAppointments(date);
      
      // Filter to get only this worker's appointments
      const workerAppointments = appointments.filter(
        appt => appt.worker_id.toString() === workerId.toString()
      );
      
      console.log(`Found ${workerAppointments.length} appointments for worker ${workerId} on ${date}`);
      
      // If we already had cached times, filter them based on appointments
      if (baseTimeslots.length > 0) {
        console.log(`Filtering ${baseTimeslots.length} time slots for conflicts with ${workerAppointments.length} appointments`);
        
        // Filter out any cached times that conflict with appointments
        const filteredTimes = baseTimeslots.filter(timeSlot => {
          // Parse the time slot
          const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
          const timeSlotMinutes = slotHour * 60 + slotMinute;
          
          // Get duration for appointment we're trying to book based on selected service
          // Look for the selected service in the booking state or service config
          let serviceDuration = 30; // Default to 30 minutes
          
          // If booking a specific service, look up its duration
          if (bookingState?.selectedService) {
            const services = config?.services?.items || [];
            const selectedService = services.find(s => s.name === bookingState.selectedService);
            if (selectedService?.duration) {
              serviceDuration = selectedService.duration;
              console.log(`Using duration ${serviceDuration} minutes for service: ${bookingState.selectedService}`);
            } else {
              console.log(`No duration found for ${bookingState.selectedService}, using default: ${serviceDuration} minutes`);
            }
          }
          
          // Calculate when this appointment would end if booked
          const timeSlotEndMinutes = timeSlotMinutes + serviceDuration;
          
          // Check if this time slot conflicts with any existing appointment
          return !workerAppointments.some(appt => {
            // Parse the appointment start time
            const [apptHour, apptMinute] = appt.start_time.split(':').map(Number);
            
            // Duration of the existing appointment (default to 30 minutes if not specified)
            const appointmentDuration = appt.duration || 30;
            
            // Calculate start and end times in minutes since midnight
            const apptStartMinutes = apptHour * 60 + apptMinute;
            const apptEndMinutes = apptStartMinutes + appointmentDuration;
            
            // Check if there's an overlap between the two time ranges
            const hasOverlap = (
              // Check if the time slot starts during an existing appointment
              (timeSlotMinutes >= apptStartMinutes && timeSlotMinutes < apptEndMinutes) ||
              // Check if the time slot ends during an existing appointment
              (timeSlotEndMinutes > apptStartMinutes && timeSlotEndMinutes <= apptEndMinutes) ||
              // Check if the time slot completely contains an existing appointment
              (timeSlotMinutes <= apptStartMinutes && timeSlotEndMinutes >= apptEndMinutes) ||
              // Check if the existing appointment completely contains the time slot
              (apptStartMinutes <= timeSlotMinutes && apptEndMinutes >= timeSlotEndMinutes)
            );
            
            if (hasOverlap) {
              // Format minutes for better readability
              const endHour = Math.floor(timeSlotEndMinutes / 60);
              const endMin = timeSlotEndMinutes % 60;
              const formattedEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
              
              // Format appointment end time too
              const apptEndHour = Math.floor(apptEndMinutes / 60);
              const apptEndMin = apptEndMinutes % 60;
              const formattedApptEndTime = `${String(apptEndHour).padStart(2, '0')}:${String(apptEndMin).padStart(2, '0')}`;
              
              console.log(`Time conflict: ${timeSlot} (${serviceDuration}min service) conflicts with appointment at ${appt.start_time}-${formattedApptEndTime} (${appointmentDuration}min). Our service would end at ${formattedEndTime}`);
            }
            
            return hasOverlap;
          });
        });
        
        console.log(`Filtered from ${baseTimeslots.length} to ${filteredTimes.length} available times`);
        // Update the state with filtered times
        setAvailableTimes(filteredTimes);
        
        // Return the filtered times so we can use them immediately
        return filteredTimes;
      }
      // No cached times yet, generate them from scratch
      else {
        // Track all potential time slots
        const allPossibleTimes = [];
        // Track only available (non-conflicting) time slots
        const availableTimes = [];
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        // Generate all possible time slots based on business hours
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const formattedHour = currentHour.toString().padStart(2, '0');
          const formattedMinute = currentMinute.toString().padStart(2, '0');
          const timeSlot = `${formattedHour}:${formattedMinute}`;
          
          // Add to all possible times
          allPossibleTimes.push(timeSlot);
          
          // Check if this time slot conflicts with any existing appointment
          const isAvailable = !workerAppointments.some(appt => {
            // Parse the appointment start time
            const [apptHour, apptMinute] = appt.start_time.split(':').map(Number);
            
            // Duration of the existing appointment (default to 30 minutes if not specified)
            const appointmentDuration = appt.duration || 30;
            
            // Calculate start and end times in minutes since midnight
            const apptStartMinutes = apptHour * 60 + apptMinute;
            const apptEndMinutes = apptStartMinutes + appointmentDuration;
            
            // Current time slot in minutes since midnight
            const timeSlotMinutes = currentHour * 60 + currentMinute;
            
            // Get duration for appointment we're trying to book based on selected service
            // Look for the selected service in the booking state or service config
            let serviceDuration = 30; // Default to 30 minutes
            
            // If booking a specific service, look up its duration
            if (bookingState?.selectedService) {
              const services = config?.services?.items || [];
              const selectedService = services.find(s => s.name === bookingState.selectedService);
              if (selectedService?.duration) {
                serviceDuration = selectedService.duration;
                // More detailed logging for only the first few time slots to avoid too many logs
                if (currentHour === startHour && currentMinute <= startMinute + interval) {
                  console.log(`Using duration ${serviceDuration} minutes for service: ${bookingState.selectedService}`);
                }
              }
            }
            
            // Calculate when this appointment would end if booked
            const timeSlotEndMinutes = timeSlotMinutes + serviceDuration;
            
            // Check if there's an overlap between the two time ranges
            // Two ranges overlap if one range starts before the other ends and ends after the other starts
            const hasOverlap = (
              // Check if the new time slot starts during an existing appointment
              (timeSlotMinutes >= apptStartMinutes && timeSlotMinutes < apptEndMinutes) ||
              // Check if the new time slot ends during an existing appointment
              (timeSlotEndMinutes > apptStartMinutes && timeSlotEndMinutes <= apptEndMinutes) ||
              // Check if the new time slot completely contains an existing appointment
              (timeSlotMinutes <= apptStartMinutes && timeSlotEndMinutes >= apptEndMinutes) ||
              // Check if the existing appointment completely contains the new time slot
              (apptStartMinutes <= timeSlotMinutes && apptEndMinutes >= timeSlotEndMinutes)
            );
            
            // For debugging only
            if (hasOverlap) {
              // Format minutes for better readability
              const endHour = Math.floor(timeSlotEndMinutes / 60);
              const endMin = timeSlotEndMinutes % 60;
              const formattedEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
              
              // Format appointment end time too
              const apptEndHour = Math.floor(apptEndMinutes / 60);
              const apptEndMin = apptEndMinutes % 60;
              const formattedApptEndTime = `${String(apptEndHour).padStart(2, '0')}:${String(apptEndMin).padStart(2, '0')}`;
              
              console.log(`Time conflict: ${formattedHour}:${formattedMinute} (${serviceDuration}min service) conflicts with appointment at ${apptHour}:${apptMinute}-${formattedApptEndTime} (${appointmentDuration}min). Our service would end at ${formattedEndTime}`);
            }
            
            return hasOverlap;
          });
          
          // Add available time slot to filtered list only if it doesn't conflict
          if (isAvailable) {
            availableTimes.push(timeSlot);
          }
          
          // Move to next time slot
          currentMinute += interval;
          if (currentMinute >= 60) {
            currentHour += 1;
            currentMinute -= 60;
          }
        }
        
        console.log(`Total time slots: ${allPossibleTimes.length}, Available after filtering: ${availableTimes.length}`);
        // This is the key fix - only set the FILTERED times as available times
        setAvailableTimes(availableTimes);
        
        // Update cache with filtered times only
        const cacheKey = `${workerId}-${date}`;
        timeSlotCache.current[cacheKey] = availableTimes;
        
        // Return the filtered times so we can use them immediately
        return availableTimes;
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      
      // Error handling: If we already have cached times, use them but log a warning
      if (baseTimeslots.length > 0) {
        console.log("⚠️ Error occurred, using cached times without filtering:", baseTimeslots.length, "slots");
        // In case of error, still use cached times but warn
        setAvailableTimes(baseTimeslots);
      } 
      // Fallback to simple time generation without filtering
      else {
        console.log("⚠️ Error occurred, generating fallback times without conflict detection");
        // In fallback mode, we won't be able to filter conflicts
        // This should be rare - only happens if appointments can't be fetched
        
        const fallbackTimes = [];
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const formattedHour = currentHour.toString().padStart(2, '0');
          const formattedMinute = currentMinute.toString().padStart(2, '0');
          fallbackTimes.push(`${formattedHour}:${formattedMinute}`);
          
          currentMinute += interval;
          if (currentMinute >= 60) {
            currentHour += 1;
            currentMinute -= 60;
          }
        }
        
        console.log(`Generated ${fallbackTimes.length} fallback times (without conflict detection)`);
        // Mark that these are fallback times without conflict detection
        setAvailableTimes(fallbackTimes);
        
        // Don't cache these since they're not filtered
        // IMPORTANT: No caching here!
        
        // Return the fallback times
        return fallbackTimes;
      }
    }
  };
  
  // Process the guided booking flow
  const processGuidedBookingStep = (message) => {
    // Extract name if we're at the name step
    if (ctx.step === 1 && message.role === 'user') {
      setBookingState(prev => ({
        ...prev,
        clientName: message.content,
        step: 2
      }));
      
      // Check if services are available
      const hasServices = config?.services?.items && config.services.items.length > 0;
      
      if (!hasServices) {
        // Skip service selection if no services are configured
        setBookingState(prev => ({
          ...prev,
          selectedService: 'Consulta',
          customDuration: 30,
          step: 3
        }));
        
        // For individual accounts, auto-assign the solo worker and jump to date
        if (!isEnterpriseAccount) {
          const solo = workers[0] || {
            worker_id: sessionStorage.getItem('workerId'),
            name: sessionStorage.getItem('workerName')
          };
          setBookingState(prev => ({
            ...prev,
            selectedWorker: solo,
            step: 4
          }));
          // Generate dates directly and ensure they're displayed
          const dates = generateDateOptions();
          setShowDateOptions(true);
          
          // Generate greeting and date options as a single message
          const greeting = `Olá ${message.content}! Para qual data você gostaria de agendar um horário com ${solo.name}?`;
          
          // Format options directly from dates array to ensure they appear
          const header = 'Escolha uma data digitando o número correspondente:';
          const options = dates.map((date, index) => 
            `${index + 1}. ${date.display}`
          ).join('\n');
          
          return `${greeting}\n\n${header}\n\n${options}`;
        }
        
        // For enterprise accounts, show worker selection
        // Generate greeting and worker options as a single message
        const greeting = `Olá ${message.content}! Com qual profissional você gostaria de agendar um horário?`;
        const workerListMsg = formatWorkerOptionsMessage();
        return greeting + "\n\n" + workerListMsg;
      }
      
      // Generate greeting and service options as a single message
      const greeting = "Olá " + message.content + "! Qual serviço você gostaria de agendar?";
      const serviceListMsg = formatServiceOptionsMessage();
      return greeting + "\n\n" + serviceListMsg;
    }
    
    // For other steps, handle based on the current content
    if (message.role === 'assistant') {
      switch(ctx.step) {
        case 0: // After greeting, next ask for name
          return "Olá! Sou a " + (config?.assistant?.name || "Amanda") + ", assistente virtual da " + (config?.business?.name || "Barbearia Elite") + ". Para começar, poderia me informar seu nome, por favor?";
        
        case 2: // After collecting name, ask for service
          setShowServiceOptions(true);
          return "Qual serviço você gostaria de agendar?";
          
          case 3: {
            // --- INDIVIDUAL ACCOUNTS: auto-pick the only worker and jump to date ---
            if (!isEnterpriseAccount) {
              const solo = workers[0] || {
                worker_id: sessionStorage.getItem('workerId'),
                name:      sessionStorage.getItem('workerName')
              };
              setBookingState(prev => ({
                ...prev,
                selectedWorker: solo,
                step: 4
              }));
              
              // Generate date options and get the results immediately
              // This function both sets state AND returns the dates for immediate use
              const dates = generateDateOptions();
              
              // Create the message with dates included - use our directly calculated dates
              const question = `Para qual data você gostaria de agendar seu ${bookingState.selectedService} com ${solo.name}?`;
              
              // Format options directly from our dates array
              const header = 'Escolha uma data digitando o número correspondente:';
              const options = dates.map((date, index) => 
                `${index + 1}. ${date.display}`
              ).join('\n');
              
              const dateOptionsText = options ? `${header}\n\n${options}` : 'Desculpe, não encontramos datas disponíveis.';
              
              // Include date options directly in the response
              const fullMessage = `${question}\n\n${dateOptionsText}`;
              
              return fullMessage;
            }
          
            // --- ENTERPRISE ACCOUNTS: ask to choose a worker ---
            // Include worker options in the response
            const question = `Qual profissional você prefere para o serviço de ${bookingState.selectedService}?`;
            const workerOptions = formatWorkerOptionsMessage();
            return question + "\n\n" + workerOptions;
          }                 
        case 4: { // After collecting worker, ask for date
          // Generate dates directly and ensure they're displayed
          const dates = generateDateOptions();
          setShowDateOptions(true);
          
          const question = "Para qual data você gostaria de agendar com " + bookingState.selectedWorker.name + "?";
          
          // Format options directly from dates array to ensure they appear
          const header = 'Escolha uma data digitando o número correspondente:';
          const options = dates.map((date, index) => 
            `${index + 1}. ${date.display}`
          ).join('\n');
          
          return `${question}\n\n${header}\n\n${options}`;
        }
          
        case 5: { // After collecting date, ask for time
          // Show loading message first, then we'll update it after we get the times
          const displayDate = new Date(bookingState.selectedDate).toLocaleDateString('pt-BR');
          // We'll initiate time fetching but return immediately - the UI will update after fetch
          setTimeout(async () => {
            await generateTimeOptions(bookingState.selectedWorker.worker_id, bookingState.selectedDate);
            
            // Find the loading message and replace it with time options
            const timeOptions = formatTimeOptionsMessage();
            const question = "Qual horário você prefere no dia " + displayDate + "?";
            
            setMessages(prev => {
              // Find the last assistant message and update it
              const updatedMessages = [...prev];
              for (let i = updatedMessages.length - 1; i >= 0; i--) {
                if (updatedMessages[i].role === 'assistant') {
                  updatedMessages[i] = {
                    role: 'assistant',
                    content: question + "\n\n" + timeOptions
                  };
                  break;
                }
              }
              return updatedMessages;
            });
          }, 100);
          
          return `Buscando horários disponíveis para o dia ${displayDate}...`;
        }
          
        case 6: { // After collecting all info, confirm
          // Create confirmation message with or without service details
          const servicePhrase = bookingState.selectedService === 'Consulta' 
            ? `agendar uma consulta de ${bookingState.customDuration} minutos` 
            : `agendar ${bookingState.selectedService}`;
          
          const confirmQuestion = `Para confirmar, você deseja ${servicePhrase} com ${bookingState.selectedWorker.name} no dia ${new Date(bookingState.selectedDate).toLocaleDateString('pt-BR')} às ${bookingState.selectedTime}. Está correto?`;
          return confirmQuestion + "\n\n1. Sim\n2. Não";
        }
          
        default:
          return message.content;
      }
    }
    
    return null;
  };
  
  // Handle free-form chat with content analysis
  const checkMessageContent = (content) => {
    // If in guided mode, don't use this function
    if (isGuidedMode()) {
      console.log("Skipping content check in guided mode");
      return;
    }
    
    const lowerContent = content.toLowerCase();
    console.log("Analyzing chat content for free mode - no UI options will be shown");
    
    // In free mode, we don't want to show any buttons,
    // but we can still update the internal state for context tracking
    
    // Track service mentions
    if (lowerContent.includes('serviço') || 
        lowerContent.includes('corte') || 
        lowerContent.includes('barba') ||
        lowerContent.includes('sobrancelha')) {
      // Just update internal tracking but don't show buttons
      console.log("Detected service mention in free mode");
    }
    
    // Track worker mentions - look for names in the workers array
    workers.forEach(worker => {
      if (lowerContent.includes(worker.name.toLowerCase())) {
        console.log(`Detected mention of worker ${worker.name} in free mode`);
        // Update booking state for context, but don't show UI elements
        setBookingState(prev => ({
          ...prev,
          selectedWorker: worker
        }));
      }
    });

    // Track date mentions
    const dateRegex = /(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/g;
    const dateMatches = lowerContent.match(dateRegex);
    if (dateMatches) {
      console.log("Detected date mention in free mode:", dateMatches[0]);
    }
    
    // No UI elements are shown in free mode, regardless of content
  };

  // Handle service selection - now by text input
  const handleServiceSelect = (service) => {
    if (isGuidedMode()) {
      // In guided mode, update state and advance
      // Using a functional update to ensure we're working with the latest state
      setBookingState(prev => {
        const newState = {
          ...prev,
          selectedService: service,
          step: 3
        };
        
        // If service is selected as 'Consulta', set the duration to 30 minutes
        if (service === 'Consulta') {
          newState.customDuration = 30;
        }
        
        return newState;
      });
      
      // Add this selection to chat messages
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: service }
      ]);
      
      // For individual accounts, skip worker selection
      // INDIVIDUAL: auto-assign the solo worker and jump to date
      if (!isEnterpriseAccount) {
        const solo = workers[0] || {
          worker_id: sessionStorage.getItem('workerId'),
          name:      sessionStorage.getItem('workerName')
        };
        setBookingState(prev => ({
          ...prev,
          selectedWorker: solo,
          step: 4
        }));

        // Generate date options
        generateDateOptions();
        
        // Create initial message without options
        const question = `Para qual data você gostaria de agendar seu ${service} com ${solo.name}?`;
        const assistantResponse = {
          role: 'assistant',
          content: question
        };
        
        // Add the message now, will update with date options after state update
        setMessages(prev => [...prev, assistantResponse]);
        
        // Update the message with date options after a short delay
        setTimeout(() => {
          const dateOptions = formatDateOptionsMessage();
          
          // Find the last assistant message and update it
          setMessages(prev => {
            const updatedMessages = [...prev];
            for (let i = updatedMessages.length - 1; i >= 0; i--) {
              if (updatedMessages[i].role === 'assistant') {
                updatedMessages[i].content = question + "\n\n" + dateOptions;
                break;
              }
            }
            return updatedMessages;
          });
        }, 100);
      } else {
        // ENTERPRISE: ask the user to choose which worker
        const question = `Qual profissional você prefere para o serviço de ${service}?`;
        const assistantResponse = {
          role: 'assistant',
          content: question
        };
        
        // Add the message now, will update with worker options after a moment
        setMessages(prev => [...prev, assistantResponse]);
        
        // Update the message with worker options after a short delay
        setTimeout(() => {
          const workerOptions = formatWorkerOptionsMessage();
          
          // Find the last assistant message and update it
          setMessages(prev => {
            const updatedMessages = [...prev];
            for (let i = updatedMessages.length - 1; i >= 0; i--) {
              if (updatedMessages[i].role === 'assistant') {
                updatedMessages[i].content = question + "\n\n" + workerOptions;
                break;
              }
            }
            return updatedMessages;
          });
        }, 100);
      }
    } else {
      // In free mode, just send as a message
      setInput(service);
      sendMessage(service);
    }
  };
  
  // Handle worker selection
  const handleWorkerSelect = (worker) => {
    console.log("Selected worker:", worker);
    
    if (isGuidedMode()) {
      // In guided mode, update state and advance
      setBookingState(prev => {
        const newState = {
          ...prev,
          selectedWorker: worker,
          step: 4
        };
        console.log("Updated booking state with worker:", newState);
        return newState;
      });
      
      // Add this selection to chat messages
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: worker.name }
      ]);
      
      // Generate date options
      generateDateOptions();
      
      // Send question as a separate message
      const question = "Para qual data você gostaria de agendar com " + worker.name + "?";
      
      // Add the question message
      setMessages(prev => [...prev, { role: 'assistant', content: question }]);
      
      // Add date options as a SEPARATE message to ensure they're always visible
      setTimeout(() => {
        // Get the date options with the formatted list of dates
        const dateOptionsMessage = formatDateOptionsMessage();
        
        // Add it as a new message (don't replace existing message)
        setMessages(prev => [...prev, { role: 'assistant', content: dateOptionsMessage }]);
      }, 100);
    } else {
      // In free mode, just send as a message
      setInput(worker.name);
      sendMessage(worker.name);
    }
  };
  
  // Cache for time slots to avoid inconsistent results
  const timeSlotCache = useRef({});

  // Handle date selection
  const handleDateSelect = async (date) => {
    if (isGuidedMode()) {
      console.log("Date selected:", date.display, date.value);
      
      // In guided mode, update state and advance
      setBookingState(prev => ({
        ...prev,
        selectedDate: date.value,
        step: 5
      }));
      
      // Add this selection to chat messages
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: date.display }
      ]);
      
      // Show loading message
      const loadingResponse = { 
        role: 'assistant', 
        content: `Buscando horários disponíveis para o dia ${date.display}...` 
      };
      setMessages(prev => [...prev, loadingResponse]);
      
      try {
        // Show loading message
        setMessages(prev => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = { 
            role: 'assistant', 
            content: `Buscando horários disponíveis para o dia ${date.display}...`
          };
          return updatedMessages;
        });
        
        // Generate time options and get the filtered results directly
        // This will do all the time slot generation and filtering in one step
        const timeSlots = await generateTimeOptions(bookingState.selectedWorker.worker_id, date.value) || [];
        
        // Create message with time options included
        const question = "Qual horário você prefere no dia " + date.display + "?";
        
        // Use the timeSlots we get directly from generateTimeOptions, not from state
        if (timeSlots && timeSlots.length > 0) {
          console.log("Showing", timeSlots.length, "FILTERED time slots for", date.display);
          
          // Format time options message with available times - use the filtered time slots
          const header = 'Escolha um horário digitando diretamente no formato HH:MM:';
          
          // Simplified approach - just show numbered list of available times
          const timesToShow = timeSlots.map((timeStr, index) => {
            return `${index + 1}. ${timeStr}`;
          });
          
          const options = timesToShow.join('\n');
          const note = 'IMPORTANTE: Digite o horário no formato HH:MM (exemplo: 14:30)\n\nAlguns horários foram escondidos por conflito com outros agendamentos.';
          
          // Replace loading message with time options immediately, no need to wait
          setMessages(prev => {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = { 
              role: 'assistant', 
              content: question + "\n\n" + header + "\n\n" + options + "\n\n" + note
            };
            return updatedMessages;
          });
        } else {
          console.log("No time slots available for", date.display);
          // Force default times if none are available - just for weekdays
          const dayOfWeek = new Date(date.value).getDay();
          
          if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
            // Generate default business hours times using the standard business hours
            const defaultTimes = [];
            const businessHours = '07:00-19:00'; // Standard weekday hours
            const [openTime, closeTime] = businessHours.split('-');
            const [startHour, startMinute] = openTime.split(':').map(Number);
            const [endHour, endMinute] = closeTime.split(':').map(Number);
            // Force 10-minute intervals to reduce the number of options
    // This is only for generating time slots - actual conflict detection will use service duration
    const interval = 10;
            
            let currentHour = startHour;
            let currentMinute = startMinute;
            
            while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
              const formattedHour = currentHour.toString().padStart(2, '0');
              const formattedMinute = currentMinute.toString().padStart(2, '0');
              defaultTimes.push(`${formattedHour}:${formattedMinute}`);
              
              // Move to next time slot
              currentMinute += interval;
              if (currentMinute >= 60) {
                currentHour += 1;
                currentMinute -= 60;
              }
            }
            
            // Set these as available times
            setAvailableTimes(defaultTimes);
            
            // Create a cache key for this worker/date combo
            const cacheKey = `${bookingState.selectedWorker.worker_id}-${date.value}`;
            timeSlotCache.current[cacheKey] = defaultTimes;
            
            // Show them to the user
            // Format the default time options
            const header = 'Escolha um horário digitando o número correspondente:';
            const options = defaultTimes.map((time, index) => 
              `${index + 1}. ${time}`
            ).join('\n');
            
            // Replace loading message with time options
            setMessages(prev => {
              const updatedMessages = [...prev];
              updatedMessages[updatedMessages.length - 1] = { 
                role: 'assistant', 
                content: question + "\n\n" + header + "\n\n" + options
              };
              return updatedMessages;
            });
          } else {
            // Not a weekday, so no times available
            // No time options available, show the question and go back to date selection
            setMessages(prev => {
              const updatedMessages = [...prev];
              updatedMessages[updatedMessages.length - 1] = { 
                role: 'assistant', 
                content: question + "\n\nDesculpe, não há horários disponíveis para este dia. Por favor, selecione outra data."
              };
              return updatedMessages;
            });
            
            // Go back to date selection
            setBookingState(prev => ({
              ...prev,
              step: 4
            }));
            
            // Show date options again
            setTimeout(() => {
              generateDateOptions();
              const dateOptionsMessage = {
                role: 'assistant',
                content: formatDateOptionsMessage()
              };
              setMessages(prev => [...prev, dateOptionsMessage]);
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error generating time options:", error);
        
        // Show error message and allow user to try again
        setMessages(prev => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = { 
            role: 'assistant', 
            content: `Desculpe, houve um erro ao buscar horários. Por favor, selecione uma data novamente.`
          };
          return updatedMessages;
        });
      }
    } else {
      // In free mode, just send as a message
      setInput(date.display);
      sendMessage(date.display);
    }
  };
  
  // Handle time selection
  const handleTimeSelect = (time) => {
    if (isGuidedMode()) {
      // In guided mode, update state and advance
      setBookingState(prev => ({
        ...prev,
        selectedTime: time,
        step: 6
      }));
      
      // Add this selection to chat messages
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: time }
      ]);
      
      // Format date for display in dd/mm/yyyy format
      const [y, m, d] = bookingState.selectedDate.split('-').map(Number);
      const selectedDate = new Date(y, m - 1, d);    // use this to fix the CGR UTC-4 bug
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      // Create confirmation message with or without service details
      const servicePhrase = bookingState.selectedService === 'Consulta' 
        ? `agendar uma consulta de ${bookingState.customDuration} minutos` 
        : `agendar ${bookingState.selectedService}`;
        
      // Add assistant response for confirmation with yes/no options
      const confirmQuestion = `Para confirmar, você deseja ${servicePhrase} com ${bookingState.selectedWorker.name} no dia ${formattedDate} às ${time}. Está correto?`;
      const confirmOptions = "1. Sim\n2. Não";
      const assistantResponse = { 
        role: 'assistant', 
        content: confirmQuestion + "\n\n" + confirmOptions
      };
      
      setMessages(prev => [...prev, assistantResponse]);
    } else {
      // In free mode, just send as a message
      setInput(time);
      sendMessage(time);
    }
  };


  // Helper function to download ICS file
  const downloadIcsFile = (appointmentId) => {
    if (window.icsUrls && window.icsUrls[appointmentId]) {
      // Create a temporary link element
      const downloadLink = document.createElement('a');
      downloadLink.href = window.icsUrls[appointmentId];
      downloadLink.download = `appointment_${appointmentId}.ics`;
      
      // Append to body, click, and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Send confirmation message
      const confirmMessage = {
        role: 'assistant',
        content: '📅 Arquivo do calendário enviado! O download deve começar automaticamente. Salve o arquivo e importe-o para o Google Calendar, Outlook ou Apple Calendar.'
      };
      setMessages(prev => [...prev, confirmMessage]);
      
      // Revoke the URL to free memory
      setTimeout(() => {
        URL.revokeObjectURL(window.icsUrls[appointmentId]);
        delete window.icsUrls[appointmentId];
      }, 5000);
    } else {
      // Handle case where ICS file is not available
      const errorMessage = {
        role: 'assistant',
        content: '❌ Desculpe, não foi possível gerar o arquivo do calendário. Por favor, tente novamente ou adicione o agendamento manualmente ao seu calendário.'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;
    
    const userMessage = { role: 'user', content: textToSend };

    if (isGuidedMode()) {
      // First, ensure that all available dates are generated immediately
      if (ctx.step === 4 && !availableDates.length) {
        console.log("Generating dates immediately since we're at date selection step");
        generateDateOptions();
      }
      
      // Check for number selections in different steps
      const numMatch = textToSend.trim().match(/^[0-9]+$/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        
        // Handle service selection by number
        if (ctx.step === 2 && commonServices.length >= num && num > 0) {
          const selectedService = commonServices[num - 1];
          setInput('');
          handleServiceSelect(selectedService);
          return;
        }
        
        // Handle worker selection by number
        else if (ctx.step === 3 && workers.length >= num && num > 0) {
          const selectedWorker = workers[num - 1];
          setInput('');
          handleWorkerSelect(selectedWorker);
          return;
        }
        
        // Handle date selection by number
        else if (ctx.step === 4 && availableDates.length >= num && num > 0) {
          const selectedDate = availableDates[num - 1];
          setInput('');
          handleDateSelect(selectedDate);
          return;
        }
      }
      
      // Special handling for date input when in date selection step
      if (ctx.step === 4) {
        // Try to parse date inputs in various formats
        const enteredText = textToSend.trim().toLowerCase();
        
        // Handle questions like "when?" or "which date?" or any generic text that isn't a date
        if (enteredText === 'quando' || enteredText === 'when' || enteredText === 'when?' || 
            enteredText === 'quando?' || enteredText === 'qual data?' || enteredText === 'which date?' ||
            enteredText === 'que dia?' || enteredText === 'what day?') {
          // Show the date options again
          const dateOptionsMessage = {
            role: 'assistant',
            content: formatDateOptionsMessage()
          };
          setMessages(prev => [...prev, { role: 'user', content: textToSend }, dateOptionsMessage]);
          setInput('');
          return;
        }
        
        // Handle numeric input that doesn't match available dates
        const numMatch = enteredText.match(/^[0-9]+$/);
        if (numMatch) {
          const num = parseInt(numMatch[0], 10);
          // If number is out of range of available dates or availableDates isn't populated yet
          if (!availableDates || availableDates.length === 0 || num <= 0 || num > availableDates.length) {
            // Calculate dates directly similar to how we did in the handleServiceSelect function
            const dates = [];
            const today = new Date();
            const specificHolidays = config?.business?.specificHolidays || ['25/12', '01/01'];
            
            for (let i = 0; i < 14; i++) {
              const date = new Date();
              date.setDate(today.getDate() + i);
              
              // Get day of week (0 = Sunday, 6 = Saturday)
              const dayOfWeek = date.getDay();
              
              // Check if business has hours for this day
              let isOpen = false;
              
              // Check if it's a specific holiday
              const day = date.getDate().toString().padStart(2, '0');
              const month = (date.getMonth() + 1).toString().padStart(2, '0');
              const dateKey = `${day}/${month}`;
              const isHoliday = specificHolidays.includes(dateKey);
              
              if (isHoliday) {
                // Check for valid holiday hours format (HH:MM-HH:MM)
                isOpen = config?.business?.holidayHours && config.business.holidayHours.includes('-');
              } else if (dayOfWeek === 0) { // Sunday
                // Check for valid Sunday hours format (HH:MM-HH:MM)
                isOpen = config?.business?.sundayHours && config.business.sundayHours.includes('-');
              } else if (dayOfWeek === 6) { // Saturday
                // Check for valid Saturday hours format (HH:MM-HH:MM) - provide a default if not specified
                isOpen = config?.business?.saturdayHours ? config.business.saturdayHours.includes('-') : true;
              } else { // Weekday (Monday-Friday)
                // Check for valid weekday hours format (HH:MM-HH:MM) - always open on weekdays by default
                isOpen = true;
              }
              
              // Only include dates when business is open
              if (isOpen) {
                // Get date components in local timezone
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                
                // Format date as YYYY-MM-DD without using toISOString() to avoid timezone issues
                const formattedDate = `${year}-${month}-${day}`;
                
                const displayDate = date.toLocaleDateString('pt-BR', { 
                  weekday: 'short', 
                  day: '2-digit', 
                  month: '2-digit' 
                });
                
                // Also include Brazilian format for matching
                const brFormat = `${day}/${month}/${year}`;
                
                dates.push({
                  value: formattedDate,
                  display: displayDate,
                  brFormat: brFormat,
                  jsDate: new Date(date)
                });
              }
            }
            
            // Update availableDates in state for future reference
            setAvailableDates(dates);
            
            // Add user's message
            setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
            
            // Create message with formatted date options
            const workerName = bookingState.selectedWorker?.name || 'profissional';
            const serviceName = bookingState.selectedService || 'serviço';
            const question = `Para qual data você gostaria de agendar seu ${serviceName} com ${workerName}?`;
            
            // Format options directly from our dates array
            const header = 'Escolha uma data digitando o número correspondente:';
            const options = dates.map((date, index) => 
              `${index + 1}. ${date.display}`
            ).join('\n');
            
            const dateOptionsText = options ? `${header}\n\n${options}` : 'Desculpe, não encontramos datas disponíveis.';
            
            // Show message with date options
            const dateInfoMessage = {
              role: 'assistant',
              content: `${question}\n\n${dateOptionsText}`
            };
            
            setMessages(prev => [...prev, dateInfoMessage]);
            setInput('');
            return;
          }
        }
        
        // If we've reached this point and the input doesn't match any date patterns,
        // it's likely a generic text input - show available dates instead of showing an error
        let isValidDate = false;
        
        // Check for recognizable date formats
        if (enteredText.match(/^\d{1,2}\/\d{1,2}(\/\d{4})?$/) || // DD/MM/YYYY or DD/MM
            enteredText.match(/^\d{4}-\d{1,2}-\d{1,2}$/) ||      // YYYY-MM-DD
            enteredText === 'hoje' || enteredText === 'today' || 
            enteredText === 'amanhã' || enteredText === 'amanha' || enteredText === 'tomorrow' ||
            availableDates.some(d => d.display.toLowerCase().includes(enteredText) || 
                                     d.value.toLowerCase() === enteredText || 
                                     d.brFormat?.toLowerCase() === enteredText)) {
          isValidDate = true;
        }
        
        // If it's not a recognizable date format, show available dates
        if (!isValidDate) {
          // Add user's message
          setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
          
          // Calculate dates directly to ensure they're available
          const dates = [];
          const today = new Date();
          const specificHolidays = config?.business?.specificHolidays || ['25/12', '01/01'];
          
          for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            
            // Get day of week (0 = Sunday, 6 = Saturday)
            const dayOfWeek = date.getDay();
            
            // Check if business has hours for this day
            let isOpen = false;
            
            // Check if it's a specific holiday
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const dateKey = `${day}/${month}`;
            const isHoliday = specificHolidays.includes(dateKey);
            
            if (isHoliday) {
              // Check holiday hours
              isOpen = !!config?.business?.holidayHours;
            } else if (dayOfWeek === 0) { // Sunday
              isOpen = !!config?.business?.sundayHours;
            } else if (dayOfWeek === 6) { // Saturday
              isOpen = !!config?.business?.saturdayHours;
            } else { // Weekday
              isOpen = !!config?.business?.weekdayHours;
            }
            
            // Only include dates when business is open
            if (isOpen) {
              // Get date components in local timezone
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              
              // Format date as YYYY-MM-DD without using toISOString() to avoid timezone issues
              const formattedDate = `${year}-${month}-${day}`;
              
              const displayDate = date.toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                day: '2-digit', 
                month: '2-digit' 
              });
              
              // Also include Brazilian format for matching
              const brFormat = `${day}/${month}/${year}`;
              
              dates.push({
                value: formattedDate,
                display: displayDate,
                brFormat: brFormat,
                jsDate: new Date(date)
              });
            }
          }
          
          // Update availableDates in state for future reference
          setAvailableDates(dates);
          
          // Add available dates message immediately
          const workerName = bookingState.selectedWorker?.name || 'profissional';
          const serviceName = bookingState.selectedService || 'serviço';
          const question = `Para qual data você gostaria de agendar seu ${serviceName} com ${workerName}?`;
          
          // Format options directly from our dates array
          const header = 'Escolha uma data digitando o número correspondente:';
          const options = dates.map((date, index) => 
            `${index + 1}. ${date.display}`
          ).join('\n');
          
          const dateOptionsText = options ? `${header}\n\n${options}` : 'Desculpe, não encontramos datas disponíveis.';
          
          // Combine the question with date options
          const dateInfoMessage = {
            role: 'assistant',
            content: `${question}\n\n${dateOptionsText}`
          };
          
          setMessages(prev => [...prev, dateInfoMessage]);
          setInput('');
          return;
        }
        
        // First make sure we have dates available
        if (!availableDates || availableDates.length === 0) {
          console.log("Generating dates because none were available during date selection");
          generateDateOptions();
        }
        
        // Try to match date by day of week abbreviation (like "qua" or "qui")
        const dayAbbrevMatch = availableDates.find(d => 
          d.display.toLowerCase().startsWith(enteredText.toLowerCase()) || 
          d.display.toLowerCase().includes(enteredText.toLowerCase()) ||
          enteredText.toLowerCase().includes(d.display.toLowerCase().split(',')[0])
        );
        
        if (dayAbbrevMatch) {
          console.log("Found date by day abbreviation match:", dayAbbrevMatch.display);
          setInput('');
          handleDateSelect(dayAbbrevMatch);
          return;
        }
        
        // Try to match by text like "qua., 14/05"
        const fullTextMatch = availableDates.find(d => 
          d.display.toLowerCase() === enteredText.toLowerCase() ||
          d.display.toLowerCase().replace(/\s+/g, '') === enteredText.toLowerCase().replace(/\s+/g, '')
        );
        
        if (fullTextMatch) {
          console.log("Found date by full text match:", fullTextMatch.display);
          setInput('');
          handleDateSelect(fullTextMatch);
          return;
        }
        
        // Check for "tomorrow", "today", "next week", etc.
        if (enteredText === 'hoje' || enteredText === 'today') {
          const today = availableDates.find(d => {
            const date = new Date();
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return d.value === formattedDate;
          });
          if (today) {
            setInput('');
            handleDateSelect(today);
            return;
          }
        } else if (enteredText === 'amanhã' || enteredText === 'amanha' || enteredText === 'tomorrow') {
          const tomorrow = availableDates.find(d => {
            const date = new Date();
            date.setDate(date.getDate() + 1);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return d.value === formattedDate;
          });
          if (tomorrow) {
            setInput('');
            handleDateSelect(tomorrow);
            return;
          }
        } else {
          // Try common date formats (DD/MM/YYYY or DD-MM-YYYY)
          for (const dateOption of availableDates) {
            // Check against Brazilian format (DD/MM/YYYY)
            if (dateOption.brFormat === enteredText || 
                dateOption.display.includes(enteredText) || 
                dateOption.value === enteredText) {
              setInput('');
              handleDateSelect(dateOption);
              return;
            }
          }
          
          // Try to parse date in various formats
          let parsedDate;
          try {
            // DD/MM/YYYY format
            if (enteredText.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              const [day, month, year] = enteredText.split('/');
              parsedDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            }
            // DD/MM format (assume current year)
            else if (enteredText.match(/^\d{1,2}\/\d{1,2}$/)) {
              const [day, month] = enteredText.split('/');
              const year = new Date().getFullYear();
              console.log(`Parsing date: ${day}/${month}/${year}`);
              parsedDate = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10));
              
              // If date is in the past (more than 1 day), assume next year
              const now = new Date();
              if (parsedDate < now && (now - parsedDate) > 24 * 60 * 60 * 1000) {
                parsedDate.setFullYear(year + 1);
              }
              
              console.log("Parsed date result:", parsedDate);
            }
            
            if (parsedDate && !isNaN(parsedDate.getTime())) {
              // Format to ISO format to match with availableDates
              const year = parsedDate.getFullYear();
              const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
              const day = String(parsedDate.getDate()).padStart(2, '0');
              const formattedDate = `${year}-${month}-${day}`;
              
              console.log("Looking for match with formatted date:", formattedDate);
              console.log("Available dates values:", availableDates.map(d => d.value));
              
              // Check if this date is in our availableDates
              const matchedDate = availableDates.find(d => d.value === formattedDate);
              
              if (matchedDate) {
                console.log("Found exact match for date:", matchedDate);
                setInput('');
                handleDateSelect(matchedDate);
                return;
              }
              
              // If no exact match, try to find the closest date
              if (!matchedDate && availableDates.length > 0) {
                console.log("No exact match, creating date object to use");
                
                // Create a date option with the parsed date
                const displayDate = parsedDate.toLocaleDateString('pt-BR', { 
                  weekday: 'short', 
                  day: '2-digit', 
                  month: '2-digit' 
                });
                
                const brFormat = `${day}/${month}/${year}`;
                
                const customDateOption = {
                  value: formattedDate,
                  display: displayDate,
                  brFormat: brFormat,
                  jsDate: new Date(parsedDate)
                };
                
                console.log("Using custom date option:", customDateOption);
                setInput('');
                handleDateSelect(customDateOption);
                return;
              }
            }
          } catch (error) {
            console.error("Error parsing date:", error);
            
            // Show a helpful message for invalid date formats
            const errorMsg = {
              role: 'assistant',
              content: `O formato de data '${enteredText}' não foi reconhecido. Por favor, use o formato DD/MM (exemplo: 15/06) ou escolha uma das datas numeradas abaixo:\n\n${formatDateOptionsMessage()}`
            };
            
            setMessages(prev => [...prev, userMessage, errorMsg]);
            setInput('');
            return;
          }
        }
      }
      
      // Handle questions about time 
      if (ctx.step === 5) {
        const enteredText = textToSend.trim().toLowerCase();
        
        // Handle questions like "what time?" or "which time?"
        if (enteredText === 'what time?' || enteredText === 'que horas?' || 
            enteredText === 'que hora?' || enteredText === 'qual horário?' || 
            enteredText === 'which time?' || enteredText === 'horario?' ||
            enteredText === 'horário?' || enteredText === 'time?' ||
            enteredText === 'quando?' || enteredText === 'quando' || 
            enteredText === 'when?' || enteredText === 'when') {
          // Show time options again
          const displayDate = bookingState.selectedDate ? new Date(bookingState.selectedDate).toLocaleDateString('pt-BR', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit' 
          }) : '';
          
          const question = displayDate ? `Qual horário você prefere no dia ${displayDate}?` : "Qual horário você prefere?";
          const timeOptions = formatTimeOptionsMessage();
          
          const timeOptionsMessage = {
            role: 'assistant',
            content: question + "\n\n" + timeOptions
          };
          
          setMessages(prev => [...prev, { role: 'user', content: textToSend }, timeOptionsMessage]);
          setInput('');
          return;
        }
        
        // Try to match time formats like 14:00 or 2pm
        if (enteredText.match(/^\d{1,2}:\d{2}$/)) {
          // Look for exact match in availableTimes
          const matchedTime = availableTimes.find(t => t.toLowerCase() === enteredText);
          if (matchedTime) {
            setInput('');
            handleTimeSelect(matchedTime);
            return;
          }
        }
        
        // If we've reached this point and the input doesn't look like a time,
        // it's likely a generic text input - show available times instead of showing an error
        let isValidTime = false;
        
        // Check if this is a recognizable time format
        if (enteredText.match(/^\d{1,2}:\d{2}$/) || // HH:MM
            enteredText.match(/^\d{1,2}(am|pm)$/) || // 2pm, 10am
            availableTimes.some(t => t.toLowerCase() === enteredText)) {
          isValidTime = true;
        }
        
        // If it's not a recognizable time format, show available times
        if (!isValidTime) {
          // Display date in a friendly format
          const displayDate = bookingState.selectedDate ? new Date(bookingState.selectedDate).toLocaleDateString('pt-BR', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit' 
          }) : '';
          
          const question = displayDate ? `Qual horário você prefere no dia ${displayDate}?` : "Qual horário você prefere?";
          const timeOptions = formatTimeOptionsMessage();
          
          // Add user's message
          setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
          
          // Make sure we have time options to display
          if (bookingState.selectedWorker && bookingState.selectedDate) {
            // Ensure time options are generated
            generateTimeOptions(bookingState.selectedWorker.worker_id, bookingState.selectedDate)
              .then(() => {
                // Get freshly generated time options
                const updatedTimeOptions = formatTimeOptionsMessage();
                
                // Add available times message with options
                const timeInfoMessage = {
                  role: 'assistant',
                  content: question + "\n\n" + updatedTimeOptions
                };
                
                setMessages(prev => [...prev, timeInfoMessage]);
              })
              .catch(error => {
                console.error("Error generating time options:", error);
                // Still show a message even if there's an error
                const errorMessage = {
                  role: 'assistant',
                  content: "Desculpe, ocorreu um erro ao buscar os horários disponíveis. Por favor, tente novamente."
                };
                setMessages(prev => [...prev, errorMessage]);
              });
          } else {
            // Fallback if we don't have worker or date information
            const timeInfoMessage = {
              role: 'assistant',
              content: question + "\n\n" + timeOptions
            };
            setMessages(prev => [...prev, timeInfoMessage]);
          }
          setInput('');
          return;
        }
      }
      
      // Handle time selection by number
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        if (ctx.step === 5 && availableTimes.length >= num && num > 0) {
          // Save the selected time from available options
          const selectedTime = availableTimes[num - 1];
          
          // Make sure this time is still available (not conflicting with appointments)
          const workerId = bookingState.selectedWorker?.worker_id;
          const date = bookingState.selectedDate;
          
          // First let the user know we're checking availability
          setMessages(prev => [...prev, 
            { role: 'user', content: `${num}` },
            { role: 'assistant', content: `Verificando disponibilidade para ${selectedTime}...` }
          ]);
          
          setInput('');
          
          // Regenerate time options to ensure we have the latest data
          if (workerId && date) {
            generateTimeOptions(workerId, date).then(() => {
              // Check if the selected time is still in the filtered list
              if (availableTimes.includes(selectedTime)) {
                // Time is available, proceed with booking
                handleTimeSelect(selectedTime);
              } else {
                // Time conflicts with an appointment, show error
                setMessages(prev => {
                  const updatedMessages = [...prev];
                  updatedMessages[updatedMessages.length - 1] = { 
                    role: 'assistant', 
                    content: `Desculpe, o horário ${selectedTime} não está mais disponível devido a um conflito com outro agendamento. Por favor, escolha outro horário.`
                  };
                  return updatedMessages;
                });
                
                // Show updated time options
                setTimeout(() => {
                  const timeListMsg = formatTimeOptionsMessage();
                  if (timeListMsg) {
                    setMessages(prev => [...prev, { role: 'assistant', content: timeListMsg }]);
                  }
                }, 500);
              }
            });
          } else {
            // If we can't check availability, proceed with caution
            handleTimeSelect(selectedTime);
          }
          return;
        } else if (ctx.step === 5) {
          // Handle invalid time selection - show available times again
          // Add user's message
          setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
          
          // Get the selected date display for context
          const displayDate = bookingState.selectedDate ? new Date(bookingState.selectedDate).toLocaleDateString('pt-BR', { 
            weekday: 'short', 
            day: '2-digit', 
            month: '2-digit' 
          }) : '';
          
          // Show the available times again for the current date
          const question = `Qual horário você prefere no dia ${displayDate}?`;
          
          // Generate time options message
          if (bookingState.selectedWorker && bookingState.selectedDate) {
            // Ensure time options are generated for the correct date and worker
            generateTimeOptions(bookingState.selectedWorker.worker_id, bookingState.selectedDate)
              .then(() => {
                // Get freshly generated time options
                const updatedTimeOptions = formatTimeOptionsMessage();
                
                // Add available times message with options
                const timeInfoMessage = {
                  role: 'assistant',
                  content: question + "\n\n" + updatedTimeOptions
                };
                
                setMessages(prev => [...prev, timeInfoMessage]);
              });
          }
          
          setInput('');
          return;
        }
        
        // Handle confirmation step yes/no
        else if (ctx.step === 6 && num <= 2) {
          setInput('');
          if (num === 1) {
            // User selected "Sim" (1)
            sendMessage("sim");
          } else {
            // User selected "Não" (2)
            sendMessage("não");
          }
          return;
        }
        
        // Handle calendar download option (option 3)
        else if (num === 3 && textToSend.trim() === "3") {
          setInput('');
          // Look for last confirmed appointment and download its calendar file
          const lastAppointment = messages.reduce((found, msg) => {
            if (msg.role === 'user' && msg.appointmentId) {
              return msg.appointmentId;
            }
            return found;
          }, null);
          
          if (lastAppointment) {
            downloadIcsFile(lastAppointment);
          } else {
            // Use the latest appointment ID from context if available
            if (ctx.lastAppointmentId) {
              downloadIcsFile(ctx.lastAppointmentId);
            } else {
              // No appointment found
              const errorMessage = {
                role: 'assistant',
                content: '❌ Desculpe, não foi possível encontrar o agendamento para download do calendário.'
              };
              setMessages(prev => [...prev, { role: 'user', content: textToSend }, errorMessage]);
            }
          }
          return;
        }
      }
      
      // Still check for exact service name matches
      if (ctx.step === 2) {
        const typed = textToSend.trim().toLowerCase();
        const matched = commonServices.find(
          s => s.toLowerCase() === typed
        );
    
        if (matched) {
          setInput('');               // limpa o campo
          handleServiceSelect(matched); // faz exatamente o que o chip faria
          return;                      // sai de sendMessage; nada mais a fazer
        }
      }
    }
    
    // Process numeric input similarly to the WhatsApp integration
    let processedText = textToSend;
    // We'll also track what to display in the user message bubble
    let displayText = textToSend;
    
    // If the input is a pure number, we need to translate it
    const numericInput = textToSend.trim().match(/^(\d+)$/);
    if (numericInput) {
      // Extract the number directly
      const directNumber = parseInt(textToSend.trim(), 10);
      if (isNaN(directNumber)) return;  // Not a valid number
      
      // Index is zero-based (option 1 → index 0)
      const optionIndex = directNumber - 1;
            
      // Handle service selection (step 2)
      if (ctx.step === 2) {
        const services = getSuggestedOptions(ctx);
        if (services && optionIndex >= 0 && optionIndex < services.length) {
          processedText = services[optionIndex];
          console.log(`✅ [Service] ${textToSend} → "${processedText}"`);
        }
      }
      
      // Handle worker selection (step 3)
      if (ctx.step === 3) {
        const workers = getSuggestedOptions(ctx);
        if (workers && optionIndex >= 0 && optionIndex < workers.length) {
          processedText = workers[optionIndex];
          console.log(`✅ [Worker] ${textToSend} → "${processedText}"`);
        }
      }
      
      // Handle confirmation (step 6)
      if (ctx.step === 6) {
        if (optionIndex === 0) { 
          processedText = 'sim';
          console.log(`✅ [Confirm] ${textToSend} → "${processedText}"`);
        }
        if (optionIndex === 1) { 
          processedText = 'não';
          console.log(`✅ [Confirm] ${textToSend} → "${processedText}"`);
        }
      }
      
      // Handle time selection (step 5)
      if (ctx.step === 5) {
        // *** MATCHING WHATSAPP BEHAVIOR ***
        // The WhatsApp integration does NOT process numeric input for times
        // It expects the user to enter times in HH:MM format directly
        // To be consistent, we'll leave the raw numeric input here
        
        // Only convert input if it's already in HH:MM format
        if (/^\d{2}:\d{2}$/.test(textToSend)) {
          // Valid time format, keep as is
          processedText = textToSend;
          displayText = textToSend;
          console.log(`✅ [Time] Valid time format entered: "${textToSend}"`);
        } else {
          // Not a valid time format, leave as is (will show validation error)
          console.log(`⚠️ [Time] Invalid time format: "${textToSend}" (should be HH:MM)`);
          
          // Add note for testing - in real WhatsApp this falls through to FSM validation
          if (/^\d+$/.test(textToSend)) {
            console.log(`ℹ️ IMPORTANT: WhatsApp integration doesn't convert numeric options for times. You entered "${textToSend}" but need to enter a time like "07:30".`);
          }
        }
      }
      
      // Handle date selection (step 4)
      if (ctx.step === 4) {
        // *** MATCHING WHATSAPP BEHAVIOR ***
        // The WhatsApp integration does NOT process numeric input for dates
        // It expects the user to enter dates in YYYY-MM-DD format directly
        
        // Get available dates from the state (for debugging only)
        const availableDateOptions = availableDates.map(date => date.display);
        
        // Function to convert display date to YYYY-MM-DD
        const formatDate = (displayStr) => {
          // Extract the date from something like "qua., 14/05"
          const match = displayStr.match(/(\d{2})\/(\d{2})/);
          if (match) {
            const day = match[1];
            const month = match[2];
            const year = new Date().getFullYear();
            return `${year}-${month}-${day}`;
          }
          return displayStr;
        };
        
        // For consistency with WhatsApp, we'll now process dates just like times
        if (/^\d{4}-\d{2}-\d{2}$/.test(textToSend)) {
          // Valid date format, keep as is
          processedText = textToSend;
          displayText = textToSend;
          console.log(`✅ [Date] Valid date format entered: "${textToSend}"`);
        } else if (availableDateOptions.includes(textToSend)) {
          // The user typed the exact display date (like "qui., 15/05")
          // Convert it to YYYY-MM-DD
          processedText = formatDate(textToSend);
          displayText = textToSend;
          console.log(`✅ [Date] Display date format entered: "${textToSend}" → "${processedText}"`);
        } else {
          // Not a valid date format, leave as is (will show validation error)
          console.log(`⚠️ [Date] Invalid date format: "${textToSend}" (should be YYYY-MM-DD)`);
          
          // Add note for testing - in real WhatsApp this falls through to FSM validation
          if (/^\d+$/.test(textToSend)) {
            console.log(`ℹ️ IMPORTANT: WhatsApp integration doesn't convert numeric options for dates. You entered "${textToSend}" but need to enter a date like "2025-05-15".`);
          }
        }
      }
    }
    
    // Handle differently based on guided vs free mode
    if (isGuidedMode()) {
      const { reply, context, appointment } = handleMessage(processedText, {
        ...ctx,
        workers   // fresh list
      });

      // Always use our displayText for showing in the chat
      // But use processedText for backend processing
      console.log(`📝 [Final] Input: "${textToSend}" → Display: "${displayText}" → Process: "${processedText}"`);
      
      setMessages(prev => [
        ...prev,
        { role: 'user', content: displayText }, // Show the converted value to the user
        { role: 'assistant', content: reply }
      ]);
      
      // For debugging - log what was processed
      console.log(`Input: "${textToSend}" → Processed: "${processedText}" → Displayed: "${displayText}"`);
      setCtx(context);

      if (appointment) {
        try {
          // Add custom duration for appointments without a specific service
          if (context.selectedService === 'Consulta' && context.customDuration) {
            appointment.duration = context.customDuration;
            appointment.service_name = 'Consulta';
          }
          
          await onNewAppointment(appointment);
        } catch (err) {
          showNotification(err.message, 'error');
        }
      }

      // Send lists as messages instead of showing UI chips
      if (context.step === 2) {
        // Show service options as a message after a small delay
        setTimeout(() => {
          const serviceListMsg = formatServiceOptionsMessage();
          if (serviceListMsg) {
            setMessages(prev => [...prev, { role: 'assistant', content: serviceListMsg }]);
          }
        }, 500);
      } else if (context.step === 3 && isEnterpriseAccount) {
        // Show worker options as a message after a small delay
        setTimeout(() => {
          const workerListMsg = formatWorkerOptionsMessage();
          if (workerListMsg) {
            setMessages(prev => [...prev, { role: 'assistant', content: workerListMsg }]);
          }
        }, 500);
      } else if (context.step === 4) {
        // Show date options as a message after a small delay
        setTimeout(() => {
          const dateListMsg = formatDateOptionsMessage();
          if (dateListMsg) {
            setMessages(prev => [...prev, { role: 'assistant', content: dateListMsg }]);
          }
        }, 500);
      } else if (context.step === 5) {
        // Show time options as a message after a small delay
        setTimeout(() => {
          // Make sure we have the latest filtered time slots
          const workerId = bookingState.selectedWorker?.worker_id;
          const date = bookingState.selectedDate;
          
          if (workerId && date) {
            // Regenerate time options to ensure we have the most up-to-date filtered list
            generateTimeOptions(workerId, date).then(() => {
              const timeListMsg = formatTimeOptionsMessage();
              if (timeListMsg) {
                setMessages(prev => [...prev, { role: 'assistant', content: timeListMsg }]);
              }
            });
          } else {
            // Fallback if worker or date is missing
            const timeListMsg = formatTimeOptionsMessage();
            if (timeListMsg) {
              setMessages(prev => [...prev, { role: 'assistant', content: timeListMsg }]);
            }
          }
        }, 500);
      }

      setInput('');
      return;        // ✅ done, skip the free-mode branch
    } else {
      // In free mode, use the API
      
      // In free mode, we want to do the same kind of conversion
      // We'll just reuse all the same logic we created for guided mode
      
      // Copy the input text
      const freeTextToSend = userMessage.content;
      // Process it using the same logic
      let freeProcessedText = freeTextToSend;
      let freeDisplayText = freeTextToSend;
      
      // Only process if it's a number
      const freeNumericInput = freeTextToSend.trim().match(/^(\d+)$/);
      if (freeNumericInput) {
        const freeDirectNumber = parseInt(freeTextToSend.trim(), 10);
        if (!isNaN(freeDirectNumber)) {
          const freeOptionIndex = freeDirectNumber - 1;
          
          // Check for time slot conversion
          if (availableTimes.length > 0) {
            const freeTimeSlots = availableTimes.map(time => 
              typeof time === 'object' && time.formatted ? time.formatted : time
            );
            
            if (freeDirectNumber > 0 && freeDirectNumber <= freeTimeSlots.length) {
              freeDisplayText = freeTimeSlots[freeDirectNumber - 1];
              console.log(`✅ [Free-Time] ${freeTextToSend} → "${freeDisplayText}"`);
            }
          }
          
          // Check for date conversion
          if (availableDates.length > 0) {
            const freeDateOptions = availableDates.map(date => date.display);
            
            if (freeDirectNumber > 0 && freeDirectNumber <= freeDateOptions.length) {
              freeDisplayText = freeDateOptions[freeDirectNumber - 1];
              console.log(`✅ [Free-Date] ${freeTextToSend} → "${freeDisplayText}"`);
            }
          }
        }
      }
      
      // Use the converted display text
      const displayUserMessage = { ...userMessage, content: freeDisplayText };
      console.log(`📝 [Free-Final] Input: "${freeTextToSend}" → Display: "${freeDisplayText}"`);
      
      const updatedMessages = [...messages, displayUserMessage];
      
      setMessages(updatedMessages);
      setInput('');
      setLoading(true);
  
      try {
        const data = await callChatApi(updatedMessages);
        const assistantMessage = data.choices[0].message;
        const newMessages = [...updatedMessages, assistantMessage];
        setMessages(newMessages);
        
        // In free mode, analyze the response for context
        if (!isGuidedMode()) {
          console.log("Checking content for UI options:", assistantMessage.content);
          // Check for UI options to display
          checkMessageContent(assistantMessage.content);
        }
  
        const appointmentData = parseAppointment(assistantMessage.content);
        if (appointmentData) {
          if (!appointmentData.client_name) {
            const promptForName = {
              role: 'assistant',
              content: 'Por favor, informe seu nome para completar o agendamento.'
            };
            setMessages(prev => [...prev, promptForName]);
          } else {
            try {
              await onNewAppointment(appointmentData);
              // Get the worker name from the ID
              const worker = workers.find(b => b.worker_id.toString() === appointmentData.worker_id.toString());
              const workerName = worker ? worker.name : `barbeiro ${appointmentData.worker_id}`;
              
              // Format the date for better readability - ensure we handle the date correctly
              let formattedDisplayDate;
              try {
                if (appointmentData.date.includes('-')) {
                  // ISO format YYYY-MM-DD
                  const selectedDate = new Date(appointmentData.date);
                  const day = selectedDate.getDate().toString().padStart(2, '0');
                  const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                  const year = selectedDate.getFullYear();
                  formattedDisplayDate = `${day}/${month}/${year}`;
                } else {
                  // Already formatted or alternative format
                  formattedDisplayDate = appointmentData.date;
                }
              } catch (err) {
                // Fallback to original format if there's an error
                formattedDisplayDate = appointmentData.date;
              }
              
              // Create success message, including service details if available
              const serviceInfo = appointmentData.service_name 
                ? `\n🔹 Serviço: ${appointmentData.service_name}${appointmentData.duration ? ` (${appointmentData.duration} min)` : ''}`
                : '';
              
              // Check if appointment response includes icsContent for calendar download
              let calendarOption = '';
              if (appointmentData.icsContent) {
                // Create a download link using data URI
                const icsBlob = new Blob([appointmentData.icsContent], { type: 'text/calendar;charset=utf-8' });
                const icsUrl = URL.createObjectURL(icsBlob);
                
                // Save reference to revoke later
                if (!window.icsUrls) window.icsUrls = {};
                window.icsUrls[appointmentData.id] = icsUrl;
                
                // Store the appointment ID in the booking context for later reference
                setBookingState(prev => ({
                  ...prev,
                  lastAppointmentId: appointmentData.id
                }));
                
                // Add calendar download option to the message
                calendarOption = `\n\n📅 Adicionar ao calendário:\n\n3. Baixar arquivo do calendário (Google, Outlook, Apple)`;
              }
                
              const successResponse = {
                role: 'assistant',
                content: `✅ Perfeito! Seu agendamento foi confirmado.\n\n📆 Data: ${formattedDisplayDate}\n⏰ Horário: ${appointmentData.start_time}\n💈 Profissional: ${workerName}${serviceInfo}\n👤 Cliente: ${appointmentData.client_name}${calendarOption}\n\nObrigado pela preferência! Caso precise reagendar ou cancelar, basta me avisar. Estamos ansiosos para recebê-lo.`
              };
              
              // Add the appointment ID to the success message for reference
              const responseWithAppointmentId = {
                ...successResponse,
                appointmentId: appointmentData.id
              };
              
              setMessages(prev => [...prev, responseWithAppointmentId]);
              
              // Reset all option displays
              setShowServiceOptions(false);
              setShowWorkerOptions(false);
              setShowDateOptions(false);
              setShowTimeOptions(false);
            } catch (error) {
              const errorResponse = {
                role: 'assistant',
                content: `❌ Não foi possível confirmar seu agendamento devido ao seguinte problema:\n\n"${error.message}"\n\nPor favor, podemos tentar um horário alternativo? Estou à disposição para ajudá-lo a encontrar um horário que funcione para você.`
              };
              setMessages(prev => [...prev, errorResponse]);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao comunicar com ChatGPT:', error);
        showNotification('Erro ao comunicar com o assistente de chat.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const parseAppointment = (text) => {
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
        
        // Support both "worker_id" and "professional_id"
        const professionalIdKey = isEnterpriseAccount ? 'worker_id' : (
          data.worker_id ? 'worker_id' : 'professional_id'
        );
        
        if (
          data[professionalIdKey] &&
          data.date &&
          data.start_time &&
          data.date.length === 10 &&
          data.start_time.length === 5
        ) {
          // Normalize the data to use worker_id
          const normalizedData = { ...data };
          if (professionalIdKey !== 'worker_id') {
            normalizedData.worker_id = data[professionalIdKey];
            delete normalizedData[professionalIdKey];
          }
          
          // If no service information is provided, add a default custom appointment
          if (!normalizedData.service_id && !normalizedData.service_name) {
            normalizedData.service_name = 'Consulta';
            normalizedData.duration = 30; // Default 30 minute appointment
          }
          
          return normalizedData;
        }
      }
    } catch (error) {
      console.error('Falha ao analisar JSON de agendamento:', error);
    }
    return null;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Reset to start a new chat
  const resetChat = () => {
    setMessages([]);
    setBookingState({
      step: 0,
      clientName: '',
      selectedService: '',
      selectedWorker: null,
      selectedDate: '',
      selectedTime: '',
      customDuration: 30, // Maintain default 30 minute duration for custom appointments
      shop_id: sessionStorage.getItem('shopId'),
      accountType: getUserRole() === 'enterprise' ? 'enterprise' : 'individual',
      workers,
      config,
      lastAppointmentId: null // Reset the last appointment ID
    });
    // No need to set these flags since we're now displaying options as messages
    // However, maintaining them in case we change the approach
    setShowServiceOptions(false);
    setShowWorkerOptions(false);
    setShowDateOptions(false);
    setShowTimeOptions(false);
  };

  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        p: 1,
        bgcolor: config?.theme?.chatBubbleColor || '#f5f5f5',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          mb: 1,
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: '8px 8px 0 0',
          boxShadow: 1
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          {config?.assistant?.name?.charAt(0) || 'A'}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {config?.assistant?.name || 'Amanda'} - {config?.assistant?.title || 'Assistente Virtual'}
          </Typography>
          <Typography variant="caption">
            {config?.business?.name || 'Barbearia Elite'}
          </Typography>
        </Box>
      </Box>
      
      {/* Messages Area */}
      <Box 
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          borderRadius: 2,
          p: 1,
          mb: 1,
          bgcolor: 'white',
          boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Welcome message if no messages yet */}
        {visibleMessages.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              textAlign: 'center',
              p: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Bem-vindo à {config?.business?.name || 'Barbearia Elite'}
            </Typography>
            <Typography variant="body2">
              {config?.assistant?.greeting || 'Olá! Sou a Amanda, sua assistente virtual. Como posso ajudá-lo hoje?'}
            </Typography>
          </Box>
        )}
        
        {/* Chat messages */}
        <Box sx={{ flex: 1 }}>
          {visibleMessages.map((msg, i) => (
            <Box 
              key={i} 
              sx={{ 
                mb: 1.5, 
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                sx={{
                  display: 'inline-block',
                  backgroundColor: msg.role === 'user' ? (config?.theme?.userMessageColor || '#1976d2') : (config?.theme?.assistantMessageColor || '#f5f5f5'),
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  p: 1.5,
                  borderRadius: msg.role === 'user' 
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  maxWidth: '85%',
                  boxShadow: 1,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </Box>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ mt: 0.5, mx: 1 }}
              >
                {msg.role === 'user' ? 'Você' : (config?.assistant?.name || 'Amanda')} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Typography>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        
        {/* No UI elements - all options are shown as messages */}
        
      </Box>
      
      {/* Input Area */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1,
          p: 1,
          bgcolor: 'white',
          borderRadius: '0 0 8px 8px',
          boxShadow: 1
        }}
      >
        <TextField
          fullWidth
          placeholder={loading ? "Processando resposta..." : "Digite sua mensagem..."}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          size="small"
          variant="outlined"
          InputProps={{
            sx: {
              borderRadius: 5,
              bgcolor: '#f9f9f9'
            }
          }}
          inputProps={{
            'aria-label': 'chat message input'
          }}
          sx={{ flex: 1 }}
        />
        <Button 
          onClick={() => sendMessage()} 
          disabled={loading} 
          variant="contained"
          aria-label="send message"
          sx={{
            borderRadius: '50%',
            minWidth: '40px',
            width: '40px',
            height: '40px',
            p: 0
          }}
        >
          {loading ? 
            <Box 
              sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                border: '2px solid white',
                borderTop: '2px solid transparent',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} 
            /> : 
            '➤'
          }
        </Button>
      </Box>
    </Box>
  );
}

Chatbox.propTypes = {
  onNewAppointment: PropTypes.func.isRequired,
  workers: PropTypes.arrayOf(
    PropTypes.shape({
      worker_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  freeModeAllowed: PropTypes.bool
}
