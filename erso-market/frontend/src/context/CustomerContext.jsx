import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, customerTokenStore } from '../lib/api';

const CustomerContext = createContext(null);

/** The shopper's own account (separate from the admin login). */
export function CustomerProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(Boolean(customerTokenStore.get()));

  useEffect(() => {
    if (!customerTokenStore.get()) return;
    api('/customers/me', { auth: 'customer' })
      .then((d) => setCustomer(d.customer))
      .catch(() => customerTokenStore.set(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (mode, payload) => {
    const d = await api(`/customers/${mode === 'register' ? 'register' : 'login'}`, { method: 'POST', body: payload });
    customerTokenStore.set(d.token);
    setCustomer(d.customer);
    return d.customer;
  }, []);

  const update = useCallback(async (payload) => {
    const d = await api('/customers/me', { method: 'PUT', body: payload, auth: 'customer' });
    setCustomer(d.customer);
    return d.customer;
  }, []);

  const signOut = useCallback(() => {
    customerTokenStore.set(null);
    setCustomer(null);
  }, []);

  return (
    <CustomerContext.Provider value={{ customer, loading, signIn, update, signOut }}>
      {children}
    </CustomerContext.Provider>
  );
}

export const useCustomer = () => useContext(CustomerContext);
