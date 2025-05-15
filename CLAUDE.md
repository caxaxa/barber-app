# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a multi-tenant booking platform for service businesses (focusing on barber shops) with WhatsApp integration. The system consists of:

1. **Frontend (React)**: User interface for customers and business administration
2. **Backend (Express and AWS Lambda)**: API server and serverless functions
3. **WhatsApp Integration**: Using Evolution API for messaging

The platform supports two operation modes:
- **Enterprise Mode**: For businesses with multiple workers
- **Individual Mode**: For solo professionals

## Common Commands

### Frontend Development

```bash
# Navigate to frontend directory
cd shop-frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Lint code (if configured)
npm run lint
```

### Backend Development

```bash
# Navigate to backend directory
cd shop-backend

# Install dependencies
npm install

# Start Express server (local development)
npm run dev

# Deploy to AWS using SAM CLI
sam deploy

# Deploy with specific parameters
sam deploy --parameter-overrides ExistingUserPoolId="YOUR_POOL_ID" ExistingUserPoolClientId="YOUR_CLIENT_ID" EvoBaseUrl="YOUR_EVO_URL" EvoApiKey="YOUR_API_KEY"
```

### WhatsApp Integration

```bash
# Test WhatsApp webhook locally
cd shop-backend
node whatsapp_in/index.js

# Generate QR code for WhatsApp connection
cd shop-backend/evolution-api
node generate-qr.js
```

## Code Architecture

### Frontend Structure

The frontend is a React application with the following structure:

1. **Components**:
   - `components/admin`: Admin configuration panels
   - `components/appointment`: Appointment booking UI
   - `components/chat`: WhatsApp and chat interface
   - `components/ui`: Shared UI components
   - `components/common`: Common components like Footer

2. **Context**:
   - `ConfigContext`: Configuration management and persistence

3. **Services**:
   - `api.js`: API integration
   - `cognito.js`: AWS Cognito authentication
   - `WorkerDynamoDBService.js`: Worker database operations

4. **Pages**:
   - `AdminPage`: Admin dashboard
   - `LoginPage`: Authentication
   - `TestEnvironment`: Testing environment

### Backend Structure

The backend is built with AWS SAM (Serverless Application Model):

1. **API Endpoints**:
   - Authenticated Admin API (Cognito)
   - Public API with API key protection
   - WhatsApp webhook

2. **Lambda Functions**:
   - Admin operations (worker management, configuration)
   - Public booking operations
   - WhatsApp message processing

3. **Database**:
   - DynamoDB for multi-tenant data storage
   - Single-table design with shop_id as partition key

### WhatsApp Integration

WhatsApp integration uses Evolution API with a serverless handler:

1. **Message Flow**:
   - WhatsApp → Evolution API → AWS API Gateway → Lambda
   - Processing via Finite State Machine (FSM)
   - Response sent back through Evolution API

2. **Numbered Options**:
   - Text-based menu for WhatsApp interface
   - Number-to-option translation for ease of use

## Key Components

### Configuration System

The application uses a multi-level configuration approach:

1. **Default configuration**: Base settings for all accounts
2. **Account-type configuration**: Settings for enterprise vs. individual
3. **Shop-specific configuration**: Custom settings for each tenant

Configuration is stored in:
- LocalStorage (client-side persistence)
- DynamoDB (server-side persistence)

### Booking State Machine

The booking system uses a finite state machine (FSM) to manage the conversation flow:

1. **Step 0**: Initial greeting
2. **Step 1**: Collect client name
3. **Step 2**: Service selection
4. **Step 3**: Worker selection (enterprise accounts only)
5. **Step 4**: Date selection
6. **Step 5**: Time selection
7. **Step 6**: Confirmation

### AWS Resources

The application depends on the following AWS services:

1. **API Gateway**: For authenticated and public endpoints
2. **Lambda**: For serverless functions
3. **DynamoDB**: For data storage
4. **Cognito**: For authentication
5. **S3/CloudFront**: For frontend hosting

## Development Guidelines

### Environment Variables

Frontend environment variables (in `.env`):
- `REACT_APP_BACKEND_URL`: Root URL returned by SAM/API Gateway
- `REACT_APP_API_URL`: Versioned endpoint for REST calls
- `REACT_APP_OPENAI_API_KEY`: For AI chat assistant
- `REACT_APP_AWS_REGION`: For Cognito & DynamoDB
- `REACT_APP_USER_POOL_ID`: Cognito User Pool ID
- `REACT_APP_COGNITO_CLIENT_ID`: OAuth2 app client
- `REACT_APP_COGNITO_DOMAIN`: Hosted-UI domain
- `REACT_APP_REDIRECT_URI`: Callback URL

Backend environment variables (set by SAM):
- `APPOINTMENTS_TABLE`: DynamoDB table name for appointments
- `WORKERS_TABLE`: DynamoDB table name for workers
- `CONFIGS_TABLE`: DynamoDB table name for configurations
- `EVO_BASE_URL`: Evolution API base URL
- `EVO_API_KEY`: Evolution API key

### Deployment

The application is deployed using AWS SAM:

1. **SAM template**: `template.yaml` defines all resources
2. **SAM config**: `samconfig.toml` contains deployment parameters
3. **CloudFormation**: AWS resource provisioning
4. **API Gateway**: Hosts the APIs
5. **Lambda**: Runs the serverless functions

### Common Patterns

1. **Multi-tenant design**: Use shop_id as a partition key
2. **ConfigContext**: Central configuration management
3. **Numbered options**: For WhatsApp interface
4. **Finite State Machine**: For conversation flow