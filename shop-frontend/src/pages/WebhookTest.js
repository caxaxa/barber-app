import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  checkConnectionStatus,
  checkWebhookConfig,
  setWebhookConfig,
  sendTestMessage,
  checkInstanceInfo
} from '../utils/testEvolutionWebhook';

export default function WebhookTest() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [webhookConfig, setWebhookConfig] = useState(null);
  const [instanceInfo, setInstanceInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [phoneNumber, setPhoneNumber] = useState('+14155238886');
  const [message, setMessage] = useState('Test message from webhook configuration');
  const [webhookUrl, setWebhookUrl] = useState('https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in');
  
  // Selected events for webhook
  const [selectedEvents, setSelectedEvents] = useState({
    'messages.upsert': true,
    'messages.update': true,
    'connection.update': true,
    'presence.update': false,
    'contacts.upsert': false,
    'groups.upsert': false
  });
  
  const resultsRef = useRef(null);
  
  // Scroll to bottom of results when new ones are added
  useEffect(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollTop = resultsRef.current.scrollHeight;
    }
  }, [results]);
  
  // Add a log entry
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { timestamp, message, type }]);
  };
  
  // Handle connection check
  const handleCheckConnection = async () => {
    setLoading(true);
    addLog('Checking WhatsApp connection...');
    
    try {
      const status = await checkConnectionStatus();
      setConnectionStatus(status);
      
      if (status && status.state === 'open') {
        addLog('Connection is active! WhatsApp is properly connected.', 'success');
      } else {
        addLog('Connection is NOT active. Please check WhatsApp connection.', 'error');
      }
    } catch (error) {
      addLog(`Error checking connection: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle webhook check
  const handleCheckWebhook = async () => {
    setLoading(true);
    addLog('Checking current webhook configuration...');
    
    try {
      const config = await checkWebhookConfig();
      setWebhookConfig(config);
      
      if (config && config.webhook.enabled) {
        addLog(`Webhook is configured to: ${config.webhook.url}`, 'success');
        addLog(`Events: ${config.webhook.events.join(', ')}`, 'info');
      } else {
        addLog('Webhook is not configured or disabled.', 'warning');
      }
    } catch (error) {
      addLog(`Error checking webhook: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle webhook setup
  const handleSetWebhook = async () => {
    setLoading(true);
    addLog(`Setting webhook to: ${webhookUrl}`);
    
    // Get selected events
    const events = Object.keys(selectedEvents).filter(event => selectedEvents[event]);
    
    if (events.length === 0) {
      addLog('Please select at least one event.', 'error');
      setLoading(false);
      return;
    }
    
    addLog(`Events: ${events.join(', ')}`);
    
    try {
      const result = await setWebhookConfig(events);
      
      if (result && result.status === 'success') {
        addLog('Webhook configured successfully!', 'success');
        // Refresh webhook config
        handleCheckWebhook();
      } else {
        addLog('Failed to configure webhook.', 'error');
      }
    } catch (error) {
      addLog(`Error setting webhook: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sending test message
  const handleSendTest = async () => {
    if (!phoneNumber) {
      addLog('Please enter a phone number.', 'error');
      return;
    }
    
    setLoading(true);
    addLog(`Sending test message to ${phoneNumber}...`);
    
    try {
      const result = await sendTestMessage(phoneNumber, message);
      
      if (result && result.status === 'success') {
        addLog('Message sent successfully!', 'success');
        addLog('Check if webhook was triggered in API Gateway logs.', 'info');
      } else {
        addLog('Failed to send message.', 'error');
      }
    } catch (error) {
      addLog(`Error sending message: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle checking instance info
  const handleCheckInstance = async () => {
    setLoading(true);
    addLog('Getting instance information...');
    
    try {
      const info = await checkInstanceInfo();
      setInstanceInfo(info);
      
      if (info) {
        addLog('Instance information retrieved.', 'success');
      } else {
        addLog('Failed to get instance information.', 'error');
      }
    } catch (error) {
      addLog(`Error getting instance info: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle event checkbox changes
  const handleEventChange = (event) => {
    setSelectedEvents({
      ...selectedEvents,
      [event.target.name]: event.target.checked
    });
  };
  
  // Format log entry with proper color
  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'error.main';
      case 'success': return 'success.main';
      case 'warning': return 'warning.main';
      default: return 'text.primary';
    }
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center">
        WhatsApp Webhook Configuration
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connection & Instance Status
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button 
              variant="contained" 
              onClick={handleCheckConnection}
              disabled={loading}
              fullWidth
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Check WhatsApp Connection
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Button 
              variant="contained" 
              onClick={handleCheckInstance}
              disabled={loading}
              fullWidth
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Check Instance Info
            </Button>
          </Grid>
          
          {connectionStatus && (
            <Grid item xs={12}>
              <Alert 
                severity={connectionStatus.state === 'open' ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                Connection State: {connectionStatus.state}
              </Alert>
              
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(connectionStatus, null, 2)}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {instanceInfo && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Instance Information:
              </Typography>
              
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(instanceInfo, null, 2)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Webhook Configuration
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Webhook URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              fullWidth
              margin="normal"
              helperText="The URL where Evolution API will send WhatsApp events"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Select Events to Monitor:
            </Typography>
            
            <Grid container>
              {Object.keys(selectedEvents).map(event => (
                <Grid item xs={12} sm={6} key={event}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedEvents[event]}
                        onChange={handleEventChange}
                        name={event}
                      />
                    }
                    label={event}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Button 
              variant="contained" 
              onClick={handleCheckWebhook}
              disabled={loading}
              fullWidth
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Check Current Webhook
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSetWebhook}
              disabled={loading}
              fullWidth
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Set Webhook Configuration
            </Button>
          </Grid>
          
          {webhookConfig && (
            <Grid item xs={12}>
              <Alert 
                severity={webhookConfig.webhook.enabled ? 'success' : 'warning'}
                sx={{ mb: 2 }}
              >
                Webhook Status: {webhookConfig.webhook.enabled ? 'Enabled' : 'Disabled'}
              </Alert>
              
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(webhookConfig, null, 2)}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Webhook with Message
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Recipient Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              fullWidth
              margin="normal"
              helperText="Format: +14155238886 (include country code with + sign)"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Test Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              fullWidth
              margin="normal"
              helperText="Message to send for webhook testing"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleSendTest}
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : null}
              Send Test Message
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Webhook Test Results
        </Typography>
        
        <Box 
          ref={resultsRef}
          sx={{ 
            height: 300, 
            overflow: 'auto', 
            bgcolor: '#f8f9fa', 
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace'
          }}
        >
          {results.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center">
              No test results yet. Run a test to see output here.
            </Typography>
          ) : (
            results.map((log, index) => (
              <Box key={index} sx={{ mb: 1 }}>
                <Typography variant="body2" sx={{ color: getLogColor(log.type) }}>
                  [{log.timestamp}] {log.message}
                </Typography>
              </Box>
            ))
          )}
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            After configuring the webhook and sending a test message, check your AWS CloudWatch logs 
            to see if the webhook triggered your Lambda function.
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
}