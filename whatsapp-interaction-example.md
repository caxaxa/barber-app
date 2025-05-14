# WhatsApp Interaction Example with Numbered Options

This document provides examples of typical interactions with the chatbot using text-based numbered options on WhatsApp.

## Example 1: Complete Booking Flow (Individual Account)

### Initial Greeting:
```
User: Olá

Bot: Olá! Sou Amanda, assistente virtual da Barbearia Elite. Qual é o seu nome, por favor?

User: Carlos

Bot: Olá Carlos! Qual serviço você gostaria de agendar?

1. Corte de cabelo
2. Barba
3. Corte e barba
4. Sobrancelha
5. Hidratação
```

### Service Selection (using number):
```
User: 1

Bot: Para qual data você gostaria de agendar seu Corte de cabelo com João Silva?
```

### Date Selection:
```
User: 2025-05-20

Bot: Qual horário você prefere no dia 2025-05-20?

1. 09:00
2. 09:30
3. 10:00
4. 10:30
5. 11:00
6. 11:30
```

### Time Selection:
```
User: 2

Bot: Para confirmar: Corte de cabelo com João Silva em 2025-05-20 às 09:30. Está correto? (Responda sim para confirmar)

1. Sim
2. Não
```

### Confirmation:
```
User: 1

Bot: ✅ Agendamento confirmado! Obrigado por escolher nossos serviços.
```

## Example 2: Complete Booking Flow (Enterprise Account)

### Initial Greeting:
```
User: Oi

Bot: Olá! Sou Amanda, assistente virtual da Barbearia Elite. Qual é o seu nome, por favor?

User: Maria

Bot: Olá Maria! Qual serviço você gostaria de agendar?

1. Corte de cabelo
2. Barba
3. Corte e barba
4. Sobrancelha
5. Hidratação
```

### Service Selection (using text instead of number - both work):
```
User: Barba

Bot: Qual profissional você prefere para o serviço de Barba?

1. João Silva
2. Pedro Costa
3. Ana Ferreira
```

### Worker Selection:
```
User: 2

Bot: Perfeito! Qual data você prefere para agendar com Pedro Costa?
```

### Date Selection:
```
User: 2025-05-21

Bot: Qual horário você prefere no dia 2025-05-21?

1. 14:00
2. 14:30
3. 15:00
4. 15:30
5. 16:00
```

### Time Selection:
```
User: 2

Bot: Para confirmar: Barba com Pedro Costa em 2025-05-21 às 14:30. Está correto? (Responda sim para confirmar)

1. Sim
2. Não
```

### Confirmation:
```
User: 1

Bot: ✅ Agendamento confirmado! Obrigado por escolher nossos serviços.
```

## Example 3: Error Handling

### Out-of-range selection:
```
User: 9

Bot: Desculpe, não entendi. Poderia escolher uma opção da lista?

1. Corte de cabelo
2. Barba
3. Corte e barba
4. Sobrancelha
5. Hidratação
```

### Date format validation:
```
User: amanhã

Bot: Formato de data inválido. Use AAAA-MM-DD, por favor.
```

### Time format validation:
```
User: 2 horas

Bot: Formato de horário inválido. Use HH:MM, por favor.
```

## Benefits for the User

1. **Simple interaction**: Just type a number to select an option
2. **Works on all devices**: No need for special WhatsApp features
3. **Consistent experience**: Same interaction pattern throughout the conversation
4. **Fallback to text**: Users can still type the full option text if they prefer
5. **Clear choices**: Numbered lists make options easy to understand and select

## Notes for Implementers

- The system accepts both number inputs and full text matches
- Error handling is built in to guide users who input invalid selections
- Context is maintained throughout the conversation
- Users can cancel and restart at any point by typing "cancelar"