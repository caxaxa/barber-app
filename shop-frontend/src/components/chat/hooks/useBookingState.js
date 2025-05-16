// src/components/chat/hooks/useBookingState.js
import { useState, useCallback, useEffect } from 'react';
import { useConfig } from '../../../context/config';
import { handleMessage } from '@barber-app/booking-fsm';
import { createAppointmentFromBookingState } from '../utils/bookingUtils';
import { isSelectionMessage, extractSelectionNumber } from '../utils/chatUtils';

/**
 * Custom hook to manage booking state and interactions in guided mode
 * @param {Object[]} workers - Array of available workers
 * @param {Function} onAppointmentCreated - Callback when appointment is created
 * @param {Function} addAssistantMessage - Function to add assistant messages
 * @returns {Object} Booking state and methods
 */
export function useBookingState(workers = [], onAppointmentCreated, addAssistantMessage) {
  const { config, getUserRole } = useConfig();
  const isEnterpriseAccount = getUserRole() === 'enterprise';
  const shopId = sessionStorage.getItem('shopId');
  
  // Initialize booking context
  const [bookingState, setBookingState] = useState({
    shop_id: shopId,
    accountType: isEnterpriseAccount ? 'enterprise' : 'individual',
    workers,
    config,
    step: 0,
    clientName: '',
    selectedService: '',
    selectedWorker: null,
    selectedDate: '',
    selectedTime: '',
    customDuration: 30,
    lastAppointmentId: null
  });

  // Update workers when they change
  useEffect(() => {
    setBookingState(prev => ({
      ...prev,
      workers,
      config // Ensure we have the latest config
    }));
  }, [workers, config]);

  // Handle selection of service
  const handleServiceSelect = useCallback((service, addToMessages = true) => {
    setBookingState(prev => {
      const updatedState = {
        ...prev,
        selectedService: service,
        step: isEnterpriseAccount ? 3 : 4 // Skip worker selection in individual mode
      };
      
      // For individual accounts, auto-select the owner as the worker
      if (!isEnterpriseAccount && prev.workers.length > 0) {
        updatedState.selectedWorker = {
          worker_id: prev.shop_id,
          name: prev.config?.business?.ownerName || prev.workers[0]?.name || 'Profissional'
        };
      }
      
      return updatedState;
    });
    
    // Add assistant message about the selection
    if (addToMessages) {
      const message = isEnterpriseAccount
        ? `Ótimo! Você escolheu ${service}. Qual profissional você prefere?`
        : `Ótimo! Você escolheu ${service}. Para qual data gostaria de agendar?`;
      
      addAssistantMessage(message);
    }
    
    return true;
  }, [isEnterpriseAccount, addAssistantMessage]);

  // Handle selection of worker (enterprise mode only)
  const handleWorkerSelect = useCallback((worker, addToMessages = true) => {
    // Find worker by name or ID
    let selectedWorker = null;
    
    if (typeof worker === 'object') {
      selectedWorker = worker;
    } else {
      // Try to find by name (string)
      selectedWorker = bookingState.workers.find(
        w => w.name.toLowerCase() === worker.toLowerCase() || 
             String(w.worker_id) === worker
      );
    }
    
    if (!selectedWorker) {
      if (addToMessages) {
        addAssistantMessage('Desculpe, não encontrei esse profissional. Poderia escolher novamente?');
      }
      return false;
    }
    
    setBookingState(prev => ({
      ...prev,
      selectedWorker,
      step: 4
    }));
    
    if (addToMessages) {
      addAssistantMessage(`Perfeito! Você escolheu ${selectedWorker.name}. Para qual data gostaria de agendar?`);
    }
    
    return true;
  }, [bookingState.workers, addAssistantMessage]);

  // Handle selection of date
  const handleDateSelect = useCallback((date, addToMessages = true) => {
    setBookingState(prev => ({
      ...prev,
      selectedDate: date,
      step: 5
    }));
    
    if (addToMessages) {
      addAssistantMessage(`Ótimo! Você escolheu o dia ${date}. Qual horário prefere?`);
    }
    
    return true;
  }, [addAssistantMessage]);

  // Handle selection of time
  const handleTimeSelect = useCallback((time, addToMessages = true) => {
    setBookingState(prev => ({
      ...prev,
      selectedTime: time,
      step: 6
    }));
    
    if (addToMessages) {
      const confirmation = `Para confirmar: ${bookingState.selectedService} com ${bookingState.selectedWorker?.name} em ${bookingState.selectedDate} às ${time}. Está correto? (Responda sim para confirmar)`;
      addAssistantMessage(confirmation);
    }
    
    return true;
  }, [bookingState.selectedService, bookingState.selectedWorker, bookingState.selectedDate, addAssistantMessage]);

  // Handle confirmation and create appointment
  const handleConfirmation = useCallback((confirmed, addToMessages = true) => {
    if (!confirmed) {
      setBookingState(prev => ({
        ...prev,
        step: 2 // Go back to service selection
      }));
      
      if (addToMessages) {
        addAssistantMessage('Sem problemas, vamos recomeçar. Qual serviço você gostaria de agendar?');
      }
      
      return false;
    }
    
    // Create appointment
    const appointment = createAppointmentFromBookingState(bookingState);
    
    if (!appointment) {
      if (addToMessages) {
        addAssistantMessage('Desculpe, não consegui criar o agendamento. Alguns dados estão faltando. Vamos começar novamente.');
      }
      
      setBookingState(prev => ({
        ...prev,
        step: 2 // Go back to service selection
      }));
      
      return false;
    }
    
    // Save appointment ID and reset state
    setBookingState(prev => ({
      ...prev,
      step: 0, // Reset flow
      lastAppointmentId: appointment.id
    }));
    
    if (addToMessages) {
      addAssistantMessage('✅ Agendamento confirmado! Obrigado por escolher nossos serviços.');
    }
    
    // Notify parent component
    onAppointmentCreated?.(appointment);
    
    return true;
  }, [bookingState, addAssistantMessage, onAppointmentCreated]);

  // Process a user message in guided mode
  const processGuidedMessage = useCallback((text) => {
    const currentStep = bookingState.step;
    
    // Handle selection messages (numbers) based on the current step
    if (isSelectionMessage(text)) {
      const selectionNumber = extractSelectionNumber(text);
      if (selectionNumber) {
        return processSelectionNumber(selectionNumber, currentStep);
      }
    }
    
    // Process with FSM based on current step
    switch (currentStep) {
      case 1: // Getting name
        setBookingState(prev => ({
          ...prev,
          clientName: text,
          step: 2
        }));
        addAssistantMessage(`Olá ${text}! Qual serviço você gostaria de agendar?`);
        return true;
        
      case 2: // Service selection
        return handleServiceSelect(text);
        
      case 3: // Worker selection (enterprise only)
        return handleWorkerSelect(text);
        
      case 4: // Date selection
        return handleDateSelect(text);
        
      case 5: // Time selection
        return handleTimeSelect(text);
        
      case 6: { // Confirmation
        const isConfirmed = /^(sim|s|confirmar?|ok|yes)$/i.test(text);
        return handleConfirmation(isConfirmed);
      }
        
      default:
        // Use the FSM from the booking-fsm package
        try {
          const result = handleMessage(text, bookingState);
          setBookingState(result.context);
          addAssistantMessage(result.reply);
          
          // Check if an appointment was created
          if (result.appointment) {
            onAppointmentCreated?.(result.appointment);
          }
          
          return true;
        } catch (error) {
          console.error('Error in FSM:', error);
          addAssistantMessage('Desculpe, tive um problema ao processar sua mensagem. Poderia tentar novamente?');
          return false;
        }
    }
  }, [bookingState, handleServiceSelect, handleWorkerSelect, handleDateSelect, handleTimeSelect, handleConfirmation, addAssistantMessage, onAppointmentCreated]);

  // Process selection numbers based on current step
  const processSelectionNumber = useCallback((number, step) => {
    switch (step) {
      case 2: { // Service selection
        const services = getAvailableServices();
        if (number > 0 && number <= services.length) {
          return handleServiceSelect(services[number - 1]);
        }
        break;
      }
        
      case 3: // Worker selection
        if (number > 0 && number <= bookingState.workers.length) {
          return handleWorkerSelect(bookingState.workers[number - 1]);
        }
        break;
        
      // Implement similar logic for dates and times if needed
        
      default:
        return false;
    }
    
    addAssistantMessage(`Opção ${number} inválida. Por favor, tente novamente.`);
    return false;
  }, [bookingState.workers, handleServiceSelect, handleWorkerSelect, addAssistantMessage]);

  // Get available services from config
  const getAvailableServices = useCallback(() => {
    // Check if services are defined in config
    if (config?.services?.items && config.services.items.length > 0) {
      // Use the services from config
      return config.services.items.map(service => service.name);
    }
    
    // Return a single custom consultation option if no services are configured
    return ["Consulta"];
  }, [config]);

  // Reset booking state
  const resetBookingState = useCallback(() => {
    setBookingState({
      shop_id: shopId,
      accountType: isEnterpriseAccount ? 'enterprise' : 'individual',
      workers,
      config,
      step: 0,
      clientName: '',
      selectedService: '',
      selectedWorker: null,
      selectedDate: '',
      selectedTime: '',
      customDuration: 30,
      lastAppointmentId: null
    });
  }, [shopId, isEnterpriseAccount, workers, config]);

  // Start booking flow
  const startBookingFlow = useCallback(() => {
    setBookingState(prev => ({
      ...prev,
      step: 1
    }));
    
    const assistantName = config?.assistant?.name || "Amanda";
    const businessName = config?.business?.name || "Barbearia Elite";
    
    addAssistantMessage(`Olá! Sou a ${assistantName}, assistente virtual de ${businessName}. Para começar, poderia me informar seu nome, por favor?`);
  }, [config, addAssistantMessage]);

  return {
    bookingState,
    setBookingState,
    processGuidedMessage,
    handleServiceSelect,
    handleWorkerSelect,
    handleDateSelect,
    handleTimeSelect,
    handleConfirmation,
    resetBookingState,
    startBookingFlow,
    getAvailableServices
  };
}