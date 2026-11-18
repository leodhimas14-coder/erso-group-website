import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { date, lek, SHIPMENT_LABEL } from '../../lib/format';

export default function ShipmentsPage() {
  const { data, loading, error } = useApi('/admin/shipments', { auth: true });
  const navigate = useNavigate();

  const create = async () => {
    const { shipment } = await api('/admin/shipments', { method: 'POST', auth: true, body: {} });
    navigate(`/admin/dergesat/${shipment._id}`);
  };

  return (
    <div>
      <div className="admin-title-row">
        <h1 className="admin-title">Dërgesat e kargos</h1>
        <button type="button" className="btn btn-primary" onClick={create}>+ Dërgesë e re</button>
      </div>
      <p className="muted small">Një dërgesë = një nisje nga magazina në Kinë drejt Shqipërisë. Kur ndryshon statusi i dërgesës, ndryshojnë automatikisht edhe porositë brenda saj.</p>
      {error && <div className="alert alert-error">{error.message}</div>}
      {loading && <p className="muted">Duke u ngarkuar…</p>}
      {data && (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Kodi</th><th>Statusi</th><th className="num">Porosi</th><th className="num">Pesha</th><th className="num">Kosto kargo</th><th>Krijuar</th></tr></thead>
          <tbody>
            {data.shipments.map((s) => (
              <tr key={s._id}>
                <td><Link to={`/admin/dergesat/${s._id}`}><b>{s.code}</b></Link></td>
                <td><span className={`pill ship-${s.status}`}>{SHIPMENT_LABEL[s.status]}</span></td>
                <td className="num">{s.orders.length}</td>
                <td className="num">{s.weightKg ? `${s.weightKg} kg` : '—'}</td>
                <td className="num">{s.cargoCostAll ? lek(s.cargoCostAll) : '—'}</td>
                <td>{date(s.createdAt)}</td>
              </tr>
            ))}
            {data.shipments.length === 0 && <tr><td colSpan={6} className="muted center">Ende s'ka dërgesa.</td></tr>}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
