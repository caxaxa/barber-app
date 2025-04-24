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
    barbersTable: process.env.BARBERS_TABLE || 'Barbers'
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
    
    // Initialize barbers.json if it doesn't exist
    const barbersPath = path.join(dbConfig.local.dataPath, 'barbers.json');
    if (!fs.existsSync(barbersPath)) {
      fs.writeFileSync(barbersPath, JSON.stringify([], null, 2));
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
const BARBERS_TABLE = dbConfig.dynamodb.barbersTable;

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

const getLocalBarbers = () => {
  try {
    const barbersPath = path.join(dbConfig.local.dataPath, 'barbers.json');
    const data = fs.readFileSync(barbersPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local barbers:', error);
    return [];
  }
};

const saveLocalBarbers = (barbers) => {
  try {
    const barbersPath = path.join(dbConfig.local.dataPath, 'barbers.json');
    fs.writeFileSync(barbersPath, JSON.stringify(barbers, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving local barbers:', error);
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

// Get all barbers
app.get('/barbers', async (req, res) => {
  try {
    let barbers = [];
    
    if (dbConfig.type === 'dynamodb') {
      const params = {
        TableName: BARBERS_TABLE
      };
      
      const data = await dynamodb.scan(params).promise();
      barbers = data.Items;
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      barbers = getLocalBarbers();
    }
    
    res.json({
      success: true,
      barbers
    });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching barbers',
      error: error.message
    });
  }
});

// Book a new appointment
app.post('/appointments/book', async (req, res) => {
  try {
    const { barber_id, date, start_time, client_name, duration = 40 } = req.body;
    
    // Validate required fields
    if (!barber_id || !date || !start_time || !client_name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Create appointment ID (date-time-barber)
    const appointment_id = `${date}-${start_time}-${barber_id}`;
    
    // The new appointment object
    const newAppointment = {
      appointment_id,
      barber_id,
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
        FilterExpression: 'barber_id = :barber_id AND #date = :date',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':barber_id': barber_id,
          ':date': date
        }
      };
      
      const result = await dynamodb.scan(conflictParams).promise();
      existingAppointments = result.Items;
    } else if (dbConfig.type === 'local' && dbConfig.local.enabled) {
      const allAppointments = getLocalAppointments();
      existingAppointments = allAppointments.filter(
        appointment => appointment.barber_id === barber_id && appointment.date === date
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
        
        // Initialize barbers.json if it doesn't exist
        const barbersPath = path.join(dbConfig.local.dataPath, 'barbers.json');
        if (!fs.existsSync(barbersPath)) {
          fs.writeFileSync(barbersPath, JSON.stringify([], null, 2));
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});