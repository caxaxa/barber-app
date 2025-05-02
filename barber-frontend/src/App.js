// src/App.js
import React, { useEffect } from 'react';
import { ConfigProvider } from './context/ConfigContext';
import { NotificationProvider } from './components/ui/NotificationContext';
import LoginPage from './pages/LoginPage';

function AppInitializer({ children }) {
  useEffect(() => {
    // Cognito implicit-grant returns tokens in the hash: "#id_token=…&access_token=…"
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.slice(1));
      const idToken = params.get('id_token');
      if (idToken) {
        localStorage.setItem('idToken', idToken);
        // Remove the fragment so the URL is clean
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  return children;
}

export default function App() {
  return (
    <AppInitializer>
      <ConfigProvider>
        <NotificationProvider>
          <LoginPage />
        </NotificationProvider>
      </ConfigProvider>
    </AppInitializer>
  );
}
