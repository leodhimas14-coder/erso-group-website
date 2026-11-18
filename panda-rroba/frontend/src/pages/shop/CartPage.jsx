import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useConfig, shippingFor } from '../../context/ConfigContext';
import { lek } from '../../lib/format';
import Icon from '../../components/Icon';

export default function CartPage() {
  const { lines, setQuantity, subtotal } = useCart();
  const { shipping } = useConfig();

  if (lines.length === 0) {
    return (
      <div className="container section empty">
        <div className="empty-icon"><Icon name="bag" size={40} /></div>
        <h1>Shporta është bosh</h1>
        <p className="muted">Shiko produktet tona dhe shto diçka që të pëlqen.</p>
        <Link to="/dyqani" className="btn btn-primary btn-lg">Shko te dyqani</Link>
      </div>
    );
  }

  const fee = shippingFor(subtotal, shipping);
  const missing = shipping.freeFrom > 0 ? shipping.freeFrom - subtotal : 0;

  return (
    <div className="container section narrow">
      <h1 className="page-title">Shporta</h1>
      {missing > 0 && (
        <div className="free-ship">
          Edhe <b>{lek(missing)}</b> për transport falas
          <div className="progress"><span style={{ width: `${Math.min(100, (subtotal / shipping.freeFrom) * 100)}%` }} /></div>
        </div>
      )}
      <ul className="cart-lines">
        {lines.map((l) => (
          <li key={l.key} className="cart-line">
            <Link to={`/produkt/${l.slug}`} className="cart-thumb">{l.image ? <img src={l.image} alt="" /> : <div className="img-placeholder" />}</Link>
            <div className="cart-line-info">
              <Link to={`/produkt/${l.slug}`} className="cart-line-name">{l.name}</Link>
              <div className="muted small">{[l.size, l.color].filter(Boolean).join(' · ')}</div>
              <div className="cart-line-bottom">
                <div className="qty small">
                  <button type="button" onClick={() => setQuantity(l.key, l.quantity - 1)} aria-label="Më pak"><Icon name="minus" size={14} /></button>
                  <span>{l.quantity}</span>
                  <button type="button" onClick={() => setQuantity(l.key, l.quantity + 1)} aria-label="Më shumë"><Icon name="plus" size={14} /></button>
                </div>
                <b>{lek(l.price * l.quantity)}</b>
              </div>
            </div>
            <button type="button" className="icon-btn" onClick={() => setQuantity(l.key, 0)} aria-label="Hiq"><Icon name="x" size={18} /></button>
          </li>
        ))}
      </ul>
      <div className="summary">
        <div><span>Nëntotali</span><span>{lek(subtotal)}</span></div>
        <div><span>Transporti</span><span>{fee === 0 ? 'Falas' : lek(fee)}</span></div>
        <div className="summary-total"><span>Totali</span><span>{lek(subtotal + fee)}</span></div>
      </div>
      <Link to="/porosit" className="btn btn-primary btn-lg btn-block">Vazhdo me porosinë</Link>
    </div>
  );
}
