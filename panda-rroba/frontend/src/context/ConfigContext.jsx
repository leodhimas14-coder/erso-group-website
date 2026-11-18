import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

// Shown until /api/config answers; mirrors the server defaults.
const DEFAULTS = {
  categories: [],
  homeBanner: { url: '', posterUrl: '', link: '' },
  promoBar: { enabled: true, text: '' },
  shipping: { fee: 300, freeFrom: 6000, localText: '1–3 ditë pune', chinaText: '10–18 ditë' },
  payments: { card: true, cod: false },
  contact: { whatsapp: '', phone: '', email: '' },
  home: { featuredTitle: 'Më të pëlqyerat', latestTitle: 'Të rejat', newsletterTitle: 'Regjistrohu dhe mëso të parën për ofertat dhe koleksionet e reja.' },
  pages: { about: '', info: '', terms: '' },
};
const ConfigContext = createContext({ ...DEFAULTS, reload: () => {} });

// The last settings seen are kept so the next visit shows the right texts
// and categories straight away, then refreshed from the server.
const CACHE_KEY = 'panda_config_v1';
const cached = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch { return {}; } };

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(() => ({ ...DEFAULTS, ...cached() }));
  const reload = useCallback(() => api('/config').then((c) => {
    setConfig({ ...DEFAULTS, ...c });
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* ignore */ }
  }).catch(() => {}), []);
  useEffect(() => { reload(); }, [reload]);
  return <ConfigContext.Provider value={{ ...config, reload }}>{children}</ConfigContext.Provider>;
}

export const useConfig = () => useContext(ConfigContext);

/** { key: label } for the shop's current categories. */
export const useCategoryLabels = () => {
  const { categories } = useContext(ConfigContext);
  return Object.fromEntries((categories || []).map((c) => [c.key, c.label]));
};

/** Shipping for a cart subtotal. freeFrom 0 means shipping is never free. */
export const shippingFor = (subtotal, shipping) =>
  (shipping.freeFrom > 0 && subtotal >= shipping.freeFrom ? 0 : shipping.fee);
