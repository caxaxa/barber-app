// src/pages/LoginPage.js
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Container,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import AdminPage from './AdminPage';
import { LoginContainer } from '../components/auth/LoginContainer';
import { loginStyles } from '../styles/loginStyles';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const { error, ready, isLoggedIn, handleHostedUi } = useAuth();

  // If we have a token and are "ready," show the app
  if (ready && isLoggedIn) {
    return <AdminPage />;
  }

  return (
    <Box sx={loginStyles.background}>
      <Container sx={loginStyles.container}>
        <Paper elevation={5} sx={loginStyles.card}>
          {/* Header */}
          <Box sx={loginStyles.header}>
            <Typography 
              variant="h5" 
              sx={loginStyles.title}
            >
              Agendamentos Online
            </Typography>
          </Box>

          <Box sx={loginStyles.body}>
            <LoginContainer 
              error={error}
              handleHostedUi={handleHostedUi}
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}