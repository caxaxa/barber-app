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
        return reject(new Error('No user in session'));
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
   