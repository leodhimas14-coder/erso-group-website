import { useState } from 'react';
import { api, qs } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { date, lek } from '../../lib/format';

function ResetPassword({ customer, onDone }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  if (!open) return <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Fjalëkalim i ri</button>;
  const save = async () => {
    try {
      await api(`/admin/customers/${customer._id}`, { method: 'PATCH', auth: true, body: { password } });
      setMsg('U ndryshua ✓ Jepja klientit.');
      setPassword('');
      onDone();
    } catch (err) { setMsg(err.message); }
  };
  return (
    <span className="inline-form">
      <input aria-label="Fjalëkalimi i ri" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 6 shenja" />
      <button type="button" className="btn btn-primary btn-sm" onClick={save}>Ruaj</button>
      {msg && <span className="small">{msg}</span>}
    </span>
  );
}

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const { data, loading, error, reload } = useApi(`/admin/customers${qs({ q: search })}`, { auth: true });

  const toggle = async (c) => {
    await api(`/admin/customers/${c._id}`, { method: 'PATCH', auth: true, body: { active: !c.active } });
    reload();
  };

  return (
    <div>
      <h1 className="admin-title">Klientët {data && <span className="muted">({data.customers.length})</span>}</h1>
      <p className="muted small">Llogaritë e blerësve. Nëse dikush harron fjalëkalimin, i vendos një të ri këtu dhe ia jep në telefon/WhatsApp.</p>
      <form className="admin-search" onSubmit={(e) => { e.preventDefault(); setSearch(q.trim()); }}>
        <input placeholder="Kërko: emri, email-i, telefoni" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="submit" className="btn btn-ghost">Kërko</button>
      </form>
      {error && <div className="alert alert-error">{error.message}</div>}
      {loading && !data && <p className="muted">Duke u ngarkuar…</p>}
      {data && (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Emri</th><th>Kontakti</th><th className="num">Porosi</th><th className="num">Paguar</th><th>Që nga</th><th>Aktiv</th><th /></tr></thead>
          <tbody>
            {data.customers.map((c) => (
              <tr key={c._id} className={c.active ? '' : 'inactive'}>
                <td><b>{c.name}</b></td>
                <td className="small">{c.email}{c.email && c.phone && <br />}{c.phone}</td>
                <td className="num">{c.orders}</td>
                <td className="num">{lek(c.spent)}</td>
                <td className="small">{date(c.createdAt)}</td>
                <td><button type="button" role="switch" aria-checked={c.active} aria-label={c.active ? 'Blloko llogarinë' : 'Aktivizo llogarinë'} className={`switch ${c.active ? 'on' : ''}`} onClick={() => toggle(c)}><span /></button></td>
                <td className="row-actions"><ResetPassword customer={c} onDone={reload} /></td>
              </tr>
            ))}
            {data.customers.length === 0 && <tr><td colSpan={7} className="muted center">Ende s'ka klientë.</td></tr>}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
