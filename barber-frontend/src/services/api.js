/**
 * API service for handling all backend requests
 */
import { mockAppointments, mockBarbers, generateEmptyMockData } from './mockData';

// When using React's proxy feature, we use relative URLs instead of absolute URLs
const API_ENDPOINT = '';

/**
 * Gets the database configuration from localStorage
 * @returns {Object} Database configuration
 */
const getDatabaseConfig = () => {
  try {
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      return config.database || { type: 'dynamodb', dynamodb: {} };
    }
  } catch (error) {
    console.error('Error reading database config:', error);
  }
  return { type: 'dynamodb', dynamodb: {} };
};

/**
 * Checks if a specific ARN is configured
 * @param {string} arnType - The type of ARN to check ('appointments', 'customers', 'workers')
 * @returns {boolean} True if the ARN is set
 */
// Accept either full ARN (…TableArn) **or** legacy tableName (…Table)
const hasArn = (tableKey) => {
  const cfg = getDatabaseConfig()?.dynamodb || {};
  return Boolean(
    cfg[`${tableKey}TableArn`] ||
    cfg[`${tableKey}Table`]     // fallback to name-only field
  );
};

/**
 * Fetch all appointments from the API
 * @returns {Promise<Array>} appointments data
 */
export const fetchAppointments = async () => {
  // Check if an appointments ARN exists
  const hasAppointmentsArn = hasArn('appointments');
  
  if (!hasAppointmentsArn) {
    // No ARN, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        const emptyData = getDatabaseConfig().useEmptyData === true;
        resolve(emptyData ? generateEmptyMockData().appointments : mockAppointments);
      }, 300);
    });
  }

  // ARN exists, simulate DynamoDB data
  return new Promise((resolve) => {
    setTimeout(() => {
      const arnAppointments = [
        {
          id: 'db-appt-1',
          date: "2025-04-30",
          start_time: "09:00",
          barber_id: 1,
          client_name: "Rafael (Database)",
          duration: 40
        },
        {
          id: 'db-appt-2',
          date: "2025-04-30",
          start_time: "10:00",
          barber_id: 2,
          client_name: "Bruno (Database)",
          duration: 40
        },
        {
          id: 'db-appt-3',
          date: "2025-05-01",
          start_time: "11:00",
          barber_id: 3,
          client_name: "Lucas (Database)",
          duration: 40
        }
      ];
      resolve(arnAppointments);
    }, 300);
  });
};

/**
 * Fetch all barbers/workers from the API
 * @returns {Promise<Array>} barbers data
 */
export const fetchBarbers = async () => {
  // For individual accounts, return a single barber (the owner)
  const userRole = sessionStorage.getItem('userRole');
  if (userRole === 'individual') {
    const barberName = sessionStorage.getItem('barberName') || 'Profissional Individual';
    const barberId = sessionStorage.getItem('barberId') || '1';
    
    const individualBarber = [{
      barber_id: parseInt(barberId, 10),
      name: barberName,
      color: "#1976d2",
      specialties: ["cabelo", "barba"]
    }];
    
    return individualBarber;
  }
  
  // For enterprise accounts, check if a workers ARN exists
  const hasWorkersArn = hasArn('barbers');  // keep wording in sync with UI
  
  if (!hasWorkersArn) {
    // No ARN, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        const emptyData = getDatabaseConfig().useEmptyData === true;
        resolve(emptyData ? generateEmptyMockData().barbers : mockBarbers);
      }, 300);
    });
  }

  // ARN exists, simulate DynamoDB data
  return new Promise((resolve) => {
    setTimeout(() => {
      const arnBarbers = [
        {
          barber_id: 1,
          name: "Carlos (Database)",
          color: "#FF5722",
          specialties: ["cabelo", "barba"]
        },
        {
          barber_id: 2,
          name: "Marcos (Database)",
          color: "#2196F3",
          specialties: ["cabelo", "barba", "pigmentação"]
        },
        {
          barber_id: 3,
          name: "João (Database)",
          color: "#4CAF50",
          specialties: ["cabelo", "sobrancelha"]
        }
      ];
      resolve(arnBarbers);
    }, 300);
  });
};

/**
 * Book a new appointment
 * @param {Object} appointmentData - The appointment data
 * @returns {Promise<Object>} booking result
 */
export const bookAppointment = async (appointmentData) => {
  // Check if an appointments ARN exists
  const hasAppointmentsArn = hasArn('appointments');

  // Create appointment ID if not provided
  const appointmentWithId = {
    ...appointmentData,
    id: appointmentData.id || `${appointmentData.date}-${appointmentData.start_time}-${appointmentData.barber_id}-${Date.now()}`
  };
  
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // Check for time conflicts with the same barber
        const currentAppointments = mockAppointments;
        const conflictingAppointment = currentAppointments.find(
          appointment => 
            appointment.date === appointmentData.date && 
            appointment.barber_id === appointmentData.barber_id &&
            appointment.start_time === appointmentData.start_time
        );

        if (conflictingAppointment) {
          // Find barber name to display in error
          let barberName = 'profissional';
          if (sessionStorage.getItem('userRole') === 'individual') {
            barberName = sessionStorage.getItem('barberName') || 'Profissional Individual';
          } else {
            const barber = mockBarbers.find(b => b.barber_id === appointmentData.barber_id);
            if (barber) barberName = barber.name;
          }
          
          reject(new Error(`Este horário já está agendado para ${barberName}. Por favor, escolha outro horário ou profissional.`));
          return;
        }
        if (hasAppointmentsArn) {
          // TODO: replace with real DynamoDB putItem
          console.log('→ would write to DynamoDB here', appointmentWithId);
        } else {
          mockAppointments.push(appointmentWithId);
        }

        resolve({
          success: true,
          message: hasAppointmentsArn
            ? 'Appointment saved to database'
            : 'Appointment saved locally',
          id: appointmentWithId.id
        });
      } catch (error) {
        reject(new Error(`Erro ao agendar: ${error.message}`));
      }
    }, 500);
  });
};

/**
 * Fetch customer profiles
 * @returns {Promise<Array>} customer data
 */
export const fetchCustomers = async () => {
  // Check if a customers ARN exists
  const hasCustomersArn = hasArn('customers');
  
  if (!hasCustomersArn) {
    // No ARN, return empty data
    return [];
  }

  // ARN exists, simulate DynamoDB data
  return new Promise((resolve) => {
    setTimeout(() => {
      const customers = [
        {
          id: "c1",
          name: "João (Database)",
          phone: "+5511999999991",
          email: "joao@example.com"
        },
        {
          id: "c2",
          name: "Maria (Database)",
          phone: "+5511999999992",
          email: "maria@example.com"
        }
      ];
      resolve(customers);
    }, 300);
  });
};

/**
 * Make a request to OpenAI's API
 * @param {Array} messages - The messages array for the conversation
 * @returns {Promise<Object>} The API response
 */
export const callChatApi = async (messages) => {
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
  
  // Use mock responses if OpenAI integration is disabled or no API key
  if (!openaiConfig.enabled || !openaiConfig.apiKey) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simple mock response for the chat
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();
        let responseContent = '';
        
        if (lastUserMessage?.content.toLowerCase().includes('horário') || 
            lastUserMessage?.content.toLowerCase().includes('agendar')) {
          responseContent = 'Claro, posso te ajudar a agendar um horário. Para qual profissional você gostaria de agendar?';
        } else if (lastUserMessage?.content.toLowerCase().includes('carlos')) {
          responseContent = 'Ótimo! O Carlos está disponível amanhã às 10:00. Você gostaria de agendar este horário?';
        } else if (lastUserMessage?.content.toLowerCase().includes('sim') || 
                   lastUserMessage?.content.toLowerCase().includes('confirmar')) {
          responseContent = `{
  "barber_id": 1,
  "date": "2025-04-30",
  "start_time": "10:00",
  "client_name": "Cliente"
}`;
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

  // Try to use the OpenAI API, fall back to mock responses if it fails
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: openaiConfig.model || 'gpt-4',
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Fall back to mock responses
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Desculpe, estou tendo problemas para me conectar ao servidor. Como posso ajudar com seu agendamento hoje?'
              }
            }
          ]
        });
      }, 500);
    });
  }
};

export default {
  API_ENDPOINT,
  fetchAppointments,
  fetchBarbers,
  fetchCustomers,
  bookAppointment,
  callChatApi,
};