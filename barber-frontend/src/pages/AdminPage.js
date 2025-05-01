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
  Snackbar
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useConfig } from '../context/ConfigContext';
import BusinessConfig from '../components/admin/config/BusinessConfig';
import AssistantConfig from '../components/admin/config/AssistantConfig';
import ThemeConfig from '../components/admin/config/ThemeConfig';
import TerminologyConfig from '../components/admin/config/TerminologyConfig';
import MessagesConfig from '../components/admin/config/MessagesConfig';
import IntegrationConfig from '../components/admin/config/IntegrationConfig';
import SecurityConfig from '../components/admin/config/SecurityConfig';
import TestEnvironment from './TestEnvironment';

export default function AdminPage() {
  const { config, updateConfig, resetConfig, logout, getUserRole } = useConfig();
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
    logout();
    window.location.reload();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            {isEnterpriseAccount ? 'Configurações Empresariais' : 'Configurações Individuais'}
          </Typography>
          
          <Button
            color="primary"
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleLaunchTestEnvironment}
            sx={{ mr: 2 }}
          >
            Testar Ambiente
          </Button>
          
          <Button
            color="primary"
            variant="outlined"
            onClick={handleSave}
            sx={{ mr: 2 }}
          >
            Salvar
          </Button>
          
          <IconButton
            color="inherit"
            onClick={handleLogout}
            aria-label="logout"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Empresa" />
          <Tab label="Assistente" />
          <Tab label="Tema" />
          <Tab label="Terminologia" />
          <Tab label="Mensagens" />
          <Tab label="Integração" />
          <Tab label="Segurança" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, height: 'calc(100vh - 120px)' }}>
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

        {/* Terminology Settings Tab */}
        <TabPanel value={tabValue} index={3}>
          <TerminologyConfig />
        </TabPanel>
        
        {/* Messages Tab */}
        <TabPanel value={tabValue} index={4}>
          <MessagesConfig />
        </TabPanel>
        
        {/* Integration Tab */}
        <TabPanel value={tabValue} index={5}>
          <IntegrationConfig />
        </TabPanel>
        
        {/* Security Settings Tab */}
        <TabPanel value={tabValue} index={7}>
          <SecurityConfig />
        </TabPanel>
      </Container>
      
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
      style={{ padding: '24px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired
};