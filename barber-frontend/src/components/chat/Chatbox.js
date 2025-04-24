import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Chip,
  Stack,
  Card,
  CardActionArea,
  CardContent,
  Divider
} from '@mui/material';
import { callChatApi } from '../../services/api';
import { useNotification } from '../ui/NotificationContext';
import { useConfig } from '../../context/ConfigContext';

/**
 * Chatbox component that allows users to book appointments via a chat interface
 */
export default function Chatbox({ onNewAppointment, barbers = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServiceOptions, setShowServiceOptions] = useState(false);
  const [showBarberOptions, setShowBarberOptions] = useState(false);
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  
  // Track booking flow state
  const [bookingState, setBookingState] = useState({
    step: 0, // 0: greeting, 1: name, 2: service, 3: barber, 4: date, 5: time, 6: confirmation
    clientName: '',
    selectedService: '',
    selectedBarber: null,
    selectedDate: '',
    selectedTime: ''
  });
  
  const messagesEndRef = useRef(null);
  const { showNotification } = useNotification();
  const { config } = useConfig();
  
  // Common services
  const commonServices = [
    "Corte de cabelo",
    "Barba",
    "Corte e barba",
    "Sobrancelha",
    "Hidratação"
  ];
  
  // Helper function to get guided mode setting from config
  const isGuidedMode = () => {
    const guidedMode = config?.chatbot?.guidedMode !== false; // Default to guided if not specified
    console.log("Current chat mode:", guidedMode ? "Guided" : "Free", config?.chatbot);
    return guidedMode;
  };

  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  const barberNames = barbers.length > 0 ? barbers.map(b => b.name).join(', ') : 'Nenhum barbeiro disponível';
  
  // Helper function to add minutes to a time string (HH:MM)
  const addMinutes = (timeStr, minutes) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0);
    return date.getHours().toString().padStart(2, '0') + ':' + 
           date.getMinutes().toString().padStart(2, '0');
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset the chat when the chat mode changes
  useEffect(() => {
    resetChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.chatbot?.guidedMode]);

  // Initialize prompt with system message
  useEffect(() => {
    if (messages.length === 0) {
      if (isGuidedMode()) {
        console.log("Initializing guided mode chat");
        // In guided mode, start with assistant greeting
        const assistantGreeting = { 
          role: 'assistant', 
          content: "Olá! Sou a " + (config?.assistant?.name || "Amanda") + ", assistente virtual da " + (config?.business?.name || "Barbearia Elite") + ". Para começar, poderia me informar seu nome, por favor?" 
        };
        setMessages([
          { role: 'system', content: getPromptText() },
          assistantGreeting
        ]);
        
        // Set booking state to name collection
        setBookingState(prev => ({
          ...prev,
          step: 1
        }));
      } else {
        console.log("Initializing free mode chat");
        // In free mode, just set the system message
        setMessages([{ role: 'system', content: getPromptText() }]);
      }
    }
    // We include messages in deps array because we need to check its length,
    // but intentionally omit getPromptText as it would cause unnecessary reruns
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, barberNames, formattedDate]);

  const getPromptText = () => {
    return `
# DIRETRIZES PARA O SISTEMA DE AGENDAMENTO DE ${config?.business?.type?.toUpperCase() || 'BARBEARIA'}

## Informações Operacionais
Data atual: ${formattedDate}
${config?.professionals?.[0]?.plural || 'Profissionais'} disponíveis: ${barberNames}

## Sua Função
Você é ${config?.assistant?.name?.toUpperCase() || 'AMANDA'}, ${config?.assistant?.fullTitle || 'Assistente Virtual'}, a secretária virtual especializada da ${config?.business?.name || 'Barbearia Elite'}. Sua prioridade absoluta é oferecer uma experiência impecável de agendamento, combinando eficiência, empatia e solução de problemas.

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
- SEMPRE peça uma ação específica do cliente - nunca encerre uma mensagem sem uma pergunta ou solicitação clara.
- NUNCA faça o cliente esperar sem necessidade, como dizer "um momento" e depois voltar.
- Confirme periodicamente sua compreensão: "Entendi corretamente que você deseja...?"

### Interações Personalizadas
- Após obter o nome do cliente, dirija-se a ele pelo nome: "Sr. João" ou "Sra. Maria".
- Para clientes que retornam, demonstre reconhecimento: "Que bom vê-lo novamente, Sr. Paulo!"
- Adapte-se ao nível de formalidade usado pelo cliente (você/tu/senhor).
- Use emojis com moderação para tornar a comunicação mais amigável quando apropriado.

## Regras de Negócio Específicas

### Horários de Funcionamento
- Horário de operação: Segunda a Sábado, das ${config?.business?.openHours || '07:00'} às ${config?.business?.closeHours || '19:00'}
- ${config?.business?.closedDays?.join?.(', ') || 'Domingo'}: FECHADO
- Última marcação permitida: ${config?.business?.lastAppointmentTime || '18:20'} (garantindo tempo para conclusão)

### Lógica de Disponibilidade - MUITO IMPORTANTE
- PRESUMA QUE TODOS OS HORÁRIOS DENTRO DO HORÁRIO DE FUNCIONAMENTO ESTÃO DISPONÍVEIS
- NÃO EXISTE CONCEITO DE "CONSULTAR" OU "VERIFICAR" DISPONIBILIDADE
- Os ÚNICOS horários indisponíveis são aqueles em que já existem agendamentos confirmados
- Se o cliente solicita um horário dentro do horário de funcionamento, SEMPRE considere disponível
- NUNCA diga "vou verificar disponibilidade" ou "um momento enquanto consulto" - isto não existe
- NUNCA demore para "procurar" horários disponíveis - isso é instantâneo

### Duração e Intervalos de Serviço
- Duração PADRÃO do atendimento: ${config?.business?.appointmentDuration || 40} minutos EXATOS
- Intervalo OBRIGATÓRIO entre atendimentos: 0 minutos (agendamentos consecutivos são permitidos)
- Horários de início permitidos: a cada ${config?.business?.appointmentInterval || 10} minutos (${config?.business?.openHours || '07:00'}, ${addMinutes(config?.business?.openHours || '07:00', config?.business?.appointmentInterval || 10)}, ${addMinutes(config?.business?.openHours || '07:00', (config?.business?.appointmentInterval || 10)*2)}, etc.)

### Serviços e Especialidades
- Cada barbeiro tem especialidades específicas. Não agende um serviço com barbeiro sem a especialidade.
- Se um cliente pedir um serviço especializado, sugira APENAS barbeiros com essa especialidade.
- Serviços VIP têm prioridade - ofereça os melhores horários para clientes VIP ou serviços premium.

### Sistema de Barbeiros e Alocação
- NUNCA invente barbeiros além dos listados como disponíveis.
- NUNCA invente IDs de barbeiros - use SOMENTE os IDs existentes.
- Se o cliente não especificar um barbeiro, sugira até 3 opções disponíveis.
- Aplique a lógica de prioridade: clientes regulares têm prioridade com barbeiros específicos.

### Regras de Conflito e Disponibilidade
- Um barbeiro NÃO pode ter dois agendamentos simultâneos ou sobrepostos.
- Mantenha o controle de disponibilidade dos barbeiros por dia/hora com máxima precisão.
- Aplique bloqueios automáticos: se um barbeiro tem agendamento às 14:00, ele NÃO estará disponível novamente até 14:40.

## Formatos e Padrões de Dados

### Formato de Data e Hora
- Formato de data: AAAA-MM-DD (ISO 8601)
- Formato de hora: HH:MM (24 horas, SEM SEGUNDOS)
- Interpretar corretamente expressões temporais do cliente:
  * "Hoje" = ${formattedDate}
  * "Amanhã" = [data seguinte a ${formattedDate}]
  * "Próxima semana" = semana após a semana atual

### Validação de Dados
- Valide RIGOROSAMENTE se as datas solicitadas estão no futuro.
- Rejeite IMEDIATAMENTE agendamentos para datas no passado.
- Confirme que o formato da hora está correto e divisível por 10 minutos.
- Verifique se o ID do barbeiro existe na lista de barbeiros disponíveis.
- Certifique-se de que o nome do cliente foi fornecido antes de confirmar.

### Confirmação e Finalização
- SEMPRE obtenha confirmação explícita antes de finalizar o agendamento.
- Estrutura de confirmação: "Para confirmar, você, [NOME DO CLIENTE], deseja agendar um [SERVIÇO] com [NOME DO BARBEIRO] para o dia [DATA FORMATADA POR EXTENSO] às [HORA]."
- Após confirmação, forneça apenas o objeto JSON exato, sem texto adicional:
\`\`\`json
{
  "barber_id": [ID NUMÉRICO],
  "date": "[AAAA-MM-DD]",
  "start_time": "[HH:MM]",
  "client_name": "[NOME COMPLETO]"
}
\`\`\`

## Estratégias para Interface com Botões

### Opções Interativas
- O usuário pode interagir com botões de serviço, barbeiros e horários
- Quando o usuário seleciona um serviço via botão, reconheça a escolha
- Quando o usuário seleciona um barbeiro via botão, reconheça a escolha
- Quando o usuário seleciona um horário via botão, reconheça a escolha

## Conflitos de Agendamento
- Se detectar conflito, explique CLARAMENTE: "Desculpe, [NOME DO BARBEIRO] já tem um compromisso às [HORA CONFLITANTE]."
- Ofereça SEMPRE 3 alternativas específicas: horários próximos, mesmo barbeiro OU mesmo horário, barbeiro diferente.
- Use frases como: "Posso oferecer [ALTERNATIVA 1], [ALTERNATIVA 2] ou [ALTERNATIVA 3]. Qual seria sua preferência?"

## Fluxo de Agendamento

1. **Acolhimento**
   - Cumprimente e se apresente de forma amigável.
   - Pergunte o nome do cliente caso ainda não saiba.
   - SEMPRE termine sua primeira mensagem com uma pergunta ou orientação clara.

2. **Coleta de Preferências**
   - Solicite UMA INFORMAÇÃO POR VEZ - nunca sobrecarregue o cliente com várias perguntas.
   - Sugira opções de serviços ou barbeiros quando apropriado.
   - Utilize as preferências expressas pelo cliente para guiar o processo.

3. **Verificação de Dados**
   - Confirme cada dado fornecido pelo cliente antes de prosseguir.
   - Valide o formato da data e hora.
   - Verifique se o barbeiro escolhido está disponível (não tem agendamento no mesmo horário).

4. **Confirmação Final**
   - Repita TODOS os detalhes do agendamento para confirmação
   - Solicite aprovação explícita
   - Forneça o JSON exato após confirmação (estritamente conforme formato)

5. **Encerramento Positivo**
   - Após confirmação da reserva, agradeça o cliente
   - Forneça informações adicionais úteis (localização, estacionamento)
   - Deixe canal aberto para dúvidas ou modificações

## REGRAS ESSENCIAIS - OBRIGATÓRIO SEGUIR

1. SEMPRE SOLICITE UMA AÇÃO/RESPOSTA DO CLIENTE - nunca termine sua mensagem sem pedir algo claro.
2. NUNCA indique que está "verificando" disponibilidade - não é necessário.
3. PRESUMA QUE TODOS HORÁRIOS NO PERÍODO DE FUNCIONAMENTO ESTÃO DISPONÍVEIS, exceto se já houver agendamento.
4. SEJA DIRETO E EFICIENTE - não adicione etapas desnecessárias ao agendamento.
5. GUIE O CLIENTE com opções claras quando apropriado.

VOCÊ DEVE SEGUIR RIGOROSAMENTE TODAS ESTAS DIRETRIZES PARA GARANTIR UMA EXPERIÊNCIA DE AGENDAMENTO PERFEITA.
`;
  };

  // Function to generate available dates (next 14 days, excluding closed days)
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    const closedDays = config?.business?.closedDays || ['Domingo'];
    
    // Map Portuguese day names to JavaScript day indices (0 = Sunday, 1 = Monday, etc.)
    const dayMap = {
      'domingo': 0,
      'segunda': 1, 'segunda-feira': 1,
      'terça': 2, 'terça-feira': 2,
      'quarta': 3, 'quarta-feira': 3,
      'quinta': 4, 'quinta-feira': 4,
      'sexta': 5, 'sexta-feira': 5,
      'sábado': 6
    };
    
    const closedDayIndices = closedDays.map(day => {
      const lowerDay = day.toLowerCase();
      return dayMap[lowerDay] !== undefined ? dayMap[lowerDay] : -1;
    }).filter(idx => idx !== -1);
    
    // Generate dates for the next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      // Skip closed days
      if (!closedDayIndices.includes(date.getDay())) {
        const formattedDate = date.toISOString().split('T')[0];
        const displayDate = date.toLocaleDateString('pt-BR', { 
          weekday: 'short', 
          day: '2-digit', 
          month: '2-digit' 
        });
        
        dates.push({
          value: formattedDate,
          display: displayDate
        });
      }
    }
    
    setAvailableDates(dates);
  };

  // Generate time options for a specific date and barber
  const generateTimeOptions = (barberId, date) => {
    const times = [];
    const [startHour, startMinute] = (config?.business?.openHours || '07:00').split(':').map(Number);
    const [endHour, endMinute] = (config?.business?.lastAppointmentTime || '18:20').split(':').map(Number);
    const interval = config?.business?.appointmentInterval || 10;
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // In a real implementation, we would fetch booked appointments for this barber/date
    // and filter out times that are already booked
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      const formattedHour = currentHour.toString().padStart(2, '0');
      const formattedMinute = currentMinute.toString().padStart(2, '0');
      times.push(`${formattedHour}:${formattedMinute}`);
      
      currentMinute += interval;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
      }
    }
    
    setAvailableTimes(times);
  };
  
  // Process the guided booking flow
  const processGuidedBookingStep = (message) => {
    // Extract name if we're at the name step
    if (bookingState.step === 1 && message.role === 'user') {
      setBookingState(prev => ({
        ...prev,
        clientName: message.content,
        step: 2
      }));
      
      // Show service options after name is collected
      setShowServiceOptions(true);
      setShowBarberOptions(false);
      setShowDateOptions(false);
      setShowTimeOptions(false);
      
      return "Olá " + message.content + "! Qual serviço você gostaria de agendar?";
    }
    
    // For other steps, handle based on the current content
    if (message.role === 'assistant') {
      switch(bookingState.step) {
        case 0: // After greeting, next ask for name
          return "Olá! Sou a " + (config?.assistant?.name || "Amanda") + ", assistente virtual da " + (config?.business?.name || "Barbearia Elite") + ". Para começar, poderia me informar seu nome, por favor?";
        
        case 2: // After collecting name, ask for service
          setShowServiceOptions(true);
          return "Qual serviço você gostaria de agendar?";
          
        case 3: // After collecting service, ask for barber
          setShowServiceOptions(false);
          setShowBarberOptions(true);
          return "Qual profissional você prefere para o serviço de " + bookingState.selectedService + "?";
          
        case 4: // After collecting barber, ask for date
          setShowBarberOptions(false);
          generateDateOptions();
          setShowDateOptions(true);
          return "Para qual data você gostaria de agendar com " + bookingState.selectedBarber.name + "?";
          
        case 5: // After collecting date, ask for time
          setShowDateOptions(false);
          generateTimeOptions(bookingState.selectedBarber.barber_id, bookingState.selectedDate);
          setShowTimeOptions(true);
          return "Qual horário você prefere no dia " + new Date(bookingState.selectedDate).toLocaleDateString('pt-BR') + "?";
          
        case 6: // After collecting all info, confirm
          setShowTimeOptions(false);
          return `Para confirmar, você deseja agendar ${bookingState.selectedService} com ${bookingState.selectedBarber.name} no dia ${new Date(bookingState.selectedDate).toLocaleDateString('pt-BR')} às ${bookingState.selectedTime}. Está correto? (Responda sim para confirmar)`;
          
        default:
          return message.content;
      }
    }
    
    return null;
  };
  
  // Handle free-form chat with content analysis
  const checkMessageContent = (content) => {
    // If in guided mode, don't use this function
    if (isGuidedMode()) {
      console.log("Skipping content check in guided mode");
      return;
    }
    
    const lowerContent = content.toLowerCase();
    console.log("Analyzing chat content for free mode - no UI options will be shown");
    
    // In free mode, we don't want to show any buttons,
    // but we can still update the internal state for context tracking
    
    // Track service mentions
    if (lowerContent.includes('serviço') || 
        lowerContent.includes('corte') || 
        lowerContent.includes('barba') ||
        lowerContent.includes('sobrancelha')) {
      // Just update internal tracking but don't show buttons
      console.log("Detected service mention in free mode");
    }
    
    // Track barber mentions - look for names in the barbers array
    barbers.forEach(barber => {
      if (lowerContent.includes(barber.name.toLowerCase())) {
        console.log(`Detected mention of barber ${barber.name} in free mode`);
        // Update booking state for context, but don't show UI elements
        setBookingState(prev => ({
          ...prev,
          selectedBarber: barber
        }));
      }
    });

    // Track date mentions
    const dateRegex = /(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?/g;
    const dateMatches = lowerContent.match(dateRegex);
    if (dateMatches) {
      console.log("Detected date mention in free mode:", dateMatches[0]);
    }
    
    // No UI elements are shown in free mode, regardless of content
  };

  // Handle service selection
  const handleServiceSelect = (service) => {
    if (isGuidedMode()) {
      // In guided mode, update state and advance
      setBookingState(prev => ({
        ...prev,
        selectedService: service,
        step: 3
      }));
      
      // Add this selection to chat messages
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: service }
      ]);
      
      // Add assistant response based on current step
      const assistantResponse = { 
        role: 'assistant', 
        content: "Qual profissional você prefere para o serviço de " + service + "?" 
      };
      
      setMessages(prev => [...prev, assistantResponse]);
      
      // Update UI
      setShowServiceOptions(false);
      setShowBarberOptions(true);
    } else {
      // In free mode, just send as a message
      setInput(service);
      sendMessage(service);
      setShowServiceOptions(false);
    }
  };
  
  // Handle barber selection
  const handleBarberSelect = (barber) => {
    console.log("Selected barber:", barber);
    
    if (isGuidedMode()) {
      // In guided mode, update state and advance
      setBookingState(prev => {
        const newState = {
          ...prev,
          selectedBarber: barber,
          step: 4
        };
        console.log("Updated booking state with barber:", newState);
        return newState;
      });
      
      // Add this selection to chat messages
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: barber.name }
      ]);
      
      // Generate date options and update UI
      generateDateOptions();
      
      // Add assistant response
      const assistantResponse = { 
        role: 'assistant', 
        content: "Para qual data você gostaria de agendar com " + barber.name + "?" 
      };
      
      setMessages(prev => [...prev, assistantResponse]);
      
      // Update UI
      setShowBarberOptions(false);
      setShowDateOptions(true);
    } else {
      // In free mode, just send as a message
      setInput(barber.name);
      sendMessage(barber.name);
      setShowBarberOptions(false);
    }
  };
  
  // Handle date selection
  const handleDateSelect = (date) => {
    if (isGuidedMode()) {
      // In guided mode, update state and advance
      setBookingState(prev => ({
        ...prev,
        selectedDate: date.value,
        step: 5
      }));
      
      // Add this selection to chat messages
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: date.display }
      ]);
      
      // Generate time options for this date and barber
      generateTimeOptions(bookingState.selectedBarber.barber_id, date.value);
      
      // Add assistant response
      const assistantResponse = { 
        role: 'assistant', 
        content: "Qual horário você prefere no dia " + date.display + "?" 
      };
      
      setMessages(prev => [...prev, assistantResponse]);
      
      // Update UI
      setShowDateOptions(false);
      setShowTimeOptions(true);
    } else {
      // In free mode, just send as a message
      setInput(date.display);
      sendMessage(date.display);
      setShowDateOptions(false);
    }
  };
  
  // Handle time selection
  const handleTimeSelect = (time) => {
    if (isGuidedMode()) {
      // In guided mode, update state and advance
      setBookingState(prev => ({
        ...prev,
        selectedTime: time,
        step: 6
      }));
      
      // Add this selection to chat messages
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: time }
      ]);
      
      // Format date for display
      const formattedDate = new Date(bookingState.selectedDate).toLocaleDateString('pt-BR');
      
      // Add assistant response for confirmation
      const assistantResponse = { 
        role: 'assistant', 
        content: `Para confirmar, você deseja agendar ${bookingState.selectedService} com ${bookingState.selectedBarber.name} no dia ${formattedDate} às ${time}. Está correto? (Responda sim para confirmar)` 
      };
      
      setMessages(prev => [...prev, assistantResponse]);
      
      // Update UI
      setShowTimeOptions(false);
    } else {
      // In free mode, just send as a message
      setInput(time);
      sendMessage(time);
      setShowTimeOptions(false);
    }
  };

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;
    
    const userMessage = { role: 'user', content: textToSend };
    
    // Handle differently based on guided vs free mode
    if (isGuidedMode()) {
      // In guided mode, process the flow based on booking step
      
      // If the user has entered their name (step 1)
      if (bookingState.step === 1) {
        setBookingState(prev => ({
          ...prev,
          clientName: textToSend,
          step: 2
        }));
        
        // Add user message to chat
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        
        // Add assistant response for service selection
        const assistantResponse = { 
          role: 'assistant', 
          content: `Olá ${textToSend}! Qual serviço você gostaria de agendar?` 
        };
        setMessages(prev => [...prev, assistantResponse]);
        
        // Show service options
        setShowServiceOptions(true);
        return;
      }
      
      // If we're on the confirmation step (step 6)
      if (bookingState.step === 6) {
        // Add user message to chat
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        
        // Check if the user confirmed
        const lowerText = textToSend.toLowerCase();
        if (lowerText.includes('sim') || lowerText.includes('confirmo') || lowerText === 's') {
          // Ensure all data is available
          if (!bookingState.selectedBarber || !bookingState.selectedDate || !bookingState.selectedTime || !bookingState.clientName) {
            console.error("Missing booking data:", bookingState);
            
            const errorResponse = {
              role: 'assistant',
              content: `❌ Não foi possível confirmar seu agendamento devido a informações incompletas. Vamos recomeçar o processo.`
            };
            setMessages(prev => [...prev, errorResponse]);
            setBookingState(prev => ({ ...prev, step: 2 }));
            setShowServiceOptions(true);
            return;
          }
          
          // Create appointment data - ensure barber_id is sent as a number
          const barber_id = typeof bookingState.selectedBarber.barber_id === 'string' 
            ? parseInt(bookingState.selectedBarber.barber_id, 10) 
            : bookingState.selectedBarber.barber_id;
            
          const appointmentData = {
            barber_id,
            date: bookingState.selectedDate,
            start_time: bookingState.selectedTime,
            client_name: bookingState.clientName
          };
          
          console.log("Attempting to create appointment with data:", appointmentData);
          console.log("Selected barber details:", bookingState.selectedBarber);
          
          try {
            // Call the onNewAppointment prop function to save the appointment
            const result = await onNewAppointment(appointmentData);
            console.log("Appointment creation result:", result);
            
            // Format date for better readability
            const formattedDate = new Date(bookingState.selectedDate).toLocaleDateString('pt-BR');
            
            // Success message
            const successResponse = {
              role: 'assistant',
              content: `✅ Perfeito! Seu agendamento foi confirmado.\n\n📆 Data: ${formattedDate}\n⏰ Horário: ${bookingState.selectedTime}\n💈 Profissional: ${bookingState.selectedBarber.name}\n👤 Cliente: ${bookingState.clientName}\n\nObrigado pela preferência! Caso precise reagendar ou cancelar, basta me avisar. Estamos ansiosos para recebê-lo.`
            };
            setMessages(prev => [...prev, successResponse]);
            
            // Reset booking state for a new appointment
            setBookingState({
              step: 0,
              clientName: '',
              selectedService: '',
              selectedBarber: null,
              selectedDate: '',
              selectedTime: ''
            });
          } catch (error) {
            const errorResponse = {
              role: 'assistant',
              content: `❌ Não foi possível confirmar seu agendamento devido ao seguinte problema:\n\n"${error.message}"\n\nPor favor, podemos tentar um horário alternativo? Estou à disposição para ajudá-lo a encontrar um horário que funcione para você.`
            };
            setMessages(prev => [...prev, errorResponse]);
          }
        } else {
          // User did not confirm, go back to service selection
          setBookingState(prev => ({
            ...prev,
            step: 2
          }));
          
          const tryAgainResponse = {
            role: 'assistant',
            content: `Vamos recomeçar então. Qual serviço você gostaria de agendar?`
          };
          setMessages(prev => [...prev, tryAgainResponse]);
          setShowServiceOptions(true);
        }
        
        return;
      }
      
      // For other steps, just add user message and wait for button selection
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      return;
    } else {
      // In free mode, use the API
      const updatedMessages = [...messages, userMessage];
      
      setMessages(updatedMessages);
      setInput('');
      setLoading(true);
  
      try {
        const data = await callChatApi(updatedMessages);
        const assistantMessage = data.choices[0].message;
        const newMessages = [...updatedMessages, assistantMessage];
        setMessages(newMessages);
        
        // In free mode, analyze the response for context
        if (!isGuidedMode()) {
          console.log("Checking content for UI options:", assistantMessage.content);
          // Check for UI options to display
          checkMessageContent(assistantMessage.content);
        }
  
        const appointmentData = parseAppointment(assistantMessage.content);
        if (appointmentData) {
          if (!appointmentData.client_name) {
            const promptForName = {
              role: 'assistant',
              content: 'Por favor, informe seu nome para completar o agendamento.'
            };
            setMessages(prev => [...prev, promptForName]);
          } else {
            try {
              await onNewAppointment(appointmentData);
              // Get the barber name from the ID
              const barber = barbers.find(b => b.barber_id.toString() === appointmentData.barber_id.toString());
              const barberName = barber ? barber.name : `barbeiro ${appointmentData.barber_id}`;
              
              // Format the date for better readability
              const dateParts = appointmentData.date.split('-');
              const formattedDisplayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
              
              const successResponse = {
                role: 'assistant',
                content: `✅ Perfeito! Seu agendamento foi confirmado.\n\n📆 Data: ${formattedDisplayDate}\n⏰ Horário: ${appointmentData.start_time}\n💈 Profissional: ${barberName}\n👤 Cliente: ${appointmentData.client_name}\n\nObrigado pela preferência! Caso precise reagendar ou cancelar, basta me avisar. Estamos ansiosos para recebê-lo.`
              };
              setMessages(prev => [...prev, successResponse]);
              
              // Reset all option displays
              setShowServiceOptions(false);
              setShowBarberOptions(false);
              setShowDateOptions(false);
              setShowTimeOptions(false);
            } catch (error) {
              const errorResponse = {
                role: 'assistant',
                content: `❌ Não foi possível confirmar seu agendamento devido ao seguinte problema:\n\n"${error.message}"\n\nPor favor, podemos tentar um horário alternativo? Estou à disposição para ajudá-lo a encontrar um horário que funcione para você.`
              };
              setMessages(prev => [...prev, errorResponse]);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao comunicar com ChatGPT:', error);
        showNotification('Erro ao comunicar com o assistente de chat.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const parseAppointment = (text) => {
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = text.substring(jsonStart, jsonEnd + 1);
        const data = JSON.parse(jsonString);
        if (
          data.barber_id &&
          data.date &&
          data.start_time &&
          data.date.length === 10 &&
          data.start_time.length === 5
        ) {
          return data;
        }
      }
    } catch (error) {
      console.error('Falha ao analisar JSON de agendamento:', error);
    }
    return null;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  // Reset to start a new chat
  const resetChat = () => {
    setMessages([]);
    setBookingState({
      step: 0,
      clientName: '',
      selectedService: '',
      selectedBarber: null,
      selectedDate: '',
      selectedTime: ''
    });
    setShowServiceOptions(false);
    setShowBarberOptions(false);
    setShowDateOptions(false);
    setShowTimeOptions(false);
  };

  const visibleMessages = messages.filter(msg => msg.role !== 'system');

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        p: 1,
        bgcolor: config?.theme?.chatBubbleColor || '#f5f5f5',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          mb: 1,
          bgcolor: 'primary.main',
          color: 'white',
          borderRadius: '8px 8px 0 0',
          boxShadow: 1
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}
        >
          {config?.assistant?.name?.charAt(0) || 'A'}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {config?.assistant?.name || 'Amanda'} - {config?.assistant?.title || 'Assistente Virtual'}
          </Typography>
          <Typography variant="caption">
            {config?.business?.name || 'Barbearia Elite'}
          </Typography>
        </Box>
      </Box>
      
      {/* Messages Area */}
      <Box 
        sx={{ 
          flex: 1, 
          overflowY: 'auto', 
          borderRadius: 2,
          p: 1,
          mb: 1,
          bgcolor: 'white',
          boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Welcome message if no messages yet */}
        {visibleMessages.length === 0 && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
              textAlign: 'center',
              p: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Bem-vindo à {config?.business?.name || 'Barbearia Elite'}
            </Typography>
            <Typography variant="body2">
              {config?.assistant?.greeting || 'Olá! Sou a Amanda, sua assistente virtual. Como posso ajudá-lo hoje?'}
            </Typography>
          </Box>
        )}
        
        {/* Chat messages */}
        <Box sx={{ flex: 1 }}>
          {visibleMessages.map((msg, i) => (
            <Box 
              key={i} 
              sx={{ 
                mb: 1.5, 
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Box
                sx={{
                  display: 'inline-block',
                  backgroundColor: msg.role === 'user' ? (config?.theme?.userMessageColor || '#1976d2') : (config?.theme?.assistantMessageColor || '#f5f5f5'),
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  p: 1.5,
                  borderRadius: msg.role === 'user' 
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  maxWidth: '85%',
                  boxShadow: 1,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </Box>
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ mt: 0.5, mx: 1 }}
              >
                {msg.role === 'user' ? 'Você' : (config?.assistant?.name || 'Amanda')} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Typography>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Service Options - only show in guided mode */}
        {isGuidedMode() && showServiceOptions && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              Escolha um serviço:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {commonServices.map((service, index) => (
                <Chip 
                  key={index}
                  label={service}
                  onClick={() => handleServiceSelect(service)}
                  color="primary"
                  variant="outlined"
                  clickable
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        )}
        
        {/* Barber Options - only show in guided mode */}
        {isGuidedMode() && showBarberOptions && barbers.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              Escolha um profissional:
            </Typography>
            <Stack spacing={1}>
              {barbers.map((barber) => (
                <Card 
                  key={barber.barber_id}
                  variant="outlined"
                  sx={{ mb: 1 }}
                >
                  <CardActionArea onClick={() => handleBarberSelect(barber)}>
                    <CardContent sx={{ py: 1 }}>
                      <Typography variant="subtitle1">{barber.name}</Typography>
                      {barber.specialties && barber.specialties.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          Especialidades: {barber.specialties.join(', ')}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>
        )}
        
        {/* Date Options - only show in guided mode */}
        {isGuidedMode() && showDateOptions && availableDates.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              Escolha uma data:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableDates.map((date, index) => (
                <Chip
                  key={index}
                  label={date.display}
                  onClick={() => handleDateSelect(date)}
                  color="primary"
                  variant="outlined"
                  clickable
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        {/* Time Options - only show in guided mode */}
        {isGuidedMode() && showTimeOptions && availableTimes.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
              Escolha um horário:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availableTimes.map((time, index) => (
                <Chip
                  key={index}
                  label={time}
                  onClick={() => handleTimeSelect(time)}
                  color="primary"
                  variant="outlined"
                  clickable
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
      
      {/* Input Area */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 1,
          p: 1,
          bgcolor: 'white',
          borderRadius: '0 0 8px 8px',
          boxShadow: 1
        }}
      >
        <TextField
          fullWidth
          placeholder={loading ? "Processando resposta..." : "Digite sua mensagem..."}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          size="small"
          variant="outlined"
          InputProps={{
            sx: {
              borderRadius: 5,
              bgcolor: '#f9f9f9'
            }
          }}
          inputProps={{
            'aria-label': 'chat message input'
          }}
          sx={{ flex: 1 }}
        />
        <Button 
          onClick={() => sendMessage()} 
          disabled={loading} 
          variant="contained"
          aria-label="send message"
          sx={{
            borderRadius: '50%',
            minWidth: '40px',
            width: '40px',
            height: '40px',
            p: 0
          }}
        >
          {loading ? 
            <Box 
              sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                border: '2px solid white',
                borderTop: '2px solid transparent',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} 
            /> : 
            '➤'
          }
        </Button>
      </Box>
    </Box>
  );
}

Chatbox.propTypes = {
  onNewAppointment: PropTypes.func.isRequired,
  barbers: PropTypes.arrayOf(
    PropTypes.shape({
      barber_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
};