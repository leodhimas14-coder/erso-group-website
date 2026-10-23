// Fuel station daily sales report: pump meter readings per shift, prices, daily expenses
// and tank stock. Everything is kept in this browser's localStorage; the JSON backup in
// "Cilësimet" moves the data to another computer.
(function () {
  'use strict';

  const KEY = 'erso-karburant-v1';
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
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
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
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.products)) return { ...defaults(), ...s };
    } catch (e) { /* fall through */ }
    return defaults();
  }
  let S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); }
    catch (e) { alert('Të dhënat nuk u ruajtën në këtë shfletues: ' + e.message); }
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
    const expenses = round2(rep.expenses.reduce((s, x) => s + (x.value || 0), 0));
    const sales = round2(fuel + extras);
    return { fuel, extras, sales, expenses, net: round2(sales - expenses) };
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
  function stock() {
    const sold = soldByProduct(S.reports);
    return S.products.map((p) => {
      const delivered = round2(S.deliveries.filter((d) => d.productId === p.id).reduce((s, d) => s + d.qty, 0));
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
  function pumpPrice(pump) {
    if (pump.price != null) return pump.price;
    return product(pump.productId)?.price ?? null;
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
  let tab = 'raporti';

  // ---------- views ----------
  function render() {
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'raporti') renderReport();
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

    $app.innerHTML = `
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
          <button class="btn" data-act="print">🖨 Printo</button>
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
          <h2>Shpenzime ditore</h2>
          <div class="scroll"><table id="t-exp">
            <thead><tr><th>Përshkrimi</th><th class="num">Vlera</th><th class="no-print"></th></tr></thead>
            <tbody>${d.expenses.map((x, i) => `<tr data-i="${i}">
              <td><input data-f="desc" value="${esc(x.desc)}" placeholder="p.sh. BANKE"></td>
              <td><input class="num" data-f="value" inputmode="decimal" value="${inVal(x.value)}"></td>
              <td class="no-print"><button class="x" data-act="del-exp" data-i="${i}">✕</button></td></tr>`).join('')}</tbody>
            <tfoot><tr><td>Totali shpenzime</td><td class="num" id="tot-exp"></td><td class="no-print"></td></tr></tfoot>
          </table></div>
          <button class="btn small no-print" data-act="add-exp" style="margin-top:6px">+ Shto shpenzim</button>
        </div>

        <div class="card">
          <h2>Totali i turnit</h2>
          <div class="totals">
            <div class="stat"><div class="k">Shitje karburant</div><div class="v" id="s-fuel"></div></div>
            <div class="stat"><div class="k">Shitje të tjera</div><div class="v" id="s-extras"></div></div>
            <div class="stat"><div class="k">Totali i shitjeve</div><div class="v" id="s-sales"></div></div>
            <div class="stat"><div class="k">Shpenzime</div><div class="v" id="s-exp"></div></div>
            <div class="stat hl"><div class="k">Për t'u dorëzuar (shitje − shpenzime)</div><div class="v" id="s-net"></div></div>
          </div>
          <div class="field" style="margin-top:10px"><label>Shënime</label><input type="text" id="r-note" value="${esc(d.note)}"></div>
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
    set('tot-l', round2(liters)); set('tot-fuel', t.fuel); set('tot-extras', t.extras); set('tot-exp', t.expenses);
    set('s-fuel', t.fuel); set('s-extras', t.extras); set('s-sales', t.sales); set('s-exp', t.expenses); set('s-net', t.net);
    const neg = d.rows.filter((r) => (rowCalc(r).liters ?? 0) < 0).length;
    const w = document.getElementById('negwarn');
    if (w) w.innerHTML = neg ? `<div class="warnbox">Kujdes: ${neg} pistoleta kanë "Fundi" më të vogël se "Fillimi" (litra negative). Kontrolloni leximet.</div>` : '';
    const dd = document.getElementById('dirty'); if (dd) dd.textContent = dirty ? ' • Ka ndryshime të paruajtura' : '';
  }

  function saveDraft() {
    const d = draft;
    if (!d.date || !d.shift) return toast('Zgjidhni datën dhe turnin');
    const clash = S.reports.find((r) => r.date === d.date && r.shift === d.shift && r.id !== d.id);
    if (clash && !confirm('Ka një raport tjetër për këtë datë dhe turn. Ta zëvendësoj?')) return;
    if (clash) S.reports = S.reports.filter((r) => r !== clash);
    d.expenses = d.expenses.filter((x) => x.desc || x.value != null);
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
      ['RAPORTI DITOR I SHITJEVE'], ['Data', rep.date, 'Turni', shiftName(rep.shift), 'Punonjësi', rep.employee], [],
      ['Emërtimi', 'Fillimi', 'Fundi', 'Litra', 'Çmimi', 'Vlera'],
      ...rep.rows.map((r) => { const c = rowCalc(r); return [r.name, r.start, r.end, c.liters, r.price, c.value]; }),
      ['Totali karburant', '', '', '', '', t.fuel], [],
      ['Shitje të tjera', 'Sasia', 'Çmimi', 'Vlera'],
      ...rep.extras.map((x) => [x.name, x.qty, x.price, extraValue(x)]),
      ['Totali shitje të tjera', '', '', t.extras], [],
      ['Shpenzime ditore', 'Vlera'], ...rep.expenses.map((x) => [x.desc, x.value]),
      ['Totali shpenzime', t.expenses], [],
      ['Totali i shitjeve', t.sales], ['Për t\'u dorëzuar', t.net], ['Shënime', rep.note || ''],
    ];
    return csv(rows);
  }

  function renderHistory() {
    const month = renderHistory.month ||= localDate().slice(0, 7);
    const list = sortedReports().filter((r) => !month || r.date.startsWith(month)).reverse();
    const sum = list.reduce((a, r) => { const t = totals(r); a.sales += t.sales; a.exp += t.expenses; a.net += t.net; return a; }, { sales: 0, exp: 0, net: 0 });
    $app.innerHTML = `<div class="card">
      <div class="row"><h2 style="margin:0;flex:1">Historiku i raporteve</h2>
        <div class="field"><label>Muaji</label><input type="month" id="h-month" value="${month}"></div>
        <button class="btn" data-act="h-all">Të gjitha</button>
        <button class="btn" data-act="h-csv">⬇ Excel (CSV)</button></div>
      <div class="scroll" style="margin-top:10px"><table>
        <thead><tr><th>Data</th><th>Turni</th><th>Punonjësi</th><th class="num">Litra</th><th class="num">Shitje</th><th class="num">Shpenzime</th><th class="num">Për dorëzim</th><th></th></tr></thead>
        <tbody>${list.map((r) => { const t = totals(r); const l = round2(r.rows.reduce((s, x) => s + (rowCalc(x).liters || 0), 0));
          return `<tr><td>${r.date}</td><td>${esc(shiftName(r.shift))}</td><td>${esc(r.employee)}</td>
          <td class="num">${fmt(l)}</td><td class="num">${fmt(t.sales)}</td><td class="num">${fmt(t.expenses)}</td><td class="num ${t.net < 0 ? 'neg' : ''}">${fmt(t.net)}</td>
          <td><button class="btn small" data-act="open" data-id="${r.id}">Hap</button> <button class="btn small danger" data-act="h-del" data-id="${r.id}">Fshi</button></td></tr>`; }).join('')
          || '<tr><td colspan="8" class="muted">Nuk ka raporte për këtë periudhë.</td></tr>'}</tbody>
        <tfoot><tr><td colspan="4">Totali (${list.length} turne)</td><td class="num">${fmt(sum.sales)}</td><td class="num">${fmt(sum.exp)}</td><td class="num">${fmt(sum.net)}</td><td></td></tr></tfoot>
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
    for (const r of reps) { const t = totals(r); const o = (days[r.date] ||= { sales: 0, exp: 0, net: 0, n: 0 }); o.sales += t.sales; o.exp += t.expenses; o.net += t.net; o.n++; }
    const sum = Object.values(days).reduce((a, o) => ({ sales: a.sales + o.sales, exp: a.exp + o.exp, net: a.net + o.net }), { sales: 0, exp: 0, net: 0 });
    const expByDesc = {};
    for (const r of reps) for (const x of r.expenses) { const k = (x.desc || '—').trim(); expByDesc[k] = round2((expByDesc[k] || 0) + (x.value || 0)); }
    $app.innerHTML = `<div class="card"><div class="row"><h2 style="margin:0;flex:1">Përmbledhje mujore</h2>
      <div class="field"><label>Muaji</label><input type="month" id="m-month" value="${month}"></div>
      <button class="btn" data-act="print">🖨 Printo</button></div>
      <div class="totals" style="margin-top:12px">
        <div class="stat"><div class="k">Shitje</div><div class="v">${fmt(sum.sales)}</div></div>
        <div class="stat"><div class="k">Shpenzime</div><div class="v">${fmt(sum.exp)}</div></div>
        <div class="stat hl"><div class="k">Neto</div><div class="v">${fmt(sum.net)}</div></div>
        <div class="stat"><div class="k">Turne</div><div class="v">${reps.length}</div></div>
      </div></div>
    <div class="grid2">
      <div class="card"><h2>Sipas produktit</h2><div class="scroll"><table>
        <thead><tr><th>Produkti</th><th class="num">Sasia</th><th class="num">Vlera</th></tr></thead>
        <tbody>${S.products.filter((p) => sold[p.id]).map((p) => `<tr><td>${esc(p.name)}</td><td class="num">${fmt(sold[p.id].qty)} ${esc(p.unit)}</td><td class="num">${fmt(sold[p.id].value)}</td></tr>`).join('') || '<tr><td colspan="3" class="muted">Pa të dhëna.</td></tr>'}</tbody>
      </table></div>
      <h3>Shpenzimet sipas përshkrimit</h3><div class="scroll"><table>
        <thead><tr><th>Përshkrimi</th><th class="num">Vlera</th></tr></thead>
        <tbody>${Object.entries(expByDesc).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${fmt(v)}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">Pa shpenzime.</td></tr>'}</tbody>
      </table></div></div>
      <div class="card"><h2>Sipas ditës</h2><div class="scroll"><table>
        <thead><tr><th>Data</th><th class="num">Turne</th><th class="num">Shitje</th><th class="num">Shpenzime</th><th class="num">Neto</th></tr></thead>
        <tbody>${Object.entries(days).sort().map(([d, o]) => `<tr><td>${d}</td><td class="num">${o.n}</td><td class="num">${fmt(o.sales)}</td><td class="num">${fmt(o.exp)}</td><td class="num">${fmt(o.net)}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Pa të dhëna.</td></tr>'}</tbody>
      </table></div></div></div>`;
  }

  function renderSettings() {
    const used = (id) => S.pumps.some((p) => p.productId === id);
    const hist = [...S.priceHistory].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100);
    $app.innerHTML = `
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
    </div>

    <div class="card"><h2>Ruajtja e të dhënave</h2>
      <p class="note" style="margin-bottom:10px">Të dhënat ruhen në këtë kompjuter, brenda shfletuesit. Bëni kopje rezervë rregullisht (p.sh. çdo javë) dhe ruajeni skedarin në USB ose email. Me "Ngarko kopjen" i hapni të dhënat në një kompjuter tjetër.</p>
      <div class="row">
        <button class="btn primary" data-act="backup">⬇ Shkarko kopjen rezervë</button>
        <label class="btn">⬆ Ngarko kopjen<input type="file" id="restore" accept=".json,application/json" hidden></label>
        <button class="btn danger" data-act="reset">Fshi të gjitha të dhënat</button>
      </div>
    </div>`;
  }

  // ---------- events ----------
  document.getElementById('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (tab === 'raporti' && dirty && b.dataset.tab !== 'raporti' && !confirm('Raporti ka ndryshime të paruajtura. Të largohem pa ruajtur?')) return;
    if (tab === 'raporti' && b.dataset.tab !== 'raporti') draft = null;
    tab = b.dataset.tab; render();
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
      else if (f !== 'productId') target[f] = num(el.value);
      if (tbl === 't-extras' && f === 'value') { target.qty = null; tr.querySelector('[data-f=qty]').value = ''; }
    } else return;
    dirty = true; recalc();
  });

  $app.addEventListener('change', (e) => {
    const el = e.target;
    if (tab === 'raporti') {
      if (el.id === 'r-date' || el.id === 'r-shift') {
        const date = document.getElementById('r-date').value; const shift = document.getElementById('r-shift').value;
        if (dirty && !confirm('Raporti ka ndryshime të paruajtura. Të vazhdoj pa ruajtur?')) { el.value = el.id === 'r-date' ? draft.date : draft.shift; return; }
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
    if (el.id === 'restore') return restore(el.files[0]);
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

  $app.addEventListener('click', (e) => {
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
        if (!confirm('Ta fshij këtë raport?')) return;
        S.reports = S.reports.filter((r) => r.id !== draft.id); save(); openDraft(draft.date, draft.shift); toast('Raporti u fshi'); return renderReport();
      case 'add-extra': draft.extras.push({ id: uid(), productId: null, name: '', qty: null, price: null, value: null }); dirty = true; return renderReport();
      case 'del-extra': draft.extras.splice(i, 1); dirty = true; return renderReport();
      case 'add-exp': draft.expenses.push({ desc: '', value: null }); dirty = true; renderReport();
        { const ins = document.querySelectorAll('#t-exp tbody input[data-f=desc]'); ins[ins.length - 1]?.focus(); } return;
      case 'del-exp': draft.expenses.splice(i, 1); dirty = true; return renderReport();
      // history
      case 'open': { const r = S.reports.find((x) => x.id === id); draft = structuredClone(r); dirty = false; tab = 'raporti'; return render(); }
      case 'h-del': if (confirm('Ta fshij këtë raport?')) { S.reports = S.reports.filter((r) => r.id !== id); save(); renderHistory(); } return;
      case 'h-all': renderHistory.month = ''; return renderHistory();
      case 'h-csv': return download(`raportet-${renderHistory.month || 'te-gjitha'}.csv`, csv([
        ['Data', 'Turni', 'Punonjësi', 'Shitje karburant', 'Shitje të tjera', 'Totali shitjeve', 'Shpenzime', 'Për dorëzim'],
        ...renderHistory.list.slice().reverse().map((r) => { const t = totals(r); return [r.date, shiftName(r.shift), r.employee, t.fuel, t.extras, t.sales, t.expenses, t.net]; }),
      ]), 'text/csv');
      // stock
      case 'd-add': {
        const qty = num(document.getElementById('d-qty').value);
        if (qty == null || qty === 0) return toast('Shkruani sasinë');
        S.deliveries.push({ id: uid(), date: document.getElementById('d-date').value || localDate(), productId: document.getElementById('d-prod').value, qty, note: document.getElementById('d-note').value.trim() });
        save(); toast('Furnizimi u shtua'); return renderStock();
      }
      case 'd-del': if (confirm('Ta fshij këtë furnizim?')) { S.deliveries = S.deliveries.filter((d) => d.id !== id); save(); renderStock(); } return;
      // settings
      case 'p-add': S.products.push({ id: uid(), name: 'Produkt i ri', price: null, unit: 'L', metered: true, stockStart: 0 }); save(); return renderSettings();
      case 'p-del': if (confirm('Ta fshij produktin? Raportet e vjetra nuk ndryshojnë.')) { S.products = S.products.filter((p) => p.id !== id); save(); renderSettings(); } return;
      case 'ph-del': S.priceHistory = S.priceHistory.filter((h) => h.id !== id); save(); return renderSettings();
      case 'pm-add': { const p = S.products.find((x) => x.metered); if (!p) return toast('Shtoni fillimisht një produkt me pistoletë');
        S.pumps.push({ id: uid(), name: p.name + ' – ' + (S.pumps.filter((x) => x.productId === p.id).length + 1), productId: p.id, price: null }); save(); return renderSettings(); }
      case 'pm-del': if (confirm('Ta fshij pistoletën? Raportet e vjetra nuk ndryshojnë.')) { S.pumps = S.pumps.filter((p) => p.id !== id); save(); renderSettings(); } return;
      case 'pm-up': case 'pm-down': {
        const j = act === 'pm-up' ? i - 1 : i + 1; if (j < 0 || j >= S.pumps.length) return;
        [S.pumps[i], S.pumps[j]] = [S.pumps[j], S.pumps[i]]; save(); return renderSettings();
      }
      case 's-add': S.shifts.push({ id: uid(), name: 'Turni ' + (S.shifts.length + 1) }); save(); return renderSettings();
      case 's-del':
        if (S.shifts.length < 2) return toast('Duhet të paktën një turn');
        if (S.reports.some((r) => r.shift === id)) return toast('Ky turn ka raporte të ruajtura');
        S.shifts = S.shifts.filter((s) => s.id !== id); save(); return renderSettings();
      case 'backup': return download(`karburant-kopje-${localDate()}.json`, JSON.stringify(S, null, 1), 'application/json');
      case 'reset':
        if (!confirm('Do të fshihen TË GJITHA raportet, çmimet dhe furnizimet. Keni bërë kopje rezervë?')) return;
        if (prompt('Shkruani FSHI për të konfirmuar') !== 'FSHI') return;
        S = defaults(); save(); draft = null; return renderSettings();
    }
  });

  function restore(file) {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(fr.result);
        if (!Array.isArray(data.products) || !Array.isArray(data.reports)) throw new Error('Skedari nuk është kopje e këtij programi');
        if (!confirm(`Kopja ka ${data.reports.length} raporte. Të zëvendësoj të dhënat aktuale?`)) return;
        S = { ...defaults(), ...data }; save(); draft = null; toast('Të dhënat u ngarkuan'); renderSettings();
      } catch (err) { alert('Ngarkimi dështoi: ' + err.message); }
    };
    fr.readAsText(file);
  }

  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  render();
})();
