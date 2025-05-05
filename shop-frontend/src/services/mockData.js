/**
 * Mock data for development when no backend is available
 */

export const mockWorkers = [
  {
    worker_id: 1,
    name: "Carlos Silva",
    color: "#FF5722",
    specialties: ["Serviço 1", "Serviço 2"]
  },
  {
    worker_id: 2,
    name: "Marcos Oliveira",
    color: "#2196F3",
    specialties: ["Serviço 1", "Serviço 2", "Serviço 3"]
  },
  {
    worker_id: 3,
    name: "João Santos",
    color: "#4CAF50",
    specialties: ["Serviço 1", "Serviço 4"]
  }
];

// Legacy alias for backward compatibility
export const mockBarbers = mockWorkers;

export const mockAppointments = [
  {
    date: "2025-04-24",
    start_time: "09:00",
    worker_id: 1,
    client_name: "Rafael Costa",
    duration: 40
  },
  {
    date: "2025-04-24",
    start_time: "09:00",
    worker_id: 2,
    client_name: "Bruno Almeida", 
    duration: 40
  },
  {
    date: "2025-04-24",
    start_time: "09:00",
    worker_id: 3,
    client_name: "Lucas Ferreira",
    duration: 40
  },
  {
    date: "2025-04-25",
    start_time: "09:00",
    worker_id: 1,
    client_name: "Gustavo Lima",
    duration: 40
  },
  {
    date: "2025-04-25",
    start_time: "14:00",
    worker_id: 2,
    client_name: "Felipe Souza",
    duration: 40
  }
];

/**
 * Generate empty data sets for when we need to start from scratch
 * @returns {Object} Empty data sets
 */
export const generateEmptyMockData = () => {
  return {
    appointments: [],
    workers: [
      {
        worker_id: 1,
        name: "Trabalhador 1",
        color: "#FF5722",
        specialties: ["Serviço 1", "Serviço 2"]
      }
    ],
    customers: []
  };
};

// If you need mock customers, you can add them here
export const mockCustomers = [];