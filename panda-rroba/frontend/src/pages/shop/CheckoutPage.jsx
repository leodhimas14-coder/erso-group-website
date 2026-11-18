import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useConfig, shippingFor } from '../../context/ConfigContext';
import { api, IS_DEMO } from '../../lib/api';
import { savePendingPayment } from '../../lib/pendingPayment';
import { useCustomer } from '../../context/CustomerContext';
import { CITIES, lek } from '../../lib/format';
import { rememberOrder } from '../../lib/myOrders';

const SAVED_KEY = 'panda_customer_v1';
const loadSaved = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY)) || {}; } catch { return {}; } };

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const { shipping, payments } = useConfig();
  const { customer, loading: customerLoading } = useCustomer();
  const methods = [payments.card && 'card', payments.bank && 'bank', payments.cod && 'cod'].filter(Boolean);
  const [method, setMethod] = useState(null);
  const paymentMethod = methods.includes(method) ? method : methods[0] || 'card';
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({ name: '', phone: '', city: '', address: '', note: '', ...loadSaved() }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fill in what the account already knows, without overwriting what was typed.
  useEffect(() => {
    if (!customer) return;
    setForm((f) => ({
      ...f,
      name: f.name || customer.name,
      phone: f.phone || (customer.phone ? `0${customer.phone.slice(4)}` : ''),
      city: f.city || customer.address?.city || '',
      address: f.address || customer.address?.address || '',
    }));
  }, [customer]);

  if (lines.length === 0) return <Navigate to="/shporta" replace />;
  if (customerLoading) return <div className="container section"><p className="muted">Duke u ngarkuar…</p></div>;
  if (!customer) return <Navigate to="/llogaria?pas=/porosit" replace />;

  const fee = shippingFor(subtotal, shipping);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { order, paymentUrl } = await api('/orders', {
        method: 'POST',
        auth: 'customer',
        body: {
          customer: form,
          paymentMethod,
          items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
        },
      });
      try {
        const { note, ...saved } = form;
        localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
      } catch { /* ignore */ }
      rememberOrder(order, form.phone);

      if (paymentUrl) {
        // Card: the cart is emptied only once the payment goes through.
        savePendingPayment({ number: order.number, phone: form.phone });
        const url = new URL(paymentUrl, window.location.href);
        if (IS_DEMO || url.origin === window.location.origin) navigate(`${url.pathname}${url.search}`);
        else window.location.assign(url.href);
        return;
      }
      clear();
      navigate('/porosia-u-krye', { state: { order, phone: form.phone }, replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section narrow">
      <h1 className="page-title">Përfundo porosinë</h1>
      <form className="form card" onSubmit={onSubmit}>
        <label>Emri dhe mbiemri<input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
        <label>Numri i telefonit<input required type="tel" inputMode="tel" placeholder="06X XXX XXXX" value={form.phone} onChange={set('phone')} autoComplete="tel" /></label>
        <label>Qyteti
          <select required value={form.city} onChange={set('city')}>
            <option value="">Zgjidhni qytetin</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label>Adresa e saktë<textarea required rows={2} placeholder="Rruga, pallati, kati, pika referimi" value={form.address} onChange={set('address')} autoComplete="street-address" /></label>
        <label>Shënim (opsionale)<input value={form.note} onChange={set('note')} placeholder="p.sh. më telefononi para se të vini" /></label>

        <fieldset className="pay-methods">
          <legend>Mënyra e pagesës</legend>
          {methods.includes('card') && (
            <label className={`pay-method ${paymentMethod === 'card' ? 'active' : ''}`}>
              <input type="radio" name="payment" id="pay-card" checked={paymentMethod === 'card'} onChange={() => setMethod('card')} />
              <span><b>💳 Kartë (Visa, Mastercard)</b><span className="muted small">Paguan tani në faqen e sigurt të bankës.</span></span>
            </label>
          )}
          {methods.includes('bank') && (
            <label className={`pay-method ${paymentMethod === 'bank' ? 'active' : ''}`}>
              <input type="radio" name="payment" id="pay-bank" checked={paymentMethod === 'bank'} onChange={() => setMethod('bank')} />
              <span><b>🏦 Transfertë bankare</b><span className="muted small">Pas porosisë të japim IBAN-in. Porosia niset kur të mbërrijë pagesa.</span></span>
            </label>
          )}
          {methods.includes('cod') && (
            <label className={`pay-method ${paymentMethod === 'cod' ? 'active' : ''}`}>
              <input type="radio" name="payment" id="pay-cod" checked={paymentMethod === 'cod'} onChange={() => setMethod('cod')} />
              <span><b>💵 Pagesë në dorëzim</b><span className="muted small">Paguan me para në dorë kur të vijë porosia.</span></span>
            </label>
          )}
        </fieldset>

        <div className="summary">
          {lines.map((l) => (
            <div key={l.key} className="small"><span>{l.quantity}× {l.name}{l.size || l.color ? ` (${[l.size, l.color].filter(Boolean).join(', ')})` : ''}</span><span>{lek(l.price * l.quantity)}</span></div>
          ))}
          <div><span>Transporti</span><span>{fee === 0 ? 'Falas' : lek(fee)}</span></div>
          <div className="summary-total"><span>Totali për të paguar</span><span>{lek(subtotal + fee)}</span></div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? 'Po dërgohet…' : paymentMethod === 'card' ? `Paguaj ${lek(subtotal + fee)}` : paymentMethod === 'bank' ? 'Porosit dhe merr IBAN-in' : 'Konfirmo porosinë'}
        </button>
        <p className="muted small center">{paymentMethod === 'card' ? 'Do të kaloni te faqja e sigurt e pagesës.' : 'Do t\'ju telefonojmë për të konfirmuar porosinë.'} <Link to="/info">Dërgesa dhe pagesa</Link></p>
      </form>
    </div>
  );
}
