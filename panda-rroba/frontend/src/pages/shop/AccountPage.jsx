import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import { api } from '../../lib/api';
import { useCustomer } from '../../context/CustomerContext';
import { useWishlist } from '../../context/WishlistContext';
import { useConfig } from '../../context/ConfigContext';
import { date, lek, STATUS_LABEL } from '../../lib/format';

function SignIn({ after }) {
  const { signIn } = useCustomer();
  const { contact } = useConfig();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', login: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(mode, mode === 'register' ? form : { login: form.login, password: form.password });
      if (after) navigate(after, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container section narrow">
      {after && <div className="alert alert-info">Për të blerë duhet një llogari. Shfletimi dhe shporta janë të lira për këdo.</div>}
      <div className="gender-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Hyr</button>
        <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Krijo llogari</button>
      </div>
      <form className="form" onSubmit={submit}>
        {mode === 'register' && <label>Emri dhe mbiemri<input id="acc-name" required value={form.name} onChange={set('name')} autoComplete="name" /></label>}
        <label>Email ose numër telefoni<input id="acc-login" required value={form.login} onChange={set('login')} autoComplete="username" placeholder="emri@gmail.com ose 069 123 4567" /></label>
        <label>Fjalëkalimi<input id="acc-password" type="password" required minLength={mode === 'register' ? 6 : undefined} value={form.password} onChange={set('password')} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? 'të paktën 6 shenja' : ''} /></label>
        {error && <div className="alert alert-error">{error}</div>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? 'Një moment…' : mode === 'register' ? 'Krijo llogarinë' : 'Hyr'}
        </button>
        {mode === 'login' && (
          <p className="muted small center">
            Harrove fjalëkalimin? Na shkruaj{contact.whatsapp ? <> në <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a></> : ''} dhe ta rivendosim.
          </p>
        )}
      </form>
    </div>
  );
}

function Profile() {
  const { customer, update } = useCustomer();
  const [form, setForm] = useState({ name: customer.name, email: '', phone: '', currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const body = { name: form.name };
      if (!customer.email && form.email) body.email = form.email;
      if (!customer.phone && form.phone) body.phone = form.phone;
      if (form.newPassword) Object.assign(body, { currentPassword: form.currentPassword, newPassword: form.newPassword });
      await update(body);
      setForm((f) => ({ ...f, email: '', phone: '', currentPassword: '', newPassword: '' }));
      setMsg({ text: 'U ruajt ✓' });
    } catch (err) {
      setMsg({ text: err.message, error: true });
    }
  };

  return (
    <details className="card profile-card">
      <summary>Të dhënat e mia</summary>
      <form className="form" onSubmit={save}>
        <label>Emri<input id="prof-name" value={form.name} onChange={set('name')} /></label>
        {customer.email ? <p className="small">Email: <b>{customer.email}</b></p> : <label>Shto email (opsionale)<input id="prof-email" type="email" value={form.email} onChange={set('email')} /></label>}
        {customer.phone ? <p className="small">Telefoni: <b>{customer.phone}</b></p> : <label>Shto numër telefoni (opsionale)<input id="prof-phone" inputMode="tel" value={form.phone} onChange={set('phone')} /></label>}
        <div className="form-row">
          <label>Fjalëkalimi aktual<input id="prof-cur" type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" /></label>
          <label>Fjalëkalim i ri<input id="prof-new" type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" /></label>
        </div>
        <div className="row">
          <button type="submit" className="btn btn-primary">Ruaj</button>
          {msg && <span className={`small ${msg.error ? 'form-error' : ''}`}>{msg.text}</span>}
        </div>
      </form>
    </details>
  );
}

function Dashboard() {
  const { customer, signOut } = useCustomer();
  const { count } = useWishlist();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api('/customers/me/orders', { auth: 'customer' }).then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, []);

  return (
    <div className="container section narrow">
      <h1 className="page-title">Përshëndetje, {customer.name.split(' ')[0]}</h1>

      <div className="account-links">
        <Link to="/te-ruajturat"><Icon name="heart" /> <span>Produktet e ruajtura</span><b>{count}</b></Link>
        <Link to="/gjurmo"><Icon name="truck" /> <span>Gjurmo një porosi</span></Link>
        <Link to="/info"><Icon name="bag" /> <span>Dërgesa dhe pagesa</span></Link>
      </div>

      <h2 className="section-title">Porositë e mia</h2>
      {!orders && <p className="muted">Duke u ngarkuar…</p>}
      {orders?.length === 0 && <p className="muted">Ende nuk ke bërë porosi.</p>}
      {orders?.length > 0 && (
        <ul className="my-orders">
          {orders.map((o) => (
            <li key={o.number}>
              <Link to={`/gjurmo?nr=${o.number}&tel=${encodeURIComponent(o.phone)}`}>
                <div>
                  <b>{o.number}</b>
                  <div className="muted small">{date(o.createdAt)} · {STATUS_LABEL[o.status]}</div>
                </div>
                <span>{lek(o.total)}</span>
                <span className="link-text">Gjurmo →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {customer.address?.address && (
        <>
          <h2 className="section-title">Adresa e dërgesës</h2>
          <div className="card">
            <div>{customer.address.city}, {customer.address.address}</div>
            <p className="muted small">Plotësohet vetë në porosinë e radhës.</p>
          </div>
        </>
      )}

      <Profile />
      <button type="button" className="btn btn-ghost btn-block" onClick={signOut}>Dil nga llogaria</button>
    </div>
  );
}

export default function AccountPage() {
  const { customer, loading } = useCustomer();
  const [params] = useSearchParams();
  const after = params.get('pas');
  if (loading) return <div className="container section"><p className="muted">Duke u ngarkuar…</p></div>;
  return customer ? <Dashboard /> : <SignIn after={after && after.startsWith('/') ? after : null} />;
}
