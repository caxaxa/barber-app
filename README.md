# Barber Shop Appointment System

A comprehensive appointment scheduling system for barbershops, offering both AI-powered chat booking and traditional calendar management, built with React and Express.

![Barber Shop Appointment System](https://github.com/yourusername/barber-appointment-system/raw/main/screenshot.png)

## Features

- **Interactive Appointment Calendar**
  - Color-coded appointments by barber
  - Visual separation of concurrent appointments
  - Month, week, and day views
  - Click-to-book functionality

- **AI-Powered Chat Assistant**
  - **Guided Mode**: Step-by-step booking with UI components
  - **Free Conversation Mode**: Natural language booking
  - Portuguese language support
  - Intelligent conflict resolution

- **Admin Panel**
  - Database configuration (DynamoDB or local storage)
  - OpenAI API key management
  - Business settings (hours, services, etc.)
  - Chat assistant customization

- **Backend Integration**
  - Flexible database options (AWS DynamoDB or local JSON)
  - Appointment conflict detection
  - RESTful API design

- **Full Customization**
  - Business information
  - Operating hours
  - Available services
  - Barber profiles and specialties
  - Theme colors

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

### Admin Panel Access

Access the admin panel by clicking the gear icon in the top-left corner of the application. Default login credentials:

- Username: `admin1`
- Password: `12345`

### Configuration Options

The admin panel provides several configuration tabs:

1. **Business**: Basic business information, operating hours, services
2. **Database**: Database type (DynamoDB or local), connection settings
3. **Integration**: OpenAI API settings, chat assistant configuration
4. **Security**: Admin login credentials
5. **Theme**: Color schemes and visual customization

### Database Options

The system supports two database modes:

1. **Local Storage**:
   - Stores data in JSON files
   - Ideal for development or small deployments
   - No external dependencies

2. **AWS DynamoDB**:
   - Scalable cloud database
   - Requires AWS account and credentials
   - Suitable for production deployments

## Chat Assistant Modes

### Guided Mode

The chat assistant uses a structured, step-by-step flow with UI components:
1. Ask for client name
2. Present service options as buttons
3. Show available barbers
4. Offer date selection
5. Provide time slots
6. Confirm booking details

### Free Conversation Mode

Allows natural language booking without structured UI elements:
- Client can specify any booking details in any order
- AI assistant extracts relevant information
- More flexible but less guided experience

Toggle between modes in the admin panel under "Integration" → "Chatbot Settings"

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