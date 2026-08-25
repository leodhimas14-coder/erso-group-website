import { useEffect, useState } from 'react';
import { getMenu } from '../../api/menuApi.js';
import { useCart } from '../../context/CartContext.jsx';
import Loading from '../../components/common/Loading.jsx';
import MenuGrid from './components/MenuGrid.jsx';
import CustomizationModal from './components/CustomizationModal.jsx';
import CartSidebar from './components/CartSidebar.jsx';
import PaymentStep from './components/PaymentStep.jsx';
import OrderConfirmation from './components/OrderConfirmation.jsx';

// Screen the kiosk walks the customer through, top to bottom.
const STEPS = { MENU: 'menu', PAYMENT: 'payment', CONFIRMATION: 'confirmation' };

export default function KioskPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [step, setStep] = useState(STEPS.MENU);
  const [completedOrder, setCompletedOrder] = useState(null);

  const { lines } = useCart();

  useEffect(() => {
    getMenu()
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading menu..." />;
  if (error) return <p style={{ color: 'red', padding: '2rem' }}>{error}</p>;

  if (step === STEPS.CONFIRMATION) {
    return (
      <OrderConfirmation
        order={completedOrder}
        onNewOrder={() => {
          setCompletedOrder(null);
          setStep(STEPS.MENU);
        }}
      />
    );
  }

  if (step === STEPS.PAYMENT) {
    return (
      <PaymentStep
        onBack={() => setStep(STEPS.MENU)}
        onPaid={(order) => {
          setCompletedOrder(order);
          setStep(STEPS.CONFIRMATION);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <h1>Erso Fast Food</h1>
        <MenuGrid products={products} onSelect={setCustomizingProduct} />
      </div>

      <CartSidebar onCheckout={() => setStep(STEPS.PAYMENT)} />

      {customizingProduct && (
        <CustomizationModal product={customizingProduct} onClose={() => setCustomizingProduct(null)} />
      )}
    </div>
  );
}

export { STEPS };
