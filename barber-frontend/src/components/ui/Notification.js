import React, { useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Notification component to display alerts
 */
export default function Notification({ message, severity = 'info', autoHideDuration = 6000, onClose }) {
  const [open, setOpen] = useState(!!message);

  useEffect(() => {
    setOpen(!!message);
  }, [message]);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  if (!message) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

Notification.propTypes = {
  message: PropTypes.string,
  severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
  autoHideDuration: PropTypes.number,
  onClose: PropTypes.func,
};