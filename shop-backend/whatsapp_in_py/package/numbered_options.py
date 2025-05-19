"""
Utilities for handling text-based numbered options in WhatsApp chatbot flows.
Evolution API does not support clickable buttons, so we use text-based numbered lists.
"""

import time
from typing import Dict, List, Optional, Tuple, Any

# Available services - should match the FSM defaults
DEFAULT_SERVICES = [
    'Corte de cabelo',
    'Barba',
    'Corte e barba',
    'Sobrancelha',
    'Hidratação',
]

def get_suggested_options(context: Dict[str, Any]) -> List[str]:
    """
    Get list of options based on current step in conversation
    
    Args:
        context: The FSM context object
        
    Returns:
        List of text options for the current step
    """
    step = context.get('step', 0)
    
    if step == 2:  # Service selection
        return DEFAULT_SERVICES
    elif step == 3:  # Worker selection
        return [worker['name'] for worker in context.get('workers', [])]
    
    return []

def format_reply_with_options(reply: str, context: Dict[str, Any]) -> str:
    """
    Format a reply message with numbered options based on context
    
    Args:
        reply: Original reply message from FSM
        context: The FSM context object
        
    Returns:
        Formatted reply with numbered options when applicable
    """
    options = get_suggested_options(context)
    
    if options:
        formatted_reply = f"{reply}\n\n"
        for idx, option in enumerate(options, 1):
            formatted_reply += f"{idx}. {option}\n"
        return formatted_reply.strip()
    
    # Special handling for confirmation step
    if context.get('step') == 6:
        return f"{reply}\n\n1. Sim\n2. Não"
    
    # For date and time steps, add format hints
    if context.get('step') == 4:
        return f"{reply}\n\nPor favor, digite a data no formato AAAA-MM-DD (exemplo: 2025-05-15)"
    
    if context.get('step') == 5:
        return f"{reply}\n\nPor favor, digite o horário no formato HH:MM (exemplo: 14:30)"
    
    return reply

def process_numeric_input(text: str, context: Dict[str, Any]) -> str:
    """
    Process numeric responses by converting them to the corresponding text options
    
    Args:
        text: User's input text
        context: Current FSM context
        
    Returns:
        Processed text (converted option if numeric)
    """
    # Strip whitespace and check if input is a number
    text = text.strip()
    if not text.isdigit():
        return text
    
    option_index = int(text) - 1
    
    # Handle service selection (step 2)
    if context.get('step') == 2:
        services = get_suggested_options(context)
        if services and 0 <= option_index < len(services):
            return services[option_index]
    
    # Handle worker selection (step 3)
    if context.get('step') == 3:
        workers = get_suggested_options(context)
        if workers and 0 <= option_index < len(workers):
            return workers[option_index]
    
    # Handle confirmation (step 6)
    if context.get('step') == 6:
        if option_index == 0:
            return 'sim'
        if option_index == 1:
            return 'não'
    
    return text

class ContextManager:
    """Store user context between interactions"""
    
    def __init__(self, ttl_seconds: int = 3600):
        """
        Initialize context manager
        
        Args:
            ttl_seconds: Default time-to-live for contexts in seconds
        """
        self.contexts = {}  # Dict to store contexts
        self.ttl_seconds = ttl_seconds
    
    def get_key(self, shop_id: str, phone_number: str) -> str:
        """
        Get storage key for a user's context
        
        Args:
            shop_id: The shop identifier
            phone_number: User's phone number
            
        Returns:
            Storage key string
        """
        return f"{shop_id}:{phone_number}"
    
    def set_context(self, shop_id: str, phone_number: str, 
                    context: Dict[str, Any], ttl_seconds: Optional[int] = None) -> None:
        """
        Store a context for a user
        
        Args:
            shop_id: The shop identifier
            phone_number: User's phone number
            context: The FSM context to store
            ttl_seconds: Optional custom TTL in seconds
        """
        key = self.get_key(shop_id, phone_number)
        self.contexts[key] = {
            'context': context,
            'expires': time.time() + (ttl_seconds or self.ttl_seconds)
        }
    
    def get_context(self, shop_id: str, phone_number: str) -> Optional[Dict[str, Any]]:
        """
        Get stored context for a user
        
        Args:
            shop_id: The shop identifier
            phone_number: User's phone number
            
        Returns:
            The stored context or None if not found/expired
        """
        key = self.get_key(shop_id, phone_number)
        entry = self.contexts.get(key)
        
        if not entry:
            return None
        
        # Check if expired
        if entry['expires'] < time.time():
            del self.contexts[key]
            return None
        
        return entry['context']
    
    def delete_context(self, shop_id: str, phone_number: str) -> None:
        """
        Delete a user's context
        
        Args:
            shop_id: The shop identifier
            phone_number: User's phone number
        """
        key = self.get_key(shop_id, phone_number)
        if key in self.contexts:
            del self.contexts[key]
    
    def cleanup_expired(self) -> int:
        """
        Remove expired contexts to prevent memory leaks
        
        Returns:
            Number of contexts removed
        """
        now = time.time()
        expired_keys = [
            key for key, entry in self.contexts.items()
            if entry['expires'] < now
        ]
        
        for key in expired_keys:
            del self.contexts[key]
        
        return len(expired_keys)