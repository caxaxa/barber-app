# WhatsApp Business Assistant for Barber Shops

A versatile appointment scheduling and customer management system for barber shops, with dual-mode operation for both individual professionals and multi-staff businesses. Features an AI-powered WhatsApp chat interface and traditional calendar management, built with React and Material UI.

![Barber Shop Appointment System](https://github.com/yourusername/barber-appointment-system/raw/main/screenshot.png)

## Key Features

- **Dual Mode Operation**
  - **Enterprise Mode**: For businesses with multiple barbers/workers
  - **Individual Mode**: For solo professionals
  - Login system with different account types
  - Role-based interface adaptations

- **Interactive Appointment Calendar**
  - Color-coded appointments by barber/worker
  - Visual separation of concurrent appointments
  - Month, week, and day views
  - Click-to-book functionality

- **AI-Powered WhatsApp Assistant**
  - **Guided Mode**: Step-by-step booking with UI components
  - **Free Conversation Mode**: Natural language booking
  - Portuguese language support
  - Intelligent conflict resolution
  - Context-aware booking flow based on account type

- **Admin Configuration Panel**
  - Database configuration with AWS DynamoDB integration
  - OpenAI API key management
  - Business settings (hours, services, etc.)
  - Chat assistant customization
  - Independent configurations for each account type

- **Database Integration**
  - AWS DynamoDB integration with ARN support
  - Fallback to mock data when ARNs aren't configured
  - Appointment conflict detection
  - Different database structures for enterprise vs. individual accounts

- **WhatsApp Integration**
  - Customer onboarding through WhatsApp
  - Appointment reminders and notifications
  - Client engagement and follow-up messages
  - Customizable templates

## System Architecture

The system consists of two main components:

1. **Frontend (React)**: User interface for customers and admin
2. **Backend (Express)**: API server for data management and persistence

### Frontend Structure

```
barber-frontend/
├── public/                  # Static files
├── src/
│   ├── components/          # UI components
│   │   ├── admin/           # Admin interface components
│   │   │   ├── AdminButton.js
│   │   │   ├── ConfigPage.js
│   │   │   └── LoginDialog.js
│   │   ├── appointment/     # Appointment booking components
│   │   │   └── AppointmentDialog.js
│   │   ├── chat/            # Chat interface components
│   │   │   ├── ChatToggleButton.js
│   │   │   ├── Chatbox.js
│   │   │   └── FloatingChat.js
│   │   └── ui/              # Shared UI components
│   │       ├── Notification.js
│   │       └── NotificationContext.js
│   ├── context/             # React context providers
│   │   └── ConfigContext.js
│   ├── services/            # API and service functions
│   │   ├── api.js
│   │   └── mockData.js
│   ├── App.js               # Main application component
│   └── index.js             # Application entry point
└── package.json             # Dependencies and scripts
```

### Backend Structure

```
barber-backend/
├── server.js                # Express server and API endpoints
└── package.json             # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- An OpenAI API key (for chat functionality)

### Frontend Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/barber-appointment-system.git
   cd barber-appointment-system
   ```

2. Install frontend dependencies:
   ```bash
   cd barber-frontend
   npm install
   ```

3. Create a `.env` file in the barber-frontend directory:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```
   Note: The OpenAI API key can also be configured through the admin panel after setup.

4. Start the frontend development server:
   ```bash
   npm start
   ```

### Backend Installation

1. Install backend dependencies:
   ```bash
   cd ../barber-backend
   npm install
   ```

2. Create a `.env` file in the barber-backend directory:
   ```
   PORT=3001
   DB_TYPE=local  # Options: 'dynamodb' or 'local'
   
   # If using DynamoDB
   AWS_REGION=your_aws_region
   APPOINTMENTS_TABLE=Appointments
   BARBERS_TABLE=Barbers
   
   # If using local storage
   LOCAL_DB_PATH=./data
   LOCAL_DB_ENABLED=true
   ```

3. Start the backend server:
   ```bash
   node server.js
   ```

The frontend will be available at http://localhost:3000, and the backend API at http://localhost:3001.

## Configuration

### Account Access

The application supports two different account types with different capabilities:

1. **Enterprise Account**
   - Username: `empresa`
   - Password: `empresa123`
   - Features: Full access to all barbers/workers, complete calendar view, and all configuration options

2. **Individual Account**
   - Username: `individual`
   - Password: `individual123`
   - Features: Single barber view, simplified configuration, and individual-focused calendar

Each account has separate configuration settings that don't interfere with one another.

### Configuration Options

The admin panel provides various configuration tabs:

1. **Database**: 
   - AWS DynamoDB integration through ARNs
   - Configure appointments, customers, and workers table ARNs
   - Toggle between mock data and empty data when ARNs aren't configured

2. **Business**: 
   - Basic business information
   - Operating hours configuration
   - Closed days settings
   - Appointment duration and intervals

3. **Chat Assistant**:
   - Customize assistant name and persona
   - Configure guided vs. free conversation mode
   - Edit assistant prompts and behavior

4. **Messaging**:
   - WhatsApp integration settings
   - Message templates for appointments, birthdays, and follow-ups
   - Google Calendar integration

5. **Theme**: 
   - Primary and secondary color settings
   - Chat bubble colors and appearance
   - Professional and client terminology customization

### Database Options

The system supports AWS DynamoDB integration with fallback to mock data:

1. **AWS DynamoDB with ARNs**:
   - Configure Amazon Resource Names (ARNs) for different tables
   - Separate ARNs for appointments, customers, and workers
   - Example ARN format: `arn:aws:dynamodb:us-east-2:002938753233:table/Appointments`
   - The ARN contains all necessary information: region, account ID, and table name

2. **Mock Data Fallback**:
   - When ARNs aren't configured, the system uses mock data
   - Toggle between example data and empty data
   - Perfect for testing and development without AWS dependencies

For the enterprise account, all three ARNs (appointments, customers, and workers) can be configured. The individual account doesn't use the workers ARN since it only manages a single professional.

## Chat Assistant Modes

The AI-powered chat assistant adapts to different account types and offers two distinct conversation modes:

### Account-Type Adaptation

- **Enterprise Account**: Assistant asks for barber/worker selection during booking
- **Individual Account**: Assistant skips worker selection, using the single professional's information

### Guided Mode

The assistant uses a structured, step-by-step flow with interactive UI components:

1. Ask for client name
2. Present service options as clickable buttons
3. Show available barbers (enterprise mode only)
4. Offer date selection with calendar interface
5. Provide time slots as clickable options
6. Confirm booking details with summary

### Free Conversation Mode

Allows natural language booking without structured UI elements:

- Client can specify any booking details in any order
- AI assistant extracts relevant information using natural language processing
- Handles ambiguities and requests clarification when needed
- Provides a more flexible but less guided experience

Toggle between modes in the admin panel under "Chat Assistant" → "Mode Selection"

## Customizing for Your Business

### Business Information

Update business details in the admin panel:
- Name and type
- Opening and closing hours
- Days closed
- Appointment duration and intervals

### Services and Barbers

Manage services and barbers through the admin panel or directly in the database:
- Add/remove services with prices
- Add/remove barbers with specialties
- Assign unique colors to barbers (for calendar display)

### Visual Customization

Modify the application appearance:
- Primary and secondary colors
- Chat bubble colors
- Assistant name and persona

## Deployment

### Frontend Deployment

Build the frontend for production:

```bash
cd barber-frontend
npm run build
```

The resulting `build` directory can be served with any static file server (Nginx, Apache, Vercel, Netlify, etc.).

### Backend Deployment

The backend can be deployed to any Node.js hosting service (Heroku, AWS, DigitalOcean, etc.). Make sure to set the appropriate environment variables on your hosting platform.

For AWS deployment:
1. Create DynamoDB tables for appointments and barbers
2. Deploy the Express server to AWS Lambda or EC2
3. Update environment variables to use your DynamoDB tables

## Advanced Customization

### Calendar Customization

The appointment calendar can be customized in `App.js`:
- Change display formats for dates and times
- Modify slot durations
- Adjust visible time ranges
- Customize event appearance

### Chat Assistant Prompts

The chat assistant's behavior is controlled by a system prompt in `ConfigContext.js`. You can modify this to change how the assistant interacts with customers.

### Backend API

The backend API endpoints can be extended in `server.js` to add new functionality:
- Additional data models
- Authentication and authorization
- Reporting and analytics

## Troubleshooting

### Common Issues

1. **OpenAI API errors**: Verify your API key in the admin panel and check for quota limitations.

2. **Database connection issues**: Ensure your DynamoDB tables exist and have the correct permissions.

3. **Appointment conflicts**: The system checks for barber-specific time conflicts. Check `server.js` to modify conflict detection logic.

4. **Calendar display issues**: If appointments don't appear correctly in the calendar, check browser console for errors.

### Getting Help

If you encounter issues or have questions:
1. Check the GitHub issues page
2. Join our Discord community
3. Open a new issue with detailed reproduction steps

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Material UI](https://mui.com/)
- [FullCalendar](https://fullcalendar.io/)
- [OpenAI](https://openai.com/)
- [Express](https://expressjs.com/)
- [AWS DynamoDB](https://aws.amazon.com/dynamodb/)