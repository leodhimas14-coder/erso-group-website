import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../../lib/api';
import ConfirmButton from '../../components/ConfirmButton';
import { useApi } from '../../lib/useApi';
import { qs } from '../../lib/api';
import { lek, dateTime, STATUS_LABEL, STATUS_FLOW, ORDER_ACTIONS } from '../../lib/format';

export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const q = params.get('q') || '';
  const [search, setSearch] = useState(q);
  const { data, loading, error, reload } = useApi(`/admin/orders${qs({ status, q })}`, { auth: true });
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const move = async (order, to) => {
    setBusyId(order._id);
    setActionError('');
    try {
      await api(`/admin/orders/${order._id}`, { method: 'PATCH', auth: true, body: { status: to } });
      reload();
    } catch (err) {
      setActionError(`${order.number}: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };
  const counts = data?.counts || {};

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  return (
    <div>
      <h1 className="admin-title">Porositë</h1>
      <div className="chips scroll">
        <button type="button" className={`chip ${!status ? 'active' : ''}`} onClick={() => setParam('status', '')}>Të gjitha</button>
        {[...STATUS_FLOW, 'e_anuluar', 'pa_paguar'].map((s) => (
          <button type="button" key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setParam('status', s)}>
            {STATUS_LABEL[s]} {counts[s] ? <span className="chip-count">{counts[s]}</span> : null}
          </button>
        ))}
      </div>
      <form className="admin-search" onSubmit={(e) => { e.preventDefault(); setParam('q', search.trim()); }}>
        <input placeholder="Kërko: numri, emri, telefoni, qyteti" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-ghost">Kërko</button>
      </form>

      {error && <div className="alert alert-error">{error.message}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}
      {loading && <p className="muted">Duke u ngarkuar…</p>}
      {data && (
        <div className="table-wrap"><table className="table">
          <thead>
            <tr><th>Nr.</th><th>Klienti</th><th>Qyteti</th><th className="num">Totali</th><th>Statusi</th><th>Data</th><th>Veprimi</th></tr>
          </thead>
          <tbody>
            {data.orders.map((o) => (
              <tr key={o._id}>
                <td><Link to={`/admin/porosite/${o._id}`}><b>{o.number}</b></Link></td>
                <td>{o.customer.name}<div className="muted small">{o.customer.phone}</div></td>
                <td>{o.customer.city}</td>
                <td className="num">{lek(o.total)}</td>
                <td><span className={`pill status-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                <td className="small">{dateTime(o.createdAt)}</td>
                <td className="row-actions">
                  {o.status === 'e_re' && (
                    <>
                      <button type="button" className="btn btn-primary btn-sm" disabled={busyId === o._id} onClick={() => move(o, 'e_konfirmuar')}>✓ Prano</button>
                      <ConfirmButton className="btn btn-danger-ghost btn-sm" disabled={busyId === o._id} onConfirm={() => move(o, 'e_anuluar')} confirmText="Sigurt?">✕</ConfirmButton>
                    </>
                  )}
                  {o.status !== 'e_re' && ORDER_ACTIONS[o.status] && o.status !== 'pa_paguar' && (
                    <button type="button" className="btn btn-ghost btn-sm" disabled={busyId === o._id} onClick={() => move(o, ORDER_ACTIONS[o.status].to)}>{ORDER_ACTIONS[o.status].label}</button>
                  )}
                </td>
              </tr>
            ))}
            {data.orders.length === 0 && <tr><td colSpan={7} className="muted center">Nuk ka porosi.</td></tr>}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
