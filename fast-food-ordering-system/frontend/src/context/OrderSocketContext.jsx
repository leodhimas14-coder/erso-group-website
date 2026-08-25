import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const OrderSocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

/**
 * Wraps a single socket.io connection shared by kitchen/cashier/admin screens
 * so every screen sees order and inventory events the moment they happen,
 * instead of polling the REST API.
 */
export function OrderSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io(SOCKET_URL, { autoConnect: true });
    setSocket(s);
    return () => s.disconnect();
  }, []);

  /** Call once the screen's role is known, e.g. join('kitchen') on the KDS page. */
  const join = (room) => socket?.emit('join', room);

  const value = useMemo(() => ({ socket, join }), [socket]);

  return <OrderSocketContext.Provider value={value}>{children}</OrderSocketContext.Provider>;
}

export function useOrderSocket() {
  const ctx = useContext(OrderSocketContext);
  if (!ctx) throw new Error('useOrderSocket must be used within OrderSocketProvider');
  return ctx;
}
