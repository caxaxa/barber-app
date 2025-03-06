
# Barber App

A full-stack barber scheduling application with integrated chatbot functionality. The app allows clients to book appointments with barbers while ensuring smooth scheduling management.

## Table of Contents
- [Overview](#overview)
- [App Layout](#app-layout)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [API Details](#api-details)
- [Chatbot Functionality](#chatbot-functionality)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
This app provides a scheduling system for barbers Eduardo and Matheus. A chatbot assists clients in booking available time slots while preventing double bookings.

## App Layout
![App Layout](assets/layout.png)


---

## Features
- User authentication for customers and barbers
- Chatbot-assisted appointment booking
- Real-time availability tracking
- Calendar integration with drag-and-drop functionality
- Admin panel for managing bookings and barbers
- API to manage bookings, users, and chatbot interactions

---

## Tech Stack
### Frontend:
- React (with Tailwind CSS)
- FullCalendar (drag-and-drop scheduling)
- ShadCN/UI for UI components

### Backend:
- Node.js (Express.js)
- PostgreSQL (Database)
- Redis (For caching real-time bookings)
- OpenAI API (Chatbot functionality)

### Deployment:
- AWS (EC2 & RDS)
- Docker (for containerized deployments)
- Nginx (Reverse Proxy)

---

## Frontend Setup
```bash
# Clone the repository
git clone https://github.com/caxaxa/barber-app.git
cd barber-app/frontend

# Install dependencies
yarn install

# Run the development server
yarn dev
```
Configuration for the API base URL and authentication is set in `.env.local`.

### Important
The chatbot operates in **Portuguese**, and users may need to adjust the language settings or chatbot responses accordingly. To modify the chatbot's behavior, edit the **Chatbox.js** file.

---

## Backend Setup
```bash
# Navigate to the backend directory
cd barber-app/backend

# Install dependencies
yarn install

# Setup environment variables (create .env file)
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/barber_db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key

# Run the server
yarn start
```

---

## Database Setup
1. Ensure PostgreSQL is installed.
2. Create a database:
   ```sql
   CREATE DATABASE barber_db;
   ```
3. Run migrations:
   ```bash
   yarn run migrate
   ```

---

## Deployment
### Docker-based Deployment
```bash
# Build and start services
docker-compose up --build -d
```
Ensure `docker-compose.yml` is configured properly for production with the correct database and API keys.

### AWS Deployment
- Frontend is hosted on an S3 bucket with CloudFront.
- Backend is deployed on an EC2 instance with Nginx.
- PostgreSQL is hosted via AWS RDS.
- Redis is hosted on AWS Elasticache.

---

## API Details
### Authentication:
- `POST /api/auth/register` → Register new user
- `POST /api/auth/login` → User login

### Appointments:
- `GET /api/appointments` → Fetch all appointments
- `POST /api/appointments/book` → Book an appointment
- `DELETE /api/appointments/:id` → Cancel an appointment

### Chatbot:
- `POST /api/chatbot/query` → Interact with the chatbot

---

## Chatbot Functionality
- The chatbot guides users to available time slots based on existing bookings.
- Prevents double bookings and ensures real-time availability.
- Uses OpenAI API to process natural language queries.

Example Query:
```
User: Can I book a slot for Eduardo on Friday at 2 PM?
Chatbot: That slot is available. Would you like to confirm?
```

---

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Added new feature'`)
4. Push to branch (`git push origin feature-name`)
5. Open a pull request

---

## License
The licensing for this project is yet to be determined. Please refer to future updates or discussions for clarification.

