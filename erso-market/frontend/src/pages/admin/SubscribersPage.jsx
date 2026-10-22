import { useState } from 'react';
import { useApi } from '../../lib/useApi';
import { date } from '../../lib/format';

export default function SubscribersPage() {
  const { data, loading, error } = useApi('/admin/subscribers', { auth: true });
  const [copied, setCopied] = useState('');
  const emails = (data?.subscribers || []).map((s) => s.email);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(emails.join(', '));
      setCopied('U kopjuan ✓');
    } catch {
      setCopied('Nuk u kopjuan. Zgjidhi me dorë nga lista.');
    }
  };

  return (
    <div>
      <div className="admin-title-row">
        <h1 className="admin-title">Abonentët e email-it {data && <span className="muted">({data.total})</span>}</h1>
        {emails.length > 0 && <button type="button" className="btn btn-primary" onClick={copyAll}>Kopjo të gjitha</button>}
      </div>
      <p className="muted small">Njerëzit që u regjistruan në fund të faqes dhe pranuan të marrin njoftime. {copied}</p>
      {error && <div className="alert alert-error">{error.message}</div>}
      {loading && <p className="muted">Duke u ngarkuar…</p>}
      {data && (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Email</th><th>Regjistruar</th></tr></thead>
          <tbody>
            {data.subscribers.map((s) => <tr key={s._id}><td>{s.email}</td><td>{date(s.createdAt)}</td></tr>)}
            {data.subscribers.length === 0 && <tr><td colSpan={2} className="muted center">Ende nuk ka abonentë.</td></tr>}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
