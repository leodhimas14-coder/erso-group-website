import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { lek, GENDER_LABEL } from '../../lib/format';
import { useCategoryLabels } from '../../context/ConfigContext';
import ConfirmButton from '../../components/ConfirmButton';

export default function ProductsPage() {
  const { data, loading, error, reload } = useApi('/admin/products', { auth: true });
  const CATEGORY_LABEL = useCategoryLabels();
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [filter, setFilter] = useState('all');

  const run = async (product, request) => {
    setBusyId(product._id);
    setActionError('');
    try {
      await request();
      reload();
    } catch (err) {
      setActionError(`${product.name}: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const toggle = (p) => run(p, () => api(`/admin/products/${p._id}`, { method: 'PUT', auth: true, body: { active: !p.active } }));
  const remove = (p) => run(p, () => api(`/admin/products/${p._id}`, { method: 'DELETE', auth: true }));

  const products = (data?.products || []).filter((p) => (filter === 'all' ? true : filter === 'active' ? p.active : !p.active));
  const hiddenCount = (data?.products || []).filter((p) => !p.active).length;

  return (
    <div>
      <div className="admin-title-row">
        <h1 className="admin-title">Produktet</h1>
        <Link to="/admin/produktet/i-ri" className="btn btn-primary">+ Produkt i ri</Link>
      </div>
      <div className="chips">
        <button type="button" className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Të gjitha</button>
        <button type="button" className={`chip ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>Në shitje</button>
        <button type="button" className={`chip ${filter === 'hidden' ? 'active' : ''}`} onClick={() => setFilter('hidden')}>Jo aktive {hiddenCount > 0 && <span className="chip-count">{hiddenCount}</span>}</button>
      </div>
      <p className="muted small">"Aktiv" = shfaqet në dyqan. Fike kur s'e ke përkohësisht; fshije kur nuk do ta shesësh më kurrë (porositë e vjetra nuk prishen).</p>
      {error && <div className="alert alert-error">{error.message}</div>}
      {actionError && <div className="alert alert-error">{actionError}</div>}
      {loading && !data && <p className="muted">Duke u ngarkuar…</p>}
      {data && (
        <div className="table-wrap"><table className="table table-products">
          <thead><tr><th /><th>Emri</th><th>Kategoria</th><th className="num">Çmimi</th><th className="num">Stok AL</th><th>Aktiv</th><th /></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className={p.active ? '' : 'inactive'}>
                <td className="thumb-cell">{p.images[0] && <img src={p.images[0]} alt="" />}</td>
                <td className="cell-name"><Link to={`/admin/produktet/${p._id}`}><b>{p.name}</b></Link>{p.featured && <span className="pill">★</span>}</td>
                <td className="cell-cat">{CATEGORY_LABEL[p.category] || <span className="muted">{p.category}</span>} · <span className="muted">{GENDER_LABEL[p.gender || 'unisex']}</span></td>
                <td className="num cell-price">{lek(p.price)}</td>
                <td className="num cell-stock">{p.variants.reduce((s, v) => s + v.stock, 0)} <span className="mobile-only muted">në stok</span></td>
                <td className="cell-switch">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.active}
                    aria-label={p.active ? `Fik ${p.name}` : `Aktivizo ${p.name}`}
                    className={`switch ${p.active ? 'on' : ''}`}
                    disabled={busyId === p._id}
                    onClick={() => toggle(p)}
                  ><span /></button>
                </td>
                <td className="row-actions cell-delete">
                  <ConfirmButton className="btn btn-danger-ghost btn-sm" disabled={busyId === p._id} onConfirm={() => remove(p)} confirmText="Fshije përgjithmonë?">Fshi</ConfirmButton>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={7} className="muted center">Asnjë produkt këtu.</td></tr>}
          </tbody>
        </table></div>
      )}
    </div>
  );
}
