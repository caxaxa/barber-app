import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  FormHelperText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useConfig } from '../../../context/ConfigContext';

export default function DatabaseConfig({ isEnterpriseAccount }) {
  const { config, updateConfig } = useConfig();
  const [useEmptyData, setUseEmptyData] = useState(config?.database?.useEmptyData || false);

  // Handler for database configuration changes
  const handleDatabaseTypeChange = (value) => {
    updateConfig({
      ...config,
      database: {
        ...(config.database || {}),
        type: value
      }
    });
  };
  
  // Handler for DynamoDB configuration changes
  const handleDynamoDBChange = (field, value) => {
    updateConfig({
      ...config,
      database: {
        ...(config.database || {}),
        dynamodb: {
          ...(config.database?.dynamodb || {}),
          [field]: value
        }
      }
    });
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: 'calc(100vh - 160px)', overflow: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Configuração do Banco de Dados
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure os bancos de dados para armazenar informações de agendamentos, clientes{isEnterpriseAccount ? ' e trabalhadores' : ''}.
      </Typography>
      <Divider sx={{ my: 3 }} />
      
      {/* Database Type Selection */}
      <Typography variant="h6" gutterBottom color="primary">
        Configuração de Bancos de Dados
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Banco de Dados</InputLabel>
            <Select
              value={config?.database?.type || 'dynamodb'}
              onChange={(e) => handleDatabaseTypeChange(e.target.value)}
              label="Tipo de Banco de Dados"
            >
              <MenuItem value="dynamodb">AWS DynamoDB</MenuItem>
              <MenuItem value="local">Arquivo JSON Local</MenuItem>
            </Select>
            <FormHelperText>Escolha entre usar o DynamoDB na AWS ou armazenar dados localmente</FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
      
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        Preencha os ARNs abaixo ou deixe em branco para usar dados de exemplo.
      </Typography>
      
      {/* Calendar Database Configuration (Appointments Table) */}
      <Typography variant="h6" gutterBottom color="primary">
        Banco de Dados de Agendamentos
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <TextField
            label="ARN da Tabela de Agendamentos"
            fullWidth
            value={config?.database?.dynamodb?.appointmentsTableArn || ''}
            onChange={(e) => handleDynamoDBChange('appointmentsTableArn', e.target.value)}
            margin="normal"
            helperText="ARN da tabela de agendamentos. Ex: arn:aws:dynamodb:us-east-2:002938753233:table/Appointments"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Região AWS"
            fullWidth
            value={config?.database?.dynamodb?.region || 'us-east-1'}
            onChange={(e) => handleDynamoDBChange('region', e.target.value)}
            margin="normal"
            helperText="Região da AWS onde o DynamoDB está localizado (ex: us-east-1)"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Nome da Tabela de Agendamentos"
            fullWidth
            value={config?.database?.dynamodb?.appointmentsTable || 'Appointments'}
            onChange={(e) => handleDynamoDBChange('appointmentsTable', e.target.value)}
            margin="normal"
            helperText="Nome da tabela de agendamentos no DynamoDB"
          />
        </Grid>
      </Grid>

      {/* Customers Database Configuration */}
      <Typography variant="h6" gutterBottom color="primary">
        Banco de Dados de Clientes
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <TextField
            label="ARN da Tabela de Clientes"
            fullWidth
            value={config?.database?.dynamodb?.customersTableArn || ''}
            onChange={(e) => handleDynamoDBChange('customersTableArn', e.target.value)}
            margin="normal"
            helperText="ARN da tabela de clientes. Ex: arn:aws:dynamodb:us-east-2:002938753233:table/CustomerProfiles"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Nome da Tabela de Clientes"
            fullWidth
            value={config?.database?.dynamodb?.customersTable || 'Customers'}
            onChange={(e) => handleDynamoDBChange('customersTable', e.target.value)}
            margin="normal"
            helperText="Nome da tabela de clientes no DynamoDB"
          />
        </Grid>
      </Grid>

      {/* Workers Database Configuration (only for enterprise accounts) */}
      {isEnterpriseAccount && (
        <>
          <Typography variant="h6" gutterBottom color="primary">
            Banco de Dados de Trabalhadores
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <TextField
                label="ARN da Tabela de Trabalhadores"
                fullWidth
                value={config?.database?.dynamodb?.workersTableArn || ''}
                onChange={(e) => handleDynamoDBChange('workersTableArn', e.target.value)}
                margin="normal"
                helperText="ARN da tabela de trabalhadores. Ex: arn:aws:dynamodb:us-east-2:002938753233:table/Barbers"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Nome da Tabela de Trabalhadores"
                fullWidth
                value={config?.database?.dynamodb?.workersTable || 'Workers'}
                onChange={(e) => handleDynamoDBChange('workersTable', e.target.value)}
                margin="normal"
                helperText="Nome da tabela de trabalhadores no DynamoDB"
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* Empty Data Toggle */}
      <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
        Dados Iniciais
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={useEmptyData}
                onChange={(e) => {
                  setUseEmptyData(e.target.checked);
                  updateConfig({
                    ...config,
                    database: {
                      ...(config.database || {}),
                      useEmptyData: e.target.checked
                    }
                  });
                }}
              />
            }
            label="Usar dados vazios quando ARNs não estão configurados"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Quando ativado, o sistema iniciará com um banco de dados vazio se os ARNs não estiverem configurados.
            Quando desativado, serão usados dados de exemplo.
          </Typography>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Para usar o DynamoDB, você precisará fornecer os ARNs das tabelas completos. 
          Se os ARNs não forem fornecidos, o sistema usará dados de exemplo ou vazios.
          <br /><br />
          <strong>Exemplo para conta empresarial:</strong><br />
          • Agendamentos: arn:aws:dynamodb:us-east-2:002938753233:table/Appointments<br />
          • Clientes: arn:aws:dynamodb:us-east-2:002938753233:table/CustomerProfiles<br />
          • Trabalhadores: arn:aws:dynamodb:us-east-2:002938753233:table/Barbers<br />
        </Typography>
      </Alert>
    </Paper>
  );
}

DatabaseConfig.propTypes = {
  isEnterpriseAccount: PropTypes.bool
};