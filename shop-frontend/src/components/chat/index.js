// src/components/chat/index.js
// Re-export components for easier imports
export { default as Chatbox } from './Chatbox';

// Export hooks
export { useChatState } from './hooks/useChatState';
export { useBookingState } from './hooks/useBookingState';
export { useGuidedMode } from './hooks/useGuidedMode';

// Export components
export { ChatHeader } from './components/ChatHeader';
export { MessageList } from './components/MessageList';
export { MessageItem } from './components/MessageItem';
export { ChatInput } from './components/ChatInput';
export { QuickReplyOptions } from './components/QuickReplyOptions';