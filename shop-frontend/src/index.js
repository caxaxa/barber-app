import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './CSS_Template.css'; // Amazon Cognito CSS Template

// No Amplify imports here any more!

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
