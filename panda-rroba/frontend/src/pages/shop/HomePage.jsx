import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import HomeBanner from '../../components/HomeBanner';
import GenderTiles from '../../components/GenderTiles';
import { useConfig } from '../../context/ConfigContext';
import { useApi } from '../../lib/useApi';


export default function HomePage() {
  const { categories, home } = useConfig();
  const featured = useApi('/products?featured=1&limit=8');
  const latest = useApi('/products?limit=8');

  return (
    <>
      <HomeBanner />

      <section className="container section">
        <div className="category-row">
          {(categories || []).map((c) => (
            <Link key={c.key} to={`/dyqani?kategoria=${c.key}`} className="category-chip">
              {c.image
                ? <img className="category-img" src={c.image} alt="" />
                : <span className="category-emoji" aria-hidden="true">{c.emoji || '🛍️'}</span>}
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      <ProductSection title={home.featuredTitle} state={featured} />

      <ProductSection title={home.latestTitle} state={latest} link="/dyqani" />

      <GenderTiles />
    </>
  );
}

function ProductSection({ title, state, link }) {
  const products = state.data?.products || [];
  if (!state.loading && products.length === 0) return null;
  return (
    <section className="container section">
      <div className="section-head">
        <h2>{title}</h2>
        {link && <Link to={link}>Shiko të gjitha →</Link>}
      </div>
      <div className="product-grid">
        {state.loading
          ? Array.from({ length: 4 }, (_, i) => <div key={i} className="product-card skeleton" />)
          : products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}
