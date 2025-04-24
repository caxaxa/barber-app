/**
 * API service for handling all backend requests
 */
import { mockAppointments, mockBarbers } from './mockData';

// When using React's proxy feature, we use relative URLs instead of absolute URLs
const API_ENDPOINT = '';

// Flag to use mock data if backend is not available
const USE_MOCK_DATA = false;

/**
 * Fetch all appointments from the API
 * @returns {Promise<Array>} appointments data
 */
export const fetchAppointments = async () => {
  if (USE_MOCK_DATA) {
    // Return mock data with a small delay to simulate network request
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockAppointments);
      }, 300);
    });
  }

  try {
    console.log('Fetching appointments from backend...');
    const res = await fetch(`${API_ENDPOINT}/appointments/all`);
    if (!res.ok) {
      throw new Error(`Error fetching appointments: ${res.status}`);
    }
    const data = await res.json();
    console.log('Appointments data from backend:', data);
    return data?.appointments || [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    console.warn('Falling back to mock data for appointments');
    return mockAppointments; // Fallback to mock data on error
  }
};

/**
 * Fetch all barbers from the API
 * @returns {Promise<Array>} barbers data
 */
export const fetchBarbers = async () => {
  if (USE_MOCK_DATA) {
    // Return mock data with a small delay to simulate network request
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockBarbers);
      }, 300);
    });
  }

  try {
    console.log('Fetching barbers from backend...');
    const res = await fetch(`${API_ENDPOINT}/barbers`);
    if (!res.ok) {
      throw new Error(`Error fetching barbers: ${res.status}`);
    }
    const data = await res.json();
    console.log('Barbers data from backend:', data);
    return data?.barbers || [];
  } catch (error) {
    console.error('Error fetching barbers:', error);
    console.warn('Falling back to mock data for barbers');
    return mockBarbers; // Fallback to mock data on error
  }
};

/**
 * Book a new appointment
 * @param {Object} appointmentData - The appointment data
 * @returns {Promise<Object>} booking result
 */
export const bookAppointment = async (appointmentData) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check for time conflicts in mock data - only check for conflicts with the same barber
        const conflictingAppointment = mockAppointments.find(
          appointment => 
            appointment.date === appointmentData.date && 
            appointment.barber_id === appointmentData.barber_id &&
            appointment.start_time === appointmentData.start_time
        );

        if (conflictingAppointment) {
          const barberName = mockBarbers.find(b => b.barber_id === appointmentData.barber_id)?.name || 'profissional';
          throw new Error(`Este horário já está agendado para ${barberName}. Por favor, escolha outro horário ou profissional.`);
        }

        // Add to mock appointments - create a new object to avoid reference issues
        mockAppointments.push({...appointmentData, id: Date.now()});
        resolve({ success: true });
      }, 500);
    });
  }

  try {
    // Make sure we're sending all required fields for proper conflict checking
    const appointmentToSend = {
      ...appointmentData,
      // Add any additional fields if needed
      id: appointmentData.id || `${appointmentData.date}-${appointmentData.start_time}-${appointmentData.barber_id}-${Date.now()}`,
    };

    console.log('Booking appointment with data:', appointmentToSend);
    
    const res = await fetch(`${API_ENDPOINT}/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentToSend),
    });
    
    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error('Error parsing response:', e);
      data = { message: 'Failed to parse server response' };
    }
    
    if (!res.ok) {
      // Enhance error handling - could be a conflict with the same barber
      if (res.status === 409) {
        const barberName = appointmentData.barber_name || 'profissional';
        throw new Error(`Este horário já está agendado para ${barberName}. Por favor, escolha outro horário ou profissional.`);
      }
      throw new Error(data.message || `Error booking appointment (${res.status})`);
    }
    
    console.log('Booking successful:', data);
    return data;
  } catch (error) {
    console.error('Error booking appointment:', error);
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('Network request failed')) {
      console.warn('Network error when booking appointment. Using mock implementation as fallback.');
      
      // Use our mock implementation as fallback
      const conflictingAppointment = mockAppointments.find(
        appointment => 
          appointment.date === appointmentData.date && 
          appointment.barber_id === appointmentData.barber_id &&
          appointment.start_time === appointmentData.start_time
      );

      if (conflictingAppointment) {
        const barberName = mockBarbers.find(b => b.barber_id === appointmentData.barber_id)?.name || 'profissional';
        throw new Error(`Este horário já está agendado para ${barberName}. Por favor, escolha outro horário ou profissional.`);
      }

      // Add to mock appointments as fallback
      const newAppointment = {...appointmentData, id: Date.now()};
      mockAppointments.push(newAppointment);
      console.log('Added appointment to mock data as fallback:', newAppointment);
      return { success: true };
    }
    throw error;
  }
};

/**
 * Make a request to OpenAI's API
 * @param {Array} messages - The messages array for the conversation
 * @returns {Promise<Object>} The API response
 */
export const callChatApi = async (messages) => {
  if (USE_MOCK_DATA) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple mock response for the chat
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        let responseContent = '';
        
        if (lastUserMessage?.content.toLowerCase().includes('horário') || 
            lastUserMessage?.content.toLowerCase().includes('agendar')) {
          responseContent = 'Claro, posso te ajudar a agendar um horário. Para qual barbeiro você gostaria de agendar?';
        } else if (lastUserMessage?.content.toLowerCase().includes('carlos')) {
          responseContent = 'Ótimo! O Carlos está disponível amanhã às 10:00. Você gostaria de agendar este horário?';
        } else if (lastUserMessage?.content.toLowerCase().includes('sim') || 
                   lastUserMessage?.content.toLowerCase().includes('confirmar')) {
          responseContent = '{\n  "barber_id": 1,\n  "date": "2025-04-25",\n  "start_time": "10:00",\n  "client_name": "Cliente"\n}';
        } else {
          responseContent = 'Como posso ajudar com seu agendamento hoje?';
        }
        
        resolve({
          choices: [
            {
              message: {
                role: 'assistant',
                content: responseContent
              }
            }
          ]
        });
      }, 1000);
    });
  }

  // Get configuration from localStorage
  let openaiConfig = { apiKey: '', model: 'gpt-4', enabled: true };
  try {
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      openaiConfig = config.openai || openaiConfig;
    }
  } catch (error) {
    console.error('Error reading OpenAI config:', error);
  }

  // Fall back to environment variable if no API key in config
  const apiKey = openaiConfig.apiKey || process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key não configurada. Configure na aba de Integração nas configurações do sistema.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: openaiConfig.model || 'gpt-4',
      messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Error calling chat API');
  }

  return response.json();
};

export default {
  API_ENDPOINT,
  fetchAppointments,
  fetchBarbers,
  bookAppointment,
  callChatApi,
};