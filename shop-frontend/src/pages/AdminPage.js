import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Button,
  Container,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  CssBaseline
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useConfig } from '../context/ConfigContext';
import BusinessConfig from '../components/admin/config/BusinessConfig';
import AssistantConfig from '../components/admin/config/AssistantConfig';
import ThemeConfig from '../components/admin/config/ThemeConfig';
import TerminologyConfig from '../components/admin/config/TerminologyConfig';
import MessagesConfig from '../components/admin/config/MessagesConfig';
import SecurityConfig from '../components/admin/config/SecurityConfig';
import WhatsAppConfig from '../components/admin/config/WhatsAppConfig';
import TestEnvironment from './TestEnvironment';
import Footer from '../components/common/Footer';

export default function AdminPage() {
  const { config, updateConfig, resetConfig, signOut, getUserRole } = useConfig();
  const [tabValue, setTabValue] = useState(0);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testEnvironmentOpen, setTestEnvironmentOpen] = useState(false);
  
  const userRole = getUserRole();
  const isEnterpriseAccount = userRole === 'enterprise';

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle save button click
  const handleSave = () => {
    updateConfig(config);
    setSaveSuccess(true);
  };

  // Handle reset confirmation
  const handleResetConfirm = () => {
    resetConfig();
    setResetDialogOpen(false);
    setSaveSuccess(true);
  };

  // Launch test environment
  const handleLaunchTestEnvironment = () => {
    setTestEnvironmentOpen(true);
  };

  // Close test environment
  const handleCloseTestEnvironment = () => {
    setTestEnvironmentOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
      signOut();
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
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, fontWeight: 'bold', letterSpacing: 0.5 }}>
            {isEnterpriseAccount ? 'Configurações Empresariais' : 'Configurações Individuais'}
          </Typography>
          
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            onClick={handleLaunchTestEnvironment}
            sx={{ mr: 2, borderRadius: 2 }}
          >
            Testar Ambiente
          </Button>
          
          <Button
            color="inherit"
            variant="outlined"
            onClick={handleSave}
            sx={{ mr: 2, borderRadius: 2 }}
          >
            Salvar
          </Button>
          
          <IconButton
            color="inherit"
            onClick={handleLogout}
            aria-label="logout"
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
            }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            '& .MuiTab-root': { 
              fontWeight: 500,
              minWidth: 'auto',
              px: 3,
              py: 1.5
            }
          }}
        >
          <Tab label="Empresa" />
          <Tab label="Assistente" />
          <Tab label="Tema" />
          <Tab label="Mensagens" />
          {/* WhatsApp integration visible for non-free plans */}
          {userRole !== 'free' && <Tab label="WhatsApp" />}
          {/* Calendário  – stub, disabled */}
          {userRole !== 'free' && (
            <Tab label="Sincronização de Calendário" disabled />
          )}
          {/* Enterprise-only placeholder */}
          {userRole === 'enterprise' && (
            <Tab label="Enterprise" disabled />
         )}
        </Tabs>
      </AppBar>

      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: 4, 
          mb: 4, 
          flexGrow: 1,
          paddingBottom: 8
        }}
      >
        {/* Business Settings Tab */}
        <TabPanel value={tabValue} index={0}>
          <BusinessConfig />
        </TabPanel>

        {/* Assistant Settings Tab */}
        <TabPanel value={tabValue} index={1}>
          <AssistantConfig />
        </TabPanel>

        {/* Theme Settings Tab */}
        <TabPanel value={tabValue} index={2}>
          <ThemeConfig />
        </TabPanel>
        
        {/* Messages Tab */}
        <TabPanel value={tabValue} index={3}>
          <MessagesConfig />
        </TabPanel>
        
        {/* WhatsApp Tab */}
        <TabPanel value={tabValue} index={4}>
          <WhatsAppConfig />
        </TabPanel>
        
        {/* Security Settings Tab */}
        <TabPanel value={tabValue} index={5}>
          <SecurityConfig />
        </TabPanel>
      </Container>
      
      {/* Footer */}
      <Footer />
      
      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      >
        <DialogTitle>Resetar Configurações</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja resetar todas as configurações para os valores padrão?
            Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleResetConfirm} color="error" variant="contained">
            Resetar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Save Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={6000}
        onClose={() => setSaveSuccess(false)}
        message="Configurações salvas com sucesso!"
      />
      
      {/* Test Environment Dialog */}
      {testEnvironmentOpen && (
        <TestEnvironment 
          open={testEnvironmentOpen}
          onClose={handleCloseTestEnvironment}
          isEnterpriseAccount={isEnterpriseAccount}
        />
      )}
    </Box>
  );
}

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
      style={{ 
        padding: '24px 0',
        transition: 'opacity 0.3s ease-in-out',
        opacity: value === index ? 1 : 0,
        height: value === index ? 'auto' : 0,
      }}
    >
      {value === index && (
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
};