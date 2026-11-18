import { useSearchParams } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import { useApi } from '../../lib/useApi';
import { qs } from '../../lib/api';
import { GENDER_LABEL } from '../../lib/format';
import { useCategoryLabels } from '../../context/ConfigContext';

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const CATEGORY_LABEL = useCategoryLabels();
  const category = params.get('kategoria') || '';
  const gender = params.get('gjinia') || '';
  const sale = params.get('oferta') === '1';
  const q = params.get('q') || '';
  const sort = params.get('rendit') || '';
  const page = Number(params.get('faqja')) || 1;

  const { data, loading, error } = useApi(`/products${qs({ category, gender, sale: sale ? '1' : '', q, sort, page, limit: 24 })}`);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'faqja') next.delete('faqja');
    setParams(next);
  };

  const title = q
    ? `Rezultatet për "${q}"`
    : [sale ? 'Ofertat' : CATEGORY_LABEL[category], GENDER_LABEL[gender]].filter(Boolean).join(' · ') || 'Të gjitha produktet';

  return (
    <div className="container section">
      <h1 className="page-title">{title}</h1>
      {gender && (
        <div className="gender-tabs">
          {['femra', 'meshkuj', 'femije'].map((g) => (
            <button type="button" key={g} className={gender === g ? 'active' : ''} onClick={() => update('gjinia', g)}>{GENDER_LABEL[g]}</button>
          ))}
        </div>
      )}
      <div className="filters">
        <div className="chips">
          <button type="button" className={`chip ${!category && !sale ? 'active' : ''}`} onClick={() => { const n = new URLSearchParams(params); n.delete('kategoria'); n.delete('oferta'); n.delete('faqja'); setParams(n); }}>Të gjitha</button>
          {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
            <button type="button" key={key} className={`chip ${category === key ? 'active' : ''}`} onClick={() => update('kategoria', key)}>{label}</button>
          ))}
          <button type="button" className={`chip chip-sale ${sale ? 'active' : ''}`} onClick={() => update('oferta', sale ? '' : '1')}>Ofertat</button>
        </div>
        <select value={sort} onChange={(e) => update('rendit', e.target.value)} aria-label="Rendit">
          <option value="">Më të rejat</option>
          <option value="cmimi-ulet">Çmimi: nga më i ulëti</option>
          <option value="cmimi-larte">Çmimi: nga më i larti</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error.message}</div>}
      <div className="product-grid">
        {loading
          ? Array.from({ length: 8 }, (_, i) => <div key={i} className="product-card skeleton" />)
          : data?.products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
      {!loading && data?.products.length === 0 && <p className="empty">Nuk u gjet asnjë produkt.</p>}

      {data?.pages > 1 && (
        <div className="pagination">
          <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => update('faqja', String(page - 1))}>← Para</button>
          <span>{page} / {data.pages}</span>
          <button type="button" className="btn btn-ghost" disabled={page >= data.pages} onClick={() => update('faqja', String(page + 1))}>Pas →</button>
        </div>
      )}
    </div>
  );
}
