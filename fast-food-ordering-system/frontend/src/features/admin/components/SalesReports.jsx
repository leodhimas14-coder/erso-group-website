import { useEffect, useState } from 'react';
import { listOrders } from '../../../api/ordersApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function SalesReports() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    listOrders({ status: 'completed', limit: 200 }, token).then((data) => setOrders(data.orders));
  }, [token]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Sales</h2>
      <p>
        Completed orders: <strong>{orders.length}</strong>
      </p>
      <p>
        Total revenue: <strong>{totalRevenue.toFixed(2)} L</strong>
      </p>
      {/* TODO: date-range filters, per-category breakdown, CSV export */}
    </div>
  );
}
