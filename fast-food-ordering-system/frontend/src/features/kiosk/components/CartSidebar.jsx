import { useCart } from '../../../context/CartContext.jsx';

export default function CartSidebar({ onCheckout }) {
  const { lines, removeItem, updateQuantity, subtotal } = useCart();

  return (
    <aside style={{ width: 320, borderLeft: '1px solid #ddd', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
      <h2>Your Order</h2>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {lines.length === 0 && <p>Cart is empty</p>}
        {lines.map((line) => (
          <div key={line.cartLineId} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            <strong>{line.name}</strong>
            <div>
              {(line.selectedOptions || []).map((o) => (
                <div key={o.choiceName} style={{ fontSize: '0.85rem', color: '#666' }}>
                  {o.groupName}: {o.choiceName}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => updateQuantity(line.cartLineId, Number(e.target.value))}
                style={{ width: 50 }}
              />
              <button onClick={() => removeItem(line.cartLineId)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
        <p>
          Subtotal: <strong>{subtotal.toFixed(2)} L</strong>
        </p>
        <button onClick={onCheckout} disabled={lines.length === 0} style={{ width: '100%', padding: '0.75rem' }}>
          Checkout
        </button>
      </div>
    </aside>
  );
}
