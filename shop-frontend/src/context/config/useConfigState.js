// src/context/config/useConfigState.js
import { useState, useEffect } from 'react';
import { fetchConfig, saveConfig } from '../../services/api';
import { signIn, signUp, getSession } from '../../services/cognito';
import { defaultConfig, defaultIndividualConfig, defaultEnterpriseConfig } from './defaultConfigs';

export function useConfigState() {
  /**
   * Generates a unique localStorage key for shop-specific configuration
   * @param {string} shop - The shop ID (username)
   * @returns {string} - The localStorage key for this shop's configuration
   */
  const getConfigStorageKey = (shop) => `appConfig_${shop || 'default'}`;

  // User and shop state
  const [userRole, setUserRole] = useState(() => {
    try {
      return sessionStorage.getItem('userRole') || null;
    } catch (error) {
      console.error('Error reading userRole from sessionStorage:', error);
      return null;
    }
  });
  
  const [shopId, setShopId] = useState(() => {
    try {
      return sessionStorage.getItem('shopId') || null;
    } catch (error) {
      console.error('Error reading shopId from sessionStorage:', error);
      return null;
    }
  });
  
  /**
   * Initialize config state with saved config or default based on role
   * Falls back to role-specific defaults if no saved configuration exists
   */
  const [config, setConfig] = useState(() => {
    try {
      const shop = sessionStorage.getItem('shopId');
      const storageKey = getConfigStorageKey(shop);
      
      // First try to load from shop-specific storage key
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (error) {
        console.error(`Error reading config from ${storageKey}:`, error);
      }
  
      // If no shop-specific config found, check for legacy 'appConfig' key
      try {
        const legacyConfig = localStorage.getItem('appConfig');
        if (legacyConfig && shop) {
          // Migrate legacy config to shop-specific storage
          localStorage.setItem(storageKey, legacyConfig);
          localStorage.removeItem('appConfig'); // Clean up legacy key
          console.log(`Migrated legacy config to ${storageKey}`);
          return JSON.parse(legacyConfig);
        }
      } catch (error) {
        console.error('Error migrating legacy config:', error);
      }
  
      // Fallback based on role
      const role = sessionStorage.getItem('userRole');
      if (role === 'enterprise') return defaultEnterpriseConfig;
      if (role === 'individual') return defaultIndividualConfig;
      return defaultConfig;
    } catch (error) {
      console.error('Error initializing config, falling back to default', error);
      return defaultConfig;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Fetch user session on mount and set authentication state
   */
  useEffect(() => {
    getSession()
      .then(session => {
        if (!session) return;
        
        try {
          const payload = session.getIdToken().payload;
          const username = payload['cognito:username'];
          const accountType = payload['custom:accountType'] || 'individual';
          
          setIsAuthenticated(true);
          setUserRole(accountType);
          setShopId(username);
          
          try {
            sessionStorage.setItem('userRole', accountType);
            sessionStorage.setItem('shopId', username);
          } catch (error) {
            console.error('Error setting session storage items:', error);
          }
        } catch (error) {
          console.error('Error processing session data:', error);
        }
      })
      .catch((error) => {
        // No session => not logged in
        console.log('No active session found:', error);
      });
  }, []);
  
  /**
   * Fetch server-side config when user becomes authenticated or changes role
   * Merges remote config with local config
   */
  useEffect(() => {
    if (!isAuthenticated || !shopId) return;
    
    (async () => {
      try {
        const remote = await fetchConfig(shopId);  // GET /config?shop_id=shopId
        if (remote && Object.keys(remote).length) {
          setConfig(prev => ({ ...prev, ...remote }));
        }
      } catch (err) {
        console.error('Could not load remote config → keeping local', err);
      }
    })();
  }, [isAuthenticated, userRole, shopId]);

  /**
   * Save config to localStorage whenever it changes, using shop-specific key
   */
  useEffect(() => {
    if (!shopId) return;
    
    try {
      const storageKey = getConfigStorageKey(shopId);
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (error) {
      console.error(`Error saving config to localStorage for shop=${shopId}:`, error);
    }
  }, [config, shopId]);

  /**
   * Check for existing authentication on mount
   */
  useEffect(() => {
    try {
      const storedRole = sessionStorage.getItem('userRole');
      const storedShopId = sessionStorage.getItem('shopId');
      
      if (storedRole && storedShopId) {
        setIsAuthenticated(true);
        setUserRole(storedRole);
        setShopId(storedShopId);
      }
    } catch (error) {
      console.error('Error checking existing authentication:', error);
    }
  }, []);

  /**
   * Authenticate user and set session data
   * @param {string} username - User's username
   * @param {string} password - User's password
   * @returns {Object} Result of login attempt
   */
  const login = async (username, password) => {
    try {
      const session = await signIn({ username, password });
      if (!session) {
        return { success: false, message: 'Failed to get session data' };
      }
      
      try {
        const accountType = session.getIdToken().payload['custom:accountType'] || 'individual';
        
        setIsAuthenticated(true);
        setShopId(username);
        setUserRole(accountType);
        
        try {
          sessionStorage.setItem('shopId', username);
          sessionStorage.setItem('userRole', accountType);
        } catch (storageError) {
          console.error('Error setting session storage during login:', storageError);
        }
        
        return { success: true };
      } catch (parseError) {
        console.error('Error parsing session data:', parseError);
        return { success: false, message: 'Error processing login response' };
      }
    } catch (err) {
      return { success: false, message: err.message || 'Authentication failed' };
    }
  };
  
  /**
   * Sign out user and redirect to logout URL
   */
  const signOut = () => {
    try {
      // Clear client state
      sessionStorage.removeItem('idToken');
      sessionStorage.removeItem('shopId');
      sessionStorage.removeItem('userRole');
    
      // Build the exact logout URL Cognito expects
      const domain = process.env.REACT_APP_COGNITO_DOMAIN;
      const clientId = process.env.REACT_APP_COGNITO_CLIENT_ID;
      const logoutUri = process.env.REACT_APP_REDIRECT_URI;
      
      if (!domain || !clientId || !logoutUri) {
        console.error('Missing environment variables for Cognito logout');
        window.location.href = '/';
        return;
      }
      
      window.location.assign(
        `${domain}/logout` +
        `?client_id=${clientId}` +
        `&logout_uri=${encodeURIComponent(logoutUri)}`
      );
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback to homepage redirect
      window.location.href = '/';
    }
  };

  /**
   * Get current user role from state or session storage
   * @returns {string|null} The user role
   */
  const getUserRole = () => {
    if (userRole) return userRole;
    
    try {
      return sessionStorage.getItem('userRole') || null;
    } catch (error) {
      console.error('Error getting user role from session storage:', error);
      return null;
    }
  };

  /**
   * Update configuration both locally and on the server
   * Performs optimistic local update and then syncs with server
   * @param {Object} newConfig - The new configuration
   */
  const updateConfig = async (newConfig) => {
    if (!newConfig) {
      console.error('Invalid config provided to updateConfig');
      return;
    }
    
    try {
      // Update local state immediately for responsive UI
      setConfig(newConfig);
      
      // Ensure shop_id is explicitly included in the config
      const configWithShopId = { 
        ...newConfig, 
        shop_id: shopId || sessionStorage.getItem('shopId') || 'default'
      };
      
      // Save to server
      await saveConfig(configWithShopId);
    } catch (error) {
      console.error('Error in updateConfig:', error);
      // Note: We don't rollback local state as it's an optimistic update
    }
  };

  /**
   * Reset configuration to default based on user role
   * Updates both local state and server
   */
  const resetConfig = async () => {
    try {
      const role = getUserRole();
      let defaultCfg = defaultConfig;
      
      if (role === 'enterprise') {
        defaultCfg = defaultEnterpriseConfig;
      } else if (role === 'individual') {
        defaultCfg = defaultIndividualConfig;
      }

      // Ensure shop_id is included
      const configWithShopId = {
        ...defaultCfg,
        shop_id: shopId || sessionStorage.getItem('shopId') || 'default'
      };
      
      // Update local state
      setConfig(configWithShopId);
      
      // Update localStorage with shop-specific key
      const currentShopId = shopId || sessionStorage.getItem('shopId');
      if (currentShopId) {
        const storageKey = getConfigStorageKey(currentShopId);
        try {
          localStorage.setItem(storageKey, JSON.stringify(configWithShopId));
        } catch (storageError) {
          console.error(`Error saving reset config to ${storageKey}:`, storageError);
        }
      }
      
      // Save to server
      await saveConfig(configWithShopId);
    } catch (error) {
      console.error('Error in resetConfig:', error);
    }
  };
  
  // Expose state and methods
  return {
    config,
    updateConfig,
    resetConfig,
    isAuthenticated,
    login,
    signOut,
    getUserRole,
    setUserRole,
    shopId
  };
}