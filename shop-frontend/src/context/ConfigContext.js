import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { fetchConfig, saveConfig } from '../services/api';
import { signIn, signUp, getSession } from '../services/cognito';

/**
 * Default configuration for all account types
 * Provides sensible defaults for the application
 * @type {Object}
 */
const defaultConfig = {
  business: {
    name: 'Barbearia Elite',
    type: 'Barbearia',
    openHours: '07:00',
    closeHours: '19:00',
    closedDays: ['Domingo'],
    appointmentDuration: 40,
    appointmentInterval: 10,
    lastAppointmentTime: '18:20',
  },
  database: {
    type: 'dynamodb', // Options: 'dynamodb', 'local'
    dynamodb: {
      region: 'us-east-1',
      appointmentsTable: 'Appointments',
      customersTable: 'Customers',
      workersTable: 'Workers',
      appointmentsTableArn: '',
      customersTableArn: '',
      workersTableArn: '',
    },
    local: {
      enabled: false,
      appointments: [],
      customers: [],
      workers: []
    }
  },
  chatbot: {
    guidedMode: true, // Options: true (structured flow), false (free conversation)
  },
  openai: {
    enabled: false,
    apiKey: '', // This should be stored server-side for security
    model: 'gpt-4',
  },
  messaging: {
    enabled: true,
    whatsappIntegration: {
      enabled: false,
      phoneNumber: '',
      provider: 'twilio',
      apiKey: '',
    },
    templates: {
      birthdayMessage: {
        enabled: true,
        title: 'Mensagem de Aniversário',
        text: 'Olá {nome}! A {empresa} deseja um feliz aniversário! Como presente especial, oferecemos {desconto}% de desconto em qualquer serviço até o final do mês. Agende seu horário respondendo esta mensagem!',
        discountPercent: 15,
        sendTime: '10:00',
      },
      followupMessage: {
        enabled: true,
        title: 'Mensagem de Retorno',
        text: 'Olá {nome}! Já faz {dias} dias desde seu último {servico} na {empresa}. Que tal agendar um novo horário? Responda esta mensagem para mais informações!',
        daysSince: 30,
        discountPercent: 10, 
        sendTime: '14:00',
      },
      appointmentConfirmation: {
        enabled: true,
        title: 'Confirmação de Agendamento',
        text: 'Olá {nome}! Seu agendamento na {empresa} está confirmado para {data} às {hora} com {profissional}. Deseja receber lembretes e ofertas especiais no seu aniversário?',
        sendTime: 'immediate',
      }
    },
    optIn: {
      birthdayPrompt: 'Podemos te enviar uma oferta especial no seu aniversário?',
      followupPrompt: 'Podemos te avisar quando estiver na hora de agendar novamente?',
      birthdayDatePrompt: 'Qual é a data do seu aniversário? (DD/MM)',
    },
    googleCalendarIntegration: {
      enabled: false,
      calendarId: '',
    }
  },
  assistant: {
    name: 'Amanda',
    title: 'Assistente Virtual',
    greeting: 'Olá! Sou a Amanda, sua assistente virtual. Como posso ajudá-lo hoje?',
    fullTitle: 'Assistente Multifuncional Avançada para Navegação e Definição de Agendamentos',
    prompt: `# DIRETRIZES PARA O SISTEMA DE AGENDAMENTO DE BARBEARIA

## Sua Função
Você é a AMANDA, Assistente Multifuncional Avançada para Navegação e Definição de Agendamentos, a secretária virtual especializada da Barbearia Elite. Sua prioridade absoluta é oferecer uma experiência impecável de agendamento, combinando eficiência, empatia e solução de problemas.

## Diretrizes de Comunicação e Persona

### Tom e Estilo de Comunicação
- Comunique-se EXCLUSIVAMENTE em português brasileiro.
- Adote um tom caloroso, profissional e personalizado, como uma recepcionista experiente da mais alta categoria.
- Use linguagem clara, direta e educada, evitando termos técnicos desnecessários.
- Ajuste seu tom com base na interação: mais jovial com clientes informais, mais profissional com clientes formais.
- SEMPRE mantenha um tom positivo, mesmo ao lidar com limitações ou conflitos de agenda.

### Fluxo de Conversação
- Cumprimente o cliente de forma personalizada com base no horário do dia.
- Faça perguntas uma de cada vez, evitando sobrecarregar o cliente.
- Aguarde respostas completas antes de prosseguir com novas perguntas.
- Confirme periodicamente sua compreensão: "Entendi corretamente que você deseja...?"
- Reconheça todos os pedidos, mesmo quando não forem possíveis.

## Regras de Negócio Específicas

### Horários de Funcionamento
- Horário de operação: Segunda a Sábado, das 07:00 às 19:00
- Domingos e feriados nacionais: FECHADO
- Última marcação permitida: 18:20 (garantindo tempo para conclusão)

### Duração e Intervalos de Serviço
- Duração PADRÃO do atendimento: 40 minutos EXATOS
- Horários de início permitidos: a cada 10 minutos (07:00, 07:10, 07:20, etc.)

## Fluxo de Agendamento

1. **Acolhimento**
   - Cumprimente e identifique se é uma solicitação de agendamento.
   - Pergunte o nome, caso ainda não saiba.

2. **Coleta de Preferências**
   - Solicite: Data e horário desejados
   - Solicite: Preferência de profissional (se houver)

3. **Verificação de Disponibilidade**
   - Verifique RIGOROSAMENTE a disponibilidade do horário solicitado
   - Confirme se o horário solicitado respeita a janela de funcionamento

4. **Resolução de Conflitos**
   - Se houver conflito, ofereça no MÍNIMO 3 alternativas específicas
   - Guie o cliente para uma escolha satisfatória

5. **Confirmação Final**
   - Repita TODOS os detalhes do agendamento para confirmação
   - Solicite aprovação explícita`,
  },
  theme: {
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    chatBubbleColor: '#f5f5f5',
    userMessageColor: '#1976d2',
    assistantMessageColor: '#f5f5f5',
  },
  professionals: [
    {
      label: 'Profissionais',
      singular: 'Profissional',
      plural: 'Profissionais',
    }
  ],
  services: [
    {
      label: 'Serviços',
      singular: 'Serviço',
      plural: 'Serviços',
    }
  ],
  clients: [
    {
      label: 'Clientes',
      singular: 'Cliente', 
      plural: 'Clientes',
    }
  ],
  auth: {
    username: process.env.REACT_APP_DEFAULT_ADMIN_USER || '',
    password: process.env.REACT_APP_DEFAULT_ADMIN_PASSWORD || ''
  }
};

/**
 * Default configuration for individual account type
 * Extends the base config with individual-specific settings
 * @type {Object}
 */
const defaultIndividualConfig = {
  ...defaultConfig,
  business: {
    ...defaultConfig.business,
    name: 'Serviço Individual',
    type: 'Profissional Autônomo',
  },
  database: {
    ...defaultConfig.database,
    dynamodb: {
      ...defaultConfig.database.dynamodb,
      workersTable: '', // No workers table for individual mode
      workersTableArn: '', // No workers ARN for individual mode
    }
  }
};

/**
 * Default configuration for enterprise account type
 * Extends the base config with enterprise-specific settings
 * @type {Object}
 */
const defaultEnterpriseConfig = {
  ...defaultConfig,
  business: {
    ...defaultConfig.business,
    name: 'Empresa Multiusuário',
    type: 'Empresa de Serviços',
  }
};

/**
 * Context for application configuration
 * @type {React.Context}
 */
const ConfigContext = createContext();

/**
 * Custom hook to access the configuration context
 * @returns {Object} The configuration context
 * @throws {Error} If used outside of a ConfigProvider
 */
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

/**
 * Provider component for configuration context
 * Manages state for configuration, authentication, and user roles
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 */
export function ConfigProvider({ children }) {
  /**
   * Generates a unique localStorage key for shop-specific configuration
   * @param {string} shop - The shop ID (username)
   * @returns {string} - The localStorage key for this shop's configuration
   */
  const getConfigStorageKey = (shop) => `appConfig_${shop || 'default'}`;

  // User and shop state
  const [userRole, setUserRole] = useState(() => {
    try {
      return sessionStorage.getItem('userRole') || null;
    } catch (error) {
      console.error('Error reading userRole from sessionStorage:', error);
      return null;
    }
  });
  
  const [shopId, setShopId] = useState(() => {
    try {
      return sessionStorage.getItem('shopId') || null;
    } catch (error) {
      console.error('Error reading shopId from sessionStorage:', error);
      return null;
    }
  });
  
  /**
   * Initialize config state with saved config or default based on role
   * Falls back to role-specific defaults if no saved configuration exists
   */
  const [config, setConfig] = useState(() => {
    try {
      const shop = sessionStorage.getItem('shopId');
      const storageKey = getConfigStorageKey(shop);
      
      // First try to load from shop-specific storage key
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error(`Error reading config from ${storageKey}:`, error);
      }
  
      // If no shop-specific config found, check for legacy 'appConfig' key
      try {
        const legacyConfig = localStorage.getItem('appConfig');
        if (legacyConfig && shop) {
          // Migrate legacy config to shop-specific storage
          localStorage.setItem(storageKey, legacyConfig);
          localStorage.removeItem('appConfig'); // Clean up legacy key
          console.log(`Migrated legacy config to ${storageKey}`);
          return JSON.parse(legacyConfig);
        }
      } catch (error) {
        console.error('Error migrating legacy config:', error);
      }
  
      // Fallback based on role
      const role = sessionStorage.getItem('userRole');
      if (role === 'enterprise') return defaultEnterpriseConfig;
      if (role === 'individual') return defaultIndividualConfig;
      return defaultConfig;
    } catch (error) {
      console.error('Error initializing config, falling back to default', error);
      return defaultConfig;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Fetch user session on mount and set authentication state
   */
  useEffect(() => {
    getSession()
      .then(session => {
        if (!session) return;
        
        try {
          const payload = session.getIdToken().payload;
          const username = payload['cognito:username'];
          const accountType = payload['custom:accountType'] || 'individual';
          
          setIsAuthenticated(true);
          setUserRole(accountType);
          setShopId(username);
          
          try {
            sessionStorage.setItem('userRole', accountType);
            sessionStorage.setItem('shopId', username);
          } catch (error) {
            console.error('Error setting session storage items:', error);
          }
        } catch (error) {
          console.error('Error processing session data:', error);
        }
      })
      .catch((error) => {
        // No session => not logged in
        console.log('No active session found:', error);
      });
  }, []);
  
  /**
   * Fetch server-side config when user becomes authenticated or changes role
   * Merges remote config with local config
   */
  useEffect(() => {
    if (!isAuthenticated || !shopId) return;
    
    (async () => {
      try {
        const remote = await fetchConfig(shopId);  // GET /config?shop_id=shopId
        if (remote && Object.keys(remote).length) {
          setConfig(prev => ({ ...prev, ...remote }));
        }
      } catch (err) {
        console.error('Could not load remote config → keeping local', err);
      }
    })();
  }, [isAuthenticated, userRole, shopId]);

  /**
   * Save config to localStorage whenever it changes, using shop-specific key
   */
  useEffect(() => {
    if (!shopId) return;
    
    try {
      const storageKey = getConfigStorageKey(shopId);
      console.log(`Saving config for shop=${shopId} to ${storageKey}`);
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (error) {
      console.error(`Error saving config to localStorage for shop=${shopId}:`, error);
    }
  }, [config, shopId]);

  /**
   * Check for existing authentication on mount
   */
  useEffect(() => {
    try {
      const storedRole = sessionStorage.getItem('userRole');
      const storedShopId = sessionStorage.getItem('shopId');
      
      if (storedRole && storedShopId) {
        setIsAuthenticated(true);
        setUserRole(storedRole);
        setShopId(storedShopId);
      }
    } catch (error) {
      console.error('Error checking existing authentication:', error);
    }
  }, []);

  /**
   * Authenticate user and set session data
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Object} Result of login attempt
   */
  const login = async (username, password) => {
    try {
      const session = await signIn({ username, password });
      if (!session) {
        return { success: false, message: 'Failed to get session data' };
      }
      
      try {
        const accountType = session.getIdToken().payload['custom:accountType'] || 'individual';
        
        setIsAuthenticated(true);
        setShopId(username);
        setUserRole(accountType);
        
        try {
          sessionStorage.setItem('shopId', username);
          sessionStorage.setItem('userRole', accountType);
        } catch (storageError) {
          console.error('Error setting session storage during login:', storageError);
        }
        
        return { success: true };
      } catch (parseError) {
        console.error('Error parsing session data:', parseError);
        return { success: false, message: 'Error processing login response' };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Authentication failed' };
    }
  };
  
  /**
   * Sign out user and redirect to logout URL
   */
  const signOut = () => {
    try {
      // Clear client state
      sessionStorage.removeItem('idToken');
      sessionStorage.removeItem('shopId');
      sessionStorage.removeItem('userRole');
    
      // Build the exact logout URL Cognito expects
      const domain = process.env.REACT_APP_COGNITO_DOMAIN;
      const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID;
      const logoutUri = process.env.REACT_APP_REDIRECT_URI;
      
      if (!domain || !clientId || !logoutUri) {
        console.error('Missing environment variables for Cognito logout');
        window.location.href = '/';
        return;
      }
      
      window.location.assign(
        `${domain}/logout` +
        `?client_id=${clientId}` +
        `&logout_uri=${encodeURIComponent(logoutUri)}`
      );
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback to homepage redirect
      window.location.href = '/';
    }
  };

  /**
   * Get current user role from state or session storage
   * @returns {string|null} The user role
   */
  const getUserRole = () => {
    if (userRole) return userRole;
    
    try {
      return sessionStorage.getItem('userRole') || null;
    } catch (error) {
      console.error('Error getting user role from session storage:', error);
      return null;
    }
  };

  /**
   * Update configuration both locally and on the server
   * Performs optimistic local update and then syncs with server
   * @param {Object} newConfig - The new configuration
   */
  const updateConfig = async (newConfig) => {
    if (!newConfig) {
      console.error('Invalid config provided to updateConfig');
      return;
    }
    
    try {
      // Update local state immediately for responsive UI
      setConfig(newConfig);
      
      // Ensure shop_id is explicitly included in the config
      const configWithShopId = { 
        ...newConfig, 
        shop_id: shopId || sessionStorage.getItem('shopId') || 'default'
      };
      
      // Save to server
      await saveConfig(configWithShopId);
    } catch (error) {
      console.error('Error in updateConfig:', error);
      // Note: We don't rollback local state as it's an optimistic update
    }
  };

  /**
   * Reset configuration to default based on user role
   * Updates both local state and server
   */
  const resetConfig = async () => {
    try {
      const role = getUserRole();
      let defaultCfg = defaultConfig;
      
      if (role === 'enterprise') {
        defaultCfg = defaultEnterpriseConfig;
      } else if (role === 'individual') {
        defaultCfg = defaultIndividualConfig;
      }

      // Ensure shop_id is included
      const configWithShopId = {
        ...defaultCfg,
        shop_id: shopId || sessionStorage.getItem('shopId') || 'default'
      };
      
      // Update local state
      setConfig(configWithShopId);
      
      // Update localStorage with shop-specific key
      const currentShopId = shopId || sessionStorage.getItem('shopId');
      if (currentShopId) {
        const storageKey = getConfigStorageKey(currentShopId);
        try {
          localStorage.setItem(storageKey, JSON.stringify(configWithShopId));
        } catch (storageError) {
          console.error(`Error saving reset config to ${storageKey}:`, storageError);
        }
      }
      
      // Save to server
      await saveConfig(configWithShopId);
    } catch (error) {
      console.error('Error in resetConfig:', error);
    }
  };
  
  // Expose context values
  const contextValue = {
    config,
    updateConfig,
    resetConfig,
    isAuthenticated,
    login,
    signOut,
    getUserRole,
    setUserRole,
    shopId
  };
  
  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
}

ConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
};