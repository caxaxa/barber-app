import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Default configuration
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
      region: 'us-east-2',
      appointmentsTable: 'Appointments',
      barbersTable: 'Barbers',
    },
    local: {
      enabled: false,
      appointments: [],
      barbers: []
    }
  },
  chatbot: {
    guidedMode: true, // Options: true (structured flow), false (free conversation)
  },
  openai: {
    enabled: true,
    apiKey: '',
    model: 'gpt-4',
  },
  messaging: {
    enabled: true,
    whatsappIntegration: {
      enabled: true,
      phoneNumber: '+5511999999999',
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
    username: 'admin1',
    password: '12345'
  }
};

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export function ConfigProvider({ children }) {
  // Initialize state with saved config or default
  const [config, setConfig] = useState(() => {
    const savedConfig = localStorage.getItem('appConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('appConfig', JSON.stringify(config));
  }, [config]);

  // Authentication
  const login = (username, password) => {
    if (username === config.auth.username && password === config.auth.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // Update configuration
  const updateConfig = (newConfig) => {
    setConfig(newConfig);
  };

  // Reset to default configuration
  const resetConfig = () => {
    setConfig(defaultConfig);
    localStorage.setItem('appConfig', JSON.stringify(defaultConfig));
  };
  
  return (
    <ConfigContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,
        isAuthenticated,
        login,
        logout
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

ConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
};