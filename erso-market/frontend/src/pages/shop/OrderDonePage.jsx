import { Link, Navigate, useLocation } from 'react-router-dom';
import { lek } from '../../lib/format';
import Icon from '../../components/Icon';
import BankDetails from '../../components/BankDetails';
import { useConfig } from '../../context/ConfigContext';

export default function OrderDonePage() {
  const { state } = useLocation();
  if (!state?.order) return <Navigate to="/" replace />;
  const { order, phone } = state;
  const { bank } = useConfig();
  const waitingTransfer = order.paymentMethod === 'bank' && !order.paid;

  return (
    <div className="container section narrow center">
      <div className="success-icon"><Icon name="check" size={40} stroke={2.5} /></div>
      <h1>Faleminderit! Porosia u pranua.</h1>
      <p className="muted">{order.paid ? 'Pagesa u krye. Do t\'ju njoftojmë kur porosia të niset.' : waitingTransfer ? 'Bëj transfertën me të dhënat më poshtë. Porosia niset sapo të mbërrijë pagesa.' : 'Do t\'ju telefonojmë së shpejti për ta konfirmuar.'}</p>
      <div className="card order-number">
        <span className="muted small">Numri i porosisë</span>
        <strong>{order.number}</strong>
        <span>Totali: <b>{lek(order.total)}</b> · {order.paid ? 'paguar me kartë ✓' : waitingTransfer ? 'pret transfertën' : 'pagesë në dorëzim'}</span>
      </div>
      {waitingTransfer && <BankDetails bank={bank} order={order} />}
      <p className="muted small">Ruajeni numrin e porosisë. Me të dhe numrin e telefonit mund ta gjurmoni porosinë kurdo.</p>
      <div className="stack">
        <Link to={`/gjurmo?nr=${order.number}&tel=${encodeURIComponent(phone)}`} className="btn btn-primary btn-lg btn-block">Gjurmo porosinë</Link>
        <Link to="/dyqani" className="btn btn-ghost btn-block">Vazhdo blerjet</Link>
      </div>
    </div>
  );
}
