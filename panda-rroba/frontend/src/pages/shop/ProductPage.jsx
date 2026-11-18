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
  const { shipping, payments } = useConfig();
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

  useEffect(() => {
    if (product) document.title = `${product.name} · Panda.al`;
    return () => { document.title = 'Panda.al · Rroba, këpucë, çanta dhe portofola'; };
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
      setHint(sizes.length && !size ? 'Zgjidhni masën' : 'Zgjidhni ngjyrën');
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
          <div className="price-row big">
            <span className="price">{lek(product.price)}</span>
            {discount > 0 && <><span className="price-old">{lek(product.compareAtPrice)}</span><span className="tag tag-sale static">-{discount}%</span></>}
          </div>

          {sizes.length > 0 && (
            <div className="option-group">
              <div className="option-label">Masa {size && <b>{size}</b>}</div>
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
              : <><b>✈️ Porosi nga magazina jonë</b> · dorëzim {shipping.chinaText}</>}
          </div>

          <div className="buy-row">
            <div className="qty">
              <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Më pak"><Icon name="minus" size={16} /></button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity((q) => Math.min(20, q + 1))} aria-label="Më shumë"><Icon name="plus" size={16} /></button>
            </div>
            <button type="button" className="btn btn-outline btn-lg grow" onClick={() => onAdd(false)}>
              {added ? <><Icon name="check" size={18} /> U shtua</> : 'Shto në shportë'}
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => onAdd(true)}>Bli tani</button>
          {hint && <p className="form-error">{hint}</p>}

          {product.description && (
            <div className="description">
              <h3>Përshkrimi</h3>
              <p>{product.description}</p>
            </div>
          )}
          <ul className="perks-list">
            <li>{payments.card ? '💳 Pagesë e sigurt me kartë' : '💵 Paguan në dorëzim'}</li>
            <li>🔍 Kontrollohet para nisjes</li>
            <li>↩️ Ndërrim mase brenda 7 ditëve</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
