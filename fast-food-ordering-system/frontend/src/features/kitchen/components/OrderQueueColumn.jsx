import OrderTicket from './OrderTicket.jsx';

const LABELS = { paid: 'New', preparing: 'Preparing', ready: 'Ready' };

export default function OrderQueueColumn({ status, orders, token }) {
  return (
    <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 8, padding: '0.75rem' }}>
      <h3>{LABELS[status] || status}</h3>
      {orders.map((order) => (
        <OrderTicket key={order._id} order={order} token={token} />
      ))}
    </div>
  );
}
