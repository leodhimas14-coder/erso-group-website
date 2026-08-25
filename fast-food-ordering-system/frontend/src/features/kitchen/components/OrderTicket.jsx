import { updateOrderItemStatus, updateOrderStatus } from '../../../api/ordersApi.js';

export default function OrderTicket({ order, token }) {
  const toggleItem = (item) => {
    const next = item.status === 'ready' ? 'queued' : 'ready';
    updateOrderItemStatus(order._id, item._id, next, token);
  };

  return (
    <div style={{ background: '#fff', borderRadius: 6, padding: '0.75rem', marginBottom: '0.75rem' }}>
      <strong>#{order.orderNumber}</strong>
      <ul style={{ paddingLeft: '1.2rem' }}>
        {order.items.map((item) => (
          <li key={item._id} style={{ textDecoration: item.status === 'ready' ? 'line-through' : 'none' }}>
            <label>
              <input type="checkbox" checked={item.status === 'ready'} onChange={() => toggleItem(item)} />
              {item.quantity}x {item.nameSnapshot}
              {item.options?.map((o) => ` (${o.choiceName})`).join('')}
            </label>
          </li>
        ))}
      </ul>
      {order.status !== 'ready' && (
        <button onClick={() => updateOrderStatus(order._id, 'preparing', token)}>Start preparing</button>
      )}
    </div>
  );
}
