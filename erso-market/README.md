# ERSO Market

Dyqan online (website + aplikacion) i **ERSO GROUP SHPK** për mallra që sjellim direkt
nga fabrikat në Kinë: **makina, makineta, motorra, pajisje shtëpiake, makineri ndërtimi
dhe pista detare**. Ndërtuar mbi të njëjtin model si Panda.al: i njëjti panel admini,
porositë me hapa Kinë → Shqipëri, dërgesat e kargos, kategoritë dhe cilësimet.

## Çfarë ka brenda

**Për klientët** (website që del në Google + aplikacion që instalohet në telefon):
- Katalog me kategori, kërkim, versione dhe ngjyra
- **Porosia minimale** për çdo produkt (p.sh. min. 10 kondicionerë)
- **Çmimi me ofertë**: produkti pa çmim, me butonin "Kërko ofertë në WhatsApp"
- **Specifikimet** si tabelë te faqja e produktit
- Shportë, porosi dhe pagesë (kartë, transfertë bankare ose në dorëzim)
- Gjurmim i porosisë me numrin e porosisë + telefonin
- Butoni i WhatsApp-it në çdo faqe

**Për ty dhe stafin** (`/admin`):
- **Paneli**: të ardhurat, shpenzimet dhe fitimi i muajit, porositë sipas statusit, më të shiturat
- **Porositë**: prano/refuzo, kalo hapat, telefono/WhatsApp klientin, shëno kostot
- **Për të blerë**: çfarë duhet blerë në fabrikë, me linkun e furnitorit
- **Dërgesat (kargo)**: krijo një dërgesë, ngarko porositë, shëno "U nis" / "Mbërriti"
- **Produktet**: foto nga telefoni, çmimi, porosia minimale, "çmimi me ofertë", specifikimet,
  versionet/ngjyrat, stoku në Shqipëri, çmimi i furnitorit (nuk i shfaqet klientit)
- **Kategoritë**: shto, riemërto, rendit, fshih
- **Cilësimet**: monedha (€ ose lekë), shiriti lart, video/foto në kryefaqe, transporti,
  pagesat, llogaria bankare, WhatsApp, tekstet e faqeve, kursi i juanit

### Rruga e një porosie

```
Porosi e re → E konfirmuar → Blerë te furnitori → Në magazinë në Kinë
→ Në rrugë për Shqipëri → Mbërriti në Shqipëri → Te korrieri → E dorëzuar
```

Produktet me stok në Shqipëri (fusha "Stok AL" te versionet) dalin si **"Gati në Shqipëri"**;
të tjerat porositen nga fabrika.

### Monedha

Çmimet ruhen si numra të plotë në monedhën e dyqanit (**euro** si fillim). Te
**Admin → Cilësimet → Monedha** zgjidh € ose lekë; ndryshimi nuk i konverton çmimet.
Kursi i juanit (p.sh. 1 ¥ = 0.13 €) përdoret vetëm për koston dhe fitimin.

## Pagesa me kartë

1. Klienti plotëson porosinë dhe shtyp **Paguaj**. Porosia krijohet me statusin
   **"Pret pagesën"** dhe stoku rezervohet.
2. Klienti kalon te faqja e pagesës së bankës/ofruesit.
3. Ofruesi njofton serverin (`POST /api/payments/<ofruesi>/callback`):
   - pagesa u krye → porosia bëhet **"Porosi e re"**, të vjen njoftimi dhe del te admini;
   - pagesa dështoi → porosia anulohet dhe stoku kthehet.
4. Porositë e papaguara anulohen vetë pas 1 ore.

**Çfarë duhet për pagesa të vërteta:** një llogari tregtari (merchant) për pagesa
online me kartë, nga banka jote (p.sh. BKT, Raiffeisen, Credins) ose nga një ofrues
si POK. Kur ta kesh, merr dokumentacionin e API-së dhe çelësat, dhe ofruesi shtohet
te `backend/src/services/payment.service.js` (dy funksione: krijo pagesën, lexo njoftimin).
Deri atëherë punon ofruesi `test`, një faqe prove pa para të vërteta.
Në prodhim, `test` fiket vetë dhe pagesa me kartë shfaqet si e paaktivizuar.

## Fotot dhe videot

Te **Produktet** shtyp **📷 Ngarko foto** (mund të zgjedhësh disa njëherësh nga telefoni),
dhe te **Cilësimet → Video** shtyp **🎬 Ngarko video ose foto**. Lejohen JPG, PNG, WEBP,
GIF (deri 10 MB) dhe MP4, MOV, WEBM (deri 60 MB). Linket mbeten si mundësi.

Online, vendos `CLOUDINARY_URL` që skedarët të mos humbasin kur rinis serveri. Pa të,
ruhen te `UPLOAD_DIR` dhe shërbehen nga `/uploads`.

## Ku vijnë paratë

Te **Cilësimet → Llogaria bankare** vendos emrin, bankën, IBAN-in (kontrollohet që të jetë
i saktë) dhe SWIFT-in.
- **Transfertë bankare:** kur e ndez te Pagesat, klienti pas porosisë sheh IBAN-in, shumën
  dhe numrin e porosisë për përshkrimin. Porosia pret si "Pret pagesën"; kur paratë
  mbërrijnë, te porosia shtyp **Shëno si të paguar**. Pa pagesë anulohet pas 3 ditësh.
- **Kartë:** paratë i kalon banka/ofruesi i kartave në llogarinë që i jep atyre në kontratë.
  Dyqani nuk i drejton paratë vetë, prandaj jepu të njëjtin IBAN.

## Llogaritë e blerësve

Kushdo mund të shfletojë dhe të mbushë shportën. Për të blerë, klienti krijon llogari
me **email ose numër telefoni** dhe fjalëkalim (ose hyn nëse e ka). Te 👤 sheh porositë
e veta, adresën e ruajtur dhe ndryshon të dhënat. Nëse harron fjalëkalimin, ti i vendos
një të ri te **Admin → Klientët**. Llogaritë e klientëve dhe të stafit janë të ndara:
një llogari klienti nuk hap dot panelin e adminit.

## Paneli i adminit

- **Porositë:** butoni **✓ Prano** / **✕ Refuzo** te çdo porosi e re. Te porosia,
  "Hapi tjetër" tregon butonin për hapin e radhës: U ble te furnitori →
  Mbërriti në magazinë → U nis me transport → Mbërriti në Shqipëri →
  Iu dha korrierit → U dorëzua.
- **Produktet:** çelësi "Aktiv" e fsheh ose e shfaq produktin në dyqan; **Fshi** e heq
  përgjithmonë (porositë e vjetra e ruajnë emrin, foton dhe çmimin e tyre).
- **Kategoritë:** shto, riemërto, ndrysho emoji-n ose foton, rendit me ▲▼, fshih me çelës,
  fshi (vetëm kur kategoria s'ka produkte). Menuja dhe kryefaqja ndjekin këtë listë.
- **Klientët:** lista e llogarive, sa porosi kanë bërë, bllokim dhe fjalëkalim i ri.
- **Cilësimet:** titujt e kryefaqes, tekstet e faqeve (Kush jemi, Dërgesa dhe pagesa,
  Privatësia dhe kushtet), shiriti nën kokë, videoja e kryefaqes, kostoja e transportit dhe
  kufiri për transport falas, kohët e dorëzimit, mënyrat e pagesës, WhatsApp,
  telefoni, email-i dhe kursi i juanit.

## Provoje në kompjuter (pa instaluar databazë)

Duhet Node.js 20 ose më i ri.

```bash
cd backend && npm install && npm run dev:memory     # API + databazë e përkohshme
cd frontend && npm install && npm run dev           # http://localhost:5173
```

Admin: http://localhost:5173/admin, me `admin@ersomarket.al` / `erso1234`.
Të dhënat fshihen kur ndalon serverin.

## Vendosja online

1. **Databaza**: krijo një cluster falas në [MongoDB Atlas](https://www.mongodb.com/atlas) dhe merr `MONGODB_URI`.
2. **Backend-i** (Render, Railway, ose një VPS):
   - `cp backend/.env.example backend/.env` dhe plotëso vlerat
   - `npm install && npm run seed` (krijon adminin nga `ADMIN_EMAIL`/`ADMIN_PASSWORD`)
   - `npm start`
3. **Frontend-i** (Netlify, Vercel, Cloudflare Pages):
   - `VITE_API_URL=https://api.ersomarket.al` (WhatsApp-i vendoset te Admin → Cilësimet)
   - `npm run build`, pastaj publiko dosjen `dist/`
   - Vendos një rregull që çdo faqe të kthejë `index.html` (SPA fallback)
4. **Domain-i**: lidh `ersomarket.al` me frontend-in dhe `api.ersomarket.al` me backend-in.
5. **Google**: shto faqen te [Google Search Console](https://search.google.com/search-console) që të dalë në kërkime.

### Google Play Store

Website-i është PWA, kështu që mund të publikohet në Play Store pa e rishkruar app-in:

1. Hap faqen online te [PWABuilder](https://www.pwabuilder.com), shkruaj `https://ersomarket.al` dhe zgjidh **Android → Generate**.
2. Do të marrësh një skedar `.aab` dhe një `assetlinks.json`. Vendose `assetlinks.json` te `frontend/public/.well-known/`.
3. Krijo llogari zhvilluesi në Google Play Console (25 $ një herë) dhe ngarko `.aab`.

App-i në Play Store hap të njëjtin dyqan, kështu që çdo ndryshim në website shfaqet menjëherë edhe në app.

## Struktura teknike

```
backend/   Node.js + Express + MongoDB (Mongoose)
  src/models        Product, Order, Shipment, User, Counter
  src/services      krijimi i porosive (çmimet llogariten në server), stoku, Telegram
  src/controllers   dyqani publik, admin: produktet, porositë, dërgesat, raportet
  test/             testet e API-së (`npm test`, me MongoDB në memorie)
frontend/  React 18 + Vite + vite-plugin-pwa
  src/pages/shop    kryefaqja, katalogu, produkti, shporta, porosia, gjurmimi
  src/pages/admin   paneli, porositë, për të blerë, dërgesat, produktet
```

Shënime:
- Çmimet ruhen në lekë të plota; çmimi i furnitorit në juan (CNY). Kursi vendoset me `CNY_TO_ALL`.
- Fitimi llogaritet vetëm nga porositë e dorëzuara: shitja − (blerja × kursi + kargo + korrieri).
  Kosto e kargos së një dërgese ndahet njësoj midis porosive brenda saj.
- Roli `admin` sheh gjithçka; roli `staff` (p.sh. magazina) sheh porositë, listën e blerjeve dhe dërgesat, por jo produktet dhe fitimin.
- Fotot ngarkohen nga paneli; online ruhen te Cloudinary kur vendoset `CLOUDINARY_URL`.

## Hapat e ardhshëm

- Ngarkim fotosh direkt nga paneli
- Pagesë me kartë / POK
- Faturë fiskale (fiskalizimi)
- Lidhje me korrierin vendas për kodin e gjurmimit
- Njoftime push për klientët ("Porosia jote u nis")

## Demo pa server

`cd frontend && npm install && npm run build:demo` krijon `dist-demo/erso-market-demo.html`:
dyqani + paneli punojnë në shfletues me të dhëna shembull (admin: `admin@ersomarket.al` / `erso1234`).
Fotot e kompanisë janë te `frontend/public/img/`.
