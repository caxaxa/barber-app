require('dotenv').config();
const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Check for configuration
let dbConfig = {
  type: process.env.DB_TYPE || 'dynamodb',
  dynamodb: {
    region: process.env.AWS_REGION || 'us-east-2',
    appointmentsTable: process.env.APPOINTMENTS_TABLE || 'Appointments',
    workersTable: process.env.WORKERS_TABLE || 'Workers'
  },
  local: {
    enabled: process.env.LOCAL_DB_ENABLED === 'true' || false,
    dataPath: process.env.LOCAL_DB_PATH || path.join(__dirname, 'data')
  }
};

// Initialize local DB directory if enabled
if (dbConfig.type === 'local' && dbConfig.local.enabled) {
  try {
    if (!fs.existsSync(dbConfig.local.dataPath)) {
      fs.mkdirSync(dbConfig.local.dataPath, { recursive: true });
    }
    
    // Initialize appointments.json if it doesn't exist
    const appointmentsPath = path.join(dbConfig.local.dataPath, 'appointments.json');
    if (!fs.existsSync(appointmentsPath)) {
      fs.writeFileSync(appointmentsPath, JSON.stringify([], null, 2));
    }
    
    // Initialize workers.json if it doesn't exist
    const workersPath = path.join(dbConfig.local.dataPath, 'workers.json');
    if (!fs.existsSync(workersPath)) {
      fs.writeFileSync(workersPath, JSON.stringify([], null, 2));
    }
    
    console.log(`Local database initialized at ${dbConfig.local.dataPath}`);
  } catch (error) {
    console.error('Error initializing local database:', error);
  }
}

// Configure AWS if using DynamoDB
let dynamodb;
if (dbConfig.type === 'dynamodb') {
  AWS.config.update({
    region: dbConfig.dynamodb.region
  });
  dynamodb = new AWS.DynamoDB.DocumentClient();
}

const APPOINTMENTS_TABLE = dbConfig.dynamodb.appointmentsTable;
const WORKERS_TABLE = dbConfig.dynamodb.workersTable;
const WORKER_APPOINTMENTS_TABLE = 'worker'; // Table for individual worker appointments (no worker_id column)

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Helper functions for local database
const getLocalAppointments = () => {
  try {
    const appointmentsPath = path.join(dbConfig.local.dataPath, 'appointments.json');
    const data = fs.readFileSync(appointmentsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local appointments:', error);
    return [];
  }
};

const saveLocalAppointments = (appointments) => {
  try {
    const appointmentsPath = path.join(dbConfig.local.dataPath, 'appointments.json');
    fs.writeFileSync(appointmentsPath, JSON.stringify(appointments, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving local appointments:', error);
    return false;
  }
};

const getLocalWorkers = () => {
  try {
    const workersPath = path.join(dbConfig.local.dataPath, 'workers.json');
    const data = fs.readFileSync(workersPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local workers:', error);
    return [];
  }
};

const saveLocalWorkers = (workers) => {
  try {
    const workersPath = path.join(dbConfig.local.dataPath, 'workers.json');
    fs.writeFileSync(workersPath, JSON.stringify(workers, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving local workers:', error);
    return false;
  }
};

// Routes

// Get all appointments
app.get('/appointments/all', async (req, res) => {
  try {
    let appointments = [];
    
    if (dbConfig.type === 'dynamodb') {
      const params = {
        TableName: APPOINTMENTS_TABLE
      };
      
      const data = await dynamodb.scan(params).promise();
      appointments = data.Items;
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      appointments = getLocalAppointments();
    }
    
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// Get all workers
app.get('/workers', async (req, res) => {
  try {
    let workers = [];
    
    if (dbConfig.type === 'dynamodb') {
      const params = {
        TableName: WORKERS_TABLE
      };
      
      const data = await dynamodb.scan(params).promise();
      workers = data.Items;
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      workers = getLocalWorkers();
    }
    
    res.json({
      success: true,
      workers
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workers',
      error: error.message
    });
  }
});

// Legacy support - Get all workers (alias for workers)
app.get('/workers', async (req, res) => {
  try {
    let workers = [];
    
    if (dbConfig.type === 'dynamodb') {
      const params = {
        TableName: WORKERS_TABLE
      };
      
      const data = await dynamodb.scan(params).promise();
      workers = data.Items;
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      workers = getLocalWorkers();
    }
    
    res.json({
      success: true,
      workers: workers // Return as workers for backward compatibility
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workers',
      error: error.message
    });
  }
});

// Book a new appointment
app.post('/appointments/book', async (req, res) => {
  try {
    const { worker_id, date, start_time, client_name, duration = 40 } = req.body;
    
    // Use worker_id if available, otherwise use worker_id (for backward compatibility)
    const staffId = worker_id || worker_id;
    
    // Validate required fields
    if (!staffId || !date || !start_time || !client_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Create appointment ID (date-time-worker)
    const appointment_id = `${date}-${start_time}-${staffId}`;
    
    // The new appointment object
    const newAppointment = {
      appointment_id,
      worker_id: staffId,
      date,
      start_time,
      client_name,
      duration: duration || 40,
      created_at: new Date().toISOString()
    };
    
    let existingAppointments = [];
    
    // Get existing appointments based on DB type
    if (dbConfig.type === 'dynamodb') {
      const conflictParams = {
        TableName: APPOINTMENTS_TABLE,
        FilterExpression: 'worker_id = :worker_id AND #date = :date',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':worker_id': staffId,
          ':date': date
        }
      };
      
      const result = await dynamodb.scan(conflictParams).promise();
      existingAppointments = result.Items;
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      const allAppointments = getLocalAppointments();
      existingAppointments = allAppointments.filter(
        appointment => (appointment.worker_id === staffId || appointment.worker_id === staffId) && appointment.date === date
      );
    }
    
    // Convert appointment times to minutes for easier comparison
    const appointmentStartMinutes = timeToMinutes(start_time);
    const appointmentEndMinutes = appointmentStartMinutes + (duration || 40);
    
    // Check if any existing appointment overlaps with the requested time
    const hasConflict = existingAppointments.some(appointment => {
      const existingStartMinutes = timeToMinutes(appointment.start_time);
      const existingEndMinutes = existingStartMinutes + (appointment.duration || 40);
      
      // Check if the appointments overlap
      return (
        (appointmentStartMinutes >= existingStartMinutes && appointmentStartMinutes < existingEndMinutes) ||
        (appointmentEndMinutes > existingStartMinutes && appointmentEndMinutes <= existingEndMinutes) ||
        (appointmentStartMinutes <= existingStartMinutes && appointmentEndMinutes >= existingEndMinutes)
      );
    });
    
    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'There is a scheduling conflict with an existing appointment'
      });
    }
    
    // Save the appointment
    if (dbConfig.type === 'dynamodb') {
      const params = {
        TableName: APPOINTMENTS_TABLE,
        Item: newAppointment
      };
      
      await dynamodb.put(params).promise();
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      const allAppointments = getLocalAppointments();
      allAppointments.push(newAppointment);
      saveLocalAppointments(allAppointments);
    }
    
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
});

// Helper function to convert time (HH:MM) to minutes
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

// Endpoint for booking worker-specific appointments (no worker_id)
app.post('/worker/appointments/book', async (req, res) => {
  try {
    const { date, start_time, client_name, duration = 40 } = req.body;
    
    // Validate required fields
    if (!date || !start_time || !client_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Create appointment ID (date-time)
    const appointment_id = `${date}-${start_time}`;
    
    // The new appointment object
    const newAppointment = {
      appointment_id,
      date,
      start_time,
      client_name,
      duration: duration || 40,
      created_at: new Date().toISOString()
    };
    
    let existingAppointments = [];
    
    // Get existing appointments from the worker-specific table
    if (dbConfig.type === 'dynamodb') {
      const conflictParams = {
        TableName: WORKER_APPOINTMENTS_TABLE,
        FilterExpression: '#date = :date',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':date': date
        }
      };
      
      try {
        const result = await dynamodb.scan(conflictParams).promise();
        existingAppointments = result.Items;
      } catch (error) {
        console.error('Error scanning worker appointments table:', error);
        // If table doesn't exist, log it but continue (we'll try to create the appointment)
        console.log('Worker table may not exist, will attempt to create appointment');
      }
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      // For local storage, we'll use a separate JSON file for worker appointments
      try {
        const workerAppointmentsPath = path.join(dbConfig.local.dataPath, 'worker_appointments.json');
        if (fs.existsSync(workerAppointmentsPath)) {
          const data = fs.readFileSync(workerAppointmentsPath, 'utf8');
          existingAppointments = JSON.parse(data);
        } else {
          // Create the file if it doesn't exist
          fs.writeFileSync(workerAppointmentsPath, JSON.stringify([], null, 2));
          existingAppointments = [];
        }
      } catch (error) {
        console.error('Error reading local worker appointments:', error);
        existingAppointments = [];
      }
    }
    
    // Convert appointment times to minutes for easier comparison
    const appointmentStartMinutes = timeToMinutes(start_time);
    const appointmentEndMinutes = appointmentStartMinutes + (duration || 40);
    
    // Check if any existing appointment overlaps with the requested time
    const hasConflict = existingAppointments.some(appointment => {
      const existingStartMinutes = timeToMinutes(appointment.start_time);
      const existingEndMinutes = existingStartMinutes + (appointment.duration || 40);
      
      // Check if the appointments overlap
      return (
        (appointmentStartMinutes >= existingStartMinutes && appointmentStartMinutes < existingEndMinutes) ||
        (appointmentEndMinutes > existingStartMinutes && appointmentEndMinutes <= existingEndMinutes) ||
        (appointmentStartMinutes <= existingStartMinutes && appointmentEndMinutes >= existingEndMinutes)
      );
    });
    
    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'There is a scheduling conflict with an existing appointment'
      });
    }
    
    // Save the appointment
    if (dbConfig.type === 'dynamodb') {
      const params = {
        TableName: WORKER_APPOINTMENTS_TABLE,
        Item: newAppointment
      };
      
      try {
        await dynamodb.put(params).promise();
      } catch (error) {
        console.error('Error putting item in worker table:', error);
        return res.status(500).json({
          success: false,
          message: 'Error saving appointment to worker table',
          error: error.message
        });
      }
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      const workerAppointmentsPath = path.join(dbConfig.local.dataPath, 'worker_appointments.json');
      let allAppointments = [];
      
      try {
        if (fs.existsSync(workerAppointmentsPath)) {
          const data = fs.readFileSync(workerAppointmentsPath, 'utf8');
          allAppointments = JSON.parse(data);
        }
        
        allAppointments.push(newAppointment);
        fs.writeFileSync(workerAppointmentsPath, JSON.stringify(allAppointments, null, 2));
      } catch (error) {
        console.error('Error saving local worker appointment:', error);
        return res.status(500).json({
          success: false,
          message: 'Error saving appointment to local storage',
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Worker appointment booked successfully',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Error booking worker appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking worker appointment',
      error: error.message
    });
  }
});

// Get all worker appointments
app.get('/worker/appointments/all', async (req, res) => {
  try {
    let appointments = [];
    
    if (dbConfig.type === 'dynamodb') {
      try {
        const params = {
          TableName: WORKER_APPOINTMENTS_TABLE
        };
        
        const data = await dynamodb.scan(params).promise();
        appointments = data.Items;
      } catch (error) {
        console.error('Error scanning worker appointments table:', error);
        // If table doesn't exist, return empty array
        appointments = [];
      }
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      try {
        const workerAppointmentsPath = path.join(dbConfig.local.dataPath, 'worker_appointments.json');
        if (fs.existsSync(workerAppointmentsPath)) {
          const data = fs.readFileSync(workerAppointmentsPath, 'utf8');
          appointments = JSON.parse(data);
        } else {
          appointments = [];
        }
      } catch (error) {
        console.error('Error reading local worker appointments:', error);
        appointments = [];
      }
    }
    
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching worker appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worker appointments',
      error: error.message
    });
  }
});

// Add an endpoint to update database configuration
app.post('/admin/db-config', async (req, res) => {
  try {
    const { type, dynamodb, local } = req.body;
    
    // Validate required fields
    if (!type || (type === 'dynamodb' && !dynamodb) || (type === 'local' && !local)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required configuration fields'
      });
    }
    
    // Update config
    dbConfig = {
      ...dbConfig,
      type,
      dynamodb: {
        ...dbConfig.dynamodb,
        ...(dynamodb || {})
      },
      local: {
        ...dbConfig.local,
        ...(local || {})
      }
    };
    
    // If switching to local, initialize local DB
    if (type === 'local' && dbConfig.local.enabled) {
      try {
        if (!fs.existsSync(dbConfig.local.dataPath)) {
          fs.mkdirSync(dbConfig.local.dataPath, { recursive: true });
        }
        
        // Initialize appointments.json if it doesn't exist
        const appointmentsPath = path.join(dbConfig.local.dataPath, 'appointments.json');
        if (!fs.existsSync(appointmentsPath)) {
          fs.writeFileSync(appointmentsPath, JSON.stringify([], null, 2));
        }
        
        // Initialize workers.json if it doesn't exist
        const workersPath = path.join(dbConfig.local.dataPath, 'workers.json');
        if (!fs.existsSync(workersPath)) {
          fs.writeFileSync(workersPath, JSON.stringify([], null, 2));
        }
      } catch (error) {
        console.error('Error initializing local database:', error);
        return res.status(500).json({
          success: false,
          message: 'Error initializing local database',
          error: error.message
        });
      }
    }
    
    // If switching to dynamodb, reinitialize the client
    if (type === 'dynamodb') {
      AWS.config.update({
        region: dbConfig.dynamodb.region
      });
      dynamodb = new AWS.DynamoDB.DocumentClient();
    }
    
    res.json({
      success: true,
      message: 'Database configuration updated successfully',
      config: dbConfig
    });
  } catch (error) {
    console.error('Error updating database configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating database configuration',
      error: error.message
    });
  }
});

// Get current database configuration
app.get('/admin/db-config', (req, res) => {
  res.json({
    success: true,
    config: dbConfig
  });
});

// Legacy support - Get all worker appointments (alias for worker endpoints)
app.get('/worker/appointments/all', async (req, res) => {
  try {
    // Forward to worker endpoint
    let appointments = [];
    
    if (dbConfig.type === 'dynamodb') {
      try {
        const params = {
          TableName: WORKER_APPOINTMENTS_TABLE
        };
        
        const data = await dynamodb.scan(params).promise();
        appointments = data.Items;
      } catch (error) {
        appointments = [];
      }
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      try {
        const workerAppointmentsPath = path.join(dbConfig.local.dataPath, 'worker_appointments.json');
        if (fs.existsSync(workerAppointmentsPath)) {
          const data = fs.readFileSync(workerAppointmentsPath, 'utf8');
          appointments = JSON.parse(data);
        } else {
          appointments = [];
        }
      } catch (error) {
        appointments = [];
      }
    }
    
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Error fetching worker appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worker appointments',
      error: error.message
    });
  }
});

// Legacy support - Book worker appointment (alias for worker endpoint)
app.post('/worker/appointments/book', async (req, res) => {
  try {
    const { date, start_time, client_name, duration = 40 } = req.body;
    
    // Validate required fields
    if (!date || !start_time || !client_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Create appointment ID (date-time)
    const appointment_id = `${date}-${start_time}`;
    
    // The new appointment object
    const newAppointment = {
      appointment_id,
      date,
      start_time,
      client_name,
      duration: duration || 40,
      created_at: new Date().toISOString()
    };
    
    let existingAppointments = [];
    
    // Get existing appointments from the worker-specific table
    if (dbConfig.type === 'dynamodb') {
      try {
        const conflictParams = {
          TableName: WORKER_APPOINTMENTS_TABLE,
          FilterExpression: '#date = :date',
          ExpressionAttributeNames: {
            '#date': 'date'
          },
          ExpressionAttributeValues: {
            ':date': date
          }
        };
        
        const result = await dynamodb.scan(conflictParams).promise();
        existingAppointments = result.Items;
      } catch (error) {
        console.log('Worker table may not exist, will attempt to create appointment');
      }
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      try {
        const workerAppointmentsPath = path.join(dbConfig.local.dataPath, 'worker_appointments.json');
        if (fs.existsSync(workerAppointmentsPath)) {
          const data = fs.readFileSync(workerAppointmentsPath, 'utf8');
          existingAppointments = JSON.parse(data);
        } else {
          fs.writeFileSync(workerAppointmentsPath, JSON.stringify([], null, 2));
          existingAppointments = [];
        }
      } catch (error) {
        existingAppointments = [];
      }
    }
    
    // Convert appointment times to minutes for easier comparison
    const appointmentStartMinutes = timeToMinutes(start_time);
    const appointmentEndMinutes = appointmentStartMinutes + (duration || 40);
    
    // Check if any existing appointment overlaps with the requested time
    const hasConflict = existingAppointments.some(appointment => {
      const existingStartMinutes = timeToMinutes(appointment.start_time);
      const existingEndMinutes = existingStartMinutes + (appointment.duration || 40);
      
      // Check if the appointments overlap
      return (
        (appointmentStartMinutes >= existingStartMinutes && appointmentStartMinutes < existingEndMinutes) ||
        (appointmentEndMinutes > existingStartMinutes && appointmentEndMinutes <= existingEndMinutes) ||
        (appointmentStartMinutes <= existingStartMinutes && appointmentEndMinutes >= existingEndMinutes)
      );
    });
    
    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: 'There is a scheduling conflict with an existing appointment'
      });
    }
    
    // Save the appointment
    if (dbConfig.type === 'dynamodb') {
      const params = {
        TableName: WORKER_APPOINTMENTS_TABLE,
        Item: newAppointment
      };
      
      try {
        await dynamodb.put(params).promise();
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error saving appointment to worker table',
          error: error.message
        });
      }
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      const workerAppointmentsPath = path.join(dbConfig.local.dataPath, 'worker_appointments.json');
      let allAppointments = [];
      
      try {
        if (fs.existsSync(workerAppointmentsPath)) {
          const data = fs.readFileSync(workerAppointmentsPath, 'utf8');
          allAppointments = JSON.parse(data);
        }
        
        allAppointments.push(newAppointment);
        fs.writeFileSync(workerAppointmentsPath, JSON.stringify(allAppointments, null, 2));
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error saving appointment to local storage',
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Worker appointment booked successfully (via worker endpoint)',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Error booking worker appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking worker appointment',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});