import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

function lineTotal(line) {
  const optionsTotal = (line.selectedOptions || []).reduce((sum, o) => sum + (o.priceDelta || 0), 0);
  return (line.basePrice + optionsTotal) * line.quantity;
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState([]); // { productId, name, basePrice, quantity, selectedOptions, notes }

  const addItem = (line) => {
    setLines((prev) => [...prev, { ...line, cartLineId: crypto.randomUUID() }]);
  };

  const removeItem = (cartLineId) => {
    setLines((prev) => prev.filter((l) => l.cartLineId !== cartLineId));
  };

  const updateQuantity = (cartLineId, quantity) => {
    setLines((prev) => prev.map((l) => (l.cartLineId === cartLineId ? { ...l, quantity } : l)));
  };

  const clearCart = () => setLines([]);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + lineTotal(l), 0), [lines]);

  const toOrderPayload = (channel, customerName = '') => ({
    channel,
    customerName,
    items: lines.map((l) => ({
      productId: l.productId,
      quantity: l.quantity,
      selectedOptions: l.selectedOptions,
      notes: l.notes,
    })),
  });

  const value = { lines, addItem, removeItem, updateQuantity, clearCart, subtotal, toOrderPayload };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
