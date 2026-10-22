import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { lek } from '../../lib/format';
import { useCart } from '../../context/CartContext';
import { clearPendingPayment, getPendingPayment } from '../../lib/pendingPayment';

/**
 * Where the customer lands for a card payment.
 * - provova=1: the built-in test card page (development and demo only).
 * - otherwise: back from the bank's page; we wait for the bank to confirm.
 */
export default function PaymentPage() {
  const [params] = useSearchParams();
  const number = params.get('nr') || getPendingPayment()?.number || '';
  const phone = getPendingPayment()?.phone || '';
  const isTest = params.get('provova') === '1';
  const reference = params.get('ref') || '';
  const navigate = useNavigate();
  const { clear } = useCart();

  const [order, setOrder] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | paying | failed | timeout | missing
  const [error, setError] = useState('');

  const finish = (paidOrder) => {
    clear();
    clearPendingPayment();
    navigate('/porosia-u-krye', { replace: true, state: { order: paidOrder, phone } });
  };

  useEffect(() => {
    if (!number || !phone) { setState('missing'); return undefined; }
    let stop = false;
    let tries = 0;
    const check = async () => {
      try {
        const { order: o } = await api(`/orders/track/${encodeURIComponent(number)}?phone=${encodeURIComponent(phone)}`);
        if (stop) return;
        setOrder(o);
        if (o.paid) return finish(o);
        if (o.status === 'e_anuluar') return setState('failed');
        if (isTest) return setState('ready');
        tries += 1;
        if (tries > 20) return setState('timeout');
        setTimeout(check, 2000);
      } catch (err) {
        if (!stop) { setError(err.message); setState('missing'); }
      }
    };
    check();
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [number, phone, isTest]);

  const testPay = async (success) => {
    setState('paying');
    try {
      const { order: o } = await api('/payments/test/callback', { method: 'POST', body: { reference, success } });
      if (o.paid) finish(o); else { setOrder(o); setState('failed'); }
    } catch (err) {
      setError(err.message);
      setState('failed');
    }
  };

  if (state === 'missing') {
    return (
      <div className="container section narrow center">
        <h1 className="page-title">Pagesa</h1>
        <p className="muted">{error || 'Nuk gjetëm porosinë që po paguhet.'}</p>
        <Link to="/llogaria" className="btn btn-primary">Shiko porositë e mia</Link>
      </div>
    );
  }

  if (state === 'failed') {
    return (
      <div className="container section narrow center">
        <h1 className="page-title">Pagesa nuk u krye</h1>
        <p className="muted">Nuk u tërhoq asnjë lek nga karta. Produktet janë ende në shportë, mund të provosh përsëri.</p>
        <Link to="/shporta" className="btn btn-primary btn-lg">Kthehu te shporta</Link>
      </div>
    );
  }

  if (state === 'timeout') {
    return (
      <div className="container section narrow center">
        <h1 className="page-title">Po presim konfirmimin e bankës</h1>
        <p className="muted">Kjo zakonisht zgjat pak sekonda. Kontrollo statusin te "Porositë e mia" pas pak.</p>
        <Link to="/llogaria" className="btn btn-primary">Porositë e mia</Link>
      </div>
    );
  }

  if (!isTest || !order) {
    return <div className="container section narrow center"><p className="muted">Po kontrollojmë pagesën…</p></div>;
  }

  return (
    <div className="container section narrow">
      <div className="test-pay card">
        <p className="test-pay-badge">Faqe prove · nuk tërhiqen para të vërteta</p>
        <h1 className="page-title">Paguaj {lek(order.total)}</h1>
        <p className="muted small">Porosia {order.number}. Në dyqanin e vërtetë këtu hapet faqja e bankës.</p>
        <div className="form">
          <label>Numri i kartës<input id="test-card" value="4242 4242 4242 4242" readOnly /></label>
          <div className="form-row">
            <label>Skadon<input id="test-exp" value="12/29" readOnly /></label>
            <label>CVV<input id="test-cvv" value="123" readOnly /></label>
          </div>
          <button type="button" className="btn btn-primary btn-lg btn-block" disabled={state === 'paying'} onClick={() => testPay(true)}>
            {state === 'paying' ? 'Po paguhet…' : `Paguaj ${lek(order.total)}`}
          </button>
          <button type="button" className="btn btn-ghost btn-block" disabled={state === 'paying'} onClick={() => testPay(false)}>Anulo pagesën</button>
        </div>
      </div>
    </div>
  );
}
