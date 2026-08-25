import { useEffect, useState } from 'react';
import { listOrders } from '../../api/ordersApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useOrderSocket } from '../../context/OrderSocketContext.jsx';
import Header from '../../components/common/Header.jsx';
import OrderQueueColumn from './components/OrderQueueColumn.jsx';

const COLUMNS = ['paid', 'preparing', 'ready'];

/** Live queue of paid orders for kitchen staff to prep and tick off. */
export default function KitchenDisplayPage() {
  const { token } = useAuth();
  const { socket, join } = useOrderSocket();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    listOrders({}, token).then((data) => setOrders(data.orders.filter((o) => COLUMNS.includes(o.status))));
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    join('kitchen');

    const upsert = (order) => {
      setOrders((prev) => {
        const withoutOrder = prev.filter((o) => o._id !== order._id);
        return COLUMNS.includes(order.status) ? [...withoutOrder, order] : withoutOrder;
      });
    };

    socket.on('order:created', upsert);
    socket.on('order:updated', upsert);
    return () => {
      socket.off('order:created', upsert);
      socket.off('order:updated', upsert);
    };
  }, [socket, join]);

  return (
    <div>
      <Header title="Kitchen Display" />
      <div style={{ display: 'flex', gap: '1rem', padding: '1rem' }}>
        {COLUMNS.map((status) => (
          <OrderQueueColumn
            key={status}
            status={status}
            orders={orders.filter((o) => o.status === status)}
            token={token}
          />
        ))}
      </div>
    </div>
  );
}
