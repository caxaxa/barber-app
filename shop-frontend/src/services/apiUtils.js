/**
 * API utilities for common patterns in API calls
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/**
 * Determines if the application is in mock mode
 * @returns {boolean} True if in mock mode
 */
export const isMockMode = () =>
  !API_BASE ||
  (API_BASE.startsWith('http://localhost') && !navigator.onLine);

/**
 * Gets the current shop ID from session storage
 * @returns {string} Shop ID
 */
export const getShopId = () => 
  sessionStorage.getItem('shopId') || 'demo-shop';

/**
 * Gets the user's role from session storage
 * @returns {string} User role
 */
export const getUserRole = () =>
  sessionStorage.getItem('userRole') || 'individual';

/**
 * Builds authentication headers with JWT token
 * @returns {Promise<Object>} Headers object with Authorization
 */
export async function getAuthHeaders() {
  const token = sessionStorage.getItem('idToken');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Validates authentication headers
 * @param {Object} headers - The headers object to validate
 * @returns {boolean} True if headers are valid
 */
export function hasValidAuthToken(headers) {
  return (
    headers.Authorization &&
    headers.Authorization !== 'Bearer undefined' &&
    headers.Authorization !== 'Bearer null'
  );
}

/**
 * Higher-order function for protected API calls
 * @param {Function} apiCall - The API call function to wrap
 * @param {Object} mockResponse - Mock response to return in mock mode
 * @param {string} errorContext - Description for error logging
 * @returns {Function} Wrapped API function
 */
export function withErrorHandling(apiCall, mockResponse, errorContext) {
  return async (...args) => {
    if (isMockMode()) return mockResponse;

    try {
      const headers = await getAuthHeaders();
      
      if (!hasValidAuthToken(headers)) {
        console.warn(`Missing authentication token for ${errorContext}, returning fallback`);
        return mockResponse;
      }
      
      return await apiCall(headers, ...args);
    } catch (error) {
      console.error(`Error in ${errorContext}:`, error);
      return mockResponse;
    }
  };
}

/**
 * Makes an API request with standard error handling
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @param {Object} mockResponse - Mock response for offline mode
 * @returns {Promise<any>} Response data
 */
export async function apiRequest(endpoint, options = {}, mockResponse = {}) {
  if (isMockMode()) return mockResponse;

  try {
    const headers = await getAuthHeaders();
    
    if (!hasValidAuthToken(headers) && options.requiresAuth !== false) {
      console.warn(`Missing authentication token for ${endpoint}, returning fallback`);
      return mockResponse;
    }

    const requestOptions = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    };

    const response = await fetch(`${API_BASE}${endpoint}`, requestOptions);
    
    if (!response.ok) {
      console.warn(`API responded with status ${response.status}: ${response.statusText}`);
      
      if (options.throwOnError) {
        throw new Error(await response.text());
      }
      
      return mockResponse;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    
    if (options.throwOnError) {
      throw error;
    }
    
    return mockResponse;
  }
}