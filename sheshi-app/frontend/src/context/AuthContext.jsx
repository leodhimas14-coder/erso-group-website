import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import request from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sheshi_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    request('/auth/me', { token })
      .then((data) => setUser(data.user))
      .catch(() => {
        setToken(null);
        localStorage.removeItem('sheshi_token');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const register = async (payload) => {
    const data = await request('/auth/register', { method: 'POST', body: payload });
    localStorage.setItem('sheshi_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const data = await request('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('sheshi_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('sheshi_token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, role: user?.role, loading, register, login, logout }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
