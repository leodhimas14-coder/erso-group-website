import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi';
import { useCart } from '../../context/CartContext';
import { lek } from '../../lib/format';
import Icon from '../../components/Icon';
import SaveButton from '../../components/SaveButton';
import { useConfig } from '../../context/ConfigContext';

const uniq = (arr) => [...new Set(arr.filter(Boolean))];

export default function ProductPage() {
  const { slug } = useParams();
  const { data, loading, error } = useApi(`/products/${slug}`);
  const product = data?.product;
  const { add } = useCart();
  const { shipping, payments, contact } = useConfig();
  const navigate = useNavigate();

  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [hint, setHint] = useState('');

  const variants = product?.variants || [];
  const sizes = useMemo(() => uniq(variants.map((v) => v.size)), [variants]);
  const colors = useMemo(() => uniq(variants.map((v) => v.color)), [variants]);

  useEffect(() => {
    if (sizes.length === 1) setSize(sizes[0]);
    if (colors.length === 1) setColor(colors[0]);
  }, [sizes, colors]);

  const minQty = product?.minQty || 1;
  useEffect(() => { setQuantity(minQty); }, [minQty]);

  useEffect(() => {
    if (product) document.title = `${product.name} · ERSO Market`;
    return () => { document.title = 'ERSO Market · Direkt nga fabrikat në Kinë'; };
  }, [product]);

  if (loading) return <div className="container section"><div className="product-detail skeleton-block" /></div>;
  if (error || !product) {
    return (
      <div className="container section empty">
        <p>{error?.message || 'Produkti nuk u gjet'}</p>
        <Link to="/dyqani" className="btn btn-primary">Kthehu te dyqani</Link>
      </div>
    );
  }

  const variant = variants.length
    ? variants.find((v) => (sizes.length ? v.size === size : true) && (colors.length ? v.color === color : true))
    : null;
  const needsChoice = variants.length > 0 && !variant;
  const discount = product.compareAtPrice > product.price ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  const colorAvailable = (c) => variants.some((v) => v.color === c && (!size || !sizes.length || v.size === size));
  const sizeAvailable = (s) => variants.some((v) => v.size === s && (!color || !colors.length || v.color === color));

  const onAdd = (goToCart) => {
    if (needsChoice) {
      setHint(sizes.length && !size ? 'Zgjidhni versionin' : 'Zgjidhni ngjyrën');
      return;
    }
    if (quantity < minQty) {
      setHint(`Porosia minimale për këtë produkt është ${minQty} copë`);
      return;
    }
    add(product, variant, quantity);
    setHint('');
    if (goToCart) navigate('/shporta');
    else { setAdded(true); setTimeout(() => setAdded(false), 2000); }
  };

  return (
    <div className="container section">
      <button type="button" className="back-link" onClick={() => navigate(-1)}><Icon name="back" size={18} /> Kthehu</button>
      <div className="product-detail">
        <div className="gallery">
          <div className="gallery-main">
            {product.images[imageIndex] ? <img src={product.images[imageIndex]} alt={product.name} /> : <div className="img-placeholder" />}
          </div>
          {product.images.length > 1 && (
            <div className="gallery-thumbs">
              {product.images.map((src, i) => (
                <button type="button" key={src} className={i === imageIndex ? 'active' : ''} onClick={() => setImageIndex(i)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <div className="product-title-row">
            <h1>{product.name}</h1>
            <SaveButton product={product} className="save-btn-lg" size={24} />
          </div>
          {product.priceOnRequest ? (
            <div className="price-row big"><span className="price price-ask">Çmimi me ofertë</span></div>
          ) : (
            <div className="price-row big">
              <span className="price">{lek(product.price)}</span>
              {discount > 0 && <><span className="price-old">{lek(product.compareAtPrice)}</span><span className="tag tag-sale static">-{discount}%</span></>}
              <span className="price-unit">/ copë</span>
            </div>
          )}
          {minQty > 1 && <p className="moq">Porosia minimale: <b>{minQty} copë</b></p>}

          {sizes.length > 0 && (
            <div className="option-group">
              <div className="option-label">Versioni {size && <b>{size}</b>}</div>
              <div className="options">
                {sizes.map((s) => (
                  <button type="button" key={s} className={`option ${size === s ? 'active' : ''}`} disabled={!sizeAvailable(s)} onClick={() => { setSize(s); setHint(''); }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {colors.length > 0 && (
            <div className="option-group">
              <div className="option-label">Ngjyra {color && <b>{color}</b>}</div>
              <div className="options">
                {colors.map((c) => (
                  <button type="button" key={c} className={`option ${color === c ? 'active' : ''}`} disabled={!colorAvailable(c)} onClick={() => { setColor(c); setHint(''); }}>{c}</button>
                ))}
              </div>
            </div>
          )}

          <div className="delivery-note">
            {variant?.stock > 0 || (!variants.length && product.inStock)
              ? <><b>🚚 Gati në Shqipëri</b> · dorëzim {shipping.localText}</>
              : <><b>🚢 Me porosi nga fabrika</b> · dorëzim {shipping.chinaText}</>}
          </div>

          <div className="buy-row">
            <div className="qty">
              <button type="button" onClick={() => setQuantity((q) => Math.max(minQty, q - 1))} aria-label="Më pak"><Icon name="minus" size={16} /></button>
              <input id="qty" type="number" inputmode="numeric" min={minQty} max={100000} value={quantity} aria-label="Sasia"
                onChange={(e) => setQuantity(Math.min(100000, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                onBlur={() => setQuantity((q) => Math.max(minQty, q))} />
              <button type="button" onClick={() => setQuantity((q) => Math.min(100000, q + 1))} aria-label="Më shumë"><Icon name="plus" size={16} /></button>
            </div>
            {!product.priceOnRequest && (
              <button type="button" className="btn btn-outline btn-lg grow" onClick={() => onAdd(false)}>
                {added ? <><Icon name="check" size={18} /> U shtua</> : 'Shto në shportë'}
              </button>
            )}
          </div>
          {product.priceOnRequest
            ? contact.whatsapp && (
              <a className="btn btn-primary btn-lg btn-block" target="_blank" rel="noreferrer"
                href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Përshëndetje ERSO! Kërkoj ofertë për: ${product.name}${color ? ` (${color})` : ''}. Sasia: ${quantity} copë.`)}`}>
                Kërko ofertë në WhatsApp
              </a>
            )
            : <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => onAdd(true)}>Porosit tani</button>}
          {!product.priceOnRequest && contact.whatsapp && (
            <a className="link-btn ask-link" target="_blank" rel="noreferrer" href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Përshëndetje ERSO! Kam një pyetje për: ${product.name}`)}`}>Keni pyetje? Na shkruani në WhatsApp</a>
          )}
          {hint && <p className="form-error">{hint}</p>}

          {product.description && (
            <div className="description">
              <h3>Përshkrimi</h3>
              <p>{product.description}</p>
            </div>
          )}
          {product.specs?.length > 0 && (
            <div className="description">
              <h3>Specifikimet</h3>
              <table className="specs-table"><tbody>
                {product.specs.map((s) => <tr key={s.label}><th scope="row">{s.label}</th><td>{s.value}</td></tr>)}
              </tbody></table>
            </div>
          )}
          <ul className="perks-list">
            <li>🔍 Inspektim në fabrikë para pagesës, me foto dhe video</li>
            <li>📄 Faturë, packing list dhe dokumente doganore</li>
            <li>{payments.card ? '💳 Pagesë e sigurt me kartë' : payments.bank ? '🏦 Pagesë me transfertë bankare' : '💵 Paguan në dorëzim'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
