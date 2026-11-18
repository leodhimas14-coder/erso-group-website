import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { lek, dateTime, STATUS_LABEL, SHIPMENT_LABEL } from '../../lib/format';
import ConfirmButton from '../../components/ConfirmButton';

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const { data, error, reload } = useApi(`/admin/shipments/${id}`, { auth: true });
  const shipment = data?.shipment;
  const editable = shipment?.status === 'ne_pergatitje';
  // Orders that are bought / in the warehouse and not yet in any shipment.
  const bought = useApi(editable ? '/admin/orders?status=e_blere' : null, { auth: true });
  const inWarehouse = useApi(editable ? '/admin/orders?status=ne_magazine' : null, { auth: true });
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ weightKg: 0, cargoCostAll: 0, note: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (shipment) setForm({ weightKg: shipment.weightKg, cargoCostAll: shipment.cargoCostAll, note: shipment.note });
  }, [shipment]);

  if (error) return <div className="alert alert-error">{error.message}</div>;
  if (!shipment) return <p className="muted">Duke u ngarkuar…</p>;

  const available = [...(bought.data?.orders || []), ...(inWarehouse.data?.orders || [])].filter((o) => !o.shipment);

  const patch = async (body) => {
    setMsg('');
    try {
      await api(`/admin/shipments/${id}`, { method: 'PATCH', auth: true, body });
      setMsg('U ruajt ✓');
      reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  const addSelected = async () => {
    await api(`/admin/shipments/${id}/orders`, { method: 'POST', auth: true, body: { orderIds: selected } });
    setSelected([]);
    reload();
    bought.reload();
    inWarehouse.reload();
  };

  const removeOrder = async (orderId) => {
    await api(`/admin/shipments/${id}/orders/${orderId}`, { method: 'DELETE', auth: true });
    reload();
    bought.reload();
    inWarehouse.reload();
  };

  const toggle = (oid) => setSelected((s) => (s.includes(oid) ? s.filter((x) => x !== oid) : [...s, oid]));

  return (
    <div>
      <Link to="/admin/dergesat" className="back-link">← Dërgesat</Link>
      <div className="admin-title-row">
        <h1 className="admin-title">{shipment.code}</h1>
        <span className={`pill ship-${shipment.status}`}>{SHIPMENT_LABEL[shipment.status]}</span>
      </div>

      <section className="card form">
        <div className="form-row">
          <label>Pesha (kg)<input type="number" min="0" step="0.1" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} /></label>
          <label>Kosto e kargos (L)<input type="number" min="0" value={form.cargoCostAll} onChange={(e) => setForm({ ...form, cargoCostAll: e.target.value })} /></label>
        </div>
        <label>Shënim<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={() => patch(form)}>Ruaj</button>
          {shipment.status === 'ne_pergatitje' && (
            <ConfirmButton className="btn btn-primary" disabled={shipment.orders.length === 0} onConfirm={() => patch({ ...form, status: 'nisur' })} confirmText="Konfirmo: klientët do shohin “Në rrugë”">✈️ U nis nga Kina</ConfirmButton>
          )}
          {shipment.status === 'nisur' && (
            <button type="button" className="btn btn-primary" onClick={() => patch({ ...form, status: 'mberritur' })}>📦 Mbërriti në Shqipëri</button>
          )}
          {msg && <span className="small">{msg}</span>}
        </div>
        <p className="muted small">
          {shipment.departedAt && <>Nisur: {dateTime(shipment.departedAt)} · </>}
          {shipment.arrivedAt && <>Mbërritur: {dateTime(shipment.arrivedAt)} · </>}
          Kosto e kargos ndahet njësoj midis porosive.
        </p>
      </section>

      <section className="card">
        <h3>Porositë në këtë dërgesë ({shipment.orders.length})</h3>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Nr.</th><th>Klienti</th><th>Qyteti</th><th className="num">Totali</th><th>Statusi</th><th /></tr></thead>
          <tbody>
            {shipment.orders.map((o) => (
              <tr key={o._id}>
                <td><Link to={`/admin/porosite/${o._id}`}><b>{o.number}</b></Link></td>
                <td>{o.customer.name}</td>
                <td>{o.customer.city}</td>
                <td className="num">{lek(o.total)}</td>
                <td><span className={`pill status-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                <td>{editable && <button type="button" className="link-btn" onClick={() => removeOrder(o._id)}>Hiq</button>}</td>
              </tr>
            ))}
            {shipment.orders.length === 0 && <tr><td colSpan={6} className="muted center">Shtoni porosi nga lista më poshtë.</td></tr>}
          </tbody>
        </table></div>
      </section>

      {editable && (
        <section className="card">
          <div className="admin-title-row">
            <h3>Porosi gati për t'u ngarkuar ({available.length})</h3>
            <button type="button" className="btn btn-primary" disabled={!selected.length} onClick={addSelected}>Shto {selected.length || ''} në dërgesë</button>
          </div>
          <div className="table-wrap"><table className="table">
            <thead><tr><th><input type="checkbox" aria-label="Zgjidh të gjitha" checked={available.length > 0 && selected.length === available.length} onChange={(e) => setSelected(e.target.checked ? available.map((o) => o._id) : [])} /></th><th>Nr.</th><th>Klienti</th><th>Qyteti</th><th>Statusi</th></tr></thead>
            <tbody>
              {available.map((o) => (
                <tr key={o._id} onClick={() => toggle(o._id)} className="clickable">
                  <td><input type="checkbox" checked={selected.includes(o._id)} readOnly /></td>
                  <td><b>{o.number}</b></td>
                  <td>{o.customer.name}</td>
                  <td>{o.customer.city}</td>
                  <td><span className={`pill status-${o.status}`}>{STATUS_LABEL[o.status]}</span></td>
                </tr>
              ))}
              {available.length === 0 && <tr><td colSpan={5} className="muted center">S'ka porosi të blera që presin dërgesë.</td></tr>}
            </tbody>
          </table></div>
        </section>
      )}
    </div>
  );
}
