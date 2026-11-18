import { Link } from 'react-router-dom';
import { lek } from '../lib/format';
import SaveButton from './SaveButton';

export default function ProductCard({ product }) {
  const discount = product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  return (
    <Link to={`/produkt/${product.slug}`} className="product-card">
      <div className="product-card-img">
        {product.images?.[0] ? <img src={product.images[0]} alt={product.name} loading="lazy" /> : <div className="img-placeholder" />}
        {discount > 0 && <span className="tag tag-sale">-{discount}%</span>}
        {product.inStock && <span className="tag tag-fast">Gati në Shqipëri</span>}
        <SaveButton product={product} />
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <div className="price-row">
          <span className="price">{lek(product.price)}</span>
          {discount > 0 && <span className="price-old">{lek(product.compareAtPrice)}</span>}
        </div>
      </div>
    </Link>
  );
}
