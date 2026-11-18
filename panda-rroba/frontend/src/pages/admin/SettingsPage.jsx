import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useConfig } from '../../context/ConfigContext';
import HomeBanner, { isVideo } from '../../components/HomeBanner';
import { lek } from '../../lib/format';
import UploadButton from '../../components/UploadButton';

// Each card saves only its own section, so one mistake doesn't block the rest.
function SectionCard({ title, hint, children, onSave, busy, msg }) {
  return (
    <section className="card form">
      <h3>{title}</h3>
      {hint && <p className="muted small">{hint}</p>}
      {children}
      <div className="row">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={onSave}>Ruaj</button>
        {msg && <span className={`small ${msg.error ? 'form-error' : ''}`}>{msg.text}</span>}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { reload } = useConfig();
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState('');
  const [msgs, setMsgs] = useState({});
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api('/admin/settings', { auth: true }).then(({ settings }) => setS(settings)).catch((e) => setLoadError(e.message));
  }, []);

  if (!s) return loadError ? <div className="alert alert-error">{loadError}</div> : <p className="muted">Duke u ngarkuar…</p>;

  const field = (section, key, transform = (v) => v) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : transform(e.target.value);
    setS((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  };

  const save = async (section, body) => {
    setBusy(section);
    setMsgs((m) => ({ ...m, [section]: null }));
    try {
      const { settings } = await api('/admin/settings', { method: 'PUT', auth: true, body });
      setS(settings);
      reload();
      setMsgs((m) => ({ ...m, [section]: { text: 'U ruajt ✓' } }));
    } catch (err) {
      setMsgs((m) => ({ ...m, [section]: { text: err.message, error: true } }));
    } finally {
      setBusy('');
    }
  };

  const banner = s.homeBanner;

  return (
    <div className="form">
      <h1 className="admin-title">Cilësimet e dyqanit</h1>
      <p className="muted small">Çdo ndryshim duket menjëherë në dyqan pasi shtyp "Ruaj".</p>

      <SectionCard
        title="Shiriti nën kokën e faqes"
        hint="Teksti i shkurtër që shfaqet nën PANDA në çdo faqe, p.sh. oferta e javës."
        busy={busy === 'promoBar'} msg={msgs.promoBar}
        onSave={() => save('promoBar', { promoBar: s.promoBar })}
      >
        <label className="check"><input id="promo-enabled" type="checkbox" checked={s.promoBar.enabled} onChange={field('promoBar', 'enabled')} /> Shfaqe shiritin</label>
        <label>Teksti<input id="promo-text" maxLength={160} value={s.promoBar.text} onChange={field('promoBar', 'text')} /></label>
        {s.promoBar.enabled && s.promoBar.text && <div className="promo-bar">{s.promoBar.text}</div>}
      </SectionCard>

      <SectionCard
        title="Video ose foto në kryefaqe"
        hint="Ngarko një video (MP4 ose MOV, deri 60 MB) ose një foto. Videoja luhet vetë, pa zë. Për telefon përdor video vertikale (4:5). Pas ngarkimit shtyp Ruaj."
        busy={busy === 'homeBanner'} msg={msgs.homeBanner}
        onSave={() => save('homeBanner', { homeBanner: banner })}
      >
        <div className="row">
          <UploadButton accept="video/mp4,video/webm,video/quicktime,image/*" label="🎬 Ngarko video ose foto" onUploaded={([f]) => f && setS((prev) => ({ ...prev, homeBanner: { ...prev.homeBanner, url: f.url } }))} />
          {banner.url && <button type="button" className="btn btn-ghost" onClick={() => setS((prev) => ({ ...prev, homeBanner: { url: '', posterUrl: '', link: prev.homeBanner.link } }))}>Hiqe</button>}
        </div>
        <label>Ose ngjit një link<input id="banner-url" value={banner.url.startsWith('blob:') || banner.url.startsWith('data:') ? '(skedar i ngarkuar)' : banner.url} onChange={field('homeBanner', 'url')} placeholder="https://…/koleksioni.mp4" /></label>
        {isVideo(banner.url) && (
          <div className="form-row">
            <label>Foto derisa ngarkohet videoja (opsionale)<input id="banner-poster" value={banner.posterUrl} onChange={field('homeBanner', 'posterUrl')} placeholder="https://…/kopertina.jpg" /></label>
            <UploadButton className="btn btn-ghost align-end" label="Ngarko foto" onUploaded={([f]) => f && setS((prev) => ({ ...prev, homeBanner: { ...prev.homeBanner, posterUrl: f.url } }))} />
          </div>
        )}
        <label>Ku të shkojë kur e shtypin (opsionale)<input id="banner-link" value={banner.link} onChange={field('homeBanner', 'link')} placeholder="/dyqani?oferta=1" /></label>
        <div className="banner-preview">
          {banner.url ? <HomeBanner banner={banner} /> : <span className="muted small">Pa video: kryefaqja fillon direkt me kategoritë.</span>}
        </div>
      </SectionCard>

      <SectionCard
        title="Transporti dhe dorëzimi"
        busy={busy === 'shipping'} msg={msgs.shipping}
        onSave={() => save('shipping', { shipping: s.shipping })}
      >
        <div className="form-row">
          <label>Kosto e transportit (L)<input id="ship-fee" type="number" min="0" value={s.shipping.fee} onChange={field('shipping', 'fee', Number)} /></label>
          <label>Transport falas mbi (L)<input id="ship-free" type="number" min="0" value={s.shipping.freeFrom} onChange={field('shipping', 'freeFrom', Number)} /></label>
        </div>
        <p className="muted small">{s.shipping.freeFrom > 0 ? `Porositë mbi ${lek(s.shipping.freeFrom)} nuk paguajnë transport.` : 'Me 0, transporti nuk është kurrë falas.'}</p>
        <div className="form-row">
          <label>Koha kur produkti është në Shqipëri<input id="ship-local" value={s.shipping.localText} onChange={field('shipping', 'localText')} placeholder="1–3 ditë pune" /></label>
          <label>Koha kur vjen nga Kina<input id="ship-china" value={s.shipping.chinaText} onChange={field('shipping', 'chinaText')} placeholder="10–18 ditë" /></label>
        </div>
      </SectionCard>

      <SectionCard
        title="Pagesat"
        hint="Me kartë klienti paguan para se ta porositësh nga Kina. Pagesën në dorëzim mund ta ndezësh nëse do, p.sh. për produktet që i ke në stok."
        busy={busy === 'payments'} msg={msgs.payments}
        onSave={() => save('payments', { payments: s.payments })}
      >
        <label className="check"><input id="pay-card-on" type="checkbox" checked={s.payments.card} onChange={field('payments', 'card')} /> Pagesë me kartë</label>
        <label className="check"><input id="pay-bank-on" type="checkbox" checked={s.payments.bank} onChange={field('payments', 'bank')} /> Transfertë bankare (klienti paguan te IBAN-i yt)</label>
        <label className="check"><input id="pay-cod-on" type="checkbox" checked={s.payments.cod} onChange={field('payments', 'cod')} /> Pagesë në dorëzim (cash)</label>
      </SectionCard>

      <SectionCard
        title="Llogaria bankare (ku vijnë paratë)"
        hint="Kjo është llogaria jote e biznesit. Klientët që zgjedhin transfertë bankare e shohin këtu ku të paguajnë. Për pagesat me kartë, paratë i kalon banka ose ofruesi i kartave në llogarinë që i jep atyre kur hap kontratën. Jepu të njëjtin IBAN."
        busy={busy === 'bank'} msg={msgs.bank}
        onSave={() => save('bank', { bank: s.bank })}
      >
        <div className="form-row">
          <label>Emri i mbajtësit të llogarisë<input id="bank-holder" value={s.bank.holder} onChange={field('bank', 'holder')} placeholder="p.sh. Panda shpk" /></label>
          <label>Banka<input id="bank-name" value={s.bank.bankName} onChange={field('bank', 'bankName')} placeholder="p.sh. BKT" /></label>
        </div>
        <label>IBAN<input id="bank-iban" value={s.bank.iban} onChange={field('bank', 'iban')} placeholder="AL47 2121 1009 0000 0002 3569 8741" autoComplete="off" spellCheck={false} /></label>
        <label>SWIFT/BIC (opsionale)<input id="bank-swift" value={s.bank.swift} onChange={field('bank', 'swift')} placeholder="p.sh. NCBAALTX" autoComplete="off" spellCheck={false} /></label>
      </SectionCard>

      <SectionCard
        title="Kontakti"
        hint="Shfaqen te fundi i faqes. WhatsApp-i shfaq edhe butonin e gjelbër në çdo faqe."
        busy={busy === 'contact'} msg={msgs.contact}
        onSave={() => save('contact', { contact: s.contact })}
      >
        <div className="form-row">
          <label>WhatsApp (me 355)<input id="contact-wa" inputMode="tel" value={s.contact.whatsapp} onChange={field('contact', 'whatsapp')} placeholder="355691234567" /></label>
          <label>Telefoni<input id="contact-phone" inputMode="tel" value={s.contact.phone} onChange={field('contact', 'phone')} placeholder="069 123 4567" /></label>
        </div>
        <label>Email<input id="contact-email" type="email" value={s.contact.email} onChange={field('contact', 'email')} placeholder="info@panda.al" /></label>
      </SectionCard>

      <SectionCard
        title="Titujt në kryefaqe"
        busy={busy === 'home'} msg={msgs.home}
        onSave={() => save('home', { home: s.home })}
      >
        <div className="form-row">
          <label>Seksioni i parë<input id="home-featured" maxLength={60} value={s.home.featuredTitle} onChange={field('home', 'featuredTitle')} /></label>
          <label>Seksioni i dytë<input id="home-latest" maxLength={60} value={s.home.latestTitle} onChange={field('home', 'latestTitle')} /></label>
        </div>
        <label>Teksti mbi regjistrimin me email<input id="home-newsletter" maxLength={160} value={s.home.newsletterTitle} onChange={field('home', 'newsletterTitle')} /></label>
      </SectionCard>

      <SectionCard
        title="Tekstet e faqeve"
        hint='Shkruaj tekstin si në një mesazh. Një rresht që fillon me "## " bëhet titull; një rresht bosh ndan paragrafët. Lëre bosh që të përdoret teksti fillestar i dyqanit.'
        busy={busy === 'pages'} msg={msgs.pages}
        onSave={() => save('pages', { pages: s.pages })}
      >
        <label>Kush jemi<textarea id="page-about" rows={6} value={s.pages.about} onChange={field('pages', 'about')} placeholder={'## Kush jemi\nPanda.al është…'} /></label>
        <label>Dërgesa dhe pagesa<textarea id="page-info" rows={6} value={s.pages.info} onChange={field('pages', 'info')} placeholder={'## Sa zgjat dërgesa?\n…'} /></label>
        <label>Privatësia dhe kushtet<textarea id="page-terms" rows={8} value={s.pages.terms} onChange={field('pages', 'terms')} placeholder={'## Çfarë të dhënash mbledhim\n…'} /></label>
      </SectionCard>

      <SectionCard
        title="Kursi i juanit"
        hint="Përdoret për të llogaritur koston e blerjes në Kinë dhe fitimin. Klientët nuk e shohin."
        busy={busy === 'cnyToAll'} msg={msgs.cnyToAll}
        onSave={() => save('cnyToAll', { cnyToAll: s.cnyToAll })}
      >
        <label>1 juan (¥) = sa lekë<input id="cny-rate" type="number" min="0" step="0.01" value={s.cnyToAll} onChange={(e) => setS((prev) => ({ ...prev, cnyToAll: Number(e.target.value) }))} /></label>
      </SectionCard>
    </div>
  );
}
