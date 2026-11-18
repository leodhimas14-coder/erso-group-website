import { useState } from 'react';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfig } from '../../context/ConfigContext';
import ConfirmButton from '../../components/ConfirmButton';
import UploadButton from '../../components/UploadButton';

function CategoryRow({ category, first, last, onChanged }) {
  const [label, setLabel] = useState(category.label);
  const [emoji, setEmoji] = useState(category.emoji);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const call = async (request) => {
    setBusy(true);
    setError('');
    try { await request(); onChanged(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const patch = (body) => call(() => api(`/admin/categories/${category._id}`, { method: 'PATCH', auth: true, body }));
  const changed = label !== category.label || emoji !== category.emoji;

  return (
    <li className={`category-row-admin ${category.active ? '' : 'inactive'}`}>
      <div className="cat-order">
        <button type="button" className="icon-btn" aria-label="Lart" disabled={first || busy} onClick={() => call(() => api(`/admin/categories/${category._id}/move`, { method: 'POST', auth: true, body: { direction: 'up' } }))}>▲</button>
        <button type="button" className="icon-btn" aria-label="Poshtë" disabled={last || busy} onClick={() => call(() => api(`/admin/categories/${category._id}/move`, { method: 'POST', auth: true, body: { direction: 'down' } }))}>▼</button>
      </div>
      <div className="cat-icon">
        {category.image ? <img src={category.image} alt="" /> : <input aria-label="Emoji" value={emoji} maxLength={8} onChange={(e) => setEmoji(e.target.value)} />}
      </div>
      <div className="cat-main">
        <input aria-label="Emri i kategorisë" value={label} onChange={(e) => setLabel(e.target.value)} />
        <span className="muted small">{category.products} produkte · lidhja: /dyqani?kategoria={category.key}</span>
        {error && <span className="form-error">{error}</span>}
      </div>
      <div className="cat-actions">
        {changed && <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => patch({ label, emoji })}>Ruaj</button>}
        <UploadButton className="btn btn-ghost btn-sm" label={category.image ? 'Ndrysho foton' : 'Foto'} onUploaded={([f]) => f && patch({ image: f.url })} />
        {category.image && <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => patch({ image: '' })}>Hiq foton</button>}
        <button type="button" role="switch" aria-checked={category.active} aria-label={category.active ? 'Fshihe nga dyqani' : 'Shfaqe në dyqan'} className={`switch ${category.active ? 'on' : ''}`} disabled={busy} onClick={() => patch({ active: !category.active })}><span /></button>
        <ConfirmButton className="btn btn-danger-ghost btn-sm" disabled={busy} confirmText="Fshije?" onConfirm={() => call(() => api(`/admin/categories/${category._id}`, { method: 'DELETE', auth: true }))}>Fshi</ConfirmButton>
      </div>
    </li>
  );
}

export default function CategoriesPage() {
  const { data, error, reload } = useApi('/admin/categories', { auth: true });
  const { reload: reloadShop } = useConfig();
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('');
  const [addError, setAddError] = useState('');

  const refresh = () => { reload(); reloadShop(); };

  const add = async (e) => {
    e.preventDefault();
    setAddError('');
    try {
      await api('/admin/categories', { method: 'POST', auth: true, body: { label, emoji } });
      setLabel('');
      setEmoji('');
      refresh();
    } catch (err) {
      setAddError(err.message);
    }
  };

  const categories = data?.categories || [];
  return (
    <div>
      <h1 className="admin-title">Kategoritë</h1>
      <p className="muted small">Renditja këtu është renditja në menu dhe në kryefaqe. Me çelësin e fsheh një kategori pa e fshirë. Një kategori fshihet vetëm kur nuk ka produkte.</p>
      {error && <div className="alert alert-error">{error.message}</div>}

      <form className="card form add-category" onSubmit={add}>
        <h3>Shto kategori</h3>
        <div className="form-row">
          <label>Emri<input id="new-cat-label" required maxLength={40} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="p.sh. Syze dielli" /></label>
          <label>Emoji (opsionale)<input id="new-cat-emoji" maxLength={8} value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🕶️" /></label>
          <button type="submit" className="btn btn-primary align-end">Shto</button>
        </div>
        {addError && <p className="form-error">{addError}</p>}
      </form>

      <ul className="category-list-admin card">
        {categories.map((c, i) => (
          <CategoryRow key={`${c._id}-${c.label}-${c.emoji}-${c.image}-${c.active}`} category={c} first={i === 0} last={i === categories.length - 1} onChanged={refresh} />
        ))}
      </ul>
    </div>
  );
}
