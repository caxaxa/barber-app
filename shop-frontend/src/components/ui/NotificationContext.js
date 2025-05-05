import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import Notification from './Notification';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState({
    message: '',
    severity: 'info',
  });

  const showNotification = (message, severity = 'info') => {
    setNotification({ message, severity });
  };

  const hideNotification = () => {
    setNotification({ message: '', severity: 'info' });
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        hideNotification,
      }}
    >
      {children}
      <Notification
        message={notification.message}
        severity={notification.severity}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};