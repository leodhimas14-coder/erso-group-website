import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'panda_saved_v1';
const WishlistContext = createContext(null);

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};

// Saved products live on this device. We keep a small snapshot so the saved
// page can render instantly, and refresh prices when the product is opened.
export function WishlistProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const value = useMemo(() => {
    const has = (productId) => items.some((i) => i._id === productId);
    const toggle = (product) =>
      setItems((prev) => (prev.some((i) => i._id === product._id)
        ? prev.filter((i) => i._id !== product._id)
        : [{
          _id: product._id, slug: product.slug, name: product.name, images: product.images?.slice(0, 1) || [],
          price: product.price, compareAtPrice: product.compareAtPrice, inStock: product.inStock,
        }, ...prev]));
    return { items, has, toggle, count: items.length };
  }, [items]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
