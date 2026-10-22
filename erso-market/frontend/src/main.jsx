import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { ConfigProvider } from './context/ConfigContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CustomerProvider } from './context/CustomerContext';
import './styles.css';

// The demo runs inside a sandboxed frame without real URLs, so it keeps routes in memory.
const Router = import.meta.env.VITE_DEMO === '1' ? MemoryRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <ConfigProvider>
        <CartProvider>
          <WishlistProvider>
            <CustomerProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </CustomerProvider>
          </WishlistProvider>
        </CartProvider>
      </ConfigProvider>
    </Router>
  </React.StrictMode>
);
