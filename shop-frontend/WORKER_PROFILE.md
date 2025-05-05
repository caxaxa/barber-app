# Individual Worker Profile Module

This module provides a separate interface for individual workers to manage their appointments without access to the main business administration settings.

## Features

- **Worker-specific login**: Separate credentials for individual workers
- **My Appointments tab**: View and manage appointments specific to the logged-in worker
- **My Profile tab**: Update personal information and preferences
- **Simplified booking**: Add appointments directly without selecting a worker
- **Separate database**: Uses a dedicated DynamoDB table without worker_id column

## Authentication

Individual workers can log in with their own credentials:

- Username: `worker`
- Password: `worker123`

In a production system, these credentials would be managed through the admin interface and stored securely.

## Database Structure

The individual worker appointments are stored in a separate DynamoDB table with ARN:

```
arn:aws:dynamodb:us-east-2:002938753233:table/worker
```

### Appointment Schema (Worker Table)

```json
{
  "appointment_id": "2024-05-15-10:00",
  "date": "2024-05-15",
  "start_time": "10:00",
  "client_name": "John Doe",
  "duration": 40,
  "created_at": "2024-04-24T12:34:56.789Z"
}
```

Note that there is no `worker_id` field, as each worker has their own table.

## API Endpoints

The following API endpoints are available for individual worker functionality:

### Get All Worker Appointments

```
GET /worker/appointments/all
```

Returns all appointments for the individual worker.

### Book Worker Appointment

```
POST /worker/appointments/book
```

Request body:
```json
{
  "date": "2024-05-15",
  "start_time": "10:00",
  "client_name": "John Doe",
  "duration": 40
}
```

Creates a new appointment in the worker-specific table.

## Implementation Details

The individual worker profile is implemented with the following components:

1. **WorkerProfilePage.js**: The main UI component for the worker profile
2. **WorkerDynamoDBService.js**: Service for interacting with the worker-specific DynamoDB table
3. **Admin role management**: Added to ConfigContext.js to handle different user roles

The system distinguishes between shop administrators and individual workers by storing the user role in session storage, which determines which interface is shown when the user clicks the admin/profile button.

## Future Enhancements

Planned future enhancements for the individual worker module:

1. **Multiple worker accounts**: Support for multiple individual worker logins
2. **Calendar view**: Add a calendar view specific to the worker's appointments
3. **Client management**: Allow workers to manage their client information
4. **Service customization**: Allow workers to define their own services and durations
5. **Working hours**: Allow workers to set their own working hours

## Security Considerations

In a production environment, consider the following security enhancements:

1. **JWT authentication**: Replace session storage with proper JWT authentication
2. **Role-based access control**: Implement proper RBAC for different user roles
3. **Password hashing**: Use bcrypt or similar for password storage
4. **Rate limiting**: Implement rate limiting for login attempts
5. **Audit logging**: Log all actions performed by individual workers