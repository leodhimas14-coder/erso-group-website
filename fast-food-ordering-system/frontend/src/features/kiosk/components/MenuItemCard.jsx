export default function MenuItemCard({ product, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '1rem',
        border: '1px solid #ddd',
        borderRadius: 8,
        background: '#fff',
        textAlign: 'left',
      }}
    >
      {product.imageUrl && (
        <img src={product.imageUrl} alt={product.name} style={{ width: '100%', borderRadius: 6, marginBottom: '0.5rem' }} />
      )}
      <strong>{product.name}</strong>
      <span style={{ color: '#666', fontSize: '0.9rem' }}>{product.description}</span>
      <span style={{ marginTop: 'auto', fontWeight: 700 }}>{product.basePrice.toFixed(2)} L</span>
    </button>
  );
}
