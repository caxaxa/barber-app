import React from 'react';
import { Box, Typography, Container, useTheme } from '@mui/material';

/**
 * Modern footer component with logo and branding
 * Uses Cognito CSS Template style classes
 * @returns {JSX.Element} Footer component with Aisol branding
 */
const Footer = () => {
  const theme = useTheme();
  
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        backgroundColor: '#f9f9f9',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.02)',
      }}
      className="background-customizable"
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
          className="redirect-customizable"
        >
          {/* Logo with green tint */}
          <Box
            component="img"
            src="/images/logo.png"
            alt="Aisol Logo"
            sx={{
              height: 24,
              filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)' // Green tint matching Cognito style
            }}
          />
          
          <Typography 
            variant="body2" 
            align="center"
            className="legalText-customizable"
            sx={{
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            Powered by Aisol© 2025
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;