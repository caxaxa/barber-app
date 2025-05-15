// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useConfig } from '../context/config';

export function useAuth() {
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { setUserRole } = useConfig();

  const COGNITO_DOMAIN = process.env.REACT_APP_COGNITO_DOMAIN;
  const COGNITO_CLIENT = process.env.REACT_APP_COGNITO_CLIENT_ID;
  const REDIRECT_URI = process.env.REACT_APP_REDIRECT_URI;
  const SCOPES = 'openid email phone';

  const finishLogin = idToken => {
    try {
      const payload = jwtDecode(idToken);
      const accountType = payload['custom:accountType'] || 'individual';
      const username = payload['cognito:username'];

      sessionStorage.setItem('idToken', idToken);
      sessionStorage.setItem('shopId', username);
      sessionStorage.setItem('userRole', accountType);

      setUserRole(accountType);
      setIsLoggedIn(true);
      setReady(true);
    } catch (e) {
      setError('Falha ao processar token: ' + e.message);
      setReady(true);
    }
  };

  useEffect(() => {
    // 1) Already logged in?
    const stored = sessionStorage.getItem('idToken');
    if (stored) {
      finishLogin(stored);
      return;
    }

    // 2) Look for id_token in URL hash
    const hash = window.location.hash;
    if (hash.includes('id_token=')) {
      const idToken = new URLSearchParams(hash.slice(1)).get('id_token');
      if (idToken) {
        // remove the hash
        window.history.replaceState({}, document.title, window.location.pathname);
        finishLogin(idToken);
        return;
      } else {
        setError('Nenhum id_token encontrado na resposta.');
      }
    }

    // 3) Not logged in yet — show login button
    setReady(true);
  }, [setUserRole]);

  const handleHostedUi = () => {
    const params = new URLSearchParams({
      response_type: 'token',
      client_id: COGNITO_CLIENT,
      redirect_uri: REDIRECT_URI,
      scope: SCOPES,
      screen_hint: 'signup',
      lang: 'pt-BR',
    });
    window.location.assign(
      `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`
    );
  };

  return {
    error,
    ready,
    isLoggedIn,
    handleHostedUi,
  };
}