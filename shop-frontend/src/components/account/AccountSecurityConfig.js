import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  Button,
  Alert,
  Box,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import SecurityIcon from '@mui/icons-material/Security';
import QrCodeIcon from '@mui/icons-material/QrCode2';
import { useConfig } from '../../context/ConfigContext';
import {
  getUserAttributes,
  updateUserAttributes,
  verifyUserAttribute,
  confirmUserAttribute,
  changePassword,
  setupMFA,
  verifyMFASetup,
  setMFAPreference,
  getMFAStatus
} from '../../services/cognito';

export default function AccountSecurityConfig() {
  const { config, getUserRole, shopId } = useConfig();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordScore, setPasswordScore] = useState(0);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Fetch user attributes from Cognito on component mount
  useEffect(() => {
    const fetchUserAttributes = async () => {
      setLoading(true);
      try {
        // Get user attributes from Cognito
        const attributes = await getUserAttributes();
        
        // Update state with returned attributes
        setEmail(attributes.email || '');
        setPhone(attributes.phone_number || '');
        setEmailVerified(attributes.email_verified === 'true');
        setPhoneVerified(attributes.phone_number_verified === 'true');
        
        // Get MFA status
        const mfaStatus = await getMFAStatus();
        setMfaEnabled(mfaStatus);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user attributes:', err);
        setError('Erro ao carregar informações da conta: ' + (err.message || 'Tente novamente'));
        setLoading(false);
      }
    };

    fetchUserAttributes();
  }, []);

  // Function to evaluate password strength
  const evaluatePasswordStrength = (password) => {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.match(/[A-Z]/)) score += 1;
    if (password.match(/[a-z]/)) score += 1;
    if (password.match(/[0-9]/)) score += 1;
    if (password.match(/[^A-Za-z0-9]/)) score += 1;
    
    setPasswordScore(score);
    return score;
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (evaluatePasswordStrength(newPassword) < 3) {
      setError('A senha não é forte o suficiente');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Call Cognito to change the password
      await changePassword(currentPassword, newPassword);
      
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Erro ao alterar a senha: ' + (err.message || 'Tente novamente'));
      setLoading(false);
    }
  };

  // State for MFA setup
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecretCode, setMfaSecretCode] = useState('');
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [showMfaDialog, setShowMfaDialog] = useState(false);
  
  // Handle MFA toggle
  const handleMfaToggle = async (event) => {
    const enabled = event.target.checked;
    setLoading(true);
    
    try {
      if (enabled) {
        // Setup MFA
        const { secretCode, qrCodeUrl } = await setupMFA();
        setMfaSecretCode(secretCode);
        setMfaQrCode(qrCodeUrl);
        setShowMfaDialog(true);
        // Note: We don't set MFA as enabled yet until verification is complete
      } else {
        // Disable MFA
        await setMFAPreference(false);
        setMfaEnabled(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error configuring MFA:', err);
      setError('Erro ao configurar MFA: ' + (err.message || 'Tente novamente'));
      setLoading(false);
    }
  };
  
  // Handle MFA verification
  const handleVerifyMFA = async () => {
    if (!mfaVerificationCode) {
      setError('Código de verificação é obrigatório');
      return;
    }
    
    setLoading(true);
    
    try {
      // Verify the MFA setup
      await verifyMFASetup(mfaVerificationCode);
      
      // Enable MFA preference
      await setMFAPreference(true);
      
      // Update UI
      setMfaEnabled(true);
      setShowMfaDialog(false);
      setMfaVerificationCode('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      setLoading(false);
    } catch (err) {
      console.error('Error verifying MFA:', err);
      setError('Erro ao verificar código MFA: ' + (err.message || 'Tente novamente'));
      setLoading(false);
    }
  };

  // State for verification dialogs
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationAttributeName, setVerificationAttributeName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Handle email verification
  const handleVerifyEmail = async () => {
    setLoading(true);
    
    try {
      // Send verification code to email
      await verifyUserAttribute('email');
      
      // Show verification dialog
      setVerificationAttributeName('email');
      setShowVerificationDialog(true);
      setSuccess(true);
      setLoading(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending verification code:', err);
      setError('Erro ao enviar código de verificação: ' + (err.message || 'Tente novamente'));
      setLoading(false);
    }
  };

  // Handle phone verification
  const handleVerifyPhone = async () => {
    setLoading(true);
    
    try {
      // Send verification code to phone
      await verifyUserAttribute('phone_number');
      
      // Show verification dialog
      setVerificationAttributeName('phone_number');
      setShowVerificationDialog(true);
      setSuccess(true);
      setLoading(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending verification code:', err);
      setError('Erro ao enviar código de verificação: ' + (err.message || 'Tente novamente'));
      setLoading(false);
    }
  };
  
  // Handle verification code submission
  const handleVerificationSubmit = async () => {
    if (!verificationCode) {
      setError('Código de verificação é obrigatório');
      return;
    }
    
    setLoading(true);
    
    try {
      // Verify the attribute with the code
      await confirmUserAttribute(verificationAttributeName, verificationCode);
      
      // Update UI based on which attribute was verified
      if (verificationAttributeName === 'email') {
        setEmailVerified(true);
      } else if (verificationAttributeName === 'phone_number') {
        setPhoneVerified(true);
      }
      
      // Close dialog and reset
      setShowVerificationDialog(false);
      setVerificationCode('');
      setSuccess(true);
      setLoading(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error confirming code:', err);
      setError('Erro ao verificar código: ' + (err.message || 'Tente novamente'));
      setLoading(false);
    }
  };

  // Handle email update
  const handleUpdateEmail = async () => {
    if (!email) {
      setError('Email não pode ser vazio');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call Cognito to update email
      await updateUserAttributes({ email });
      
      setSuccess(true);
      setEmailVerified(false); // Email needs verification after change
      setLoading(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating email:', err);
      setError('Erro ao atualizar email: ' + (err.message || 'Tente novamente'));
      setLoading(false);
    }
  };

  // Handle phone update
  const handleUpdatePhone = async () => {
    if (!phone) {
      setError('Telefone não pode ser vazio');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call Cognito to update phone
      await updateUserAttributes({ phone_number: phone });
      
      setSuccess(true);
      setPhoneVerified(false); // Phone needs verification after change
      setLoading(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating phone:', err);
      setError('Erro ao atualizar telefone: ' + (err.message || 'Tente novamente'));
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <SecurityIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1.5 }} />
        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
          Segurança da Conta
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure opções de segurança para sua conta no AWS Cognito.
      </Typography>
      <Divider sx={{ my: 3 }} />
      
      {/* General Account Info */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Informações da Conta
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Identificador da Conta"
              fullWidth
              value={shopId || ''}
              disabled
              margin="normal"
              helperText="Seu ID único no sistema"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Tipo de Conta"
              fullWidth
              value={getUserRole() || 'individual'}
              disabled
              margin="normal"
              helperText="Seu tipo de plano atual"
            />
          </Grid>
        </Grid>
      </Box>
      
      {/* Contact Information */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Informações de Contato
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <TextField
              label="Email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              helperText={emailVerified ? "Email verificado" : "Email não verificado"}
              InputProps={{
                endAdornment: emailVerified ? 
                  <Box sx={{ color: 'success.main', fontWeight: 'bold', fontSize: '0.75rem', ml: 1 }}>✓</Box> : 
                  null
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleUpdateEmail}
              disabled={loading}
              sx={{ mt: 3 }}
              fullWidth
            >
              Atualizar Email
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            {!emailVerified && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleVerifyEmail}
                disabled={loading}
                sx={{ mt: 3 }}
                fullWidth
              >
                Verificar Email
              </Button>
            )}
          </Grid>
          
          <Grid item xs={12} md={5}>
            <TextField
              label="Telefone"
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              margin="normal"
              helperText={phoneVerified ? "Telefone verificado" : "Telefone não verificado"}
              InputProps={{
                endAdornment: phoneVerified ? 
                  <Box sx={{ color: 'success.main', fontWeight: 'bold', fontSize: '0.75rem', ml: 1 }}>✓</Box> : 
                  null
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleUpdatePhone}
              disabled={loading}
              sx={{ mt: 3 }}
              fullWidth
            >
              Atualizar Telefone
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            {!phoneVerified && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleVerifyPhone}
                disabled={loading}
                sx={{ mt: 3 }}
                fullWidth
              >
                Verificar Telefone
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>
      
      {/* Password */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LockResetIcon sx={{ color: 'primary.main', mr: 1.5 }} />
          <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 0 }}>
            Alterar Senha
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Senha Atual"
              type="password"
              fullWidth
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              margin="normal"
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Nova Senha"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                evaluatePasswordStrength(e.target.value);
              }}
              margin="normal"
              required
              helperText={
                newPassword ? 
                `Força da senha: ${passwordScore}/5` : 
                "A senha deve conter letras, números e símbolos"
              }
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Confirmar Nova Senha"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              error={confirmPassword && newPassword !== confirmPassword}
              helperText={
                confirmPassword && newPassword !== confirmPassword ? 
                "As senhas não coincidem" : 
                " "
              }
            />
          </Grid>
          
          {/* Password strength indicator */}
          {newPassword && (
            <Grid item xs={12}>
              <Box sx={{ width: '100%', mt: 1, mb: 2 }}>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  bgcolor: 'grey.200', 
                  borderRadius: 5,
                  overflow: 'hidden'
                }}>
                  <Box 
                    sx={{ 
                      height: '100%', 
                      width: `${(passwordScore / 5) * 100}%`,
                      bgcolor: passwordScore <= 2 ? 'error.main' : 
                               passwordScore <= 3 ? 'warning.main' : 
                               'success.main',
                      transition: 'width 0.3s ease'
                    }} 
                  />
                </Box>
              </Box>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleChangePassword}
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
              sx={{ mt: 2 }}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Processando...' : 'Alterar Senha'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {/* 2FA */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Autenticação de Dois Fatores (2FA)
        </Typography>
        <FormGroup>
          <FormControlLabel 
            control={
              <Switch 
                checked={mfaEnabled} 
                onChange={handleMfaToggle}
                disabled={loading}
              />
            } 
            label="Ativar autenticação de dois fatores (MFA)"
          />
        </FormGroup>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta,
          exigindo um código além da senha durante o login.
        </Typography>
      </Box>
      
      {/* Messages */}
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
          Operação realizada com sucesso!
        </Alert>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* MFA Setup Dialog */}
      <Dialog open={showMfaDialog} onClose={() => !loading && setShowMfaDialog(false)}>
        <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Escaneie o QR code abaixo com um aplicativo de autenticação como Google Authenticator, Authy ou Microsoft Authenticator:
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            {mfaQrCode && (
              <Box>
                <img 
                  src={`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(mfaQrCode)}`} 
                  alt="QR Code para MFA" 
                  style={{ width: 200, height: 200 }}
                />
              </Box>
            )}
          </Box>
          
          <Typography variant="body2" paragraph>
            Ou configure manualmente usando este código: <br />
            <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
              {mfaSecretCode}
            </Box>
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            Digite o código de verificação do seu aplicativo:
          </Typography>
          
          <TextField
            label="Código de Verificação"
            fullWidth
            value={mfaVerificationCode}
            onChange={(e) => setMfaVerificationCode(e.target.value)}
            margin="normal"
            placeholder="000000"
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMfaDialog(false)} disabled={loading} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleVerifyMFA} 
            variant="contained" 
            color="primary"
            disabled={loading || !mfaVerificationCode}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Verification Code Dialog */}
      <Dialog open={showVerificationDialog} onClose={() => !loading && setShowVerificationDialog(false)}>
        <DialogTitle>
          {verificationAttributeName === 'email' ? 'Verificar Email' : 'Verificar Telefone'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {verificationAttributeName === 'email' 
              ? 'Enviamos um código de verificação para seu email.'
              : 'Enviamos um código de verificação por SMS para seu telefone.'}
          </Typography>
          
          <TextField
            label="Código de Verificação"
            fullWidth
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            margin="normal"
            placeholder="000000"
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowVerificationDialog(false)} 
            disabled={loading} 
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleVerificationSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading || !verificationCode}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}