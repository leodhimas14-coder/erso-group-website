import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import { useApi } from '../lib/useApi';
import { useConfig } from '../context/ConfigContext';

const TABS = [
  { key: 'femra', label: 'Femra' },
  { key: 'meshkuj', label: 'Meshkuj' },
  { key: 'femije', label: 'Fëmijë' },
];


const TAB_KEY = 'panda_menu_tab';

export default function MenuDrawer({ open, onClose, top = 0 }) {
  const [tab, setTab] = useState(() => { try { return localStorage.getItem(TAB_KEY) || 'femra'; } catch { return 'femra'; } });
  const { categories } = useConfig();
  // Menu rows per tab: newest, every category, offers. Each opens the shop filtered by the tab's gender.
  const ROWS = [
    { label: 'Të rejat', params: {} },
    ...(categories || []).map((c) => ({ label: c.label, params: { kategoria: c.key } })),
    { label: 'Ofertat', params: { oferta: '1' } },
  ];
  const hot = useApi(open ? '/products?featured=1&limit=4' : null);

  useEffect(() => {
    try { localStorage.setItem(TAB_KEY, tab); } catch { /* ignore */ }
  }, [tab]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const href = (params) => `/dyqani?${new URLSearchParams({ gjinia: tab, ...params })}`;
  const hotProducts = hot.data?.products || [];

  return (
    <div className="menu-drawer" style={{ top }} role="dialog" aria-modal="true" aria-label="Menuja">
      <div className="menu-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <nav className="menu-list">
        {ROWS.map((row) => (
          <Link key={row.label} to={href(row.params)} onClick={onClose} className={row.params.oferta ? 'menu-sale' : ''}>
            <span>{row.label}</span>
            <Icon name="caret" size={16} filled stroke={0} />
          </Link>
        ))}
      </nav>


      {hotProducts.length > 0 && (
        <div className="menu-hot">
          <h3>Më të kërkuarat!</h3>
          <div className="menu-hot-row">
            {hotProducts.map((p) => (
              <Link key={p._id} to={`/produkt/${p.slug}`} onClick={onClose} className="menu-hot-card">
                {p.images[0] ? <img src={p.images[0]} alt="" /> : <div className="img-placeholder" />}
                <span>{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
