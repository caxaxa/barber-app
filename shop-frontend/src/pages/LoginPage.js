// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Container,
  Alert,
  Card,
  CardMedia,
  Stack,
} from '@mui/material';
import {jwtDecode} from 'jwt-decode';
import { useConfig } from '../context/ConfigContext';
import AdminPage from './AdminPage';

export default function LoginPage() {
  const [error, setError]           = useState('');
  const [ready, setReady]           = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { setUserRole }             = useConfig();

  const COGNITO_DOMAIN = process.env.REACT_APP_COGNITO_DOMAIN;
  const COGNITO_CLIENT = process.env.REACT_APP_COGNITO_CLIENT_ID;
  const REDIRECT_URI   = process.env.REACT_APP_REDIRECT_URI;
  const SCOPES         = 'openid email phone';

  // Called once we have a valid id_token
  const finishLogin = idToken => {
    try {
      const payload     = jwtDecode(idToken);
      const accountType = payload['custom:accountType'] || 'individual';
      const username    = payload['cognito:username'];

      sessionStorage.setItem('idToken',  idToken);
      sessionStorage.setItem('shopId',    username);
      sessionStorage.setItem('userRole',  accountType);

      setUserRole(accountType);
      setIsLoggedIn(true);
      setReady(true);
    } catch (e) {
      setError('Falha ao processar token: ' + e.message);
      setReady(true);
    }
  };

  // On mount: check for stored token or #id_token in hash
  useEffect(() => {
    // 1) Already logged in?
    const stored = sessionStorage.getItem('idToken');
    if (stored) {
      finishLogin(stored);
      return;
    }

    // 2) Look for id_token in URL hash
    const hash = window.location.hash;
    if (hash.includes('id_token=')) {
      const idToken = new URLSearchParams(hash.slice(1)).get('id_token');
      if (idToken) {
        // remove the hash
        window.history.replaceState({}, document.title, window.location.pathname);
        finishLogin(idToken);
        return;
      } else {
        setError('Nenhum id_token encontrado na resposta.');
      }
    }

    // 3) Not logged in yet — show login button
    setReady(true);
  }, [setUserRole]);

  // If we have a token and are “ready,” show the app
  if (ready && isLoggedIn) {
    return <AdminPage />;
  }

  // Otherwise, show the Entrar button for implicit flow
  const handleHostedUi = () => {
    const params = new URLSearchParams({
      response_type: 'token',
      client_id:     COGNITO_CLIENT,
      redirect_uri:  REDIRECT_URI,
      scope:         SCOPES,
      screen_hint:   'signup',  // optional: jump straight to the sign-up form
      lang:          'pt-BR',   // Portuguese localization
    });
    window.location.assign(
      `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`
    );
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}
    >
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
            <Typography variant="caption" color="text.secondary">
              Não tem conta? Use a Hosted-UI do Cognito para se cadastrar.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
