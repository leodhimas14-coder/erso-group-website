import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const ROLE_LANDING = { admin: '/admin', cashier: '/cashier', kitchen: '/kitchen' };

/** Staff login (admin/cashier/kitchen). Kiosk ordering itself needs no login. */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      navigate(ROLE_LANDING[user.role] || '/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: '4rem auto' }}>
      <h2>Staff Login</h2>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Log in</button>
    </form>
  );
}
