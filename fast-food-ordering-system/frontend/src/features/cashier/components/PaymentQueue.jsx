import { markOrderPaid } from '../../../api/ordersApi.js';
import ReceiptPreview from './ReceiptPreview.jsx';

export default function PaymentQueue({ orders, token }) {
  if (orders.length === 0) return <p style={{ padding: '1rem' }}>No orders awaiting payment.</p>;

  return (
    <div style={{ padding: '1rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {orders.map((order) => (
        <div key={order._id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '1rem' }}>
          <ReceiptPreview order={order} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={() => markOrderPaid(order._id, 'cash', token)}>Confirm cash</button>
            <button onClick={() => markOrderPaid(order._id, 'terminal', token)}>Confirm terminal</button>
          </div>
        </div>
      ))}
    </div>
  );
}
