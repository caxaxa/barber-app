import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  FormHelperText,
  Alert,
  Box,
  Button,
  RadioGroup,
  Radio,
  FormLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import SendIcon from '@mui/icons-material/Send';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useConfig } from '../../../context/config';
// Import shared WhatsApp utilities
import { normalizePhoneNumber } from '../../../shared/utils/whatsappFilters';
// Import WhatsApp API service
import { 
  checkWhatsAppConnection,
  configureWhatsAppWebhook,
  getWhatsAppWebhookConfig,
  sendWhatsAppMessage,
  testWhatsAppIntegrationFlow
} from '../../../services/whatsappApi';

export default function WhatsAppConfig() {
  const { config, updateConfig } = useConfig();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCodeURL, setQrCodeURL] = useState('');
  const [qrCodeError, setQrCodeError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [isConfiguringWebhook, setIsConfiguringWebhook] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [testNumber, setTestNumber] = useState('+14155238886'); // Twilio number
  const [testMessage, setTestMessage] = useState('Teste do sistema de agendamentos via WhatsApp');
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState(null);
  
  // Initialize whatsappIntegration if it doesn't exist
  const whatsappConfig = config?.messaging?.whatsappIntegration || {
    enabled: false,
    phoneNumber: '',
    instanceName: 'teste', // Default to 'teste' since that's currently configured
    filterMode: 'whitelist', // 'whitelist' or 'blacklist'
    filterNumbers: ['+14155238886'], // Explicitly whitelist the Twilio test number
    disableGroups: true,
    webhookUrl: 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in',
    adIntegration: {
      enabled: false,
      campaignId: ''
    }
  };
  
  // Handler for WhatsApp integration changes
  const handleWhatsAppChange = (field, value) => {
    const updatedWhatsApp = {
      ...whatsappConfig,
      [field]: value
    };
    
    updateConfig({
      ...config,
      messaging: {
        ...(config.messaging || {}),
        whatsappIntegration: updatedWhatsApp
      }
    });
  };
  
  // Check connection status when component mounts
  useEffect(() => {
    if (whatsappConfig.enabled) {
      // Check connection status when component mounts or enabled status changes
      handleCheckConnection();
      
      // Also check if webhook is configured
      const checkWebhookConfig = async () => {
        try {
          const result = await getWhatsAppWebhookConfig();
          if (result.success && result.data?.webhookUrl) {
            setWebhookConfigured(true);
            // Update the webhook URL in the config if it's different
            if (result.data.webhookUrl !== whatsappConfig.webhookUrl) {
              handleWhatsAppChange('webhookUrl', result.data.webhookUrl);
            }
          }
        } catch (error) {
          console.error('Error checking webhook configuration:', error);
        }
      };
      
      checkWebhookConfig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whatsappConfig.enabled]);
  
  // Handler for ad integration changes
  const handleAdIntegrationChange = (field, value) => {
    const updatedAdIntegration = {
      ...whatsappConfig.adIntegration,
      [field]: value
    };
    
    handleWhatsAppChange('adIntegration', updatedAdIntegration);
  };
  
  // Function to handle filter numbers input
  const handleFilterNumbersChange = (e) => {
    const numbersText = e.target.value;
    // Split by commas, new lines, or spaces and filter out empty strings
    const numbersArray = numbersText.split(/[,\n\s]+/)
      .filter(n => n.trim())
      .map(normalizePhoneNumber); // Use the shared utility to normalize numbers
    
    // Remove duplicates
    const uniqueNumbers = [...new Set(numbersArray)];
    handleWhatsAppChange('filterNumbers', uniqueNumbers);
  };
  
  // Generate a string representation of the filter numbers for the text field
  const getFilterNumbersString = () => {
    return (whatsappConfig.filterNumbers || []).join('\n');
  };
  
  // Handler for check connection
  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    
    try {
      const result = await checkWhatsAppConnection();
      setConnectionStatus(result);
      
      if (result.connected) {
        setSnackbarMessage(`WhatsApp está conectado! ${result.data?.phone ? `Número conectado: ${result.data.phone}` : ''}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('WhatsApp não está conectado. Por favor, escaneie o QR code.');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      setSnackbarMessage(`Erro ao verificar conexão: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsCheckingConnection(false);
    }
  };
  
  // Handler for webhook configuration
  const handleConfigureWebhook = async () => {
    setIsConfiguringWebhook(true);
    
    try {
      // Use webhook URL from config or default
      const webhookUrl = whatsappConfig.webhookUrl || 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in';
      
      // Save webhook URL in config
      handleWhatsAppChange('webhookUrl', webhookUrl);
      
      // Events to monitor
      const events = [
        'messages.upsert',
        'messages.update',
        'connection.update',
        'status.instance'
      ];
      
      const result = await configureWhatsAppWebhook(webhookUrl, events);
      
      if (result.success) {
        setWebhookConfigured(true);
        setSnackbarMessage('Webhook configurado com sucesso!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(`Falha ao configurar webhook: ${result.error}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error configuring webhook:', error);
      setSnackbarMessage(`Erro ao configurar webhook: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsConfiguringWebhook(false);
    }
  };
  
  // Handler for sending test message
  const handleSendTest = async () => {
    if (!testNumber) {
      setSnackbarMessage('Por favor, informe um número de telefone para teste');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    setIsSendingTest(true);
    
    try {
      // Force check connection first - so we have updated status
      if (!connectionStatus) {
        try {
          await handleCheckConnection();
        } catch (connError) {
          // Continue anyway even if connection check fails
          console.warn('Failed to check connection before sending:', connError);
        }
      }
      
      const result = await sendWhatsAppMessage(testNumber, testMessage);
      setTestResult(result);
      
      if (result.success) {
        // If message was successful, update connection status to indicate we're connected
        setConnectionStatus(prev => ({
          ...prev,
          connected: true,
          data: { ...(prev?.data || {}), inferredFromMessageSuccess: true }
        }));
        
        setSnackbarMessage(`Mensagem de teste enviada com sucesso! ${result.data?.key?.id ? `ID: ${result.data.key.id}` : ''}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(`Falha ao enviar mensagem: ${result.error}`);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      setSnackbarMessage(`Erro ao enviar mensagem: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Handler for running diagnostics
  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticsResult(null);
    
    try {
      // Run the comprehensive test flow
      const result = await testWhatsAppIntegrationFlow(testNumber);
      setDiagnosticsResult(result);
      
      // Show basic status in snackbar
      if (result.success) {
        setSnackbarMessage('WhatsApp está configurado corretamente!');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage(`Diagnóstico encontrou ${result.issues.length} problema(s). Verifique o relatório.`);
        setSnackbarSeverity('warning');
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      setSnackbarMessage(`Erro ao executar diagnóstico: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };
  
  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // Generate QR code for WhatsApp connection using Evolution API
  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    setQrCodeError('');
    
    try {
      // Use the shared utility to normalize phone number
      const phoneNumber = normalizePhoneNumber(whatsappConfig.phoneNumber).replace(/\D/g, '');
      if (!phoneNumber) {
        throw new Error('Número de telefone é obrigatório');
      }
      
      // Use the fixed instance name "teste" which is already connected on Railway
      const instanceName = "teste";
      
      // Use environment variables when available, or fall back to defaults
      const evoBaseUrl = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
      
      // Using the confirmed API key
      const evoApiKey = process.env.REACT_APP_EVO_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
      
      // Make API call to generate QR code
      const response = await fetch(`${evoBaseUrl}/instance/connect/${instanceName}?number=${phoneNumber}`, {
        method: 'GET',
        headers: {
          'apikey': evoApiKey
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API responded with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Extract QR code from response (handling different response formats)
      let qrCode = null;
      
      if (data.qrcode?.base64) {
        qrCode = data.qrcode.base64;
      } else if (data.qrcode) {
        qrCode = data.qrcode;
      } else if (data.base64) {
        qrCode = data.base64;
      }
      
      if (!qrCode) {
        throw new Error('QR code not found in response');
      }
      
      // Update state with QR code and open dialog
      setQrCodeURL(qrCode);
      setQrDialogOpen(true);
      
      // Save the instance name for future reference
      handleWhatsAppChange('instanceName', instanceName);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrCodeError(`Falha ao gerar o QR code: ${error.message}`);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Integração com WhatsApp
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure sua integração com WhatsApp via Evolution API para atendimento automatizado.
      </Typography>
      <Divider sx={{ my: 3 }} />
      
      {/* Basic WhatsApp Configuration */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Configuração Básica
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={whatsappConfig.enabled || false}
                  onChange={(e) => handleWhatsAppChange('enabled', e.target.checked)}
                />
              }
              label="Ativar integração com WhatsApp"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Número de WhatsApp Business"
              fullWidth
              value={whatsappConfig.phoneNumber || ''}
              onChange={(e) => handleWhatsAppChange('phoneNumber', e.target.value)}
              margin="normal"
              disabled={!whatsappConfig.enabled}
              helperText="Formato: +5511999999999"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              label="Provedor de Integração"
              value="Evolution API"
              fullWidth
              disabled
              margin="normal"
              helperText="A integração é realizada via Evolution API"
            />
          </Grid>
          
          <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<QrCodeIcon />}
                onClick={handleGenerateQR}
                disabled={!whatsappConfig.enabled || isGeneratingQR}
                sx={{ mt: 2 }}
              >
                {isGeneratingQR ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Gerando QR Code...
                  </>
                ) : (
                  'Gerar QR Code para Conexão'
                )}
              </Button>
              {qrCodeError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {qrCodeError}
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Clique para gerar um QR Code que você poderá escanear no WhatsApp para conectar sua conta.
              </Typography>
            </Grid>
        </Grid>
      </Box>
      
      {/* Advanced WhatsApp Configuration */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Configuração Avançada
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={whatsappConfig.disableGroups || false}
                  onChange={(e) => handleWhatsAppChange('disableGroups', e.target.checked)}
                  disabled={!whatsappConfig.enabled}
                />
              }
              label="Nunca responder mensagens de grupos"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Quando ativado, o bot ignorará todas as mensagens enviadas em grupos do WhatsApp.
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl component="fieldset" sx={{ mt: 2 }} disabled={!whatsappConfig.enabled}>
              <FormLabel component="legend">Modo de Filtragem de Números</FormLabel>
              <RadioGroup
                value={whatsappConfig.filterMode || 'whitelist'}
                onChange={(e) => handleWhatsAppChange('filterMode', e.target.value)}
                row
              >
                <FormControlLabel value="whitelist" control={<Radio />} label="Lista de Permissão" />
                <FormControlLabel value="blacklist" control={<Radio />} label="Lista de Bloqueio" />
              </RadioGroup>
              <FormHelperText>
                {whatsappConfig.filterMode === 'whitelist' 
                  ? 'Lista de Permissão: Apenas os números listados abaixo receberão respostas do bot' 
                  : 'Lista de Bloqueio: Os números listados abaixo nunca receberão respostas do bot'}
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label={whatsappConfig.filterMode === 'whitelist' ? 'Números Permitidos' : 'Números Bloqueados'}
              fullWidth
              multiline
              rows={4}
              value={getFilterNumbersString()}
              onChange={handleFilterNumbersChange}
              margin="normal"
              disabled={!whatsappConfig.enabled}
              helperText="Digite um número por linha (formato: +5511999999999)"
              placeholder="+5511999999999&#10;+5511888888888&#10;+5511777777777"
            />
          </Grid>
        </Grid>
      </Box>
      
      {/* Ads Integration */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Integração com Anúncios
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={whatsappConfig.adIntegration?.enabled || false}
                  onChange={(e) => handleAdIntegrationChange('enabled', e.target.checked)}
                  disabled={!whatsappConfig.enabled}
                />
              }
              label="Ativar integração com anúncios"
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="ID da Campanha de Anúncios"
              fullWidth
              value={whatsappConfig.adIntegration?.campaignId || ''}
              onChange={(e) => handleAdIntegrationChange('campaignId', e.target.value)}
              margin="normal"
              disabled={!whatsappConfig.enabled || !whatsappConfig.adIntegration?.enabled}
              helperText="ID da campanha de anúncios do Facebook/Instagram"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                A integração com anúncios permite que os usuários que clicarem em um anúncio do tipo 
                &quot;Enviar mensagem&quot; sejam automaticamente atendidos pelo bot. É necessário configurar 
                corretamente a campanha de anúncios no Facebook Ads Manager.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Box>

      {/* Webhook Configuration and Testing */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Webhook e Testes
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Configure o webhook para receber mensagens e teste a integração WhatsApp.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="URL do Webhook"
              fullWidth
              value={whatsappConfig.webhookUrl || 'https://yrkr81hodi.execute-api.us-east-2.amazonaws.com/Prod/whatsapp-in'}
              onChange={(e) => handleWhatsAppChange('webhookUrl', e.target.value)}
              margin="normal"
              disabled={!whatsappConfig.enabled}
              helperText="URL onde o Evolution API enviará eventos (mensagens)"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCheckConnection}
                disabled={!whatsappConfig.enabled || isCheckingConnection}
                startIcon={isCheckingConnection ? <CircularProgress size={20} /> : <SyncIcon />}
                sx={{ flex: 1 }}
              >
                Verificar Conexão
              </Button>
              
              <Button
                variant="contained"
                color="secondary"
                onClick={handleConfigureWebhook}
                disabled={!whatsappConfig.enabled || isConfiguringWebhook}
                startIcon={isConfiguringWebhook ? <CircularProgress size={20} /> : webhookConfigured ? <CheckCircleIcon /> : <SyncIcon />}
                sx={{ flex: 1 }}
              >
                Configurar Webhook
              </Button>
              
              <Button
                variant="outlined"
                color="info"
                onClick={handleRunDiagnostics}
                disabled={!whatsappConfig.enabled || isRunningDiagnostics}
                startIcon={isRunningDiagnostics ? <CircularProgress size={20} /> : <SyncIcon />}
                sx={{ flex: 1 }}
              >
                Diagnóstico Completo
              </Button>
            </Box>
          </Grid>
          
          {connectionStatus && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: connectionStatus.connected ? '#e8f5e9' : '#ffebee' }}>
                <Box display="flex" alignItems="center" mb={1}>
                  {connectionStatus.connected ? <CheckCircleIcon color="success" sx={{ mr: 1 }} /> : <ErrorIcon color="error" sx={{ mr: 1 }} />}
                  <Typography variant="subtitle1" color={connectionStatus.connected ? 'success.main' : 'error.main'}>
                    Status da Conexão: {connectionStatus.connected ? 'Conectado' : 'Desconectado'}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {connectionStatus.connected 
                    ? `O WhatsApp está conectado e pronto para receber e enviar mensagens. ${connectionStatus.data?.phone ? `Número conectado: ${connectionStatus.data.phone}` : ''}`
                    : 'O WhatsApp não está conectado. Por favor, gere um QR Code e escaneie-o com seu WhatsApp.'}
                </Typography>
              </Box>
            </Grid>
          )}
          
          {webhookConfigured && (
            <Grid item xs={12}>
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Webhook configurado com sucesso para a URL: {whatsappConfig.webhookUrl}
                </Typography>
              </Alert>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              Enviar Mensagem de Teste
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Número de Destino"
                  fullWidth
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  margin="normal"
                  disabled={!whatsappConfig.enabled || isSendingTest}
                  helperText="Formato: +14155238886 (inclua o código do país com sinal +)"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Mensagem de Teste"
                  fullWidth
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  margin="normal"
                  disabled={!whatsappConfig.enabled || isSendingTest}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendTest}
                  disabled={!whatsappConfig.enabled || isSendingTest || !testNumber}
                  startIcon={isSendingTest ? <CircularProgress size={20} /> : <SendIcon />}
                  fullWidth
                >
                  Enviar Mensagem de Teste
                </Button>
                {!connectionStatus?.connected && whatsappConfig.enabled && (
                  <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                    Nota: A verificação indica que o WhatsApp pode estar desconectado, mas você ainda pode tentar enviar mensagens.
                  </Typography>
                )}
              </Grid>
              
              {testResult && (
                <Grid item xs={12}>
                  <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 2 }}>
                    {testResult.success 
                      ? `Mensagem enviada com sucesso! ${testResult.data?.key?.id ? `ID: ${testResult.data.key.id}` : ''}` 
                      : `Falha ao enviar mensagem: ${testResult.error}`}
                  </Alert>
                </Grid>
              )}
              
              {/* Diagnostics Results */}
              {diagnosticsResult && (
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Paper sx={{ p: 2, border: 1, borderColor: diagnosticsResult.success ? 'success.main' : 'warning.main', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Relatório de Diagnóstico WhatsApp
                    </Typography>
                    
                    <Alert severity={diagnosticsResult.success ? 'success' : 'warning'} sx={{ mb: 2 }}>
                      <Typography variant="body1">
                        {diagnosticsResult.summary}
                      </Typography>
                    </Alert>
                    
                    {diagnosticsResult.issues.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          Problemas Encontrados:
                        </Typography>
                        {diagnosticsResult.issues.map((issue, index) => (
                          <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                            • {issue}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    
                    {diagnosticsResult.recommendations.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          Recomendações:
                        </Typography>
                        {diagnosticsResult.recommendations.map((rec, index) => (
                          <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                            • {rec}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Resultados Detalhados:
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Conexão:</strong> {diagnosticsResult.connection?.connected ? 'Conectado' : 'Desconectado'}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Webhook:</strong> {diagnosticsResult.webhook?.enabled ? 'Configurado' : 'Não configurado'}
                        {diagnosticsResult.webhook?.webhookUrl ? ` (${diagnosticsResult.webhook.webhookUrl})` : ''}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Mensagem de Teste:</strong> {diagnosticsResult.message?.success ? 'Enviada com sucesso' : 'Falhou'}
                        {diagnosticsResult.message?.error ? ` (${diagnosticsResult.message.error})` : ''}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="outlined" onClick={() => setDiagnosticsResult(null)}>Fechar Relatório</Button>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>
      
      {/* Notification Settings */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Configurações de Notificações
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={whatsappConfig.notifications?.appointmentConfirmation || false}
                  onChange={(e) => handleWhatsAppChange('notifications', {
                    ...whatsappConfig.notifications,
                    appointmentConfirmation: e.target.checked
                  })}
                  disabled={!whatsappConfig.enabled}
                />
              }
              label="Enviar confirmação de agendamento"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Envia uma mensagem de confirmação quando um agendamento é realizado.
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={whatsappConfig.notifications?.appointmentReminder || false}
                  onChange={(e) => handleWhatsAppChange('notifications', {
                    ...whatsappConfig.notifications,
                    appointmentReminder: e.target.checked
                  })}
                  disabled={!whatsappConfig.enabled}
                />
              }
              label="Enviar lembretes de agendamento"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Envia lembretes antes da data do agendamento.
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={whatsappConfig.notifications?.feedbackRequest || false}
                  onChange={(e) => handleWhatsAppChange('notifications', {
                    ...whatsappConfig.notifications,
                    feedbackRequest: e.target.checked
                  })}
                  disabled={!whatsappConfig.enabled}
                />
              }
              label="Solicitar feedback após o atendimento"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Envia uma mensagem solicitando feedback após o horário do agendamento.
            </Typography>
          </Grid>
        </Grid>
      </Box>
      
      {/* Message Templates */}
      <Box>
        <Typography variant="h6" gutterBottom color="primary">
          Modelos de Mensagens
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Personalize as mensagens enviadas pelo sistema. Use {'{nome}'}, {'{data}'}, {'{hora}'}, {'{serviço}'} e {'{profissional}'} como variáveis.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Mensagem de Boas-vindas"
              fullWidth
              multiline
              rows={3}
              value={whatsappConfig.templates?.welcome || 'Olá {nome}! Bem-vindo(a) ao nosso sistema de agendamentos. Como posso ajudar hoje?'}
              onChange={(e) => handleWhatsAppChange('templates', {
                ...whatsappConfig.templates,
                welcome: e.target.value
              })}
              margin="normal"
              disabled={!whatsappConfig.enabled}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Confirmação de Agendamento"
              fullWidth
              multiline
              rows={3}
              value={whatsappConfig.templates?.confirmation || 'Seu agendamento foi confirmado:\n\nServiço: {serviço}\nData: {data}\nHora: {hora}\nProfissional: {profissional}\n\nAgradecemos a preferência!'}
              onChange={(e) => handleWhatsAppChange('templates', {
                ...whatsappConfig.templates,
                confirmation: e.target.value
              })}
              margin="normal"
              disabled={!whatsappConfig.enabled}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Lembrete de Agendamento"
              fullWidth
              multiline
              rows={3}
              value={whatsappConfig.templates?.reminder || 'Olá {nome}! Lembrete do seu agendamento amanhã:\n\nServiço: {serviço}\nData: {data}\nHora: {hora}\nProfissional: {profissional}\n\nEstamos aguardando você!'}
              onChange={(e) => handleWhatsAppChange('templates', {
                ...whatsappConfig.templates,
                reminder: e.target.value
              })}
              margin="normal"
              disabled={!whatsappConfig.enabled}
            />
          </Grid>
        </Grid>
      </Box>
      
      {/* Global Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Escaneie o QR Code no WhatsApp</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {qrCodeURL && (
              <img 
                src={qrCodeURL} 
                alt="WhatsApp QR Code" 
                style={{ maxWidth: '100%', height: 'auto' }} 
              />
            )}
          </Box>
          <Typography variant="body2" align="center">
            Abra o WhatsApp no seu celular, vá em Configurações &gt; Aparelhos conectados &gt; Conectar um aparelho
            e escaneie este QR code.
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Este QR code expira em 45 segundos. Se expirar, feche esta janela e gere um novo.
          </Alert>
          <Alert severity="info" sx={{ mt: 2 }}>
            Após escanear, aguarde até que a conexão seja estabelecida. O sistema receberá e enviará mensagens
            automaticamente uma vez que o status da instância for atualizado para &quot;CONNECTED&quot;.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Fechar</Button>
          <Button onClick={handleGenerateQR} color="primary" startIcon={<QrCodeIcon />}>
            Gerar Novo QR Code
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}