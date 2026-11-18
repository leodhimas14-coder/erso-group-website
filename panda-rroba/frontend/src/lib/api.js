const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'panda_admin_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

const CUSTOMER_KEY = 'panda_customer_token';
export const customerTokenStore = {
  get: () => { try { return localStorage.getItem(CUSTOMER_KEY); } catch { return null; } },
  set: (t) => { try { t ? localStorage.setItem(CUSTOMER_KEY, t) : localStorage.removeItem(CUSTOMER_KEY); } catch { /* ignore */ } },
};

export const IS_DEMO = import.meta.env.VITE_DEMO === '1';

/** auth: true = admin/staff login, 'customer' = shopper login. */
export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const token = auth === 'customer' ? customerTokenStore.get() : auth ? tokenStore.get() : null;
  if (IS_DEMO) {
    const { demoApi } = await import('./demoApi');
    return demoApi(path, { method, body, auth, token });
  }
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Nuk ka lidhje me internetin. Provoni përsëri.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Diçka shkoi keq');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)).toString();
  return s ? `?${s}` : '';
};
