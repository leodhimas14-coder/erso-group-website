import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { OrderSocketProvider } from './context/OrderSocketContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OrderSocketProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </OrderSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
