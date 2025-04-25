import React from 'react';
import { ConfigProvider } from './context/ConfigContext';
import { NotificationProvider } from './components/ui/NotificationContext';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <ConfigProvider>
      <NotificationProvider>
        <LoginPage />
      </NotificationProvider>
    </ConfigProvider>
  );
}