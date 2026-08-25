export default function OrderConfirmation({ order, onNewOrder }) {
  if (!order) return null;

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto', textAlign: 'center' }}>
      <h2>Order #{order.orderNumber} confirmed!</h2>
      <p>Total: {order.total.toFixed(2)} L</p>
      <p>Please listen for your order number to be called.</p>
      <button onClick={onNewOrder} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem' }}>
        Start new order
      </button>
    </div>
  );
}
