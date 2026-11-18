import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import Icon from '../../components/Icon';
import { useWishlist } from '../../context/WishlistContext';

export default function SavedPage() {
  const { items } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="container section empty">
        <div className="empty-icon"><Icon name="heart" size={36} /></div>
        <h1>S'ke produkte të ruajtura</h1>
        <p className="muted">Shtyp zemrën te një produkt që ta gjesh më vonë këtu.</p>
        <Link to="/dyqani" className="btn btn-primary btn-lg">Shko te dyqani</Link>
      </div>
    );
  }

  return (
    <div className="container section">
      <h1 className="page-title">Produktet e ruajtura <span className="muted">({items.length})</span></h1>
      <div className="product-grid">
        {items.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </div>
  );
}
