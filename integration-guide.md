# Integration Guide

This guide provides instructions on how to integrate the refactored components into the existing codebase.

## 1. ConfigContext Integration

The ConfigContext has been refactored to be more modular. Here's how to integrate it:

1. **Update imports in existing code**:
   ```javascript
   // Old import
   import { useConfig } from '../context/ConfigContext';

   // New import
   import { useConfig } from '../context/config';
   ```

   The backward compatibility file ensures that existing code will continue to work, but new code should use the modular import.

## 2. LoginPage Integration

The LoginPage component has been refactored into smaller components. No action is needed as the main component has been replaced directly.

## 3. Chatbox Integration

The Chatbox component has been completely refactored. To integrate it:

1. **Rename the files**:
   ```bash
   # Back up the original Chatbox.js
   mv /home/ubuntu/shop-frontend/src/components/chat/Chatbox.js /home/ubuntu/shop-frontend/src/components/chat/Chatbox.js.bak
   
   # Move the new Chatbox into place
   mv /home/ubuntu/shop-frontend/src/components/chat/NewChatbox.js /home/ubuntu/shop-frontend/src/components/chat/Chatbox.js
   ```

2. **Update imports in components that use Chatbox**:
   You can use the following import pattern for more flexibility:
   ```javascript
   // Import just the Chatbox component
   import { Chatbox } from '../components/chat';
   
   // Or import multiple components/hooks
   import { Chatbox, useChatState } from '../components/chat';
   ```

## 4. Testing The Changes

After integration, test the application thoroughly:

1. **Test the login flow**:
   - Test login with valid credentials
   - Verify token processing
   - Test the redirect after successful login

2. **Test the configuration system**:
   - Verify that settings are loaded correctly
   - Test saving and loading configurations
   - Test account type-specific configurations

3. **Test the chat functionality**:
   - Test guided mode booking flow
   - Test free mode conversations
   - Verify appointment creation
   - Test error scenarios

## 5. Rollback Plan

If issues are encountered, a rollback plan is in place:

1. **For ConfigContext**:
   The backward compatibility file ensures that old code will continue to work.

2. **For LoginPage**:
   ```bash
   # Restore from git if needed
   git checkout -- /home/ubuntu/shop-frontend/src/pages/LoginPage.js
   ```

3. **For Chatbox**:
   ```bash
   # Restore the original Chatbox.js
   mv /home/ubuntu/shop-frontend/src/components/chat/Chatbox.js.bak /home/ubuntu/shop-frontend/src/components/chat/Chatbox.js
   ```

## 6. Future Improvements

After successful integration, consider these future improvements:

1. **Add unit tests** for all components and hooks
2. **Implement error boundaries** for component error handling
3. **Add documentation** with JSDoc for all functions and components
4. **Optimize rendering** with React.memo and useCallback
5. **Add accessibility features** with proper ARIA attributes

## 7. Performance Considerations

The refactored code includes several performance improvements:

1. **Memoization** for expensive calculations
2. **Component splitting** to avoid unnecessary re-renders
3. **Optimized state updates** to prevent cascading re-renders

Monitor application performance after integration and address any performance issues that arise.