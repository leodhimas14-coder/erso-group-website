import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard';
import HomeBanner from '../../components/HomeBanner';
import HomeHero, { HowWeWork, FromTheField } from '../../components/HomeHero';
import CategoryIcon from '../../components/CategoryIcon';
import { useConfig } from '../../context/ConfigContext';
import { useApi } from '../../lib/useApi';

export default function HomePage() {
  const { categories, home, homeBanner } = useConfig();
  const featured = useApi('/products?featured=1&limit=8');
  const latest = useApi('/products?limit=8');

  return (
    <>
      {homeBanner?.url ? <HomeBanner /> : <HomeHero />}

      <section className="container section">
        <div className="section-head"><h2>Kategoritë</h2><Link to="/dyqani">Të gjitha →</Link></div>
        <div className="category-grid">
          {(categories || []).map((c) => (
            <Link key={c.key} to={`/dyqani?kategoria=${c.key}`} className="category-tile">
              <CategoryIcon category={c} />
              <span>{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <ProductSection title={home.featuredTitle} state={featured} />
      <HowWeWork />
      <ProductSection title={home.latestTitle} state={latest} link="/dyqani" />
      <FromTheField />
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
