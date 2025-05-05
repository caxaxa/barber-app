import { useState } from 'react';
import { signIn } from '../services/cognito';

export default function SignIn({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    try {
        await signIn({
            username: credentials.username,
            password: credentials.password
            });
        onLogin();  // e.g. reload your ConfigContext / redirect
        } catch (err) {
        setError(err.message);
        }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Username"
        onChange={e => setCredentials(c => ({ ...c, username: e.target.value }))}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={e => setCredentials(c => ({ ...c, password: e.target.value }))}
      />
      <button type="submit">Sign In</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
