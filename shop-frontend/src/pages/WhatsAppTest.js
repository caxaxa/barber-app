import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { sendTestWhatsAppMessage, checkWhatsAppConnection } from '../utils/whatsappTest';
import { useConfig } from '../context/ConfigContext';
import { isPhoneNumberInList } from '../shared/utils/whatsappFilters';

export default function WhatsAppTest() {
  const [phoneNumber, setPhoneNumber] = useState('+14155238886');
  const [message, setMessage] = useState('Test message from booking system');
  const [status, setStatus] = useState({ checking: false, connected: false, details: null });
  const [sendResult, setSendResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { config } = useConfig();
  
  // WhatsApp config from settings
  const whatsappConfig = config?.messaging?.whatsappIntegration || { 
    enabled: false,
    filterMode: 'whitelist',
    filterNumbers: []
  };
  
  // Check connection on page load
  useEffect(() => {
    checkConnection();
  }, []);
  
  // Handle connection check
  const checkConnection = async () => {
    setStatus({ checking: true, connected: false, details: null });
    
    try {
      const result = await checkWhatsAppConnection();
      setStatus({
        checking: false,
        connected: result.connected,
        details: result.status
      });
    } catch (error) {
      setStatus({
        checking: false,
        connected: false,
        details: { error: error.message }
      });
    }
  };
  
  // Handle test message sending
  const handleSendTest = async () => {
    if (!phoneNumber) {
      setSendResult({
        success: false,
        message: 'Please enter a phone number'
      });
      return;
    }
    
    setIsLoading(true);
    setSendResult(null);
    
    try {
      const result = await sendTestWhatsAppMessage(phoneNumber, message);
      setSendResult(result);
    } catch (error) {
      setSendResult({
        success: false,
        message: `Error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if number would be filtered
  const checkFilterStatus = () => {
    if (!phoneNumber) return { allowed: true };
    
    // Check if the number is in whitelist
    const isInWhitelist = isPhoneNumberInList(phoneNumber, whatsappConfig.filterNumbers);
    
    // For whitelist: allowed if IN list
    // For blacklist: allowed if NOT in list
    const isAllowed = whatsappConfig.filterMode === 'whitelist' 
      ? isInWhitelist 
      : !isInWhitelist;
    
    return {
      allowed: isAllowed,
      inList: isInWhitelist,
      mode: whatsappConfig.filterMode
    };
  };
  
  const filterStatus = checkFilterStatus();
  
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        WhatsApp Integration Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connection Status
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={checkConnection}
            disabled={status.checking}
            sx={{ mr: 2 }}
          >
            Check Connection
          </Button>
          
          {status.checking ? (
            <CircularProgress size={24} />
          ) : (
            <Chip 
              label={status.connected ? 'Connected' : 'Disconnected'} 
              color={status.connected ? 'success' : 'error'}
            />
          )}
        </Box>
        
        {status.details && (
          <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(status.details, null, 2)}
            </Typography>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          WhatsApp Configuration
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText 
              primary="WhatsApp Integration" 
              secondary={whatsappConfig.enabled ? 'Enabled' : 'Disabled'} 
            />
            <Chip 
              label={whatsappConfig.enabled ? 'Enabled' : 'Disabled'} 
              color={whatsappConfig.enabled ? 'success' : 'error'} 
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Filter Mode" 
              secondary={whatsappConfig.filterMode === 'whitelist' ? 'Whitelist (only listed numbers can message)' : 'Blacklist (listed numbers are blocked)'} 
            />
            <Chip label={whatsappConfig.filterMode.toUpperCase()} />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemText 
              primary="Numbers in Filter List" 
              secondary={whatsappConfig.filterNumbers.length > 0 
                ? whatsappConfig.filterNumbers.join(', ') 
                : 'No numbers in list'} 
            />
            <Chip label={whatsappConfig.filterNumbers.length.toString()} />
          </ListItem>
        </List>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Send Test Message
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Recipient Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              fullWidth
              helperText="Format: +14155238886 (include country code with + sign)"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Test Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          
          <Grid item xs={12}>
            {!filterStatus.allowed && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Warning: This number would {filterStatus.inList ? 'be blocked' : 'not be allowed'} based on your {whatsappConfig.filterMode} settings.
              </Alert>
            )}
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendTest}
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Sending...
                </>
              ) : (
                'Send Test Message'
              )}
            </Button>
          </Grid>
        </Grid>
        
        {sendResult && (
          <Box sx={{ mt: 3 }}>
            <Alert severity={sendResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
              {sendResult.message}
            </Alert>
            
            {sendResult.response && (
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(sendResult.response, null, 2)}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}