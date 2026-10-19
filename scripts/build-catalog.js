// Merges the CMS content (content/kategorite.json + content/produkte/*.json)
// into the single file the catalog page reads: site/data/catalog.json.
// Netlify runs this on every deploy; run it locally with `node scripts/build-catalog.js`.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const prodDir = path.join(root, 'content', 'produkte');
const out = path.join(root, 'site', 'data', 'catalog.json');

const kategorite = JSON.parse(fs.readFileSync(path.join(root, 'content', 'kategorite.json'), 'utf8')).kategorite || [];

const produkte = fs.readdirSync(prodDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    try {
      return { slug: path.basename(f, '.json'), ...JSON.parse(fs.readFileSync(path.join(prodDir, f), 'utf8')) };
    } catch (e) {
      console.warn('Skipping invalid product file', f, e.message);
      return null;
    }
  })
  .filter((p) => p && p.publikuar !== false && p.titulli)
  .map((p) => ({
    id: p.slug,
    cat: p.kategoria,
    name: p.titulli,
    price: p.cmimi === '' || p.cmimi == null ? null : Number(p.cmimi),
    currency: p.monedha || '€',
    status: p.statusi || 'porosi',
    delivery: p.afati || '',
    desc: p.pershkrimi || '',
    specs: (p.specifikimet || []).filter((s) => s && s.emri).map((s) => [s.emri, s.vlera || '']),
    photos: (p.fotot || []).map((f) => (typeof f === 'string' ? f : f && f.foto)).filter(Boolean),
    realPhotos: !!p.foto_reale,
    created: Date.parse(p.data) || 0,
  }))
  .sort((a, b) => b.created - a.created);

const categories = kategorite.map((k) => ({ id: k.id, name: k.emri, icon: k.ikona || '📦' }));

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ categories, products: produkte }, null, 1));
console.log(`catalog.json: ${categories.length} categories, ${produkte.length} products`);
