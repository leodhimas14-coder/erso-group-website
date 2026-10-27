// Fuel stations grouped by area (Durrës, Tiranë…). Each station has its own daily shift
// reports (pump readings, prices, expenses), tank stock and settings; customers who pay
// monthly are shared by all stations. Everything is kept in this browser's localStorage;
// the JSON backup on the home page moves the data to another computer.
(function () {
  'use strict';

  const DEMO = !!window.KARBURANT_DEMO;
  const KEY = DEMO ? 'erso-karburant-demo2' : 'erso-karburant-v1';
  const $app = document.getElementById('app');

  // ---------- helpers ----------
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const pad = (n) => String(n).padStart(2, '0');
  const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n, dec = 2) => (n == null || Number.isNaN(n)) ? '' :
    Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  // Accepts "34888.10", "34,888.10" and "34888,10".
  function num(v) {
    if (v == null) return null;
    let s = String(v).trim().replace(/\s/g, '');
    if (s === '') return null;
    if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
    else if (s.includes(',')) s = s.replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  const inVal = (n) => (n == null ? '' : String(n));
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2200);
  }
  // Claude viewer capabilities (photo reading, downloads) exist only when the page runs as a
  // claude.ai artifact; on the normal website `cap()` resolves null and the plain fallbacks run.
  const caps = {};
  const cap = (name) => (caps[name] ||= (window.claude?.use ? window.claude.use(name).catch(() => null) : Promise.resolve(null)));
  const inViewer = !!window.claude?.use;

  async function download(name, text, type) {
    const dl = await cap('downloads');
    if (dl) {
      try { await dl.save({ filename: name, data: text }); toast('Skedari u shkarkua'); }
      catch (e) { if (e.code !== 'declined') toast('Shkarkimi nuk funksionon këtu'); }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // In-page replacement for confirm(): the claude.ai viewer blocks native dialogs.
  // `typed` asks the user to type a word first; `cancel: null` makes it a plain notice.
  function ask(msg, { ok = 'Po', cancel = 'Anulo', danger = false, typed = null, input = null, html = null, wide = false } = {}) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'modal';
      wrap.innerHTML = `<div class="dialog${wide ? ' wide' : ''}" role="dialog" aria-modal="true">
        <div class="msg"></div>${html || ''}
        ${typed || input ? `<input type="text" class="typed" placeholder="${esc(typed || input)}" autocomplete="off">` : ''}
        <div class="row end">${cancel ? `<button class="btn" data-a="0">${esc(cancel)}</button>` : ''}
        ${ok ? `<button class="btn ${danger ? 'danger' : 'primary'}" data-a="1">${esc(ok)}</button>` : ''}</div></div>`;
      wrap.querySelector('.msg').textContent = msg;
      const done = (v) => { wrap.remove(); document.removeEventListener('keydown', key); resolve(v); };
      const key = (e) => {
        if (e.key === 'Escape') done(input ? null : false);
        if (e.key === 'Enter' && e.target.classList?.contains('typed')) wrap.querySelector('[data-a="1"]')?.click();
      };
      wrap.addEventListener('click', (e) => {
        const b = e.target.closest('[data-a]');
        if (!b) return;
        if (b.dataset.a === '1' && typed && wrap.querySelector('.typed').value.trim() !== typed) return toast(`Shkruani ${typed}`);
        if (input) return done(b.dataset.a === '1' ? wrap.querySelector('.typed').value.trim() : null);
        done(b.dataset.a === '1');
      });
      document.addEventListener('keydown', key);
      document.body.appendChild(wrap);
      (wrap.querySelector('.typed') || wrap.querySelector('[data-a="1"]') || wrap.querySelector('[data-a]'))?.focus();
      ask.close = () => done(false);
    });
  }
  // CSV with ";" and a BOM so Excel opens it with the right columns and Albanian letters.
  function csv(rows) {
    return '﻿' + rows.map((r) => r.map((c) => {
      const s = c == null ? '' : String(c);
      return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(';')).join('\r\n');
  }

  // ---------- state ----------
  function defaults() {
    const p = (name, price, metered = true) => ({ id: uid(), name, price, unit: metered ? 'L' : 'copë', metered, stockStart: 0 });
    const products = [p('Benz100', 215), p('Benzine', 187), p('D1 G', 220), p('D2', 210), p('Gaz', 66), p('Adblu', 600, false), p('Vajra', 0, false)];
    const by = (n) => products.find((x) => x.name === n).id;
    const pump = (name, prod, price = null) => ({ id: uid(), name, productId: by(prod), price });
    return {
      products,
      pumps: [
        pump('Benz100 – 1', 'Benz100'), pump('Benzine – 1', 'Benzine'), pump('D1 G – 1', 'D1 G'),
        pump('D2 – 1', 'D2'), pump('D2 – 2', 'D2'), pump('D1 G – 2', 'D1 G'),
        pump('Benzine – 2', 'Benzine'), pump('Benz100 – 2', 'Benz100'),
        pump('Gaz – 1', 'Gaz'), pump('Gaz – 2', 'Gaz'), pump('Gaz – 3', 'Gaz', 64), pump('Gaz – 4', 'Gaz', 64),
      ],
      shifts: [{ id: 'T1', name: 'Turni I (06:00–14:00)' }, { id: 'T2', name: 'Turni II (14:00–22:00)' }],
      priceHistory: [],
      reports: [],
      deliveries: [],
    };
  }
  // Demo: five days of invented shifts so every screen has something to show.
  function demoState(seedInit = 7, custs = []) {
    const s = defaults();
    let seed = seedInit;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const base = { 'Benz100': 60, 'Benzine': 90, 'D1 G': 70, 'D2': 160, 'Gaz': 180 };
    const meters = [34800.4, 139500.49, 87760.15, 331300.73, 442500.2, 160200.61, 232100.45, 69000.44, 553000.53, 923100.98, 485700.83, 341300.39];
    const people = ['Punonjës shembull A', 'Punonjës shembull B'];
    const costs = [['BANKE', 11700], ['Furnitor buke', 1200], ['Pastrim', 2000], ['Rimbursim klienti', 3500], ['Telefon', 1000]];
    const pn = (id) => s.products.find((p) => p.id === id).name;
    const day = new Date();
    // Five full days plus today's first shift, so today's shift II is the one to fill in.
    for (let k = 5; k >= 0; k--) {
      const d = new Date(day); d.setDate(d.getDate() - k);
      for (const sh of k ? s.shifts : s.shifts.slice(0, 1)) {
        const rows = s.pumps.map((pm, i) => {
          const start = meters[i];
          const end = round2(start + base[pn(pm.productId)] * (0.4 + rnd()));
          meters[i] = end;
          return { pumpId: pm.id, name: pm.name, productId: pm.productId, start, end, price: pumpPrice(pm, s) };
        });
        const ad = s.products.find((p) => p.name === 'Adblu');
        const exp = costs.filter(() => rnd() < 0.35).map(([desc, value]) => ({ desc, value, kind: 'exp' }));
        for (const c of custs) if (rnd() < 0.12) exp.push({ desc: c.name, value: Math.round(2 + rnd() * 30) * 500, kind: 'client', customerId: c.id });
        s.reports.push({ id: uid(), date: localDate(d), shift: sh.id, employee: people[shiftIdxIn(s, sh.id) % 2], note: 'Shembull',
          rows, extras: rnd() < 0.6 ? [{ id: uid(), productId: ad.id, name: 'Adblu', qty: 1 + Math.floor(rnd() * 3), price: ad.price, value: null }] : [], expenses: exp });
      }
    }
    const stocks = { 'Benz100': 1500, 'Benzine': 2500, 'D1 G': 2000, 'D2': 6000, 'Gaz': 12000, 'Adblu': 40, 'Vajra': 52 };
    s.products.forEach((p) => { p.stockStart = stocks[p.name] || 0; });
    const d2 = s.products.find((p) => p.name === 'D2');
    const dd = new Date(day); dd.setDate(dd.getDate() - 3);
    s.deliveries.push({ id: uid(), date: localDate(dd), productId: d2.id, qty: 4000, note: 'Shembull: cisternë' });
    return s;
  }
  function demoDB() {
    const db = emptyDB();
    db.customers = ['Nedi', 'Arbi', 'Neri', 'Hoti Metal', 'Bilo Opel'].map((name) => ({ id: uid(), name, phone: '', note: 'Shembull' }));
    const plan = { 'Durrës': ['Shkozet', 'Plepa'], 'Tiranë': ['Kombinat', 'Kashar'], 'Dibër': ['Peshkopi'] };
    let seed = 7;
    for (const [g, names] of Object.entries(plan)) {
      const grp = { id: uid(), name: g };
      db.groups.push(grp);
      for (const name of names) db.stations.push({ id: uid(), name, groupId: grp.id, ...demoState(seed += 11, db.customers) });
    }
    const d = new Date(); d.setDate(d.getDate() - 2);
    db.payments.push({ id: uid(), customerId: db.customers[0].id, date: localDate(d), amount: 10000, note: 'Shembull: pagesë' });
    return db;
  }
  const emptyDB = () => ({ groups: [], stations: [], customers: [], payments: [] });
  // Older saves held one station; they become "Pika 1" in a group to rename.
  function upgrade(raw) {
    if (raw && Array.isArray(raw.stations)) return { ...emptyDB(), ...raw };
    if (raw && Array.isArray(raw.products)) {
      const grp = { id: uid(), name: 'Pa grup' };
      return { ...emptyDB(), groups: [grp], stations: [{ id: uid(), name: 'Pika 1', groupId: grp.id, ...defaults(), ...raw }] };
    }
    return null;
  }
  function shiftIdxIn(s, id) { return s.shifts.findIndex((x) => x.id === id); }
  function load() {
    try {
      const db = upgrade(JSON.parse(localStorage.getItem(KEY)));
      if (db) return db;
    } catch (e) { /* fall through */ }
    return DEMO ? demoDB() : emptyDB();
  }
  let DB = load();
  let S = null; // the station that is open
  const station = (id) => DB.stations.find((x) => x.id === id);
  const group = (id) => DB.groups.find((x) => x.id === id);
  const customer = (id) => DB.customers.find((x) => x.id === id);
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(DB)); }
    catch (e) { toast('Të dhënat nuk u ruajtën në këtë shfletues: ' + e.message); }
  }
  const product = (id) => S.products.find((p) => p.id === id);
  const shiftIdx = (id) => { const i = S.shifts.findIndex((s) => s.id === id); return i < 0 ? 99 : i; };
  const shiftName = (id) => (S.shifts.find((s) => s.id === id) || { name: id }).name;
  const order = (r) => r.date + '|' + pad(shiftIdx(r.shift));
  const sortedReports = () => [...S.reports].sort((a, b) => order(a).localeCompare(order(b)));

  // ---------- calculations ----------
  function rowCalc(r) {
    const liters = r.start != null && r.end != null ? round2(r.end - r.start) : null;
    const value = liters != null && r.price != null ? round2(liters * r.price) : null;
    return { liters, value };
  }
  function extraValue(x) {
    if (x.qty != null && x.price != null) return round2(x.qty * x.price);
    return x.value ?? null;
  }
  function totals(rep) {
    const fuel = round2(rep.rows.reduce((s, r) => s + (rowCalc(r).value || 0), 0));
    const extras = round2(rep.extras.reduce((s, x) => s + (extraValue(x) || 0), 0));
    const expenses = round2(rep.expenses.reduce((s, x) => s + (x.kind === 'client' ? 0 : x.value || 0), 0));
    const credit = round2(rep.expenses.reduce((s, x) => s + (x.kind === 'client' ? x.value || 0 : 0), 0));
    const sales = round2(fuel + extras);
    return { fuel, extras, sales, expenses, credit, net: round2(sales - expenses - credit) };
  }
  function soldByProduct(reports) {
    const m = {};
    for (const rep of reports) {
      for (const r of rep.rows) {
        const c = rowCalc(r);
        if (c.liters == null) continue;
        const o = (m[r.productId] ||= { qty: 0, value: 0 });
        o.qty = round2(o.qty + c.liters); o.value = round2(o.value + (c.value || 0));
      }
      for (const x of rep.extras) {
        if (!x.productId) continue;
        const o = (m[x.productId] ||= { qty: 0, value: 0 });
        o.qty = round2(o.qty + (x.qty || 0)); o.value = round2(o.value + (extraValue(x) || 0));
      }
    }
    return m;
  }
  function stock(st = S) {
    const sold = soldByProduct(st.reports);
    return st.products.map((p) => {
      const delivered = round2(st.deliveries.filter((d) => d.productId === p.id).reduce((s, d) => s + d.qty, 0));
      const out = sold[p.id]?.qty || 0;
      return { p, delivered, out, now: round2((p.stockStart || 0) + delivered - out) };
    });
  }

  // ---------- report draft ----------
  // The start reading of each pump is the end reading of the latest earlier shift.
  function previousEnd(pumpId, date, shift) {
    const key = date + '|' + pad(shiftIdx(shift));
    const prev = sortedReports().filter((r) => order(r) < key).reverse();
    for (const r of prev) {
      const row = r.rows.find((x) => x.pumpId === pumpId);
      if (row && row.end != null) return row.end;
    }
    return null;
  }
  function pumpPrice(pump, st = S) {
    if (pump.price != null) return pump.price;
    return st.products.find((p) => p.id === pump.productId)?.price ?? null;
  }
  function newDraft(date, shift) {
    return {
      id: null, date, shift, employee: '', note: '',
      rows: S.pumps.map((pm) => ({
        pumpId: pm.id, name: pm.name, productId: pm.productId,
        start: previousEnd(pm.id, date, shift), end: null, price: pumpPrice(pm),
      })),
      extras: S.products.filter((p) => !p.metered).map((p) => ({ id: uid(), productId: p.id, name: p.name, qty: null, price: p.price || null, value: null })),
      expenses: [],
    };
  }
  function openDraft(date, shift) {
    const existing = S.reports.find((r) => r.date === date && r.shift === shift);
    draft = existing ? structuredClone(existing) : newDraft(date, shift);
    dirty = false;
  }
  let draft = null;
  let dirty = false;
  // view: 'pikat' (home), 'klientet', 'klient' (one customer) or a station tab.
  let tab = 'pikat';
  let custId = null;
  const STATION_TABS = [['raporti', 'Raporti'], ['historiku', 'Historiku'], ['gjendja', 'Gjendja'], ['permbledhje', 'Përmbledhje'], ['cilesimet', 'Çmimet & Cilësimet']];
  const $nav = document.getElementById('tabs');

  // Each station and the customer list has its own link (#pika-…, #klientet).
  function setHash(h) {
    try { if (location.hash.slice(1) !== h) history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) { /* sandboxed */ }
  }
  async function leaveReport() {
    if (tab === 'raporti' && dirty && !(await ask('Raporti ka ndryshime të paruajtura. Të largohem pa ruajtur?'))) return false;
    if (tab === 'raporti') { draft = null; dirty = false; }
    return true;
  }
  async function go(to, id) {
    if (!(await leaveReport())) return;
    if (to === 'station') {
      const st = station(id); if (!st) return go('pikat');
      if (S !== st) { S = st; draft = null; }
      tab = 'raporti'; setHash('pika-' + st.id);
    } else if (to === 'klient') { custId = id; tab = 'klient'; setHash('klientet'); }
    else if (STATION_TABS.some(([t]) => t === to) && S) tab = to;
    else { tab = to; if (to === 'pikat') { S = null; setHash(''); } else setHash(to); }
    render(); window.scrollTo(0, 0);
  }
  function routeFromHash() {
    const h = location.hash.slice(1);
    if (h.startsWith('pika-') && station(h.slice(5))) { S = station(h.slice(5)); tab = 'raporti'; }
    else if (h === 'klientet' || h === 'litrat') tab = h;
  }

  function renderNav() {
    const g = S && group(S.groupId);
    const top = `<button data-go="pikat" class="${tab === 'pikat' ? 'active' : ''}">Pikat</button>
      <button data-go="litrat" class="${tab === 'litrat' ? 'active' : ''}">Litrat</button>
      <button data-go="klientet" class="${tab === 'klientet' || tab === 'klient' ? 'active' : ''}">Klientët</button>`;
    const st = S && !['pikat', 'litrat', 'klientet', 'klient'].includes(tab) ? `<span class="crumb">${esc(g?.name || 'Pa grup')} › <b>${esc(S.name)}</b></span>
      ${STATION_TABS.map(([t, l]) => `<button data-go="${t}" class="${tab === t ? 'active' : ''}">${l}</button>`).join('')}`
      : S ? `<button data-go="station" data-id="${S.id}" class="back">↩ ${esc(S.name)}</button>` : '';
    $nav.innerHTML = top + st;
  }

  // ---------- views ----------
  function render() {
    renderNav();
    if (tab === 'pikat') renderHome();
    else if (tab === 'klientet') renderCustomers();
    else if (tab === 'klient') renderCustomer();
    else if (tab === 'litrat') renderLiters();
    else if (tab === 'raporti') renderReport();
    else if (tab === 'historiku') renderHistory();
    else if (tab === 'gjendja') renderStock();
    else if (tab === 'permbledhje') renderSummary();
    else renderSettings();
  }

  function renderReport() {
    if (!draft) {
      const last = sortedReports().pop();
      // Continue after the last saved shift so the cashier lands on the shift to fill in.
      if (last) {
        const i = shiftIdx(last.shift);
        if (i < S.shifts.length - 1) openDraft(last.date, S.shifts[i + 1].id);
        else { const d = new Date(last.date + 'T12:00'); d.setDate(d.getDate() + 1); openDraft(localDate(d), S.shifts[0].id); }
      } else openDraft(localDate(), S.shifts[0].id);
    }
    const d = draft;
    const negatives = d.rows.filter((r) => (rowCalc(r).liters ?? 0) < 0);
    const productOpts = (sel) => `<option value="">— tjetër —</option>` + S.products.map((p) =>
      `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('');

    $app.innerHTML = `${demoBanner()}
    <div class="card photo-card no-print">
      <div class="row"><div style="flex:1;min-width:220px"><h2 style="margin:0 0 4px">📷 Lexo raportin nga foto</h2>
        <p class="note" style="margin:0">Bëni foto ekranit të Excel-it, fletës së shkruar me dorë ose numratorëve të pompave. Sistemi i lexon numrat dhe jua tregon para se t'i vendosë në raport.</p></div>
        <label class="btn primary">Zgjidh foton<input type="file" id="photo" accept="image/jpeg,image/png,image/webp" hidden></label></div>
    </div>
    <div class="card">
      <div class="print-only"><h2>RAPORTI DITOR I SHITJEVE</h2></div>
      <div class="row">
        <div class="field"><label>Data</label><input type="date" id="r-date" value="${d.date}"></div>
        <div class="field"><label>Turni</label><select id="r-shift">${S.shifts.map((s) =>
          `<option value="${s.id}" ${s.id === d.shift ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="field" style="flex:1;min-width:180px"><label>Punonjësi</label><input type="text" id="r-emp" value="${esc(d.employee)}" placeholder="Emri i punonjësit"></div>
        <div class="row no-print">
          <button class="btn primary" data-act="save">💾 Ruaj raportin</button>
          <button class="btn" data-act="prices" title="Vendos çmimet aktuale te ky raport">Çmimet aktuale</button>
          ${inViewer ? '' : '<button class="btn" data-act="print">🖨 Printo</button>'}
          <button class="btn" data-act="csv">⬇ Excel (CSV)</button>
          ${d.id ? '<button class="btn danger" data-act="delete">Fshi raportin</button>' : ''}
        </div>
      </div>
      <p class="note no-print">${d.id ? '<span class="badge ok">I ruajtur</span> Po ndryshoni një raport të ruajtur.' : '<span class="badge">I ri</span> "Fillimi" plotësohet vetë nga "Fundi" i turnit të mëparshëm.'} <span id="dirty" class="neg">${dirty ? ' • Ka ndryshime të paruajtura' : ''}</span></p>
    </div>

    <div class="grid2">
      <div>
        <div class="card">
          <h2>Leximet e pistoletave</h2>
          <div id="negwarn">${negatives.length ? `<div class="warnbox">Kujdes: ${negatives.length} pistoleta kanë "Fundi" më të vogël se "Fillimi" (litra negative). Kontrolloni leximet.</div>` : ''}</div>
          <div class="scroll"><table id="t-rows">
            <thead><tr><th>Emërtimi</th><th class="num">Fillimi</th><th class="num">Fundi</th><th class="num">Litra</th><th class="num">Çmimi</th><th class="num">Vlera</th></tr></thead>
            <tbody>${d.rows.map((r, i) => `<tr data-i="${i}">
              <td>${esc(r.name)}</td>
              <td><input class="num" data-f="start" inputmode="decimal" value="${inVal(r.start)}"></td>
              <td><input class="num" data-f="end" inputmode="decimal" value="${inVal(r.end)}"></td>
              <td class="num" data-c="liters"></td>
              <td><input class="num" style="min-width:70px" data-f="price" inputmode="decimal" value="${inVal(r.price)}"></td>
              <td class="num" data-c="value"></td></tr>`).join('')}</tbody>
            <tfoot><tr><td colspan="3">Totali karburant</td><td class="num" id="tot-l"></td><td></td><td class="num" id="tot-fuel"></td></tr></tfoot>
          </table></div>
          <button class="btn small no-print" data-act="add-pump" style="margin-top:6px">+ Shto pistoletë ose artikull</button>

          <h3>Shitje të tjera (Adblu, Vajra, të tjera)</h3>
          <div class="scroll"><table id="t-extras">
            <thead><tr><th>Produkti</th><th>Përshkrimi</th><th class="num">Sasia</th><th class="num">Çmimi</th><th class="num">Vlera</th><th class="no-print"></th></tr></thead>
            <tbody>${d.extras.map((x, i) => `<tr data-i="${i}">
              <td><select data-f="productId">${productOpts(x.productId)}</select></td>
              <td><input data-f="name" value="${esc(x.name)}"></td>
              <td><input class="num" style="min-width:60px" data-f="qty" inputmode="decimal" value="${inVal(x.qty)}"></td>
              <td><input class="num" style="min-width:70px" data-f="price" inputmode="decimal" value="${inVal(x.price)}"></td>
              <td><input class="num" data-f="value" inputmode="decimal" value="${inVal(extraValue(x))}" title="Llogaritet vetë nga sasia × çmimi; ose shkruani vlerën direkt"></td>
              <td class="no-print"><button class="x" data-act="del-extra" data-i="${i}">✕</button></td></tr>`).join('')}</tbody>
            <tfoot><tr><td colspan="4">Totali shitje të tjera</td><td class="num" id="tot-extras"></td><td class="no-print"></td></tr></tfoot>
          </table></div>
          <button class="btn small no-print" data-act="add-extra" style="margin-top:6px">+ Shto rresht</button>
        </div>
      </div>

      <div>
        <div class="card">
          <h2>Shpenzime ditore dhe klientë</h2>
          <datalist id="cust-list">${DB.customers.map((c) => `<option value="${esc(c.name)}"></option>`).join('')}</datalist>
          <div class="scroll"><table id="t-exp">
            <thead><tr><th>Përshkrimi / klienti</th><th>Lloji</th><th class="num">Vlera</th><th class="no-print"></th></tr></thead>
            <tbody>${d.expenses.map((x, i) => `<tr data-i="${i}" class="${x.kind === 'client' ? 'is-client' : ''}">
              <td><input data-f="desc" list="cust-list" value="${esc(x.desc)}" placeholder="p.sh. BANKE ose Nedi"></td>
              <td><select data-f="kind"><option value="exp">Shpenzim</option><option value="client" ${x.kind === 'client' ? 'selected' : ''}>Klient (borxh)</option></select></td>
              <td><input class="num" data-f="value" inputmode="decimal" value="${inVal(x.value)}"></td>
              <td class="no-print"><button class="x" data-act="del-exp" data-i="${i}">✕</button></td></tr>`).join('')}</tbody>
            <tfoot><tr><td colspan="2">Totali shpenzime</td><td class="num" id="tot-exp"></td><td class="no-print"></td></tr>
              <tr><td colspan="2">Klientë në borxh</td><td class="num" id="tot-credit"></td><td class="no-print"></td></tr></tfoot>
          </table></div>
          <button class="btn small no-print" data-act="add-exp" style="margin-top:6px">+ Shto rresht</button>
          <p class="note no-print">Klientët që paguajnë një herë në muaj: shkruani emrin (p.sh. Nedi). Nëse klienti është në listë, njihet vetë. Për klient të ri zgjidhni "Klient (borxh)". Shënohet me datën e raportit te faqja Klientët.</p>
        </div>

        <div class="card">
          <h2>Totali i turnit</h2>
          <div class="totals">
            <div class="stat"><div class="k">Shitje karburant</div><div class="v" id="s-fuel"></div></div>
            <div class="stat"><div class="k">Shitje të tjera</div><div class="v" id="s-extras"></div></div>
            <div class="stat"><div class="k">Totali i shitjeve</div><div class="v" id="s-sales"></div></div>
            <div class="stat"><div class="k">Shpenzime</div><div class="v" id="s-exp"></div></div>
            <div class="stat"><div class="k">Klientë në borxh</div><div class="v" id="s-credit"></div></div>
            <div class="stat hl"><div class="k">Për t'u dorëzuar (shitje − shpenzime − borxhe)</div><div class="v" id="s-net"></div></div>
          </div>
          <div class="field" style="margin-top:10px"><label>Shënime</label><input type="text" id="r-note" value="${esc(d.note)}"></div>
        </div>
        <div class="card">
          <h2>Litrat e shitura</h2>
          <div class="scroll"><table id="t-lit">
            <thead><tr><th>Produkti</th><th class="num">Ky turn</th><th class="num">Gjithë dita</th><th class="num">Muaji deri sot</th></tr></thead>
            <tbody></tbody><tfoot></tfoot>
          </table></div>
          <p class="note">"Gjithë dita" bashkon të gjitha turnet e datës ${esc(d.date)}. Të dhënat shkojnë vetë te faqja "Litrat".</p>
        </div>
      </div>
    </div>`;
    recalc();
  }

  // Updates only the computed cells so typing never loses focus.
  function recalc() {
    const d = draft;
    let liters = 0;
    document.querySelectorAll('#t-rows tbody tr').forEach((tr) => {
      const r = d.rows[tr.dataset.i]; const c = rowCalc(r);
      const lc = tr.querySelector('[data-c=liters]'); const vc = tr.querySelector('[data-c=value]');
      lc.textContent = fmt(c.liters); vc.textContent = fmt(c.value);
      lc.classList.toggle('neg', (c.liters ?? 0) < 0); vc.classList.toggle('neg', (c.value ?? 0) < 0);
      liters += c.liters || 0;
    });
    document.querySelectorAll('#t-extras tbody tr').forEach((tr) => {
      const x = d.extras[tr.dataset.i]; const inp = tr.querySelector('[data-f=value]');
      if (x.qty != null && x.price != null && document.activeElement !== inp) inp.value = inVal(extraValue(x));
    });
    const t = totals(d);
    const set = (id, v) => { const el = document.getElementById(id); if (el) { el.textContent = fmt(v); el.classList.toggle('neg', v < 0); } };
    set('tot-l', round2(liters)); set('tot-fuel', t.fuel); set('tot-extras', t.extras); set('tot-exp', t.expenses); set('tot-credit', t.credit);
    set('s-fuel', t.fuel); set('s-extras', t.extras); set('s-sales', t.sales); set('s-exp', t.expenses); set('s-credit', t.credit); set('s-net', t.net);
    const neg = d.rows.filter((r) => (rowCalc(r).liters ?? 0) < 0).length;
    const w = document.getElementById('negwarn');
    if (w) w.innerHTML = neg ? `<div class="warnbox">Kujdes: ${neg} pistoleta kanë "Fundi" më të vogël se "Fillimi" (litra negative). Kontrolloni leximet.</div>` : '';
    renderShiftLiters();
    const dd = document.getElementById('dirty'); if (dd) dd.textContent = dirty ? ' • Ka ndryshime të paruajtura' : '';
  }

  async function saveDraft() {
    const d = draft;
    if (!d.date || !d.shift) return toast('Zgjidhni datën dhe turnin');
    const clash = S.reports.find((r) => r.date === d.date && r.shift === d.shift && r.id !== d.id);
    if (clash && !(await ask('Ka një raport tjetër për këtë datë dhe turn. Ta zëvendësoj?'))) return;
    if (clash) S.reports = S.reports.filter((r) => r !== clash);
    d.expenses = d.expenses.filter((x) => x.desc || x.value != null);
    if (d.expenses.some((x) => x.kind === 'client' && !x.desc.trim())) return toast('Shkruani emrin e klientit');
    for (const x of d.expenses) {
      if (x.kind !== 'client') { delete x.customerId; continue; }
      const c = findCustomer(x.desc) || addCustomer(x.desc);
      x.customerId = c.id; x.desc = c.name; delete x.auto;
    }
    d.extras = d.extras.filter((x) => x.qty != null || x.value != null);
    if (!d.id) d.id = uid();
    d.savedAt = new Date().toISOString();
    const i = S.reports.findIndex((r) => r.id === d.id);
    if (i >= 0) S.reports[i] = structuredClone(d); else S.reports.push(structuredClone(d));
    save(); dirty = false; toast('Raporti u ruajt'); renderReport();
  }

  function reportCsv(rep) {
    const t = totals(rep);
    const rows = [
      ['RAPORTI DITOR I SHITJEVE'], ['Pika', S.name, 'Data', rep.date, 'Turni', shiftName(rep.shift), 'Punonjësi', rep.employee], [],
      ['Emërtimi', 'Fillimi', 'Fundi', 'Litra', 'Çmimi', 'Vlera'],
      ...rep.rows.map((r) => { const c = rowCalc(r); return [r.name, r.start, r.end, c.liters, r.price, c.value]; }),
      ['Totali karburant', '', '', '', '', t.fuel], [],
      ['Shitje të tjera', 'Sasia', 'Çmimi', 'Vlera'],
      ...rep.extras.map((x) => [x.name, x.qty, x.price, extraValue(x)]),
      ['Totali shitje të tjera', '', '', t.extras], [],
      ['Shpenzime ditore', 'Lloji', 'Vlera'], ...rep.expenses.map((x) => [x.desc, x.kind === 'client' ? 'Klient' : 'Shpenzim', x.value]),
      ['Totali shpenzime', '', t.expenses], ['Klientë në borxh', '', t.credit], [],
      ['Totali i shitjeve', t.sales], ['Për t\'u dorëzuar', t.net], ['Shënime', rep.note || ''],
    ];
    return csv(rows);
  }

  function renderHistory() {
    const month = renderHistory.month ||= localDate().slice(0, 7);
    const list = sortedReports().filter((r) => !month || r.date.startsWith(month)).reverse();
    const sum = list.reduce((a, r) => { const t = totals(r); a.sales += t.sales; a.exp += t.expenses; a.credit += t.credit; a.net += t.net; return a; }, { sales: 0, exp: 0, credit: 0, net: 0 });
    $app.innerHTML = `<div class="card">
      <div class="row"><h2 style="margin:0;flex:1">Historiku i raporteve</h2>
        <div class="field"><label>Muaji</label><input type="month" id="h-month" value="${month}"></div>
        <button class="btn" data-act="h-all">Të gjitha</button>
        <button class="btn" data-act="h-csv">⬇ Excel (CSV)</button></div>
      <div class="scroll" style="margin-top:10px"><table>
        <thead><tr><th>Data</th><th>Turni</th><th>Punonjësi</th><th class="num">Litra</th><th class="num">Shitje</th><th class="num">Shpenzime</th><th class="num">Klientë</th><th class="num">Për dorëzim</th><th></th></tr></thead>
        <tbody>${list.map((r) => { const t = totals(r); const l = round2(r.rows.reduce((s, x) => s + (rowCalc(x).liters || 0), 0));
          return `<tr><td>${r.date}</td><td>${esc(shiftName(r.shift))}</td><td>${esc(r.employee)}</td>
          <td class="num">${fmt(l)}</td><td class="num">${fmt(t.sales)}</td><td class="num">${fmt(t.expenses)}</td><td class="num">${fmt(t.credit)}</td><td class="num ${t.net < 0 ? 'neg' : ''}">${fmt(t.net)}</td>
          <td><button class="btn small" data-act="open" data-id="${r.id}">Hap</button> <button class="btn small danger" data-act="h-del" data-id="${r.id}">Fshi</button></td></tr>`; }).join('')
          || '<tr><td colspan="9" class="muted">Nuk ka raporte për këtë periudhë.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="4">Totali (${list.length} turne)</td><td class="num">${fmt(sum.sales)}</td><td class="num">${fmt(sum.exp)}</td><td class="num">${fmt(sum.credit)}</td><td class="num">${fmt(sum.net)}</td><td></td></tr></tfoot>
      </table></div></div>`;
    renderHistory.list = list;
  }

  function renderStock() {
    const st = stock();
    const deliveries = [...S.deliveries].sort((a, b) => b.date.localeCompare(a.date));
    $app.innerHTML = `<div class="grid2">
      <div class="card"><h2>Gjendja në kohë reale</h2>
        <div class="scroll"><table>
          <thead><tr><th>Produkti</th><th class="num">Gjendja fillestare</th><th class="num">+ Furnizime</th><th class="num">− Shitje</th><th class="num">Gjendja tani</th></tr></thead>
          <tbody>${st.map((s) => `<tr><td>${esc(s.p.name)}</td>
            <td><input class="num" data-stockstart="${s.p.id}" inputmode="decimal" value="${inVal(s.p.stockStart)}"></td>
            <td class="num">${fmt(s.delivered)}</td><td class="num">${fmt(s.out)}</td>
            <td class="num ${s.now < 0 ? 'neg' : ''}"><b>${fmt(s.now)}</b> ${esc(s.p.unit)}</td></tr>`).join('')}</tbody>
        </table></div>
        <p class="note">Gjendja tani = gjendja fillestare + furnizimet − litrat e shitura në të gjitha raportet e ruajtura. Pas matjes së depozitës, korrigjoni me një rresht "Rregullim" (sasi negative ose pozitive).</p>
      </div>
      <div class="card"><h2>Furnizime (hyrje malli)</h2>
        <div class="row">
          <div class="field"><label>Data</label><input type="date" id="d-date" value="${localDate()}"></div>
          <div class="field"><label>Produkti</label><select id="d-prod">${S.products.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Sasia</label><input type="text" id="d-qty" inputmode="decimal" style="width:100px"></div>
          <div class="field" style="flex:1;min-width:120px"><label>Shënim (fatura, furnitori, rregullim)</label><input type="text" id="d-note"></div>
          <button class="btn primary" data-act="d-add">+ Shto</button>
        </div>
        <div class="scroll" style="margin-top:10px"><table>
          <thead><tr><th>Data</th><th>Produkti</th><th class="num">Sasia</th><th>Shënim</th><th></th></tr></thead>
          <tbody>${deliveries.map((x) => `<tr><td>${x.date}</td><td>${esc(product(x.productId)?.name || '?')}</td><td class="num ${x.qty < 0 ? 'neg' : ''}">${fmt(x.qty)}</td><td>${esc(x.note)}</td>
            <td><button class="x" data-act="d-del" data-id="${x.id}">✕</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Ende pa furnizime.</td></tr>'}</tbody>
        </table></div>
      </div></div>`;
  }

  function renderSummary() {
    const month = renderSummary.month ||= localDate().slice(0, 7);
    const reps = S.reports.filter((r) => r.date.startsWith(month));
    const sold = soldByProduct(reps);
    const days = {};
    for (const r of reps) { const t = totals(r); const o = (days[r.date] ||= { sales: 0, exp: 0, net: 0, n: 0 }); o.sales += t.sales; o.exp += t.expenses + t.credit; o.net += t.net; o.n++; }
    const sum = reps.reduce((a, r) => { const t = totals(r); a.sales += t.sales; a.exp += t.expenses; a.credit += t.credit; a.net += t.net; return a; }, { sales: 0, exp: 0, credit: 0, net: 0 });
    const expByDesc = {};
    for (const r of reps) for (const x of r.expenses) { const k = (x.desc || '—').trim() + (x.kind === 'client' ? ' (klient)' : ''); expByDesc[k] = round2((expByDesc[k] || 0) + (x.value || 0)); }
    $app.innerHTML = `<div class="card"><div class="row"><h2 style="margin:0;flex:1">Përmbledhje mujore</h2>
      <div class="field"><label>Muaji</label><input type="month" id="m-month" value="${month}"></div>
      ${inViewer ? '' : '<button class="btn" data-act="print">🖨 Printo</button>'}</div>
      <div class="totals" style="margin-top:12px">
        <div class="stat"><div class="k">Shitje</div><div class="v">${fmt(sum.sales)}</div></div>
        <div class="stat"><div class="k">Shpenzime</div><div class="v">${fmt(sum.exp)}</div></div>
        <div class="stat"><div class="k">Klientë në borxh</div><div class="v">${fmt(sum.credit)}</div></div>
        <div class="stat hl"><div class="k">Neto</div><div class="v">${fmt(sum.net)}</div></div>
        <div class="stat"><div class="k">Turne</div><div class="v">${reps.length}</div></div>
      </div></div>
    <div class="grid2">
      <div class="card"><h2>Sipas produktit</h2><div class="scroll"><table>
        <thead><tr><th>Produkti</th><th class="num">Sasia</th><th class="num">Vlera</th></tr></thead>
        <tbody>${S.products.filter((p) => sold[p.id]).map((p) => `<tr><td>${esc(p.name)}</td><td class="num">${fmt(sold[p.id].qty)} ${esc(p.unit)}</td><td class="num">${fmt(sold[p.id].value)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Pa të dhëna.</td></tr>'}</tbody>
      </table></div>
      <h3>Shpenzimet dhe klientët sipas emrit</h3><div class="scroll"><table>
        <thead><tr><th>Përshkrimi</th><th class="num">Vlera</th></tr></thead>
        <tbody>${Object.entries(expByDesc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${fmt(v)}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">Pa shpenzime.</td></tr>'}</tbody>
      </table></div></div>
      <div class="card"><h2>Sipas ditës</h2><div class="scroll"><table>
        <thead><tr><th>Data</th><th class="num">Turne</th><th class="num">Shitje</th><th class="num">Shpenzime + klientë</th><th class="num">Neto</th></tr></thead>
        <tbody>${Object.entries(days).sort().map(([d, o]) => `<tr><td>${d}</td><td class="num">${o.n}</td><td class="num">${fmt(o.sales)}</td><td class="num">${fmt(o.exp)}</td><td class="num">${fmt(o.net)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Pa të dhëna.</td></tr>'}</tbody>
      </table></div></div></div>`;
  }

  function renderSettings() {
    const used = (id) => S.pumps.some((p) => p.productId === id);
    const hist = [...S.priceHistory].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100);
    $app.innerHTML = `
    <div class="card"><h2>Pika</h2>
      <div class="row">
        <div class="field" style="flex:1;min-width:180px"><label>Emri i pikës</label><input type="text" id="st-name" value="${esc(S.name)}"></div>
        <div class="field"><label>Grupi</label><select id="st-group">${DB.groups.map((g) => `<option value="${g.id}" ${g.id === S.groupId ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
        <button class="btn danger" data-act="st-del">Fshi pikën</button>
      </div>
    </div>
    <div class="card"><h2>Produktet dhe çmimet</h2>
      <div class="scroll"><table>
        <thead><tr><th>Emërtimi</th><th class="num">Çmimi aktual</th><th>Njësia</th><th>Me pistoletë</th><th></th></tr></thead>
        <tbody>${S.products.map((p) => `<tr data-pid="${p.id}">
          <td><input data-pf="name" value="${esc(p.name)}"></td>
          <td><input class="num" data-pf="price" inputmode="decimal" value="${inVal(p.price)}"></td>
          <td><input data-pf="unit" value="${esc(p.unit)}" style="width:70px"></td>
          <td><input type="checkbox" data-pf="metered" ${p.metered ? 'checked' : ''}></td>
          <td><button class="btn small danger" data-act="p-del" data-id="${p.id}" ${used(p.id) ? 'disabled title="Ka pistoleta me këtë produkt"' : ''}>Fshi</button></td></tr>`).join('')}</tbody>
      </table></div>
      <button class="btn small" data-act="p-add" style="margin-top:6px">+ Shto produkt</button>
      <p class="note">Ndryshimi i çmimit vlen për raportet e reja. Raportet e ruajtura e mbajnë çmimin me të cilin u shitën. Për t'ia vendosur çmimin e ri raportit që keni hapur, shtypni "Çmimet aktuale" te Raporti.</p>
      <h3>Historiku i çmimeve</h3>
      <div class="scroll"><table>
        <thead><tr><th>Data</th><th>Produkti</th><th class="num">Çmimi i vjetër</th><th class="num">Çmimi i ri</th><th></th></tr></thead>
        <tbody>${hist.map((h) => `<tr><td>${h.at.slice(0, 16).replace('T', ' ')}</td><td>${esc(product(h.productId)?.name || h.name || '?')}</td><td class="num">${fmt(h.old)}</td><td class="num">${fmt(h.price)}</td>
          <td><button class="x" data-act="ph-del" data-id="${h.id}" title="Fshi nga historiku">✕</button></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Ende pa ndryshime çmimi.</td></tr>'}</tbody>
      </table></div>
    </div>

    <div class="card"><h2>Pistoletat</h2>
      <div class="scroll"><table>
        <thead><tr><th>#</th><th>Emri</th><th>Produkti</th><th class="num">Çmim i veçantë</th><th></th></tr></thead>
        <tbody>${S.pumps.map((pm, i) => `<tr data-pmid="${pm.id}"><td>${i + 1}</td>
          <td><input data-mf="name" value="${esc(pm.name)}"></td>
          <td><select data-mf="productId">${S.products.filter((p) => p.metered).map((p) => `<option value="${p.id}" ${p.id === pm.productId ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></td>
          <td><input class="num" data-mf="price" inputmode="decimal" value="${inVal(pm.price)}" placeholder="si produkti"></td>
          <td><button class="x" data-act="pm-up" data-i="${i}" title="Lart">▲</button><button class="x" data-act="pm-down" data-i="${i}" title="Poshtë">▼</button>
            <button class="btn small danger" data-act="pm-del" data-id="${pm.id}">Fshi</button></td></tr>`).join('')}</tbody>
      </table></div>
      <button class="btn small" data-act="pm-add" style="margin-top:6px">+ Shto pistoletë</button>
      <p class="note">"Çmim i veçantë" përdoret kur një pistoletë shet me çmim tjetër nga produkti (p.sh. Gaz 64 në vend të 66). Lëreni bosh që të marrë çmimin e produktit.</p>
    </div>

    <div class="card"><h2>Turnet</h2>
      <table style="max-width:500px"><tbody>${S.shifts.map((s) => `<tr data-sid="${s.id}"><td><input data-sf="name" value="${esc(s.name)}"></td>
        <td style="width:1%"><button class="btn small danger" data-act="s-del" data-id="${s.id}">Fshi</button></td></tr>`).join('')}</tbody></table>
      <button class="btn small" data-act="s-add" style="margin-top:6px">+ Shto turn</button>
    </div>`;
  }

  // ---------- events ----------
  $nav.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-go]'); if (!b || b.dataset.go === tab) return;
    go(b.dataset.go, b.dataset.id);
  });

  $app.addEventListener('input', (e) => {
    const el = e.target;
    if (tab !== 'raporti') return;
    const tr = el.closest('tr[data-i]');
    if (el.id === 'r-emp') draft.employee = el.value;
    else if (el.id === 'r-note') draft.note = el.value;
    else if (tr && el.dataset.f) {
      const tbl = el.closest('table').id; const i = +tr.dataset.i; const f = el.dataset.f;
      const target = tbl === 't-rows' ? draft.rows[i] : tbl === 't-extras' ? draft.extras[i] : draft.expenses[i];
      if (f === 'name' || f === 'desc') target[f] = el.value;
      else if (f !== 'productId' && f !== 'kind') target[f] = num(el.value);
      if (tbl === 't-exp' && f === 'desc') autoClient(target, tr);
      if (tbl === 't-extras' && f === 'value') { target.qty = null; tr.querySelector('[data-f=qty]').value = ''; }
    } else return;
    dirty = true; recalc();
  });

  $app.addEventListener('change', async (e) => {
    const el = e.target;
    if (el.id === 'restore') return restore(el.files[0]);
    if (tab === 'litrat') return litersChange(el);
    if (tab === 'klientet' && el.id === 'c-month') { renderCustomers.month = el.value; return renderCustomers(); }
    if (tab === 'klient') return customerChange(el);
    if (tab === 'raporti' && el.dataset.f === 'kind') {
      const tr = el.closest('tr'); const x = draft.expenses[+tr.dataset.i];
      x.kind = el.value; x.auto = false; tr.classList.toggle('is-client', x.kind === 'client');
      dirty = true; return recalc();
    }
    if (tab === 'raporti') {
      if (el.id === 'photo') { const f = el.files[0]; el.value = ''; return readPhoto(f); }
      if (el.id === 'r-date' || el.id === 'r-shift') {
        const date = document.getElementById('r-date').value; const shift = document.getElementById('r-shift').value;
        if (dirty && !(await ask('Raporti ka ndryshime të paruajtura. Të vazhdoj pa ruajtur?'))) { el.value = el.id === 'r-date' ? draft.date : draft.shift; return; }
        if (date) { openDraft(date, shift); renderReport(); }
      } else if (el.dataset.f === 'productId') {
        const x = draft.extras[+el.closest('tr').dataset.i]; const p = product(el.value);
        x.productId = el.value || null;
        if (p) { x.name = p.name; x.price = p.price || null; }
        dirty = true; renderReport();
      }
      return;
    }
    if (tab === 'historiku' && el.id === 'h-month') { renderHistory.month = el.value; renderHistory(); return; }
    if (tab === 'permbledhje' && el.id === 'm-month') { renderSummary.month = el.value; renderSummary(); return; }
    if (tab === 'gjendja' && el.dataset.stockstart) { product(el.dataset.stockstart).stockStart = num(el.value) || 0; save(); renderStock(); return; }
    if (tab !== 'cilesimet') return;
    if (el.id === 'st-name') { if (el.value.trim()) S.name = el.value.trim(); save(); renderNav(); return toast('U ruajt'); }
    if (el.id === 'st-group') { S.groupId = el.value; save(); renderNav(); return toast('U ruajt'); }
    const ptr = el.closest('tr[data-pid]');
    if (ptr && el.dataset.pf) {
      const p = product(ptr.dataset.pid); const f = el.dataset.pf;
      if (f === 'price') {
        const v = num(el.value);
        if (v !== p.price) S.priceHistory.push({ id: uid(), productId: p.id, name: p.name, old: p.price, price: v, at: new Date().toISOString() });
        p.price = v;
      } else if (f === 'metered') p.metered = el.checked;
      else p[f] = el.value.trim();
      save(); toast('U ruajt'); renderSettings(); return;
    }
    const mtr = el.closest('tr[data-pmid]');
    if (mtr && el.dataset.mf) {
      const pm = S.pumps.find((x) => x.id === mtr.dataset.pmid); const f = el.dataset.mf;
      pm[f] = f === 'price' ? num(el.value) : el.value;
      save(); toast('U ruajt'); return;
    }
    const str = el.closest('tr[data-sid]');
    if (str) { S.shifts.find((s) => s.id === str.dataset.sid).name = el.value; save(); toast('U ruajt'); }
  });

  $app.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act; const id = b.dataset.id; const i = +b.dataset.i;
    switch (act) {
      // report
      case 'save': return saveDraft();
      case 'print': return window.print();
      case 'csv': return download(`raporti-${draft.date}-${draft.shift}.csv`, reportCsv(draft), 'text/csv');
      case 'prices':
        draft.rows.forEach((r) => { const pm = S.pumps.find((x) => x.id === r.pumpId); r.price = pm ? pumpPrice(pm) : product(r.productId)?.price ?? r.price; });
        draft.extras.forEach((x) => { const p = product(x.productId); if (p && p.price) x.price = p.price; });
        dirty = true; toast('U vendosën çmimet aktuale'); return renderReport();
      case 'delete':
        if (!(await ask('Ta fshij këtë raport?'))) return;
        S.reports = S.reports.filter((r) => r.id !== draft.id); save(); openDraft(draft.date, draft.shift); toast('Raporti u fshi'); return renderReport();
      case 'add-pump': return addPumpDialog();
      case 'add-extra': draft.extras.push({ id: uid(), productId: null, name: '', qty: null, price: null, value: null }); dirty = true; return renderReport();
      case 'del-extra': draft.extras.splice(i, 1); dirty = true; return renderReport();
      case 'add-exp': draft.expenses.push({ desc: '', value: null, kind: 'exp' }); dirty = true; renderReport();
        { const ins = document.querySelectorAll('#t-exp tbody input[data-f=desc]'); ins[ins.length - 1]?.focus(); } return;
      case 'del-exp': draft.expenses.splice(i, 1); dirty = true; return renderReport();
      // history
      case 'open': { const r = S.reports.find((x) => x.id === id); draft = structuredClone(r); dirty = false; tab = 'raporti'; return render(); }
      case 'open-st': return go('station', id);
      case 'l-csv': return download(`litrat-${renderLiters.o.mode === 'dite' ? renderLiters.o.date : renderLiters.o.month}.csv`, csv(renderLiters.csv), 'text/csv');
      case 'g-add': case 'g-ren': case 'g-del': case 'st-add': case 'st-del':
      case 'c-add': case 'c-open': case 'c-pay': case 'c-pay-del': case 'c-del': case 'c-csv': case 'c-report':
        return homeAction(act, b);
      case 'h-del': if (await ask('Ta fshij këtë raport?')) { S.reports = S.reports.filter((r) => r.id !== id); save(); renderHistory(); } return;
      case 'h-all': renderHistory.month = ''; return renderHistory();
      case 'h-csv': return download(`raportet-${renderHistory.month || 'te-gjitha'}.csv`, csv([
        ['Pika', 'Data', 'Turni', 'Punonjësi', 'Shitje karburant', 'Shitje të tjera', 'Totali shitjeve', 'Shpenzime', 'Klientë', 'Për dorëzim'],
        ...renderHistory.list.slice().reverse().map((r) => { const t = totals(r); return [S.name, r.date, shiftName(r.shift), r.employee, t.fuel, t.extras, t.sales, t.expenses, t.credit, t.net]; }),
      ]), 'text/csv');
      // stock
      case 'd-add': {
        const qty = num(document.getElementById('d-qty').value);
        if (qty == null || qty === 0) return toast('Shkruani sasinë');
        S.deliveries.push({ id: uid(), date: document.getElementById('d-date').value || localDate(), productId: document.getElementById('d-prod').value, qty, note: document.getElementById('d-note').value.trim() });
        save(); toast('Furnizimi u shtua'); return renderStock();
      }
      case 'd-del': if (await ask('Ta fshij këtë furnizim?')) { S.deliveries = S.deliveries.filter((d) => d.id !== id); save(); renderStock(); } return;
      // settings
      case 'p-add': S.products.push({ id: uid(), name: 'Produkt i ri', price: null, unit: 'L', metered: true, stockStart: 0 }); save(); return renderSettings();
      case 'p-del': if (await ask('Ta fshij produktin? Raportet e vjetra nuk ndryshojnë.')) { S.products = S.products.filter((p) => p.id !== id); save(); renderSettings(); } return;
      case 'ph-del': S.priceHistory = S.priceHistory.filter((h) => h.id !== id); save(); return renderSettings();
      case 'pm-add': { const p = S.products.find((x) => x.metered); if (!p) return toast('Shtoni fillimisht një produkt me pistoletë');
        S.pumps.push({ id: uid(), name: p.name + ' – ' + (S.pumps.filter((x) => x.productId === p.id).length + 1), productId: p.id, price: null }); save(); return renderSettings(); }
      case 'pm-del': if (await ask('Ta fshij pistoletën? Raportet e vjetra nuk ndryshojnë.')) { S.pumps = S.pumps.filter((p) => p.id !== id); save(); renderSettings(); } return;
      case 'pm-up': case 'pm-down': {
        const j = act === 'pm-up' ? i - 1 : i + 1; if (j < 0 || j >= S.pumps.length) return;
        [S.pumps[i], S.pumps[j]] = [S.pumps[j], S.pumps[i]]; save(); return renderSettings();
      }
      case 's-add': S.shifts.push({ id: uid(), name: 'Turni ' + (S.shifts.length + 1) }); save(); return renderSettings();
      case 's-del':
        if (S.shifts.length < 2) return toast('Duhet të paktën një turn');
        if (S.reports.some((r) => r.shift === id)) return toast('Ky turn ka raporte të ruajtura');
        S.shifts = S.shifts.filter((s) => s.id !== id); save(); return renderSettings();
      case 'backup': return download(`karburant-kopje-${localDate()}.json`, JSON.stringify(DB, null, 1), 'application/json');
      case 'demo-reset':
        if (!(await ask('Të rifilloj demon me të dhënat shembull? Ndryshimet tuaja në demo fshihen.'))) return;
        DB = demoDB(); S = null; save(); draft = null; dirty = false; return go('pikat');
      case 'reset':
        if (!(await ask('Do të fshihen TË GJITHA pikat, raportet, klientët dhe furnizimet. Keni bërë kopje rezervë? Shkruani FSHI për të konfirmuar.', { ok: 'Fshi të gjitha', danger: true, typed: 'FSHI' }))) return;
        DB = DEMO ? demoDB() : emptyDB(); S = null; save(); draft = null; return go('pikat');
    }
  });

  function restore(file) {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = async () => {
      try {
        const data = upgrade(JSON.parse(fr.result));
        if (!data) throw new Error('Skedari nuk është kopje e këtij programi');
        const n = data.stations.reduce((a, st) => a + st.reports.length, 0);
        if (!(await ask(`Kopja ka ${data.stations.length} pika dhe ${n} raporte. Të zëvendësoj të dhënat aktuale?`))) return;
        DB = data; S = null; save(); draft = null; dirty = false; toast('Të dhënat u ngarkuan'); go('pikat');
      } catch (err) { ask('Ngarkimi dështoi: ' + err.message, { ok: 'Mirë', cancel: null }); }
    };
    fr.readAsText(file);
  }

  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ---------- demo banner ----------
  function demoBanner() {
    if (!DEMO) return '';
    return `<div class="demo no-print"><b>Demo.</b> Të dhënat janë shembull dhe ruhen vetëm në këtë shfletues. Provoni çdo gjë lirisht.
      <button class="btn small" data-act="demo-reset">Rifillo demon</button></div>`;
  }

  // ---------- new pumps and products ----------
  const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9ë ç]/g, '').replace(/\s+/g, '');
  function findProduct(name) {
    const n = norm(name);
    return n ? S.products.find((p) => norm(p.name) === n) : null;
  }
  function ensureProduct(name, price, metered) {
    let p = findProduct(name);
    if (!p) {
      p = { id: uid(), name: String(name).trim(), price: price ?? null, unit: metered ? 'L' : 'copë', metered, stockStart: 0 };
      S.products.push(p);
    }
    return p;
  }
  // Adds a pump to the settings and a matching row to the open report.
  function addPump(name, prod, start = null) {
    const pm = { id: uid(), name: name || `${prod.name} – ${S.pumps.filter((x) => x.productId === prod.id).length + 1}`, productId: prod.id, price: null };
    S.pumps.push(pm);
    draft.rows.push({ pumpId: pm.id, name: pm.name, productId: prod.id, start: start ?? previousEnd(pm.id, draft.date, draft.shift), end: null, price: pumpPrice(pm) });
    return draft.rows.length - 1;
  }
  async function addPumpDialog() {
    const opts = S.products.map((p) => `<option value="${p.id}">${esc(p.name)}${p.metered ? '' : ' (pa pistoletë)'}</option>`).join('');
    const html = `<div class="form">
      <label>Produkti<select id="np-prod">${opts}<option value="new">+ Produkt i ri…</option></select></label>
      <div id="np-new" hidden class="form">
        <label>Emri i produktit<input type="text" id="np-pname" placeholder="p.sh. Benzine 98"></label>
        <label>Çmimi<input type="text" id="np-price" inputmode="decimal" placeholder="p.sh. 190"></label>
        <label class="check"><input type="checkbox" id="np-metered" checked> Ka pistoletë me numrator (litra)</label>
      </div>
      <label>Emri i pistoletës (bosh = vendoset vetë)<input type="text" id="np-name" placeholder="p.sh. Benzine – 3"></label>
    </div>`;
    const vals = {};
    const p = ask('Shto pistoletë ose artikull të ri', { ok: 'Shto', html });
    const sel = document.getElementById('np-prod');
    const sync = () => {
      document.getElementById('np-new').hidden = sel.value !== 'new';
      Object.assign(vals, { prod: sel.value, pname: document.getElementById('np-pname').value, price: document.getElementById('np-price').value,
        metered: document.getElementById('np-metered').checked, name: document.getElementById('np-name').value });
    };
    document.querySelector('.dialog').addEventListener('input', sync);
    document.querySelector('.dialog').addEventListener('change', sync);
    sync();
    if (!(await p)) return;
    let prod;
    if (vals.prod === 'new') {
      if (!vals.pname.trim()) return toast('Shkruani emrin e produktit');
      prod = ensureProduct(vals.pname, num(vals.price), vals.metered);
    } else prod = product(vals.prod);
    if (prod.metered) addPump(vals.name.trim(), prod);
    else draft.extras.push({ id: uid(), productId: prod.id, name: prod.name, qty: null, price: prod.price || null, value: null });
    save(); dirty = true; renderReport();
    toast(prod.metered ? 'Pistoleta u shtua. Ruhet edhe te Cilësimet.' : 'Artikulli u shtua te Shitje të tjera');
  }

  // ---------- reading a report from a photo ----------
  // Two ways to reach Claude: inside the claude.ai viewer the `sample` capability (the viewer's
  // own account); on the website the /api/lexo-foto edge function (the station's API key).
  async function photoReader() {
    const sample = await cap('sample');
    const lim = sample ? await sample.limits().catch(() => null) : null;
    if (lim?.images) return { kind: 'sample', sample };
    if (inViewer || DEMO || location.protocol === 'file:') return null;
    try {
      const r = await fetch('/api/lexo-foto', { cache: 'no-store' });
      const j = r.ok ? await r.json() : null;
      if (j?.configured) return { kind: 'server', pin: j.pin };
    } catch (e) { /* not deployed */ }
    return null;
  }

  function photoPrompt() {
    const pumps = draft.rows.map((r, i) => `${i}: ${r.name} (produkti: ${product(r.productId)?.name || '?'})`).join('\n');
    const others = S.products.filter((p) => !p.metered).map((p) => p.name).join(', ') || 'asnjë';
    return `Fotoja tregon një raport ditor shitjesh nga një pikë karburanti në Shqipëri. Mund të jetë ekran Excel-i (ndoshta i fotografuar në pjerrësi), fletë e shkruar me dorë, ose numratorët (totalizatorët) e pompave.

Lexo numrat me shumë kujdes, shifër për shifër. Zakonisht presja ndan mijëshet dhe pika dhjetoret (34,888.10 = 34888.1); në shkrim dore mund të jetë e kundërta, gjyko nga konteksti.

Kolonat e zakonshme: "Emertimi" (pistoleta/produkti), "FILLIMI" ose "Ora 06.00" (leximi në fillim = start), "FUNDI" ose "Ora 14.00" (leximi në fund = end), "LITRA", "ÇMIMI" (price), "VLERA". Në të djathtë shpesh ka "Shpenzime Ditore" me përshkrim dhe vlerë.

Pistoletat në sistem, me radhë (index: emri):
${pumps}

Lidh çdo rresht të fotos me pistoletën e duhur: i njëjti produkt, sipas radhës (D2 e parë në foto → pistoleta e parë D2, e dyta → e dyta, etj.). Mos e përdor dy herë të njëjtin index.
Nëse në foto ka një rresht me numra që nuk ka pistoletë përkatëse në listë (p.sh. një pistoletë e tretë Benzine), vendos "index": null dhe shkruaj produktin te "product". Rreshtat pa asnjë numër mos i përfshi.
Produkte pa pistoletë (shitje të tjera): ${others}. Shitje të tjera me emër të ri përfshiji gjithashtu.

Përgjigju VETËM me një objekt JSON në këtë formë:
{"date": "YYYY-MM-DD" ose null, "employee": "emri" ose null,
 "rows": [{"index": 0, "product": "Benz100", "label": "si shkruhet në foto", "start": 34800.4, "end": 34888.1, "price": 215}],
 "extras": [{"name": "Adblu", "qty": 1, "price": 600, "value": 600}],
 "expenses": [{"desc": "BANKE", "value": 11700}],
 "unclear": "shkurt, në shqip: çfarë nuk lexohej qartë, ose bosh"}
Çdo numër që nuk lexohet me siguri vendose null. Mos llogarit litra apo vlera vetë.`;
  }

  // Phone photos are large; a 2000px JPEG keeps the request small and the digits readable.
  async function shrink(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.88));
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function parseJsonLoose(text) {
    const a = text.indexOf('{'); const b = text.lastIndexOf('}');
    if (a < 0 || b < a) throw { code: 'invalid_json' };
    try { return JSON.parse(text.slice(a, b + 1)); } catch (e) { throw { code: 'invalid_json' }; }
  }
  const PIN_KEY = 'erso-karburant-pin';
  async function getPin() {
    let pin = '';
    try { pin = localStorage.getItem(PIN_KEY) || ''; } catch (e) { /* private window */ }
    return pin || (await ask('Shkruani kodin (PIN) për leximin e fotove.', { ok: 'Vazhdo', input: 'PIN' })) || null;
  }
  async function askServer(pin, file, signal) {
    const image = await shrink(file);
    const r = await fetch('/api/lexo-foto', { method: 'POST', signal, headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pin, image, mediaType: 'image/jpeg', prompt: photoPrompt() }) });
    const j = await r.json().catch(() => ({ error: 'upstream_error' }));
    if (j.error === 'bad_pin') { try { localStorage.removeItem(PIN_KEY); } catch (e) { /* ignore */ } throw { code: 'bad_pin' }; }
    if (j.error) throw { code: j.error };
    if (pin) { try { localStorage.setItem(PIN_KEY, pin); } catch (e) { /* ignore */ } }
    return parseJsonLoose(j.text || '');
  }

  async function readPhoto(file) {
    if (!file) return;
    const reader = await photoReader();
    if (!reader) {
      const msg = inViewer || DEMO
        ? 'Leximi i fotos punon kur demoja hapet brenda claude.ai me llogarinë tuaj. Hyni në claude.ai në këtë shfletues dhe hapeni lidhjen përsëri.'
        : 'Leximi i fotos nuk është aktivizuar ende në këtë faqe. Duhet vendosur çelësi i Anthropic te Netlify (shih udhëzimet te NETLIFY.md, seksioni 6). Deri atëherë numrat shkruhen me dorë.';
      return ask(msg, { ok: 'Mirë', cancel: null });
    }
    const pin = reader.kind === 'server' && reader.pin ? await getPin() : '';
    if (pin === null) return;
    const ctl = new AbortController();
    const wait = ask('Po lexoj foton… Zakonisht zgjat 20–60 sekonda.', { ok: null, cancel: 'Ndalo', html: '<div class="spinner"></div>' });
    const closeWait = ask.close;
    let stopped = false;
    wait.then(() => { stopped = true; ctl.abort(); });
    let data;
    try {
      data = reader.kind === 'sample'
        ? await reader.sample.json(photoPrompt(), { images: [file], signal: ctl.signal, modelTier: 'default' })
        : await askServer(pin, file, ctl.signal);
    } catch (e) {
      if (!stopped) closeWait();
      if (e?.code === 'cancelled' || e?.name === 'AbortError') return;
      const why = {
        not_granted: 'Nuk u dha leje për leximin e fotos. Hapeni faqen përsëri dhe zgjidhni "Lejo".',
        sampling_disabled: 'Leximi i fotos nuk është i disponueshëm për këtë llogari.',
        rate_limited: 'Shumë kërkesa njëherësh. Provoni pas pak minutash.',
        image_rejected: 'Fotoja nuk u pranua. Provoni një foto JPG ose PNG.',
        invalid_json: 'Fotoja nuk u lexua dot. Provoni një foto më të qartë, më afër dhe pa reflekse.',
        refused: 'Fotoja nuk u lexua dot.',
        bad_pin: 'Kodi (PIN) është i gabuar. Provoni përsëri.',
        not_configured: 'Leximi i fotos nuk është aktivizuar ende në këtë faqe.',
        too_large: 'Fotoja është shumë e madhe.',
      }[e?.code] || 'Leximi dështoi. Kontrolloni internetin dhe provoni përsëri.';
      return ask(why, { ok: 'Mirë', cancel: null });
    }
    if (!stopped) closeWait();
    showPhotoResult(data || {});
  }

  function showPhotoResult(data) {
    const n = (v) => (typeof v === 'number' ? v : num(v));
    const used = new Set();
    const all = (Array.isArray(data.rows) ? data.rows : []).map((r) => ({
      index: Number.isInteger(r.index) && r.index >= 0 && r.index < draft.rows.length ? r.index : null,
      product: String(r.product || r.label || '').trim(), label: String(r.label || '').trim(),
      start: n(r.start), end: n(r.end), price: n(r.price),
    })).filter((r) => r.start != null || r.end != null);
    for (const r of all) { if (r.index != null && used.has(r.index)) r.index = null; if (r.index != null) used.add(r.index); }
    const rows = all.filter((r) => r.index != null);
    const fresh = all.filter((r) => r.index == null && r.product);
    const extras = (Array.isArray(data.extras) ? data.extras : []).map((x) => ({ name: String(x.name || '').trim(), qty: n(x.qty), price: n(x.price), value: n(x.value) }))
      .filter((x) => x.name && (x.qty != null || x.value != null));
    const expenses = (Array.isArray(data.expenses) ? data.expenses : []).map((x) => ({ desc: String(x.desc || ''), value: n(x.value) })).filter((x) => x.desc || x.value != null);
    if (!rows.length && !fresh.length && !extras.length && !expenses.length) return ask('Në foto nuk u gjetën numra që mund të lexohen. Provoni një foto më të qartë.', { ok: 'Mirë', cancel: null });

    const liters = (r) => (r.start != null && r.end != null ? round2(r.end - r.start) : null);
    const line = (name, r, badge) => { const l = liters(r);
      return `<tr><td>${esc(name)}${badge}</td><td class="muted">${esc(r.label)}</td><td class="num">${fmt(r.start)}</td><td class="num">${fmt(r.end)}</td>
        <td class="num ${l < 0 ? 'neg' : ''}">${fmt(l)}</td><td class="num">${fmt(r.price, 0)}</td></tr>`; };
    const newExtras = extras.filter((x) => !findProduct(x.name));
    const table = `<div class="scroll"><table>
      <thead><tr><th>Pistoleta</th><th>Në foto</th><th class="num">Fillimi</th><th class="num">Fundi</th><th class="num">Litra</th><th class="num">Çmimi</th></tr></thead>
      <tbody>${rows.map((r) => line(draft.rows[r.index].name, r, '')).join('')}
        ${fresh.map((r) => line(r.product, r, ' <span class="badge new">E re</span>')).join('')}</tbody></table></div>
      ${fresh.length ? `<p class="note">"E re": pistoleta që nuk ekziston ende në sistem. Do të shtohet vetë${fresh.some((r) => !findProduct(r.product)) ? ', bashkë me produktin e ri' : ''}.</p>` : ''}
      ${extras.length ? `<h3>Shitje të tjera</h3><table><tbody>${extras.map((x) => `<tr><td>${esc(x.name)}${findProduct(x.name) ? '' : ' <span class="badge new">E re</span>'}</td><td class="num">${fmt(x.qty, 0)}</td><td class="num">${fmt(x.price)}</td><td class="num">${fmt(x.value ?? (x.qty != null && x.price != null ? x.qty * x.price : null))}</td></tr>`).join('')}</tbody></table>` : ''}
      ${expenses.length ? `<h3>Shpenzime</h3><table><tbody>${expenses.map((x) => `<tr><td>${esc(x.desc)}</td><td class="num">${fmt(x.value)}</td></tr>`).join('')}</tbody></table>` : ''}
      ${data.unclear ? `<div class="warnbox">${esc(data.unclear)}</div>` : ''}
      ${all.some((r) => r.start != null && r.end != null && r.end < r.start) ? '<div class="warnbox">Disa rreshta kanë "Fundi" më të vogël se "Fillimi". Kontrollojini pasi t\'i vendosni.</div>' : ''}
      <label class="check"><input type="checkbox" id="ph-start" checked> Vendos edhe "Fillimin" nga fotoja (përndryshe mbetet nga turni i mëparshëm)</label>
      <label class="check"><input type="checkbox" id="ph-price" checked> Vendos edhe çmimet nga fotoja</label>`;
    const parts = [`${rows.length + fresh.length} pistoleta`];
    if (fresh.length + newExtras.length) parts.push(`${fresh.length + newExtras.length} artikuj të rinj`);
    if (expenses.length) parts.push(`${expenses.length} shpenzime`);
    const msg = `U lexuan ${parts.join(', ')}. Kontrolloni numrat me foton para se t'i vendosni.`;
    let useStart = true, usePrice = true;
    const p = ask(msg, { ok: 'Vendos në raport', html: table, wide: true });
    document.getElementById('ph-start')?.addEventListener('change', (e) => { useStart = e.target.checked; });
    document.getElementById('ph-price')?.addEventListener('change', (e) => { usePrice = e.target.checked; });
    p.then((yes) => {
      if (!yes) return;
      const put = (row, r) => {
        if (useStart && r.start != null) row.start = r.start;
        if (r.end != null) row.end = r.end;
        if (usePrice && r.price != null) row.price = r.price;
      };
      for (const r of rows) put(draft.rows[r.index], r);
      for (const r of fresh) {
        const prod = ensureProduct(r.product, r.price, true);
        put(draft.rows[addPump('', prod, r.start)], r);
      }
      for (const x of extras) {
        const prod = ensureProduct(x.name, x.price, false);
        const slot = draft.extras.find((e) => e.productId === prod.id && e.qty == null && e.value == null);
        const val = x.qty != null && x.price != null ? null : x.value;
        if (slot) Object.assign(slot, { qty: x.qty, price: x.price ?? slot.price, value: val });
        else draft.extras.push({ id: uid(), productId: prod.id, name: prod.name, qty: x.qty, price: x.price ?? prod.price, value: val });
      }
      draft.expenses = draft.expenses.filter((x) => x.desc || x.value != null)
        .concat(expenses.map((x) => { const c = findCustomer(x.desc); return c ? { ...x, desc: c.name, kind: 'client', customerId: c.id, auto: true } : { ...x, kind: 'exp' }; }));
      if (!draft.employee && data.employee) draft.employee = String(data.employee);
      save(); dirty = true; renderReport(); toast('Numrat u vendosën. Kontrollojini dhe shtypni "Ruaj raportin".');
    });
  }

  // ---------- home: stations by group ----------
  function stationToday(st) {
    const today = localDate();
    const reps = st.reports.filter((r) => r.date === today);
    const sales = round2(reps.reduce((a, r) => a + totals(r).sales, 0));
    const last = [...st.reports].sort((a, b) => (a.date + a.shift).localeCompare(b.date + b.shift)).pop();
    return { n: reps.length, sales, last };
  }
  function renderHome() {
    const loose = DB.stations.filter((st) => !group(st.groupId));
    const groups = [...DB.groups, ...(loose.length ? [{ id: '', name: 'Pa grup', loose: true }] : [])];
    const tile = (st) => {
      const t = stationToday(st);
      return `<button class="tile" data-act="open-st" data-id="${st.id}">
        <span class="tile-name">${esc(st.name)}</span>
        <span class="tile-k">Sot</span><span class="tile-v">${t.n ? fmt(t.sales) : '—'}</span>
        <span class="tile-meta">${t.n ? `${t.n} ${t.n === 1 ? 'turn i ruajtur' : 'turne të ruajtura'}` : 'Asnjë turn sot'}${t.last ? ` · i fundit ${esc(t.last.date)}` : ''}</span>
      </button>`;
    };
    $app.innerHTML = `${demoBanner()}
      <div class="row" style="margin-bottom:12px"><h2 class="page-title" style="flex:1">Pikat e karburantit</h2>
        <button class="btn" data-act="st-add">+ Shto pikë</button>
        <button class="btn primary" data-act="g-add">+ Shto grup</button></div>
      ${groups.map((g) => {
        const sts = g.loose ? loose : DB.stations.filter((st) => st.groupId === g.id);
        const sum = round2(sts.reduce((a, st) => a + stationToday(st).sales, 0));
        return `<section class="card group">
          <div class="row"><h2 style="margin:0;flex:1">${esc(g.name)} <span class="muted small">${sts.length} pika · sot ${fmt(sum)}</span></h2>
            ${g.loose ? '' : `<button class="btn small" data-act="st-add" data-group="${g.id}">+ Pikë</button>
            <button class="btn small" data-act="g-ren" data-id="${g.id}">Riemërto</button>
            <button class="btn small danger" data-act="g-del" data-id="${g.id}">Fshi</button>`}</div>
          <div class="tiles">${sts.map(tile).join('') || '<p class="muted">Ende pa pika në këtë grup. Shtypni "+ Pikë".</p>'}</div>
        </section>`;
      }).join('') || `<div class="card empty"><h2>Filloni me grupin e parë</h2>
        <p class="muted">Krijoni grupet sipas zonës (p.sh. Durrës, Tiranë, Dibër), pastaj shtoni pikat në secilin grup. Çdo pikë ka raportet, çmimet dhe gjendjen e vet.</p>
        <button class="btn primary" data-act="g-add">+ Shto grup</button></div>`}
      <div class="card"><h2>Ruajtja e të dhënave</h2>
        <p class="note" style="margin-bottom:10px">Të dhënat e të gjitha pikave ruhen në këtë kompjuter, brenda shfletuesit. Bëni kopje rezervë rregullisht (p.sh. çdo javë) dhe ruajeni skedarin në USB ose email. Me "Ngarko kopjen" i hapni të dhënat në një kompjuter tjetër.</p>
        <div class="row">
          <button class="btn primary" data-act="backup">⬇ Shkarko kopjen rezervë</button>
          <label class="btn">⬆ Ngarko kopjen<input type="file" id="restore" accept=".json,application/json" hidden></label>
          <button class="btn danger" data-act="reset">Fshi të gjitha të dhënat</button>
        </div>
      </div>`;
  }

  // New stations copy products, pumps and shifts from a chosen station, without its reports.
  async function addStationDialog(groupId) {
    if (!DB.groups.length) {
      const name = await ask('Krijoni fillimisht një grup (p.sh. Durrës).', { ok: 'Krijo grupin', input: 'Emri i grupit' });
      if (!name) return;
      DB.groups.push({ id: uid(), name }); save();
    }
    const html = `<div class="form">
      <label>Emri i pikës<input type="text" id="ns-name" placeholder="p.sh. Shkozet"></label>
      <label>Grupi<select id="ns-group">${DB.groups.map((g) => `<option value="${g.id}" ${g.id === groupId ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></label>
      <label>Produktet dhe pistoletat<select id="ns-copy"><option value="">Lista standarde (Benz100, Benzine, D1 G, D2, Gaz…)</option>
        ${DB.stations.map((st) => `<option value="${st.id}">Kopjo nga ${esc(st.name)}</option>`).join('')}</select></label>
    </div>`;
    const vals = {};
    const p = ask('Shto pikë të re', { ok: 'Shto', html });
    const dlg = document.querySelector('.dialog');
    const sync = () => Object.assign(vals, { name: dlg.querySelector('#ns-name').value.trim(), group: dlg.querySelector('#ns-group').value, copy: dlg.querySelector('#ns-copy').value });
    dlg.addEventListener('input', sync); dlg.addEventListener('change', sync); sync();
    dlg.querySelector('#ns-name').focus();
    if (!(await p)) return;
    if (!vals.name) return toast('Shkruani emrin e pikës');
    const src = station(vals.copy);
    const base = defaults();
    if (src) {
      // Fresh ids keep the two stations independent.
      const ids = {};
      base.products = src.products.map((x) => { const id = uid(); ids[x.id] = id; return { ...x, id, stockStart: 0 }; });
      base.pumps = src.pumps.map((x) => ({ ...x, id: uid(), productId: ids[x.productId] }));
      base.shifts = structuredClone(src.shifts);
    }
    const st = { id: uid(), name: vals.name, groupId: vals.group, ...base };
    DB.stations.push(st); save(); toast('Pika u shtua');
    go('station', st.id);
  }

  async function homeAction(act, b) {
    const id = b.dataset.id;
    switch (act) {
      case 'g-add': {
        const name = await ask('Emri i grupit (p.sh. Durrës, Tiranë, Dibër)', { ok: 'Shto', input: 'Emri i grupit' });
        if (!name) return;
        DB.groups.push({ id: uid(), name }); save(); return renderHome();
      }
      case 'g-ren': {
        const g = group(id);
        const name = await ask(`Emri i ri për "${g.name}"`, { ok: 'Ruaj', input: g.name });
        if (!name) return;
        g.name = name; save(); return renderHome();
      }
      case 'g-del':
        if (DB.stations.some((st) => st.groupId === id)) return ask('Grupi ka pika. Zhvendosini ose fshijini pikat fillimisht (te "Çmimet & Cilësimet" e pikës).', { ok: 'Mirë', cancel: null });
        DB.groups = DB.groups.filter((g) => g.id !== id); save(); return renderHome();
      case 'st-add': return addStationDialog(b.dataset.group || DB.groups[0]?.id);
      case 'st-del': {
        const n = S.reports.length;
        if (!(await ask(`Të fshihet pika "${S.name}" me ${n} raporte? Shkruani FSHI për të konfirmuar.`, { ok: 'Fshi pikën', danger: true, typed: 'FSHI' }))) return;
        DB.stations = DB.stations.filter((st) => st !== S); S = null; draft = null; dirty = false; save(); return go('pikat');
      }
      // customers
      case 'c-add': {
        const name = await ask('Emri i klientit', { ok: 'Shto', input: 'p.sh. Nedi' });
        if (!name) return;
        const c = findCustomer(name) || addCustomer(name); save(); return go('klient', c.id);
      }
      case 'c-open': return go('klient', id);
      case 'c-pay': {
        const amount = num(document.getElementById('pay-amount').value);
        if (!amount) return toast('Shkruani shumën e paguar');
        DB.payments.push({ id: uid(), customerId: custId, date: document.getElementById('pay-date').value || localDate(), amount, note: document.getElementById('pay-note').value.trim() });
        save(); toast('Pagesa u regjistrua'); return renderCustomer();
      }
      case 'c-pay-del':
        if (!(await ask('Ta fshij këtë pagesë?'))) return;
        DB.payments = DB.payments.filter((x) => x.id !== id); save(); return renderCustomer();
      case 'c-del': {
        const c = customer(custId);
        if (charges().some((x) => x.customerId === c.id)) return ask(`${c.name} ka borxhe të shënuara në raporte. Fshijini te raportet përkatëse para se të fshini klientin.`, { ok: 'Mirë', cancel: null });
        if (!(await ask(`Ta fshij klientin ${c.name}?`))) return;
        DB.customers = DB.customers.filter((x) => x !== c); DB.payments = DB.payments.filter((x) => x.customerId !== c.id); save(); return go('klientet');
      }
      case 'c-csv': {
        const c = customer(custId);
        return download(`klienti-${c.name}.csv`, csv([[c.name], ['Data', 'Pika', 'Turni', 'Borxh', 'Pagesë', 'Gjendja'],
          ...ledger(c.id).map((m) => [m.date, m.where, m.shift, m.charge, m.paid, m.balance])]), 'text/csv');
      }
      case 'c-report': {
        const st = station(b.dataset.st); const r = st?.reports.find((x) => x.id === id);
        if (!r) return toast('Raporti nuk u gjet');
        await go('station', st.id); draft = structuredClone(r); dirty = false; return renderReport();
      }
    }
  }

  // ---------- customers who pay monthly ----------
  function findCustomer(name) {
    const n = norm(name);
    return n ? DB.customers.find((c) => norm(c.name) === n) : null;
  }
  function addCustomer(name) {
    const c = { id: uid(), name: String(name).trim(), phone: '', note: '' };
    DB.customers.push(c);
    return c;
  }
  // A known customer's name typed in the expenses marks the row as that customer's credit.
  function autoClient(x, tr) {
    const c = findCustomer(x.desc);
    if (c && x.kind !== 'client') { x.kind = 'client'; x.auto = true; }
    else if (!c && x.auto) { x.kind = 'exp'; x.auto = false; }
    tr.classList.toggle('is-client', x.kind === 'client');
    const sel = tr.querySelector('[data-f=kind]'); if (sel) sel.value = x.kind === 'client' ? 'client' : 'exp';
  }
  // Credit lives in the station reports, so editing a report updates the customer page.
  function charges() {
    const out = [];
    for (const st of DB.stations) for (const r of st.reports) for (const x of r.expenses) {
      if (x.kind === 'client' && x.customerId) {
        out.push({ customerId: x.customerId, date: r.date, stationId: st.id, where: st.name, shift: (st.shifts.find((s) => s.id === r.shift) || { name: r.shift }).name, value: x.value || 0, reportId: r.id });
      }
    }
    return out;
  }
  function ledger(cid) {
    const moves = [
      ...charges().filter((x) => x.customerId === cid).map((x) => ({ ...x, charge: x.value, paid: null })),
      ...DB.payments.filter((x) => x.customerId === cid).map((x) => ({ date: x.date, where: x.note || 'Pagesë', shift: '', charge: null, paid: x.amount, paymentId: x.id })),
    ].sort((a, b) => a.date.localeCompare(b.date) || (a.paid == null ? -1 : 1));
    let bal = 0;
    for (const m of moves) { bal = round2(bal + (m.charge || 0) - (m.paid || 0)); m.balance = bal; }
    return moves;
  }
  function renderCustomers() {
    const month = renderCustomers.month ||= localDate().slice(0, 7);
    const all = charges();
    const q = norm(renderCustomers.q || '');
    const rows = DB.customers.filter((c) => !q || norm(c.name).includes(q)).map((c) => {
      const mine = all.filter((x) => x.customerId === c.id);
      const pays = DB.payments.filter((x) => x.customerId === c.id);
      const inMonth = round2(mine.filter((x) => x.date.startsWith(month)).reduce((a, x) => a + x.value, 0));
      const paidMonth = round2(pays.filter((x) => x.date.startsWith(month)).reduce((a, x) => a + x.amount, 0));
      const balance = round2(mine.reduce((a, x) => a + x.value, 0) - pays.reduce((a, x) => a + x.amount, 0));
      const last = mine.map((x) => x.date).sort().pop();
      return { c, inMonth, paidMonth, balance, last, count: mine.filter((x) => x.date.startsWith(month)).length };
    }).sort((a, b) => b.balance - a.balance || a.c.name.localeCompare(b.c.name));
    const tot = rows.reduce((a, r) => ({ m: a.m + r.inMonth, p: a.p + r.paidMonth, b: a.b + r.balance }), { m: 0, p: 0, b: 0 });
    $app.innerHTML = `${demoBanner()}<div class="card">
      <div class="row"><h2 style="margin:0;flex:1">Klientët me pagesë mujore</h2>
        <div class="field"><label>Kërko</label><input type="text" id="c-q" value="${esc(renderCustomers.q || '')}" placeholder="Emri"></div>
        <div class="field"><label>Muaji</label><input type="month" id="c-month" value="${month}"></div>
        <button class="btn primary" data-act="c-add">+ Shto klient</button></div>
      <div class="totals" style="margin-top:12px">
        <div class="stat"><div class="k">Borxhe këtë muaj</div><div class="v">${fmt(tot.m)}</div></div>
        <div class="stat"><div class="k">Paguar këtë muaj</div><div class="v">${fmt(tot.p)}</div></div>
        <div class="stat hl"><div class="k">Pa paguar gjithsej</div><div class="v">${fmt(tot.b)}</div></div>
      </div>
      <div class="scroll" style="margin-top:12px"><table>
        <thead><tr><th>Klienti</th><th>Telefoni</th><th class="num">Herë këtë muaj</th><th class="num">Borxh këtë muaj</th><th class="num">Paguar këtë muaj</th><th class="num">Pa paguar gjithsej</th><th>Hera e fundit</th><th></th></tr></thead>
        <tbody>${rows.map((r) => `<tr>
          <td><b>${esc(r.c.name)}</b></td><td>${esc(r.c.phone)}</td><td class="num">${r.count}</td>
          <td class="num">${fmt(r.inMonth)}</td><td class="num">${fmt(r.paidMonth)}</td>
          <td class="num ${r.balance > 0 ? 'owe' : ''}">${fmt(r.balance)}</td><td>${esc(r.last || '—')}</td>
          <td><button class="btn small" data-act="c-open" data-id="${r.c.id}">Hap</button></td></tr>`).join('')
          || '<tr><td colspan="8" class="muted">Ende pa klientë. Shkruani emrin e klientit te "Shpenzime ditore dhe klientë" në raport, ose shtypni "+ Shto klient".</td></tr>'}</tbody>
      </table></div></div>`;
  }
  function renderCustomer() {
    const c = customer(custId);
    if (!c) return go('klientet');
    const moves = ledger(c.id);
    const bal = moves.length ? moves[moves.length - 1].balance : 0;
    $app.innerHTML = `<div class="card">
      <div class="row"><h2 style="margin:0;flex:1"><button class="btn small" data-go-list>← Klientët</button> ${esc(c.name)}</h2>
        <button class="btn" data-act="c-csv">⬇ Excel (CSV)</button>
        <button class="btn danger" data-act="c-del">Fshi klientin</button></div>
      <div class="row" style="margin-top:10px">
        <div class="field"><label>Emri</label><input type="text" id="cu-name" value="${esc(c.name)}"></div>
        <div class="field"><label>Telefoni</label><input type="text" id="cu-phone" value="${esc(c.phone)}" inputmode="tel"></div>
        <div class="field" style="flex:1;min-width:160px"><label>Shënim (p.sh. targa, kompania)</label><input type="text" id="cu-note" value="${esc(c.note)}"></div>
      </div></div>
    <div class="grid2">
      <div class="card"><h2>Lëvizjet</h2><div class="scroll"><table>
        <thead><tr><th>Data</th><th>Pika / shënim</th><th>Turni</th><th class="num">Borxh</th><th class="num">Pagesë</th><th class="num">Gjendja</th><th></th></tr></thead>
        <tbody>${moves.slice().reverse().map((m) => `<tr><td>${esc(m.date)}</td><td>${esc(m.where)}</td><td>${esc(m.shift)}</td>
          <td class="num">${fmt(m.charge)}</td><td class="num paid">${fmt(m.paid)}</td><td class="num">${fmt(m.balance)}</td>
          <td>${m.paymentId ? `<button class="x" data-act="c-pay-del" data-id="${m.paymentId}" title="Fshi pagesën">✕</button>`
            : `<button class="btn small" data-act="c-report" data-id="${m.reportId}" data-st="${m.stationId}">Raporti</button>`}</td></tr>`).join('')
          || '<tr><td colspan="7" class="muted">Ende pa lëvizje.</td></tr>'}</tbody>
      </table></div></div>
      <div class="card"><h2>Pa paguar: <span class="${bal > 0 ? 'owe' : ''}">${fmt(bal)}</span></h2>
        <h3>Regjistro pagesën mujore</h3>
        <div class="form">
          <label>Data<input type="date" id="pay-date" value="${localDate()}"></label>
          <label>Shuma<input type="text" id="pay-amount" inputmode="decimal" value="${bal > 0 ? bal : ''}"></label>
          <label>Shënim<input type="text" id="pay-note" placeholder="p.sh. Pagesa e tetorit"></label>
          <button class="btn primary" data-act="c-pay">Regjistro pagesën</button>
        </div>
        <p class="note">Borxhet shtohen vetë nga raportet e turneve, me datën e raportit. Për të ndryshuar një borxh, hapni raportin.</p>
      </div></div>`;
  }
  function customerChange(el) {
    const c = customer(custId); if (!c) return;
    if (el.id === 'cu-name' && el.value.trim()) {
      const other = findCustomer(el.value);
      if (other && other !== c) { el.value = c.name; return toast('Ka tashmë një klient me këtë emër'); }
      c.name = el.value.trim();
      // Keep the name on the report rows in step.
      for (const st of DB.stations) for (const r of st.reports) for (const x of r.expenses) if (x.customerId === c.id) x.desc = c.name;
    } else if (el.id === 'cu-phone') c.phone = el.value.trim();
    else if (el.id === 'cu-note') c.note = el.value.trim();
    else return;
    save(); toast('U ruajt');
  }
  $app.addEventListener('input', (e) => {
    if (tab === 'klientet' && e.target.id === 'c-q') {
      renderCustomers.q = e.target.value; renderCustomers();
      const q = document.getElementById('c-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length);
    }
  });
  $app.addEventListener('click', (e) => { if (e.target.closest('[data-go-list]')) go('klientet'); });

  // ---------- liters sold, all stations ----------
  // "Naftë / Benzinë / Gaz" matches the office sheet; "Çdo produkt" keeps D1 G, D2… apart.
  const FUEL_ORDER = ['Naftë', 'Benzinë', 'Gaz'];
  function fuelType(name) {
    const n = norm(name);
    if (n.includes('gaz') || n.includes('lpg')) return 'Gaz';
    if (n.includes('benz')) return 'Benzinë';
    if (/^d\d|naft|diesel|dizel/.test(n)) return 'Naftë';
    return String(name).trim();
  }
  const catName = (st, productId, fallback, byType) => {
    const name = st.products.find((p) => p.id === productId)?.name || fallback || '?';
    return byType ? fuelType(name) : name.trim();
  };
  function litersOf(st, reports, byType) {
    const m = {};
    for (const rep of reports) for (const r of rep.rows) {
      const l = rowCalc(r).liters;
      if (l == null) continue;
      const k = catName(st, r.productId, r.name, byType);
      m[k] = round2((m[k] || 0) + l);
    }
    return m;
  }
  const catSort = (a, b) => {
    const ia = FUEL_ORDER.indexOf(fuelType(a)); const ib = FUEL_ORDER.indexOf(fuelType(b));
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  };
  const sumVals = (m) => round2(Object.values(m).reduce((a, v) => a + v, 0));

  // Liters on the open report: this shift, the whole day and the month so far.
  function renderShiftLiters() {
    const tb = document.querySelector('#t-lit tbody'); if (!tb) return;
    const d = draft;
    const notThis = (r) => r.id !== d.id && !(r.date === d.date && r.shift === d.shift);
    const shift = litersOf(S, [d], false);
    const day = litersOf(S, [d, ...S.reports.filter((r) => r.date === d.date && notThis(r))], false);
    const month = litersOf(S, [d, ...S.reports.filter((r) => r.date.startsWith(d.date.slice(0, 7)) && r.date <= d.date && notThis(r))], false);
    const cats = [...new Set([...Object.keys(day), ...Object.keys(month)])].sort(catSort);
    tb.innerHTML = cats.map((k) => `<tr><td>${esc(k)}</td><td class="num">${fmt(shift[k] ?? 0)}</td><td class="num">${fmt(day[k] ?? 0)}</td><td class="num">${fmt(month[k] ?? 0)}</td></tr>`).join('')
      || '<tr><td colspan="4" class="muted">Shkruani "Fundin" e pistoletave.</td></tr>';
    document.querySelector('#t-lit tfoot').innerHTML = `<tr><td>Totali</td><td class="num">${fmt(sumVals(shift))}</td><td class="num">${fmt(sumVals(day))}</td><td class="num">${fmt(sumVals(month))}</td></tr>`;
  }

  function renderLiters() {
    const o = renderLiters.o ||= { mode: 'dite', date: localDate(), month: localDate().slice(0, 7), group: '', byType: true, dayCat: '' };
    const gIdx = (st) => { const i = DB.groups.findIndex((g) => g.id === st.groupId); return i < 0 ? 999 : i; };
    const sts = DB.stations.filter((st) => !o.group || st.groupId === o.group).sort((a, b) => gIdx(a) - gIdx(b));
    const inPeriod = (r) => (o.mode === 'dite' ? r.date === o.date : r.date.startsWith(o.month));
    const per = sts.map((st) => litersOf(st, st.reports.filter(inPeriod), o.byType));
    const counts = sts.map((st) => st.reports.filter(inPeriod).length);
    const cats = [...new Set(per.flatMap((m) => Object.keys(m)))].sort(catSort);
    const rowTot = (k) => round2(per.reduce((a, m) => a + (m[k] || 0), 0));
    const colTot = per.map(sumVals);
    const grand = round2(colTot.reduce((a, v) => a + v, 0));

    // Group names above the station columns, as in the office sheet.
    const spans = [];
    for (const st of sts) {
      const name = group(st.groupId)?.name || 'Pa grup';
      if (spans.length && spans[spans.length - 1].name === name) spans[spans.length - 1].n++; else spans.push({ name, n: 1 });
    }
    const head = `<thead><tr class="ghead"><th></th>${spans.map((x) => `<th colspan="${x.n}">${esc(x.name)}</th>`).join('')}<th></th></tr>
      <tr><th>Emërtimi</th>${sts.map((st) => `<th class="num">${esc(st.name)}</th>`).join('')}<th class="num">Totali</th></tr></thead>`;
    const period = o.mode === 'dite' ? o.date : o.month;
    const t1 = `<div class="scroll"><table class="matrix">${head}
      <tbody>${cats.map((k) => `<tr><td><b>${esc(k)}</b></td>${per.map((m) => `<td class="num">${m[k] ? fmt(m[k], 0) : ''}</td>`).join('')}<td class="num"><b>${fmt(rowTot(k), 0)}</b></td></tr>`).join('')
        || `<tr><td colspan="${sts.length + 2}" class="muted">Nuk ka raporte të ruajtura për ${esc(period)}.</td></tr>`}
        <tr class="muted"><td>Raporte (turne)</td>${counts.map((n) => `<td class="num ${n ? '' : 'missing'}">${n}</td>`).join('')}<td class="num">${counts.reduce((a, n) => a + n, 0)}</td></tr></tbody>
      <tfoot><tr><td>Totali litra</td>${colTot.map((v) => `<td class="num">${fmt(v, 0)}</td>`).join('')}<td class="num">${fmt(grand, 0)}</td></tr></tfoot></table></div>`;
    renderLiters.csv = [['Shitjet në litra', period], ['Emërtimi', ...sts.map((st) => st.name), 'Totali'],
      ...cats.map((k) => [k, ...per.map((m) => m[k] || 0), rowTot(k)]), ['Totali litra', ...colTot, grand]];

    let t2 = '';
    if (o.mode === 'muaj') {
      const [y, mo] = o.month.split('-').map(Number);
      const lastDay = new Date(y, mo, 0).getDate();
      const today = localDate();
      const days = [];
      for (let d = 1; d <= lastDay; d++) { const ds = `${o.month}-${pad(d)}`; if (ds <= today) days.push(ds); }
      const cell = (st, ds) => { const m = litersOf(st, st.reports.filter((r) => r.date === ds), o.byType); return o.dayCat ? m[o.dayCat] || 0 : sumVals(m); };
      const grid = days.map((ds) => sts.map((st) => cell(st, ds)));
      t2 = `<div class="card"><div class="row"><h2 style="margin:0;flex:1">Litrat ditë për ditë</h2>
        <div class="field"><label>Produkti</label><select id="l-daycat"><option value="">Të gjitha</option>${cats.map((k) => `<option ${k === o.dayCat ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div></div>
        <div class="scroll" style="margin-top:10px"><table class="matrix"><thead><tr><th>Data</th>${sts.map((st) => `<th class="num">${esc(st.name)}</th>`).join('')}<th class="num">Totali</th></tr></thead>
        <tbody>${days.map((ds, i) => `<tr><td>${ds.slice(8)}.${ds.slice(5, 7)}</td>${grid[i].map((v) => `<td class="num ${v ? '' : 'missing'}">${v ? fmt(v, 0) : '—'}</td>`).join('')}<td class="num"><b>${fmt(round2(grid[i].reduce((a, v) => a + v, 0)), 0)}</b></td></tr>`).join('')}</tbody>
        <tfoot><tr><td>Muaji</td>${sts.map((st, j) => `<td class="num">${fmt(round2(grid.reduce((a, r) => a + r[j], 0)), 0)}</td>`).join('')}<td class="num">${fmt(round2(grid.flat().reduce((a, v) => a + v, 0)), 0)}</td></tr></tfoot></table></div>
        <p class="note">"—" do të thotë që për atë ditë nuk ka raport të ruajtur.</p></div>`;
    }

    const stocks = sts.map((st) => {
      const m = {};
      for (const s of stock(st)) if (s.p.metered) { const k = o.byType ? fuelType(s.p.name) : s.p.name.trim(); m[k] = round2((m[k] || 0) + s.now); }
      return m;
    });
    const sCats = [...new Set(stocks.flatMap((m) => Object.keys(m)))].sort(catSort);
    const t3 = `<div class="card"><h2>Gjendja e karburantit sipas pikave tani</h2><div class="scroll"><table class="matrix">${head}
      <tbody>${sCats.map((k) => `<tr><td><b>${esc(k)}</b></td>${stocks.map((m) => `<td class="num ${(m[k] ?? 0) < 0 ? 'neg' : ''}">${m[k] != null ? fmt(m[k], 0) : ''}</td>`).join('')}<td class="num"><b>${fmt(round2(stocks.reduce((a, m) => a + (m[k] || 0), 0)), 0)}</b></td></tr>`).join('')}</tbody>
      </table></div><p class="note">Gjendja fillestare + furnizimet − shitjet, për çdo pikë (te "Gjendja" e pikës).</p></div>`;

    $app.innerHTML = `${demoBanner()}<div class="card">
      <div class="row"><h2 style="margin:0;flex:1">Shitjet në litra</h2>
        <div class="field"><label>Periudha</label><select id="l-mode"><option value="dite">Një ditë</option><option value="muaj" ${o.mode === 'muaj' ? 'selected' : ''}>Gjithë muaji</option></select></div>
        ${o.mode === 'dite' ? `<div class="field"><label>Data</label><input type="date" id="l-date" value="${o.date}"></div>` : `<div class="field"><label>Muaji</label><input type="month" id="l-month" value="${o.month}"></div>`}
        <div class="field"><label>Grupi</label><select id="l-group"><option value="">Të gjitha</option>${DB.groups.map((g) => `<option value="${g.id}" ${g.id === o.group ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select></div>
        <div class="field"><label>Ndarja</label><select id="l-type"><option value="1">Naftë / Benzinë / Gaz</option><option value="0" ${o.byType ? '' : 'selected'}>Çdo produkt</option></select></div>
        <button class="btn" data-act="l-csv">⬇ Excel (CSV)</button></div>
      <div style="margin-top:12px">${t1}</div></div>${t2}${t3}`;
  }
  function litersChange(el) {
    const o = renderLiters.o;
    if (el.id === 'l-mode') o.mode = el.value;
    else if (el.id === 'l-date' && el.value) o.date = el.value;
    else if (el.id === 'l-month' && el.value) o.month = el.value;
    else if (el.id === 'l-group') o.group = el.value;
    else if (el.id === 'l-type') { o.byType = el.value === '1'; o.dayCat = ''; }
    else if (el.id === 'l-daycat') o.dayCat = el.value;
    else return;
    renderLiters();
  }

  routeFromHash();
  render();
})();
