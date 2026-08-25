import { useEffect, useState } from 'react';
import { listOrders } from '../../api/ordersApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useOrderSocket } from '../../context/OrderSocketContext.jsx';
import Header from '../../components/common/Header.jsx';
import PaymentQueue from './components/PaymentQueue.jsx';

/** Cashier's view of orders awaiting payment confirmation, receipt printing, and fiscalization. */
export default function CashierDashboardPage() {
  const { token } = useAuth();
  const { socket, join } = useOrderSocket();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    listOrders({ status: 'pending_payment' }, token).then((data) => setOrders(data.orders));
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    join('cashier');

    const upsert = (order) => {
      setOrders((prev) => {
        const withoutOrder = prev.filter((o) => o._id !== order._id);
        return order.status === 'pending_payment' ? [order, ...withoutOrder] : withoutOrder;
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
      <Header title="Cashier Dashboard" />
      <PaymentQueue orders={orders} token={token} />
    </div>
  );
}
