import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../lib/useApi';
import { lek, STATUS_LABEL, STATUS_FLOW } from '../../lib/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const orders = useApi('/admin/orders?status=e_re', { auth: true });
  const report = useApi(isAdmin ? '/admin/reports/summary' : null, { auth: true });
  const counts = orders.data?.counts || {};
  const r = report.data;

  return (
    <div>
      <h1 className="admin-title">Mirë se erdhe, {user.name}</h1>

      {counts.e_re > 0 && (
        <Link to="/admin/porosite?status=e_re" className="attention">
          <strong>{counts.e_re} {counts.e_re === 1 ? 'porosi e re pret' : 'porosi të reja presin'} të pranohen</strong>
          <span>Shiko dhe prano →</span>
        </Link>
      )}

      {isAdmin && r && (
        <>
          <p className="muted small">Ky muaj · fitimi llogaritet vetëm nga porositë e dorëzuara</p>
          <div className="stat-grid">
            <Stat label="Porosi gjithsej" value={r.orders} />
            <Stat label="Të ardhura (të dorëzuara)" value={lek(r.revenue)} />
            <Stat label="Shpenzime" value={lek(r.costs)} />
            <Stat label="Fitimi" value={lek(r.profit)} strong />
            <Stat label="Në proces (vlera)" value={lek(r.pendingValue)} />
            <Stat label="Të anuluara" value={r.cancelled} />
          </div>
        </>
      )}

      <h2 className="admin-subtitle">Porositë sipas statusit</h2>
      <div className="status-grid">
        {[...STATUS_FLOW, 'e_anuluar'].map((s) => (
          <Link key={s} to={`/admin/porosite?status=${s}`} className={`status-tile status-${s}`}>
            <strong>{counts[s] || 0}</strong>
            <span>{STATUS_LABEL[s]}</span>
          </Link>
        ))}
      </div>

      {isAdmin && r?.topProducts?.length > 0 && (
        <>
          <h2 className="admin-subtitle">Më të shiturat këtë muaj</h2>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Produkti</th><th className="num">Copë</th><th className="num">Vlera</th></tr></thead>
            <tbody>
              {r.topProducts.map((p) => (
                <tr key={p.name}><td>{p.name}</td><td className="num">{p.quantity}</td><td className="num">{lek(p.revenue)}</td></tr>
              ))}
            </tbody>
          </table></div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, strong }) {
  return (
    <div className={`stat ${strong ? 'stat-strong' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
