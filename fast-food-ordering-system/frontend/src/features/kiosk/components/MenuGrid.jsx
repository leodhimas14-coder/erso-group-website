import MenuItemCard from './MenuItemCard.jsx';

export default function MenuGrid({ products, onSelect }) {
  const byCategory = products.reduce((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category} style={{ marginBottom: '2rem' }}>
          <h2>{category}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {items.map((product) => (
              <MenuItemCard key={product._id} product={product} onClick={() => onSelect(product)} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
