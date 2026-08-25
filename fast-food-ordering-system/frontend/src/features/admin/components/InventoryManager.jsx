import { useEffect, useState } from 'react';
import request from '../../../api/client.js';
import { useAuth } from '../../../context/AuthContext.jsx';

/** Recipe-based ingredient stock levels, with quick manual adjustment for restocks/waste. */
export default function InventoryManager() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);

  const refresh = () => request('/inventory', { token }).then((data) => setItems(data.items));

  useEffect(() => {
    refresh();
  }, [token]);

  const adjust = async (id, change) => {
    await request(`/inventory/${id}/adjust`, { method: 'POST', body: { change, reason: 'manual_adjustment' }, token });
    refresh();
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Inventory</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Item</th>
            <th align="left">On hand</th>
            <th align="left">Reorder at</th>
            <th align="left">Adjust</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item._id} style={{ background: item.quantityOnHand <= item.reorderThreshold ? '#ffe8e8' : 'transparent' }}>
              <td>{item.name}</td>
              <td>
                {item.quantityOnHand} {item.unit}
              </td>
              <td>{item.reorderThreshold}</td>
              <td>
                <button onClick={() => adjust(item._id, 10)}>+10</button>
                <button onClick={() => adjust(item._id, -10)}>-10</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
