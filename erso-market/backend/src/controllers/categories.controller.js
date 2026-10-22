const Category = require('../models/Category');
const Product = require('../models/Product');
const { HttpError } = require('../middleware/errorHandler');
const { listCategories } = require('../services/category.service');
const { slugify } = require('./products.controller');

const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const cleanImage = (v) => {
  const url = clean(v, 1000);
  if (url && !/^https?:\/\//i.test(url) && !url.startsWith('data:image/')) throw new HttpError(400, 'Linku i fotos duhet të fillojë me https://');
  return url;
};

async function publicList(_req, res) {
  res.json({ categories: await listCategories() });
}

async function adminList(_req, res) {
  const categories = await listCategories({ includeHidden: true });
  const counts = await Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]);
  const byKey = Object.fromEntries(counts.map((c) => [c._id, c.n]));
  res.json({ categories: categories.map((c) => ({ ...c.toObject(), products: byKey[c.key] || 0 })) });
}

async function create(req, res) {
  const label = clean(req.body?.label, 40);
  if (!label) throw new HttpError(400, 'Shkruaj emrin e kategorisë');
  const key = slugify(label);
  if (!key) throw new HttpError(400, 'Emër i pavlefshëm');
  if (await Category.exists({ key })) throw new HttpError(409, 'Kjo kategori ekziston tashmë');
  const last = await Category.findOne().sort({ position: -1 });
  const category = await Category.create({
    key, label, emoji: clean(req.body?.emoji, 8), image: cleanImage(req.body?.image), position: (last?.position ?? -1) + 1,
  });
  res.status(201).json({ category });
}

async function update(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Kategoria nuk u gjet');
  const body = req.body || {};
  if (body.label !== undefined) {
    const label = clean(body.label, 40);
    if (!label) throw new HttpError(400, 'Emri nuk mund të jetë bosh');
    category.label = label;
  }
  if (body.emoji !== undefined) category.emoji = clean(body.emoji, 8);
  if (body.image !== undefined) category.image = cleanImage(body.image);
  if (body.active !== undefined) category.active = Boolean(body.active);
  await category.save();
  res.json({ category });
}

/** Moves a category one place up or down in the menu. */
async function move(req, res) {
  const all = await listCategories({ includeHidden: true });
  const i = all.findIndex((c) => String(c._id) === req.params.id);
  if (i < 0) throw new HttpError(404, 'Kategoria nuk u gjet');
  const j = req.body?.direction === 'up' ? i - 1 : i + 1;
  if (j >= 0 && j < all.length) [all[i], all[j]] = [all[j], all[i]];
  await Promise.all(all.map((c, position) => Category.updateOne({ _id: c._id }, { position })));
  res.json({ ok: true });
}

async function remove(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Kategoria nuk u gjet');
  const used = await Product.countDocuments({ category: category.key });
  if (used) throw new HttpError(400, `Kjo kategori ka ${used} produkte. Kaloji te një kategori tjetër ose fshiji, pastaj fshi kategorinë.`);
  await category.deleteOne();
  res.json({ ok: true });
}

module.exports = { publicList, adminList, create, update, move, remove };
