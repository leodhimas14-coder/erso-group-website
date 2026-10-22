import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'erso_cart_v1';
const CartContext = createContext(null);

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};

// A cart line is one product + one variant. Prices here are for display only;
// the server recalculates everything at checkout.
const lineKey = (productId, variantId) => `${productId}:${variantId || ''}`;
const MAX_QTY = 100000;

export function CartProvider({ children }) {
  const [lines, setLines] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* ignore */ }
  }, [lines]);

  const value = useMemo(() => {
    const add = (product, variant, quantity = 1) => {
      const key = lineKey(product._id, variant?._id);
      setLines((prev) => {
        const existing = prev.find((l) => l.key === key);
        if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_QTY) } : l));
        return [...prev, {
          key,
          productId: product._id,
          variantId: variant?._id,
          slug: product.slug,
          name: product.name,
          image: product.images?.[0] || '',
          size: variant?.size || '',
          color: variant?.color || '',
          price: product.price,
          minQty: product.minQty || 1,
          quantity: Math.max(quantity, product.minQty || 1),
        }];
      });
    };
    // 0 removes the line; otherwise the quantity stays between the product's minimum and MAX_QTY.
    const setQuantity = (key, quantity) =>
      setLines((prev) => (quantity <= 0
        ? prev.filter((l) => l.key !== key)
        : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(Math.max(quantity, l.minQty || 1), MAX_QTY) } : l))));
    const clear = () => setLines([]);
    const count = lines.reduce((s, l) => s + l.quantity, 0);
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
    return { lines, add, setQuantity, clear, count, subtotal };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
