// src/pages/LoginPage.js

import React, { useState } from 'react';
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
import { useConfig } from '../context/ConfigContext';
import AdminPage from './AdminPage';
import SignUp from './SignUp';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { login } = useConfig();

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // Perform login via Cognito
  const handleLogin = async () => {
    setError('');
    const result = await login(username, password);
    if (result.success) {
      setIsLoggedIn(true);
    } else {
      setError(result.message || 'Credenciais inv&aacute;lidas. Tente novamente.');
    }
  };

  // If already authenticated, show the admin/config page
  if (isLoggedIn) {
    return <AdminPage />;
  }

  // If in signup mode, render the SignUp form
  if (mode === 'signup') {
    return (
      <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ width: '100%', p: 4, borderRadius: 2 }}>
          <SignUp />
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button onClick={() => { setMode('login'); setError(''); }}>
              Voltar para Login
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Default: login mode
  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ width: '100%', p: 4, borderRadius: 2 }}>
        <Stack spacing={3}>
          <Card sx={{ mb: 3, overflow: 'hidden', borderRadius: 2 }}>
            <CardMedia
              component="img"
              height="140"
              image="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
              alt="WhatsApp Business Assistant"
            />
          </Card>

          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            WhatsApp Business Assistant
          </Typography>
          
          <Typography variant="body1" align="center" color="text.secondary" paragraph>
            Acesse a plataforma para configurar seu assistente virtual e gerenciar seus agendamentos.
          </Typography>

          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <TextField
            label="Usuário"
            fullWidth
            margin="normal"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          
          <TextField
            label="Senha"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <Button
            onClick={handleLogin}
            variant="contained"
            size="large"
            fullWidth
            disabled={!username || !password}
            sx={{ mt: 2 }}
          >
            Entrar
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Não tem conta?{' '}
              <Button variant="text" onClick={() => { setMode('signup'); setError(''); }}>
                Criar uma conta
              </Button>
            </Typography>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Credenciais de teste:
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Empresa: usu&aacute;rio &quot;empresa&quot; / senha &quot;empresa123&quot;
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Individual: usu&aacute;rio &quot;individual&quot; / senha &quot;individual123&quot;
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
