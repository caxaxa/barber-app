import { useState } from 'react';
import { signUp } from '../services/cognito';

export default function SignUp() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    accountType: "individual",  // default
  });
  const [message, setMessage] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await signUp({
            username: form.username,
            password: form.password,
            phone:    form.phone,
            accountType: form.accountType
          });
      setMessage("Check your phone for the confirmation code");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Username"
        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
      />
      <input
        type="phone"
        placeholder="phone"
        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
      />
      <select
        value={form.accountType}
        onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))}
      >
        <option value="individual">Individual</option>
        <option value="enterprise">Enterprise</option>
      </select>
      <button type="submit">Sign Up</button>
      {message && <p>{message}</p>}
    </form>
  );
}
