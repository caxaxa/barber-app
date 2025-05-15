// src/services/cognito.js
import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails
  } from 'amazon-cognito-identity-js';
  
  const poolData = {
    UserPoolId: process.env.REACT_APP_USER_POOL_ID,
    ClientId:   process.env.REACT_APP_COGNITO_CLIENT_ID,
  };
  
  export const userPool = new CognitoUserPool(poolData);
  
  export function signUp({ username, password, email, accountType }) {
    return new Promise((resolve, reject) => {
      userPool.signUp(
        username,
        password,
        [
          { Name: 'email', Value: email },
          { Name: 'custom:accountType', Value: accountType }
        ],
        null,
        (err, data) => (err ? reject(err) : resolve(data))
      );
    });
  }
  
  export function signIn({ username, password }) {
    const authDetails = new AuthenticationDetails({ Username: username, Password: password });
    const user = new CognitoUser({ Username: username, Pool: userPool });
  
    return new Promise((resolve, reject) => {
      user.authenticateUser(authDetails, {
        onSuccess: session => resolve(session),
        onFailure: err     => reject(err),
      });
    });
  }
  
  export function getSession() {
    return new Promise((resolve, reject) => {
      const user = userPool.getCurrentUser();
      if (!user) {
        return resolve(null);
      }
      user.getSession((err, session) => {
        if (err) {
          reject(err);
        } else {
          resolve(session);
        }
      });
    });
  }

  export function confirmSignUp(username, code) {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: username, Pool: userPool });
      user.confirmRegistration(code, true, (err, data) =>
        err ? reject(err) : resolve(data)
      );
    });
  }

/**
 * Change user password
 * @param {string} oldPassword - The current password
 * @param {string} newPassword - The new password
 * @returns {Promise} - Resolves when password is changed successfully
 */
export function changePassword(oldPassword, newPassword) {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      return reject(new Error('No user in session'));
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      user.changePassword(oldPassword, newPassword, (err, result) => {
        err ? reject(err) : resolve(result);
      });
    });
  });
}

/**
 * Get user attributes from Cognito
 * @returns {Promise<Object>} - Resolves with user attributes
 */
export function getUserAttributes() {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      return reject(new Error('No user in session'));
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      user.getUserAttributes((err, attributes) => {
        if (err) {
          reject(err);
          return;
        }

        // Convert array of attributes to object
        const attributesObj = attributes.reduce((obj, attribute) => {
          obj[attribute.Name] = attribute.Value;
          return obj;
        }, {});

        resolve(attributesObj);
      });
    });
  });
}

/**
 * Update user attributes in Cognito
 * @param {Object} attributes - Attributes to update (e.g., {email: 'new@example.com'})
 * @returns {Promise<Object>} - Resolves when attributes are updated
 */
export function updateUserAttributes(attributes) {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      return reject(new Error('No user in session'));
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Convert attributes object to array of attribute objects
      const attributeList = Object.entries(attributes).map(([key, value]) => ({
        Name: key,
        Value: value
      }));

      user.updateAttributes(attributeList, (err, result) => {
        err ? reject(err) : resolve(result);
      });
    });
  });
}

/**
 * Verify user attribute (like email or phone_number)
 * @param {string} attributeName - The attribute to verify
 * @returns {Promise} - Resolves when verification code is sent
 */
export function verifyUserAttribute(attributeName) {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      return reject(new Error('No user in session'));
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      user.getAttributeVerificationCode(attributeName, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err)
      });
    });
  });
}

/**
 * Confirm verification code for an attribute
 * @param {string} attributeName - The attribute being verified
 * @param {string} code - The verification code
 * @returns {Promise} - Resolves when verification is successful
 */
export function confirmUserAttribute(attributeName, code) {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      return reject(new Error('No user in session'));
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      user.verifyAttribute(attributeName, code, {
        onSuccess: (data) => resolve(data),
        onFailure: (err) => reject(err)
      });
    });
  });
}

/**
 * Set up MFA (TOTP - Time-based One-Time Password)
 * @returns {Promise<Object>} - Resolves with secret code and QR code URL
 */
export function setupMFA() {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      return reject(new Error('No user in session'));
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      user.associateSoftwareToken({
        onSuccess: (secretCode) => {
          // Generate a QR code URL for TOTP apps
          const username = user.getUsername();
          const issuer = 'BarberApp'; // App name
          const qrCodeUrl = `otpauth://totp/${issuer}:${username}?secret=${secretCode}&issuer=${issuer}`;
          
          resolve({
            secretCode,
            qrCodeUrl
          });
        },
        onFailure: (err) => reject(err)
      });
    });
  });
}

/**
 * Verify MFA setup with code from authenticator app
 * @param {string} code - Verification code from authenticator app
 * @returns {Promise} - Resolves when MFA setup is verified
 */
export function verifyMFASetup(code) {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      return reject(new Error('No user in session'));
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      user.verifySoftwareToken(code, 'TOTP', {
        onSuccess: (data) => resolve(data),
        onFailure: (err) => reject(err)
      });
    });
  });
}

/**
 * Enable or disable MFA for the user
 * @param {boolean} enabled - Whether to enable or disable MFA
 * @returns {Promise} - Resolves when MFA preference is updated
 */
export function setMFAPreference(enabled) {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      return reject(new Error('No user in session'));
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      // Set the preferred MFA method to TOTP or NOMFA
      user.setUserMfaPreference(null, {
        Enabled: enabled,
        PreferredMfa: enabled
      }, (err, result) => {
        err ? reject(err) : resolve(result);
      });
    });
  });
}

/**
 * Check if user has MFA enabled
 * @returns {Promise<boolean>} - Resolves with true if MFA is enabled
 */
export function getMFAStatus() {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      return reject(new Error('No user in session'));
    }

    user.getSession((err, session) => {
      if (err) {
        reject(err);
        return;
      }

      user.getUserData((err, userData) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Check MFA options from user data
        const preferredMfaSetting = userData.PreferredMfaSetting;
        const mfaEnabled = preferredMfaSetting === 'SOFTWARE_TOKEN_MFA';
        
        resolve(mfaEnabled);
      });
    });
  });
}