import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import request from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('erso_token'));
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
        localStorage.removeItem('erso_token');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const data = await request('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('erso_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginWithPin = async (userId, pin) => {
    const data = await request('/auth/login-pin', { method: 'POST', body: { userId, pin } });
    localStorage.setItem('erso_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('erso_token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, role: user?.role, loading, login, loginWithPin, logout }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
