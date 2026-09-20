import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Krijo llogari në Librari Alb</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Emri i përdoruesit (username)
          <input value={form.username} onChange={update('username')} required pattern="[a-z0-9_]{3,20}" />
        </label>
        <label>
          Emri për t'u shfaqur
          <input value={form.displayName} onChange={update('displayName')} required maxLength={50} />
        </label>
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} required />
        </label>
        <label>
          Fjalëkalimi
          <input type="password" value={form.password} onChange={update('password')} required minLength={8} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Duke u regjistruar...' : 'Regjistrohu'}
        </button>
      </form>
      <p>
        Ke llogari? <Link to="/hyrje">Hyr</Link>
      </p>
    </div>
  );
}
