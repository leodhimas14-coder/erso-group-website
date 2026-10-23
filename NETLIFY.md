# ERSO GROUP SHPK: faqja në Netlify

Faqja është te dosja `site/`:

- `site/index.html`: faqja kryesore (5 gjuhë, galeria me foto reale)
- `site/katalog/`: katalogu i produkteve
- `site/admin/`: paneli ku shtoni, ndryshoni dhe fshini produkte
- `site/foto/`: fotot e produkteve (i ngarkon paneli)
- `content/produkte/`: një skedar për çdo produkt (i krijon paneli)
- `content/kategorite.json`: lista e kategorive

Netlify ekzekuton `node scripts/build-catalog.js`, që i bashkon produktet në `site/data/catalog.json`.

## 1. Lidhni faqen me Netlify (një herë)

1. Hyni në https://app.netlify.com dhe zgjidhni **Add new site → Import an existing project → GitHub**.
2. Zgjidhni repon `leodhimas14-coder/erso-group-website`, degën `main`.
3. Netlify i lexon cilësimet vetë nga `netlify.toml`. Shtypni **Deploy**.
4. Te **Domain management** lidhni domenin tuaj (p.sh. `ersogroup.al`).

## 2. Aktivizoni hyrjen në panel (një herë, rreth 5 minuta)

Paneli hyn me llogarinë tuaj të GitHub-it. Netlify bën lidhjen.

1. Në GitHub: **Settings → Developer settings → OAuth Apps → New OAuth App**.
   - Application name: `ERSO Paneli`
   - Homepage URL: adresa e faqes (p.sh. `https://ersogroup.al`)
   - Authorization callback URL: `https://api.netlify.com/auth/done`
2. Ruajeni dhe kopjoni **Client ID**, pastaj krijoni dhe kopjoni një **Client secret**.
3. Në Netlify: **Site configuration → Access & security → OAuth → Install provider → GitHub** dhe ngjitni Client ID dhe Client secret.

Hyjnë vetëm llogaritë GitHub që kanë të drejtë shkrimi në repo. Për t'i dhënë dikujt tjetër akses: repo në GitHub → **Settings → Collaborators**.

## 3. Shtimi i produkteve

1. Hapni `https://adresa-juaj/admin/` dhe shtypni **Login with GitHub**.
2. **Produktet → New Produkt**: plotësoni emrin, kategorinë, çmimin (bosh = "sipas kërkesës"), statusin, përshkrimin, specifikimet dhe fotot.
3. Shtypni **Publish → Publish now**. Pas 1–2 minutash produkti del te `/katalog/`.

- **Ndryshim:** hapni produktin, ndryshoni, **Publish**.
- **Fshehje pa fshirë:** çaktivizoni "Shfaqe në faqe".
- **Fshirje:** hapni produktin → **Delete entry**.
- **Kategori e re:** **Kategoritë → Kategoritë e katalogut → Add**. ID-ja duhet me shkronja të vogla, p.sh. `telefona`.

## 4. Fotot: si të duken të besueshme

- **Bëni foto vetë ose kërkoni foto reale nga fabrika**, jo foto nga interneti. Klientët i njohin fotot e katalogëve dhe nuk u besojnë.
- **Aktivizoni "Foto reale"** vetëm kur fotot janë tuajat ose të fabrikës. Te produkti del shenja "✓ Foto reale".
- **Foto horizontale (4:3), me dritë të mirë dhe sfond të pastër.** E para del në kartë, kështu që zgjidhni më të qartën.
- **3–6 foto për produkt:** përpara, anash, detaje (etiketa, numri i modelit), paketimi.
- **Një foto me produktin në fabrikë, në magazinë ose në kontejner.** Kjo tregon që malli ekziston dhe kalon nga duart tuaja.
- **Foto pas dorëzimit në Shqipëri** (me lejen e klientit) janë dëshmia më e fortë.
- **Shkruani të dhëna konkrete:** modelin, fuqinë, përmasat, garancinë dhe afatin e dorëzimit.
- Fotot mund t'i ngarkoni direkt nga telefoni. Netlify i zvogëlon automatikisht që faqja të hapet shpejt.

## 5. Raporti ditor i karburantit

Hapni `https://adresa-juaj/karburant/` (faqja nuk shfaqet në Google dhe nuk lidhet nga faqja kryesore).

- **Raporti:** zgjidhni datën, turnin dhe punonjësin. "Fillimi" i çdo pistolete merret vetë nga "Fundi" i turnit të mëparshëm. Shkruani "Fundi"; litrat (fundi − fillimi), vlera (litra × çmimi) dhe totalet dalin vetë. Shtoni shpenzimet ditore dhe shtypni **Ruaj raportin**.
- **Çmimet & Cilësimet:** ndryshoni ose fshini çmimet, produktet, pistoletat dhe turnet. Raportet e ruajtura e mbajnë çmimin e vjetër.
- **Gjendja:** gjendja e depozitave dhe furnizimet.
- **Kujdes:** të dhënat ruhen në shfletuesin e kompjuterit ku punoni. Shkarkoni kopjen rezervë çdo javë.
