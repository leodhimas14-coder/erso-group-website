import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { lek, date } from '../../lib/format';
import StatusTimeline from '../../components/StatusTimeline';
import BankDetails from '../../components/BankDetails';
import { useConfig } from '../../context/ConfigContext';

export default function TrackPage() {
  const [params, setParams] = useSearchParams();
  const [number, setNumber] = useState(params.get('nr') || '');
  const [phone, setPhone] = useState(params.get('tel') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { bank } = useConfig();

  const lookup = async (nr, tel) => {
    setLoading(true);
    setError('');
    try {
      const d = await api(`/orders/track/${encodeURIComponent(nr.trim())}?phone=${encodeURIComponent(tel)}`);
      setOrder(d.order);
    } catch (err) {
      setOrder(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.get('nr') && params.get('tel')) lookup(params.get('nr'), params.get('tel'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    setParams({ nr: number.trim(), tel: phone.trim() }, { replace: true });
    lookup(number, phone);
  };

  return (
    <div className="container section narrow">
      <h1 className="page-title">Gjurmo porosinë</h1>
      <form className="form card" onSubmit={onSubmit}>
        <label>Numri i porosisë<input required placeholder="PA-1001" value={number} onChange={(e) => setNumber(e.target.value)} /></label>
        <label>Numri i telefonit<input required type="tel" inputMode="tel" placeholder="06X XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Po kërkohet…' : 'Kërko'}</button>
      </form>
      {error && <div className="alert alert-error">{error}</div>}

      {order && (
        <div className="card track-result">
          <div className="track-head">
            <div><span className="muted small">Porosia</span><strong>{order.number}</strong></div>
            <div className="right"><span className="muted small">Data</span><strong>{date(order.createdAt)}</strong></div>
          </div>
          <StatusTimeline order={order} />
          {order.status === 'pa_paguar' && order.paymentMethod === 'bank' && <BankDetails bank={bank} order={order} />}
          {order.courierTracking && <p className="small">Kodi i korrierit: <b>{order.courierTracking}</b></p>}
          <div className="summary">
            {order.items.map((i, idx) => (
              <div key={idx} className="small"><span>{i.quantity}× {i.name}{i.size || i.color ? ` (${[i.size, i.color].filter(Boolean).join(', ')})` : ''}</span><span>{lek(i.unitPrice * i.quantity)}</span></div>
            ))}
            <div><span>Transporti</span><span>{order.shippingFee ? lek(order.shippingFee) : 'Falas'}</span></div>
            <div className="summary-total"><span>Totali</span><span>{lek(order.total)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
