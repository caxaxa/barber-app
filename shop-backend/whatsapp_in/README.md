# WhatsApp Integration with Text-Based Numbered Options

This implementation integrates the booking FSM with WhatsApp using Evolution API, providing a text-based numbered option interface since Evolution API doesn't support clickable buttons.

## How It Works

1. **Text-based Numbered Options**: Instead of buttons, the system presents options as a numbered list
2. **Number-to-Option Translation**: When a user sends a number (e.g., "1"), the system translates it to the corresponding option text
3. **FSM Compatibility**: This approach maintains compatibility with the existing FSM by translating before processing

## Example Flow

### Service Selection Step

```
Bot: Olá João! Qual serviço você gostaria de agendar?

1. Corte de cabelo
2. Barba
3. Corte e barba
4. Sobrancelha
5. Hidratação

User: 1

[System translates "1" to "Corte de cabelo" before passing to FSM]
```

### Worker Selection Step

```
Bot: Qual profissional você prefere para o serviço de Corte de cabelo?

1. Carlos
2. Marcelo
3. Roberto

User: 2

[System translates "2" to "Marcelo" before passing to FSM]
```

### Confirmation Step

```
Bot: Para confirmar: Corte de cabelo com Marcelo em 2025-05-15 às 14:30. Está correto? (Responda sim para confirmar)

1. Sim
2. Não

User: 1

[System translates "1" to "sim" before passing to FSM]
```

## Implementation Details

### Key Components

1. **NumberedOptions Utility** (`numbered-options.js` / `numbered_options.py`)
   - Formats FSM replies with numbered options based on the current step
   - Processes user input to convert numbers to corresponding text options
   - Manages user context between interactions

2. **Context Management**
   - Maintains conversation state for each user
   - Uses a key format: `{shopId}:{phoneNumber}`
   - Includes TTL to automatically expire old contexts

3. **Webhook Handler** (`index.js` / `whatsapp_in.py`)
   - Receives messages from Evolution API
   - Processes them through the FSM
   - Formats replies with numbered options
   - Sends responses back to WhatsApp

## Integration Flow

1. **Receive Message**:
   - Get message from Evolution API webhook
   - Extract user phone and message text

2. **Process Input**:
   - Retrieve user's context (or create new)
   - Convert numeric input to corresponding text options

3. **Run FSM**:
   - Pass processed text to FSM
   - Get reply and updated context

4. **Format Reply**:
   - Add numbered options to FSM reply
   - Add formatting hints for date/time steps

5. **Send Response**:
   - Send formatted reply to WhatsApp via Evolution API
   - Store updated context for next interaction

## Benefits

- **Maintains FSM Logic**: No changes needed to the core FSM implementation
- **User-Friendly**: Clear numbered options make it easy for users to respond
- **Flexible**: Works with any WhatsApp provider that doesn't support buttons

## Implementation Notes

- The implementation is available in both JavaScript (Node.js) and Python
- TTL (Time To Live) for contexts prevents memory leaks
- Each language implementation follows the same principles but with language-specific idioms
- Error handling and logging are implemented for better debugging