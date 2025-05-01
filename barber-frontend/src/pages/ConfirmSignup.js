// src/pages/ConfirmSignUp.jsx
import { useState } from 'react';
import { confirmSignUp } from '../services/cognito';

export default function ConfirmSignUp({ username }) {
  const [code, setCode] = useState('');
  const [msg, setMsg]   = useState('');

  const onConfirm = async e => {
    e.preventDefault();
    try {
      await confirmSignUp(username, code);
      setMsg('✅ Your account is confirmed! You can now sign in.');
    } catch (err) {
      setMsg(`❌ ${err.message}`);
    }
  };

  return (
    <form onSubmit={onConfirm}>
      <h3>Enter the code we sent to your email</h3>
      <input
        placeholder="Confirmation code"
        value={code}
        onChange={e => setCode(e.target.value)}
      />
      <button type="submit">Confirm</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
