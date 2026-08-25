import { useState } from 'react';
import { useCart } from '../../../context/CartContext.jsx';
import { createOrder, createPaymentIntent } from '../../../api/ordersApi.js';

/**
 * Phase 1 stub: submits the cart as a pending order and shows where Stripe
 * Elements would be mounted. Wire up @stripe/react-stripe-js's
 * <Elements>/<PaymentElement> around the clientSecret once Stripe keys are
 * configured (see frontend/.env.example).
 */
export default function PaymentStep({ onBack, onPaid }) {
  const { toOrderPayload, subtotal, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | error
  const [error, setError] = useState('');

  const handlePay = async () => {
    setStatus('submitting');
    setError('');
    try {
      const { order } = await createOrder(toOrderPayload('kiosk', customerName));
      await createPaymentIntent(order._id); // clientSecret goes to <PaymentElement> once wired up
      clearCart();
      onPaid(order);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '4rem auto' }}>
      <h2>Payment</h2>
      <p>Total due: {subtotal.toFixed(2)} L</p>

      <label style={{ display: 'block', marginBottom: '1rem' }}>
        Name for order (optional)
        <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: '100%' }} />
      </label>

      {/* TODO: mount <Elements stripe={stripePromise} options={{ clientSecret }}><PaymentElement /></Elements> here */}
      <div style={{ border: '1px dashed #999', padding: '1rem', marginBottom: '1rem', color: '#666' }}>
        Stripe payment form placeholder
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack}>Back to menu</button>
        <button onClick={handlePay} disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Processing...' : 'Pay now'}
        </button>
      </div>
    </div>
  );
}
