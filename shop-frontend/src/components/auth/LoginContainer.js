// src/components/auth/LoginContainer.js
import React from 'react';
import PropTypes from 'prop-types';
import { Button, Alert } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { LoginHeader } from './LoginHeader';
import { CalendarPreview } from './CalendarPreview';
import { FeatureBadges } from './FeatureBadges';
import { LoginFooter } from './LoginFooter';
import { loginStyles } from '../../styles/loginStyles';

export function LoginContainer({ error, handleHostedUi }) {
  return (
    <>
      <LoginHeader />
      <CalendarPreview />
      <FeatureBadges />

      {/* Error message */}
      {error && (
        <Alert 
          severity="error" 
          className="errorMessage-customizable"
          sx={{ 
            mb: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          {error}
        </Alert>
      )}

      {/* Login button */}
      <Button
        onClick={handleHostedUi}
        variant="contained"
        size="large"
        fullWidth
        className="submitButton-customizable"
        startIcon={<EventAvailableIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />}
        sx={loginStyles.loginButton}
      >
        Comece Agora
      </Button>

      <LoginFooter />
    </>
  );
}

LoginContainer.propTypes = {
  error: PropTypes.string,
  handleHostedUi: PropTypes.func.isRequired
};