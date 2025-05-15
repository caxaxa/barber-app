// src/styles/loginStyles.js

/**
 * Shared styles for login page components with responsive design
 */
export const loginStyles = {
  // Page background
  background: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)',
    padding: { xs: 2, sm: 3 }
  },
  
  // Container for login card
  container: {
    maxWidth: { xs: '100%', sm: '450px' },
    width: '100%',
    height: { xs: 'auto', sm: 'auto' },
    mx: 'auto'
  },
  
  // Login card
  card: {
    width: '100%',
    height: '100%',
    borderRadius: { xs: 2, sm: 3 },
    overflow: 'hidden',
    boxShadow: { 
      xs: '0 4px 12px rgba(0,0,0,0.1)', 
      sm: '0 8px 24px rgba(0,0,0,0.15)' 
    }
  },
  
  // Header section
  header: {
    py: { xs: 1.5, sm: 2 },
    px: { xs: 2, sm: 3 },
    bgcolor: 'primary.main',
    color: 'white',
    textAlign: 'center'
  },
  
  // Title text
  title: {
    fontSize: { xs: '1.25rem', sm: '1.5rem' },
    fontWeight: 600
  },
  
  // Body section
  body: {
    px: { xs: 2, sm: 3 },
    py: { xs: 2, sm: 3 },
    bgcolor: 'white'
  },
  
  // Icon styles
  icon: {
    fontSize: { xs: 36, sm: 48 },
    filter: 'drop-shadow(0 4px 8px rgba(25, 118, 210, 0.3))',
    animation: 'pulse 2s infinite ease-in-out',
    mr: { xs: 1, sm: 1.5 }
  },
  
  // Calendar preview container
  calendarPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: { xs: 1, sm: 2 },
    mb: { xs: 2, sm: 3 }
  },
  
  // Calendar card
  calendarCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    backgroundColor: 'rgba(25, 118, 210, 0.05)',
    p: { xs: 1.5, sm: 2 },
    borderRadius: '8px',
    border: '1px solid rgba(25, 118, 210, 0.1)',
    minWidth: { xs: '120px', sm: '130px' }
  },
  
  // Features container
  featuresContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: { xs: 1, sm: 1.5 },
    flexWrap: 'wrap'
  },
  
  // Feature badge
  featureBadge: {
    display: 'flex',
    alignItems: 'center',
    bgcolor: 'rgba(25, 118, 210, 0.08)',
    color: 'primary.main',
    fontSize: { xs: '0.75rem', sm: '0.85rem' },
    fontWeight: 500,
    borderRadius: '16px',
    py: 0.5,
    px: { xs: 1, sm: 1.2 }
  },
  
  // Login button
  loginButton: {
    my: { xs: 1.5, sm: 2 },
    py: { xs: 1, sm: 1.5 },
    fontSize: { xs: '0.9rem', sm: '1rem' },
    fontWeight: 600
  },
  
  // Footer section
  footer: {
    textAlign: 'center',
    mt: { xs: 1, sm: 1.5 }
  }
};