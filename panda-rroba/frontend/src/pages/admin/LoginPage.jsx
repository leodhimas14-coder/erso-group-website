import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import { IS_DEMO } from '../../lib/api';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(IS_DEMO ? 'admin@panda.al' : '');
  const [password, setPassword] = useState(IS_DEMO ? 'panda1234' : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <form className="form card login-card" onSubmit={onSubmit}>
        <div className="center"><Logo size={44} /><h1>Panda Admin</h1></div>
        <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></label>
        <label>Fjalëkalimi<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></label>
        {IS_DEMO && <p className="muted small center">Demo: të dhënat e hyrjes janë plotësuar.</p>}
        {error && <div className="alert alert-error">{error}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Po hyhet…' : 'Hyr'}</button>
      </form>
    </div>
  );
}
