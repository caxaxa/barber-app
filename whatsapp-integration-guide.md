# WhatsApp Integration Guide - Text-Based Numbered Options

## Overview

This guide explains how the chatbot interacts with WhatsApp using text-based numbered options since the Evolution API does not support clickable buttons.

## How Text-Based Numbered Options Work

Instead of presenting clickable buttons to users, the chatbot now formats options as numbered lists in text messages. Users can respond with the number corresponding to their choice.

### Example Interaction:

```
Bot: Qual serviço você gostaria de agendar?

1. Corte de cabelo
2. Barba
3. Corte e barba
4. Sobrancelha
5. Hidratação

User: 1

Bot: Qual profissional você prefere para o serviço de Corte de cabelo?

1. João Silva
2. Maria Oliveira
3. Pedro Costa

User: 2

Bot: Para qual data você gostaria de agendar com Maria Oliveira?

(Date options shown)

[...]

Bot: Para confirmar: Corte de cabelo com Maria Oliveira em 2025-05-20 às 14:30. Está correto? (Responda sim para confirmar)

1. Sim
2. Não

User: 1

Bot: ✅ Agendamento confirmado! Obrigado por escolher nossos serviços.
```

## Technical Implementation

The implementation involves three key components:

1. **Formatting Responses with Numbered Options**:
   - When options are available (services, workers, confirmation), the chatbot formats the message with numbered options.
   - Each option is presented as a line with a number, followed by the option text.

2. **Processing Numeric Input**:
   - When a user sends a message containing only a number, the system interprets it as a selection.
   - The number is mapped to the corresponding option (array index + 1).
   - The selected option is then passed to the FSM for processing.

3. **Context Management**:
   - The system maintains a conversation context for each user.
   - This context includes the current step, selected options, and available choices.
   - The context is preserved between messages to maintain conversation state.

## Code Components

### Key Functions in JavaScript (index.mjs):

- `formatReplyWithNumberedOptions(reply, context)`: Adds numbered options to replies when applicable.
- `processUserInput(text, context)`: Converts numeric responses to corresponding option texts.
- `userContexts` Map: Stores conversation context for each user.

### Key Functions in Python (whatsapp.in.py):

- `format_reply_with_numbered_options(reply, ctx)`: Adds numbered options to replies.
- `process_user_input(text, ctx)`: Handles numeric responses.
- `USER_CONTEXTS` dictionary: Stores conversation states.

## Integration with Booking FSM

The numbered options system works with the existing Finite State Machine (FSM):

1. The FSM manages the conversation flow and booking logic.
2. The WhatsApp integration layer:
   - Adds numbered options to outgoing messages.
   - Converts incoming number responses to option text.
   - Passes the processed text to the FSM.

## Benefits of Text-Based Numbered Options

1. **Universal Compatibility**: Works on all WhatsApp clients without requiring special features.
2. **Simple User Experience**: Intuitive for users - just type a number to select.
3. **Lower Technical Requirements**: No need for button support in the messaging API.
4. **Consistent Behavior**: Provides a predictable interaction pattern through the entire conversation.

## Maintenance Considerations

- When adding new options to the FSM, ensure they are properly numbered in the formatting functions.
- If the FSM steps change, update the option processing logic to handle the new steps correctly.
- Consider adding validation and error handling for out-of-range numeric inputs.