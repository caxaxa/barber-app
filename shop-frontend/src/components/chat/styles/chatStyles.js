// src/components/chat/styles/chatStyles.js

/**
 * Shared styles for chat components with responsive design
 */
export const chatStyles = {
  // Container styles
  container: {
    display: 'flex', 
    flexDirection: 'column', 
    height: { xs: 'calc(100vh - 56px)', sm: '100%' }, 
    p: { xs: 0.5, sm: 1 },
    bgcolor: (theme) => theme.palette.grey[100],
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  
  // Header styles
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    p: { xs: 1, sm: 1.5 },
    mb: 1,
    bgcolor: 'primary.main',
    color: 'white',
    borderRadius: { xs: '4px 4px 0 0', sm: '8px 8px 0 0' },
    boxShadow: 1
  },
  
  // Avatar styles
  avatarContainer: {
    width: { xs: 32, sm: 40 },
    height: { xs: 32, sm: 40 },
    borderRadius: '50%',
    bgcolor: 'primary.light',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: { xs: '1rem', sm: '1.2rem' },
    fontWeight: 'bold'
  },
  
  // Message list styles
  messageList: { 
    flex: 1, 
    overflowY: 'auto',
    borderRadius: { xs: 1, sm: 2 },
    p: { xs: 0.5, sm: 1 },
    mb: 1,
    bgcolor: 'white',
    display: 'flex',
    flexDirection: 'column'
  },
  
  // User message styles
  userMessage: {
    p: { xs: 1, sm: 1.5 },
    borderRadius: 2,
    maxWidth: { xs: '85%', sm: '80%' },
    bgcolor: 'primary.main',
    color: 'white',
    boxShadow: 1,
    borderTopRightRadius: 0,
    ml: 'auto',
    mr: { xs: 0.5, sm: 1 },
    mb: 1
  },
  
  // Assistant message styles
  assistantMessage: {
    p: { xs: 1, sm: 1.5 },
    borderRadius: 2,
    maxWidth: { xs: '85%', sm: '80%' },
    bgcolor: (theme) => theme.palette.grey[100],
    color: 'text.primary',
    boxShadow: 0,
    borderTopLeftRadius: 0,
    mr: 'auto',
    ml: { xs: 0.5, sm: 1 },
    mb: 1
  },
  
  // Input container styles
  inputContainer: { 
    display: 'flex',
    alignItems: 'center',
    gap: { xs: 0.5, sm: 1 },
    p: { xs: 0.5, sm: 1 },
    bgcolor: 'white',
    borderRadius: { xs: '0 0 4px 4px', sm: '0 0 8px 8px' },
    boxShadow: '0 -1px 3px rgba(0,0,0,0.1)'
  },
  
  // Quick reply options container
  quickReplyOptions: {
    p: { xs: 1, sm: 1.5 }, 
    mb: 1,
    borderRadius: { xs: 1, sm: 2 },
    bgcolor: 'rgba(0,0,0,0.02)',
    border: '1px solid rgba(0,0,0,0.08)'
  },
  
  // Options chip container
  optionsContainer: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: { xs: 0.5, sm: 1 } 
  },
  
  // Options chip
  optionChip: {
    borderRadius: 1,
    fontSize: { xs: '0.75rem', sm: '0.875rem' },
    height: { xs: 28, sm: 32 }
  },
  
  // Send button
  sendButton: {
    borderRadius: { xs: 1, sm: 2 },
    minWidth: { xs: '40px', sm: '48px' },
    minHeight: { xs: '40px', sm: '48px' },
    p: { xs: 1, sm: 1.5 }
  },
  
  // Input field
  inputField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: { xs: 1, sm: 2 },
      fontSize: { xs: '0.875rem', sm: '0.95rem' }
    }
  }
};