import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { lek } from '../../lib/format';
import ConfirmButton from '../../components/ConfirmButton';

export default function PurchaseListPage() {
  const { data, loading, error, reload } = useApi('/admin/purchase-list', { auth: true });
  const [busy, setBusy] = useState(false);
  const items = data?.items || [];
  const orderIds = [...new Set(items.flatMap((i) => i.orders.map((o) => o.id)))];
  const totalCny = items.reduce((s, i) => s + i.totalCny, 0);

  const markAll = async () => {
    setBusy(true);
    try {
      await api('/admin/purchase-list/mark-bought', { method: 'POST', auth: true, body: { orderIds } });
      reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="admin-title-row">
        <h1 className="admin-title">Për të blerë në Kinë</h1>
        {items.length > 0 && <ConfirmButton className="btn btn-primary" disabled={busy} onConfirm={markAll} confirmText={`Shëno ${orderIds.length} porosi si të blera?`}>U blenë të gjitha</ConfirmButton>}
      </div>
      <p className="muted small">Artikujt nga porositë e <b>konfirmuara</b> që nuk i ke në stok në Shqipëri, të grupuar sipas produktit, masës dhe ngjyrës.</p>
      {error && <div className="alert alert-error">{error.message}</div>}
      {loading && <p className="muted">Duke u ngarkuar…</p>}
      {data && items.length === 0 && <p className="empty">S'ka asgjë për të blerë. Konfirmoni porositë e reja që të shfaqen këtu.</p>}
      {items.length > 0 && (
        <>
          <div className="table-wrap"><table className="table">
            <thead><tr><th /><th>Produkti</th><th>Masa / Ngjyra</th><th className="num">Sasia</th><th className="num">¥</th><th>Furnitori</th><th>Porositë</th></tr></thead>
            <tbody>
              {items.map((i) => (
                <tr key={`${i.productId}-${i.size}-${i.color}`}>
                  <td className="thumb-cell">{i.image && <img src={i.image} alt="" />}</td>
                  <td><b>{i.name}</b></td>
                  <td>{[i.size, i.color].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="num"><b>{i.quantity}</b></td>
                  <td className="num">{i.totalCny ? `¥${i.totalCny}` : '—'}</td>
                  <td>{i.supplier.url ? <a href={i.supplier.url} target="_blank" rel="noreferrer">{i.supplier.name || 'Linku'}</a> : i.supplier.name || '—'}</td>
                  <td className="small">{i.orders.map((o) => <Link key={o.id} to={`/admin/porosite/${o.id}`} className="order-ref">{o.number}</Link>)}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <p>Gjithsej: <b>¥{totalCny.toFixed(2)}</b> ≈ {lek(totalCny * data.cnyToAll)}</p>
        </>
      )}
    </div>
  );
}
