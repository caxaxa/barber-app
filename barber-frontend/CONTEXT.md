# WhatsApp Business Assistant - Project Context

This document provides comprehensive context about the WhatsApp Business Assistant project for barber shops.

## Project Overview

The WhatsApp Business Assistant is a versatile appointment scheduling and customer management system designed specifically for barber shops and similar service businesses. It features a dual-mode operation that supports both multi-staff businesses (enterprise) and solo professionals (individual), each with their own unique interface adaptations and configurations.

## Key Components

### 1. Dual Account System

The application has two distinct account types:

**Enterprise Account**
- Login: username `empresa`, password `empresa123`
- Features multi-worker management
- Full calendar with all barbers/workers 
- Complete database configuration with workers table
- Worker selection in booking flow

**Individual Account**
- Login: username `individual`, password `individual123`
- Single professional setup
- Simplified calendar view
- No workers table needed in database
- Skips worker selection in booking flow

### 2. Database Configuration with ARNs

- Uses AWS DynamoDB integration through Amazon Resource Names (ARNs)
- Enterprise accounts can configure ARNs for appointments, customers, and workers tables
- Individual accounts only configure appointments and customers ARNs
- Format example: `arn:aws:dynamodb:us-east-2:002938753233:table/Appointments`
- Falls back to mock data when ARNs aren't configured
- Toggle between empty data and example data when using mock data

### 3. Chat Assistant with AI Integration

- AI-powered WhatsApp assistant for appointment booking
- Supports both guided (UI-based) and free conversation modes
- Context-aware flow that adapts to account type (enterprise vs. individual)
- Uses OpenAI API for natural language processing in free conversation mode
- Portuguese language support throughout

### 4. Appointment Calendar

- Interactive calendar with time slot booking 
- Color-coded appointments by barber/worker
- Different views based on account type (all barbers vs. single barber)
- Conflict detection to prevent double-booking
- Date format: dd/mm/yyyy for display, YYYY-MM-DD for internal storage

## Technical Architecture

### Frontend Structure

The application is built with React and Material UI, featuring:

- **Context System**: Uses React Context API for configuration management
- **Component Structure**: Well-organized component hierarchy for UI elements
- **Service Layer**: API service functions handle data fetching and persistence
- **Responsive Design**: Adapts to different screen sizes and devices

### Key Files and Their Purposes

1. **API Service** (`/src/services/api.js`)
   - Handles all data fetching and persistence
   - Checks for ARN configuration and uses appropriate data source
   - Includes fallback mechanisms for when ARNs aren't configured
   - Simulates database operations when using mock data

2. **Config Context** (`/src/context/ConfigContext.js`)
   - Manages application configuration
   - Handles different settings for different account types
   - Provides account-specific configuration storage
   - Contains default settings for various aspects of the application

3. **Chatbox Component** (`/src/components/chat/Chatbox.js`)
   - Implements the chat interface for booking appointments
   - Handles guided mode with UI elements
   - Processes free conversation mode with AI
   - Adapts flow based on account type

4. **Test Environment** (`/src/pages/TestEnvironment.js`)
   - Provides a testing area for the calendar and chat
   - Shows appointment data fetched from the configured source
   - Allows for testing the booking flow
   - Demonstrates data integration from DynamoDB or mock sources

5. **Login Page** (`/src/pages/LoginPage.js`)
   - Handles authentication for different account types
   - Sets up session storage with user role and related information
   - Redirects to the appropriate interface based on account type

### Data Flow

1. **Configuration Loading**
   - User logs in as enterprise or individual account
   - Role is stored in session storage
   - Context loads the appropriate configuration for that role
   - Configuration is persisted in localStorage with role-specific keys

2. **Data Fetching**
   - API service checks if ARNs are configured for the specific tables
   - If ARNs exist, it fetches data from DynamoDB (simulated in the demo)
   - If ARNs don't exist, it falls back to mock data
   - Individual accounts don't use the workers table

3. **Appointment Booking**
   - User interacts with chat assistant or calendar
   - For guided mode, a step-by-step flow collects booking information
   - For free conversation, AI extracts booking details from natural language
   - Enterprise accounts include worker selection, individual accounts skip it
   - Booking is saved to the appropriate data source with conflict checking

## Recent Development Work

1. **Fixed Database Integration**
   - Implemented proper ARN checking for individual database tables
   - Added clear indicators for when data is coming from DynamoDB vs. mock data
   - Fixed data fetching to consistently use the correct source

2. **Enhanced UI for Different Account Types**
   - Calendar now properly filters data based on account type
   - Chat assistant skips worker selection for individual accounts
   - Added proper UI indications for data source

3. **Date Handling Improvements**
   - Fixed date formatting in the chatbot to ensure consistent dd/mm/yyyy display
   - Ensured proper date handling in appointment confirmations
   - Improved error handling for date parsing

4. **Database Configuration UI**
   - Enhanced database config tab with more clear ARN fields
   - Added examples and clear instructions for ARN format
   - Created separate toggle for empty vs. example mock data

## Important Considerations

1. **ARN-Based Integration**
   - The system uses ARNs to connect to DynamoDB
   - ARNs contain all needed information (region, account ID, table name)
   - No separate AWS configuration is needed when using ARNs
   - Must be correctly formatted to work properly

2. **Account-Specific Configurations**
   - Each account type has its own configuration stored separately
   - Changes in one account don't affect the other
   - Demo mode includes preset configurations for both account types

3. **Date Formats**
   - UI displays dates in dd/mm/yyyy format for Brazilian users
   - Internal date storage uses YYYY-MM-DD ISO format
   - Time slots use 24-hour format (HH:MM)

4. **Chat Assistant Behavior**
   - Adapts questions based on account type
   - Enterprise mode asks for worker selection
   - Individual mode skips worker selection
   - Both modes handle services, dates, and times similarly

## Future Development Plans

1. **Enhanced WhatsApp Integration**
   - Direct integration with WhatsApp API
   - Real-time notifications and reminders
   - QR code scanning for quick account connections

2. **Full Database Integration**
   - Complete AWS SDK integration for DynamoDB
   - Additional database options (MongoDB, SQL)
   - Data synchronization and backup features

3. **Analytical Features**
   - Booking statistics and trends
   - Worker performance metrics
   - Revenue tracking and forecasting

4. **Mobile Applications**
   - Native apps for iOS and Android
   - Offline support with synchronization
   - Push notifications for appointments

## Troubleshooting Common Issues

1. **Data Not Showing from DynamoDB**
   - Check if ARNs are properly configured
   - Verify ARN format is correct
   - Check console for error messages

2. **Chat Assistant Not Working as Expected**
   - Check if the correct mode is selected (guided vs. free)
   - Verify OpenAI API key if using free mode
   - Check if the account type configuration is correct

3. **Date Issues in Bookings**
   - Remember that displayed dates use dd/mm/yyyy format
   - Internally, dates are stored as YYYY-MM-DD
   - Date parsing may need adjustment for different locales

4. **Account Configuration Issues**
   - Clear localStorage if configuration becomes corrupted
   - Check that you're using the correct account credentials
   - Verify that session storage has the correct role information