// src/context/config/ConfigContext.js
import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useConfigState } from './useConfigState';

/**
 * Context for application configuration
 * @type {React.Context}
 */
const ConfigContext = createContext();

/**
 * Custom hook to access the configuration context
 * @returns {Object} The configuration context
 * @throws {Error} If used outside of a ConfigProvider
 */
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

/**
 * Provider component for configuration context
 * Manages state for configuration, authentication, and user roles
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 */
export function ConfigProvider({ children }) {
  const configState = useConfigState();
  
  return (
    <ConfigContext.Provider value={configState}>
      {children}
    </ConfigContext.Provider>
  );
}

ConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
};