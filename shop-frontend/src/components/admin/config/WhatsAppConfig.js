import React, { useState } from 'react';
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
  CircularProgress
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { useConfig } from '../../../context/config';
// Import shared WhatsApp utilities
import { normalizePhoneNumber, isPhoneNumberInList } from '../../../shared/utils/whatsappFilters';

export default function WhatsAppConfig() {
  const { config, updateConfig } = useConfig();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCodeURL, setQrCodeURL] = useState('');
  const [qrCodeError, setQrCodeError] = useState('');
  
  // Initialize whatsappIntegration if it doesn't exist
  const whatsappConfig = config?.messaging?.whatsappIntegration || {
    enabled: false,
    phoneNumber: '',
    instanceName: '',
    filterMode: 'whitelist', // 'whitelist' or 'blacklist'
    filterNumbers: [],
    disableGroups: true,
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
      
      // Use the fixed instance name "teste" as shown in the curl command example
      // This is known to work with the Evolution API
      const instanceName = "teste";
      
      // Use environment variables when available, or fall back to defaults
      const evoBaseUrl = process.env.REACT_APP_EVO_BASE_URL || 'https://evolution-api-production-ad04.up.railway.app';
      
      // This API key should ideally come from environment variables
      // Warning: Hardcoded API keys in frontend code can be a security risk
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
      <Box>
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