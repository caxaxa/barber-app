# Chatbot Tests

This directory contains tests for the chatbot component and related utilities.

## Available Tests

The following test files are available:

- `Chatbox.test.js`: Tests for the main Chatbox component
- `ChatbotFixesTest.js`: Specific tests for the fixes implemented in the chatbot
- `../utils/__tests__/bookingUtils.test.js`: Tests for booking utility functions
- `../utils/__tests__/dateUtils.test.js`: Tests for date and time utility functions

## Running Tests

You can run the tests using npm scripts:

```bash
# Run all tests
npm test

# Run only chatbot-related tests
npm run test:chatbot

# Run only chatbot utility tests
npm run test:utils

# Run only the tests for the specific fixes
npm run test:fixes
```

## Key Areas Tested

The tests cover the following key areas:

1. **Date Handling**
   - Correct day of week determination
   - Proper date formatting
   - Date range generation

2. **Business Hours Determination**
   - Different hours for weekdays, Saturdays, and Sundays
   - Fallback to openHours/closeHours when specific weekday hours not defined

3. **Time Slot Generation**
   - Generating time slots based on business hours
   - Using configurable time intervals

4. **Conflict Detection**
   - Detecting overlaps between appointments
   - Handling minimal overlaps (allowing slots with < 5 minute overlap)

5. **UI Formatting**
   - Grouping time slots by hour when there are many
   - Displaying time slots in a user-friendly way

## When to Run These Tests

Run these tests whenever you make changes to:

- The Chatbox component
- Date or time handling logic
- Appointment conflict detection
- Time slot generation
- UI formatting of dates or times

This will ensure that your changes don't break the core chatbot functionality.

## Adding New Tests

When adding new features or making other changes to the chatbot, consider adding new tests to cover:

1. New utility functions
2. Edge cases in date/time handling
3. Changes to the chat flow
4. UI formatting changes