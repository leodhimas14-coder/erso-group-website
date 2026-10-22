import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import CategoryIcon from './CategoryIcon';
import { useApi } from '../lib/useApi';
import { useConfig } from '../context/ConfigContext';

export default function MenuDrawer({ open, onClose, top = 0 }) {
  const { categories, contact } = useConfig();
  const hot = useApi(open ? '/products?featured=1&limit=4' : null);

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
  const hotProducts = hot.data?.products || [];

  return (
    <div className="menu-drawer" style={{ top }} role="dialog" aria-modal="true" aria-label="Menuja">
      <nav className="menu-list">
        <Link to="/dyqani" onClick={onClose}><span>Të gjitha produktet</span><Icon name="caret" size={16} filled stroke={0} /></Link>
        {(categories || []).map((c) => (
          <Link key={c.key} to={`/dyqani?kategoria=${c.key}`} onClick={onClose} className="menu-cat">
            <CategoryIcon category={c} size={28} />
            <span>{c.label}</span>
            <Icon name="caret" size={16} filled stroke={0} />
          </Link>
        ))}
        <Link to="/dyqani?oferta=1" onClick={onClose} className="menu-sale"><span>Ofertat</span><Icon name="caret" size={16} filled stroke={0} /></Link>
        <Link to="/gjurmo" onClick={onClose}><span>Gjurmo porosinë</span><Icon name="caret" size={16} filled stroke={0} /></Link>
        {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer"><span>Kërko ofertë në WhatsApp</span><Icon name="caret" size={16} filled stroke={0} /></a>}
      </nav>

      {hotProducts.length > 0 && (
        <div className="menu-hot">
          <h3>Më të kërkuarat</h3>
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
