// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  Card,
  CardMedia,
  Stack,
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import { useConfig } from '../context/ConfigContext';
import AdminPage from './AdminPage';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const { setUserRole } = useConfig(); // expose a setter in your context
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const COGNITO_DOMAIN = process.env.REACT_APP_COGNITO_DOMAIN;        // e.g. https://appointment-app-123.auth.us-east-2.amazoncognito.com
  const COGNITO_CLIENT = process.env.REACT_APP_COGNITO_CLIENT_ID;    // e.g. 52r7dt137d6vj2h4ch49t8krrs
  const REDIRECT_URI   = process.env.REACT_APP_REDIRECT_URI;         // e.g. http://localhost:3000
  const SCOPES         = encodeURIComponent('openid email phone');

  // 1) On mount, check for an `id_token` in the URL fragment
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const idToken = params.get('id_token');
      if (idToken) {
        // decode, extract your custom attribute & username
        const payload = jwtDecode(idToken);
        const accountType = payload['custom:accountType'] || 'individual';
        const username    = payload['cognito:username'];

        // store in sessionStorage
        sessionStorage.setItem('idToken', idToken);
        sessionStorage.setItem('shopId',  username);
        sessionStorage.setItem('userRole', accountType);

        // inform ConfigContext
        setUserRole(accountType);

        // clean up the URL (remove hash)
        window.history.replaceState({}, document.title, window.location.pathname);

        setIsLoggedIn(true);
      } else {
        setError('No id_token found in URL');
      }
    }
    setReady(true);
  }, [setUserRole]);

  // 2) If we’re already “done” parsing the hash and logged in, show the app
  if (ready && isLoggedIn) {
    return <AdminPage />;
  }

  // 3) Otherwise, render a big “Entrar” button that sends you to Cognito Hosted-UI
  const handleHostedUi = () => {
    const loginUrl =
      `${COGNITO_DOMAIN}/oauth2/authorize` +
      `?response_type=token` +
      `&client_id=${COGNITO_CLIENT}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${SCOPES}`;
    window.location.assign(loginUrl);
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ width: '100%', p: 4, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Card sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
            <CardMedia
              component="img"
              height="140"
              image="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1740"
              alt="WhatsApp Business Assistant"
            />
          </Card>

          <Typography variant="h4" align="center" fontWeight="bold">
            WhatsApp Business Assistant
          </Typography>
          
          <Typography variant="body1" align="center" color="text.secondary">
            Clique abaixo para entrar via Amazon Cognito.
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            onClick={handleHostedUi}
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 2 }}
          >
            Entrar
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Não tem conta? Use a Hosted-UI do Cognito para se cadastrar.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
