import { useEffect, useState } from 'react';
import { getMenu, updateProduct } from '../../../api/menuApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function MenuEditor() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getMenu({ includeUnavailable: true }).then((data) => setProducts(data.products));
  }, []);

  const toggleAvailable = async (product) => {
    const { product: updated } = await updateProduct(product._id, { available: !product.available }, token);
    setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Menu Editor</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th align="left">Name</th>
            <th align="left">Category</th>
            <th align="left">Price</th>
            <th align="left">Available</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.basePrice.toFixed(2)} L</td>
              <td>
                <input type="checkbox" checked={product.available} onChange={() => toggleAvailable(product)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
