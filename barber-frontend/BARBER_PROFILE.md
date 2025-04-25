# Individual Barber Profile Module

This module provides a separate interface for individual barbers to manage their appointments without access to the main business administration settings.

## Features

- **Barber-specific login**: Separate credentials for individual barbers
- **My Appointments tab**: View and manage appointments specific to the logged-in barber
- **My Profile tab**: Update personal information and preferences
- **Simplified booking**: Add appointments directly without selecting a barber
- **Separate database**: Uses a dedicated DynamoDB table without barber_id column

## Authentication

Individual barbers can log in with their own credentials:

- Username: `barber`
- Password: `barber123`

In a production system, these credentials would be managed through the admin interface and stored securely.

## Database Structure

The individual barber appointments are stored in a separate DynamoDB table with ARN:

```
arn:aws:dynamodb:us-east-2:002938753233:table/barber
```

### Appointment Schema (Barber Table)

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

Note that there is no `barber_id` field, as each barber has their own table.

## API Endpoints

The following API endpoints are available for individual barber functionality:

### Get All Barber Appointments

```
GET /barber/appointments/all
```

Returns all appointments for the individual barber.

### Book Barber Appointment

```
POST /barber/appointments/book
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

Creates a new appointment in the barber-specific table.

## Implementation Details

The individual barber profile is implemented with the following components:

1. **BarberProfilePage.js**: The main UI component for the barber profile
2. **BarberDynamoDBService.js**: Service for interacting with the barber-specific DynamoDB table
3. **Admin role management**: Added to ConfigContext.js to handle different user roles

The system distinguishes between shop administrators and individual barbers by storing the user role in session storage, which determines which interface is shown when the user clicks the admin/profile button.

## Future Enhancements

Planned future enhancements for the individual barber module:

1. **Multiple barber accounts**: Support for multiple individual barber logins
2. **Calendar view**: Add a calendar view specific to the barber's appointments
3. **Client management**: Allow barbers to manage their client information
4. **Service customization**: Allow barbers to define their own services and durations
5. **Working hours**: Allow barbers to set their own working hours

## Security Considerations

In a production environment, consider the following security enhancements:

1. **JWT authentication**: Replace session storage with proper JWT authentication
2. **Role-based access control**: Implement proper RBAC for different user roles
3. **Password hashing**: Use bcrypt or similar for password storage
4. **Rate limiting**: Implement rate limiting for login attempts
5. **Audit logging**: Log all actions performed by individual barbers