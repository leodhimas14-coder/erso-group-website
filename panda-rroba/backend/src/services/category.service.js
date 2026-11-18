const Category = require('../models/Category');
const { CATEGORIES } = require('../config/constants');

const DEFAULT_EMOJI = { rroba: '👕', kepuce: '👟', canta: '👜', portofola: '👛', aksesore: '🧢' };

/** Creates the starting categories the first time the shop runs. */
async function ensureDefaultCategories() {
  if (await Category.estimatedDocumentCount()) return;
  await Category.insertMany(
    CATEGORIES.map((c, i) => ({ key: c.key, label: c.label, emoji: DEFAULT_EMOJI[c.key] || '', position: i }))
  ).catch((err) => { if (err.code !== 11000) throw err; });
}

async function listCategories({ includeHidden = false } = {}) {
  await ensureDefaultCategories();
  return Category.find(includeHidden ? {} : { active: true }).sort({ position: 1, createdAt: 1 });
}

async function categoryExists(key) {
  await ensureDefaultCategories();
  return Boolean(await Category.exists({ key }));
}

module.exports = { ensureDefaultCategories, listCategories, categoryExists };
