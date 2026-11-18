import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { lek, dateTime, STATUS_LABEL, STATUS_FLOW, ORDER_ACTIONS } from '../../lib/format';
import ConfirmButton from '../../components/ConfirmButton';

const waLink = (phone) => `https://wa.me/${phone.replace(/\D/g, '')}`;

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data, error, reload } = useApi(`/admin/orders/${id}`, { auth: true });
  const order = data?.order;
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (order) {
      setForm({
        purchaseCny: order.costs.purchaseCny,
        deliveryAll: order.costs.deliveryAll,
        courierTracking: order.courierTracking,
        internalNote: order.internalNote,
      });
    }
  }, [order]);

  if (error) return <div className="alert alert-error">{error.message}</div>;
  if (!order || !form) return <p className="muted">Duke u ngarkuar…</p>;

  const save = async (extra = {}) => {
    setBusy(true);
    setMsg('');
    try {
      await api(`/admin/orders/${id}`, {
        method: 'PATCH',
        auth: true,
        body: {
          costs: { purchaseCny: form.purchaseCny, deliveryAll: form.deliveryAll },
          courierTracking: form.courierTracking,
          internalNote: form.internalNote,
          ...extra,
        },
      });
      setMsg('U ruajt ✓');
      reload();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Orders fully covered by Albania stock go straight from confirmed to the courier.
  const allLocal = order.items.every((i) => i.fromLocalStock);
  const action = allLocal && order.status === 'e_konfirmuar'
    ? { label: 'Iu dha korrierit', to: 'ne_dorezim' }
    : ORDER_ACTIONS[order.status];
  const open = !['e_anuluar', 'e_dorezuar'].includes(order.status);
  const steps = allLocal ? ['e_re', 'e_konfirmuar', 'ne_dorezim', 'e_dorezuar'] : STATUS_FLOW;
  const currentStep = steps.indexOf(order.status);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div>
      <Link to="/admin/porosite" className="back-link">← Porositë</Link>
      <div className="admin-title-row">
        <h1 className="admin-title">{order.number}</h1>
        <span className={`pill status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </div>

      <section className="card next-step">
        <div className="next-step-head">
          <h3>{open ? 'Hapi tjetër' : 'Statusi'}</h3>
          {order.paid
            ? <span className="pill status-e_dorezuar">{order.paymentMethod === 'card' ? '💳 Paguar me kartë' : 'Paguar'}</span>
            : <span className="pill status-e_re">{order.paymentMethod === 'cod' ? 'Paguhet në dorëzim' : order.paymentMethod === 'bank' ? '🏦 Pret transfertën' : 'Pa paguar'}</span>}
        </div>

        {order.status !== 'e_anuluar' && order.status !== 'pa_paguar' && (
          <ol className="stepper">
            {steps.map((st, i) => (
              <li key={st} className={`${i < currentStep ? 'done' : ''} ${i === currentStep ? 'current' : ''}`}>
                <span className="dot" />{STATUS_LABEL[st]}
              </li>
            ))}
          </ol>
        )}

        {open && (
          <div className="next-step-actions">
            {action && (
              <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={() => save({ status: action.to })}>{action.label}</button>
            )}
            {order.status === 'ne_magazine' && !order.shipment && (
              <Link to="/admin/dergesat" className="btn btn-outline btn-lg">Shtoje në një dërgesë kargo</Link>
            )}
            <ConfirmButton
              className="btn btn-danger-ghost btn-lg"
              disabled={busy}
              onConfirm={() => save({ status: 'e_anuluar' })}
              confirmText={order.paid ? 'Po, refuzoje (ktheji paratë në kartë)' : 'Po, refuzoje porosinë'}
            >
              {order.status === 'e_re' ? '✕ Refuzo' : 'Anulo porosinë'}
            </ConfirmButton>
          </div>
        )}
        {order.status === 'pa_paguar' && order.paymentMethod === 'bank' && <p className="muted small">Kontrollo llogarinë bankare për një transfertë {lek(order.total)} me përshkrimin <b>{order.number}</b>. Kur të vijë, shtyp "Shëno si të paguar". Pa pagesë, porosia anulohet vetë pas 3 ditësh.</p>}
        {order.status === 'pa_paguar' && order.paymentMethod !== 'bank' && <p className="muted small">Klienti nuk e ka përfunduar pagesën me kartë. Nëse nuk paguan brenda 1 ore, porosia anulohet vetë.</p>}
        {order.status === 'e_anuluar' && order.paid && <p className="small"><b>Kjo porosi ishte paguar.</b> Kthejini paratë klientit nga paneli i bankës.</p>}
        {allLocal && open && <p className="muted small">Të gjithë artikujt janë në stok në Shqipëri, kështu që kjo porosi nuk kalon nga Kina.</p>}
        {order.shipment && <p className="small">Dërgesa: <Link to={`/admin/dergesat/${order.shipment._id}`}>{order.shipment.code}</Link></p>}

        {open && (
          <details className="manual-status">
            <summary>Ndrysho statusin me dorë</summary>
            <select value="" onChange={(e) => e.target.value && save({ status: e.target.value })} disabled={busy} aria-label="Zgjidh statusin">
              <option value="">Zgjidh statusin…</option>
              {STATUS_FLOW.map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
            </select>
          </details>
        )}
        {msg && <p className="small">{msg}</p>}
      </section>

      <div className="admin-grid">
        <section className="card">
          <h3>Klienti</h3>
          <p><b>{order.customer.name}</b></p>
          <p><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a> · <a href={waLink(order.customer.phone)} target="_blank" rel="noreferrer">WhatsApp</a></p>
          <p>{order.customer.city}, {order.customer.address}</p>
          {order.customer.note && <p className="note">“{order.customer.note}”</p>}
        </section>

        <section className="card">
          <h3>Historiku</h3>
          <ul className="history">
            {[...order.statusHistory].reverse().map((h, i) => (
              <li key={i}><b>{STATUS_LABEL[h.status]}</b> <span className="muted small">{dateTime(h.at)}{h.by ? ` · ${h.by}` : ''}{h.note ? ` · ${h.note}` : ''}</span></li>
            ))}
          </ul>
        </section>

      </div>

      <section className="card">
        <h3>Artikujt</h3>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Produkti</th><th>Masa / Ngjyra</th><th className="num">Sasia</th><th className="num">Çmimi</th><th>Burimi</th></tr></thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i._id}>
                <td>{i.name}</td>
                <td>{[i.size, i.color].filter(Boolean).join(' / ') || '—'}</td>
                <td className="num">{i.quantity}</td>
                <td className="num">{lek(i.unitPrice * i.quantity)}</td>
                <td>{i.fromLocalStock ? <span className="pill status-e_dorezuar">Stok në AL</span> : <span className="pill status-e_blere">Nga Kina</span>}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td colSpan={3}>Transporti</td><td className="num">{lek(order.shippingFee)}</td><td /></tr>
            <tr><td colSpan={3}><b>Totali</b></td><td className="num"><b>{lek(order.total)}</b></td><td /></tr>
          </tfoot>
        </table></div>
      </section>

      <section className="card form">
        <h3>Kostot dhe dërgesa</h3>
        <div className="form-row">
          <label>Blerja (¥ CNY)<input type="number" min="0" step="0.01" value={form.purchaseCny} onChange={set('purchaseCny')} /></label>
          <label>Korrieri në AL (L)<input type="number" min="0" value={form.deliveryAll} onChange={set('deliveryAll')} /></label>
          <label>Kargo (L)<input value={order.costs.cargoAll} disabled title="Llogaritet nga dërgesa" /></label>
        </div>
        <label>Kodi i korrierit<input value={form.courierTracking} onChange={set('courierTracking')} /></label>
        <label>Shënim i brendshëm<textarea rows={2} value={form.internalNote} onChange={set('internalNote')} /></label>
        <div className="row">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => save()}>Ruaj</button>
          {msg && <span className="small">{msg}</span>}
        </div>
      </section>
    </div>
  );
}
