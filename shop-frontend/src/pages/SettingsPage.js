import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Container,
  Snackbar,
  Alert,
  CssBaseline
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useConfig } from '../context/ConfigContext';
import ThemeConfig from '../components/admin/config/ThemeConfig';
import AccountSecurityConfig from '../components/account/AccountSecurityConfig';
import PropTypes from 'prop-types';
import Footer from '../components/common/Footer';

export default function SettingsPage({ onBack }) {
  const { config, updateConfig } = useConfig();
  const [tabValue, setTabValue] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle save button click
  const handleSave = () => {
    updateConfig(config);
    setSaveSuccess(true);
  };

  // Handle back button click
  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      <CssBaseline />
      
      <AppBar position="static" color="primary" elevation={3}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleBack}
            aria-label="back"
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: 0.5 }}>
            Configurações da Conta
          </Typography>
          
          <Button
            color="inherit"
            variant="outlined"
            onClick={handleSave}
            sx={{ borderRadius: 2 }}
          >
            Salvar
          </Button>
        </Toolbar>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="settings tabs"
          sx={{ 
            bgcolor: 'primary.dark',
            '& .MuiTab-root': { 
              minWidth: 120, 
              fontSize: '0.875rem', 
              textTransform: 'none',
              fontWeight: 500
            }
          }}
        >
          <Tab label="Segurança da Conta" />
          <Tab label="Tema e Cores" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* Segurança da Conta */}
        {tabValue === 0 && (
          <AccountSecurityConfig />
        )}
        
        {/* Tema e Cores */}
        {tabValue === 1 && (
          <ThemeConfig />
        )}
        
      </Container>
      
      <Footer />
      
      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSaveSuccess(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          Configurações salvas com sucesso!
        </Alert>
      </Snackbar>
    </Box>
  );
}

SettingsPage.propTypes = {
  onBack: PropTypes.func
};