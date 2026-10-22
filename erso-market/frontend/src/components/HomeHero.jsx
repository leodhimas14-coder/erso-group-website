import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

const photo = (n) => `${import.meta.env.BASE_URL}img/galeri-${n}.jpg`;

/** Opening of the home page while the owner hasn't set a banner in Admin → Kryefaqja. */
export default function HomeHero() {
  const { contact } = useConfig();
  return (
    <section className="hero">
      <div className="hero-media">
        <img src={photo(1)} alt="Ngarkim i mallit në kamion te fabrika në Kinë" />
      </div>
      <div className="container hero-inner">
        <p className="eyebrow">ERSO GROUP SHPK · Durrës</p>
        <h1>Direkt nga fabrikat në Kinë, <span>deri te dera juaj.</span></h1>
        <p className="hero-lead">Makina, motorra, pajisje dhe makineri. Ne gjejmë fabrikën, inspektojmë mallin, e transportojmë dhe e zhdoganojmë.</p>
        <div className="hero-ctas">
          <Link to="/dyqani" className="btn btn-light btn-lg">Shiko katalogun</Link>
          {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent('Përshëndetje ERSO! Po kërkoj një produkt nga Kina.')}`} className="btn btn-outline-light btn-lg" target="_blank" rel="noreferrer">Kërko ofertë</a>}
        </div>
        <ul className="hero-facts">
          <li><b>45+</b><span>lloje produktesh të sjella</span></li>
          <li><b>7</b><span>hapa të menaxhuar</span></li>
          <li><b>CN → AL</b><span>det · tokë · ajër</span></li>
        </ul>
      </div>
    </section>
  );
}

const STEPS = ['Na thoni çfarë kërkoni', 'Gjejmë fabrikën', 'Modele & çmim', 'Inspektojmë & blejmë', 'Letrat & paketimi', 'Transporti', 'Zhdoganimi & dorëzimi'];

export function HowWeWork() {
  return (
    <section className="container section how">
      <div className="section-head"><h2>Si punojmë</h2></div>
      <ol className="how-steps">
        {STEPS.map((s, i) => <li key={s}><span>{String(i + 1).padStart(2, '0')}</span>{s}</li>)}
      </ol>
    </section>
  );
}

const FIELD = [
  [1, 'Ngarkim në kamion'],
  [5, 'Paketim special druri'],
  [6, 'Dorëzim në Shqipëri'],
];

export function FromTheField() {
  return (
    <section className="container section field">
      <div className="section-head"><h2>Nga terreni</h2><Link to="/rreth-nesh">Kush jemi →</Link></div>
      <div className="field-grid">
        {FIELD.map(([n, cap]) => (
          <figure key={n}><img src={photo(n)} alt={cap} loading="lazy" /><figcaption>{cap}</figcaption></figure>
        ))}
      </div>
    </section>
  );
}
