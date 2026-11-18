import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import InstallButton from './InstallButton';
import { api } from '../lib/api';
import { useConfig } from '../context/ConfigContext';


function Newsletter() {
  const { home } = useConfig();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState({ status: 'idle', message: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!consent) {
      setState({ status: 'error', message: 'Shëno kutinë më poshtë që të pranosh njoftimet.' });
      return;
    }
    setState({ status: 'busy', message: '' });
    try {
      await api('/newsletter', { method: 'POST', body: { email, consent } });
      setState({ status: 'done', message: 'Faleminderit! Do të të njoftojmë për koleksionet dhe ofertat e reja.' });
      setEmail('');
      setConsent(false);
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  };

  return (
    <form className="newsletter" onSubmit={onSubmit}>
      <h2>{home.newsletterTitle}</h2>
      <div className="newsletter-field">
        <input id="newsletter-email" type="email" required placeholder="Adresa e email-it" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Adresa e email-it" autoComplete="email" />
        <button type="submit" aria-label="Regjistrohu" disabled={state.status === 'busy'}><Icon name="caret" size={18} filled stroke={0} /></button>
      </div>
      <label className="newsletter-consent">
        <input id="newsletter-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>Pranoj të marr njoftime për oferta dhe produkte të reja nga Panda.al, siç përshkruhet te <Link to="/kushtet">Privatësia dhe kushtet</Link>.</span>
      </label>
      <p className="newsletter-note">Mund të çregjistrohesh kurdo duke na shkruar. Email-in nuk ia japim askujt.</p>
      {state.message && <p className={state.status === 'error' ? 'form-error' : 'newsletter-ok'} role="status">{state.message}</p>}
    </form>
  );
}

function Section({ title, children }) {
  return (
    <details className="footer-section">
      <summary>{title}<Icon name="caret" size={16} filled stroke={0} /></summary>
      <div className="footer-section-body">{children}</div>
    </details>
  );
}

export default function SiteFooter() {
  const { contact } = useConfig();
  const whatsapp = contact.whatsapp || import.meta.env.VITE_WHATSAPP;
  return (
    <footer className="site-footer">
      <div className="container">
        <Newsletter />

        <nav className="footer-sections" aria-label="Lidhje të dobishme">
          <Section title="Shërbimi ndaj klientit">
            <Link to="/gjurmo">Gjurmo porosinë</Link>
            <Link to="/info">Dërgesa dhe pagesa</Link>
            <Link to="/info">Ndërrimi i masës dhe kthimet</Link>
            {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Na shkruaj në WhatsApp</a>}
            {contact.phone && <span className="footer-contact">Tel: {contact.phone}</span>}
            {contact.email && <span className="footer-contact">Email: {contact.email}</span>}
          </Section>
          <Section title="Llogaria ime">
            <Link to="/llogaria">Porositë e mia</Link>
            <Link to="/te-ruajturat">Produktet e ruajtura</Link>
            <Link to="/shporta">Shporta</Link>
          </Section>
          <Section title="Rreth Panda.al">
            <Link to="/rreth-nesh">Kush jemi</Link>
            <InstallButton className="link-like" />
          </Section>
          <Link to="/kushtet" className="footer-section-link">Privatësia dhe kushtet</Link>
        </nav>

        <div className="footer-country">
          <span className="muted">Shteti dhe gjuha:</span>
          <span>AL / Shqip</span>
        </div>
        <p className="muted small footer-copy">© {new Date().getFullYear()} Panda.al</p>
      </div>
    </footer>
  );
}
