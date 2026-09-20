/**
 * Categories a post can be tagged with. "PINNED" are the fixed shortcuts
 * that always show first in the category picker (opened from the Home
 * button); "GENERAL" are ordinary discussion topics listed below them in
 * no particular priority.
 */
const PINNED_CATEGORIES = [
  { slug: 'lajme-urgjente', label: 'Lajme Urgjente' },
  { slug: 'protesta', label: 'Protesta' },
  { slug: 'tema-e-dites', label: 'Tema e Ditës' },
];

const GENERAL_CATEGORIES = [
  { slug: 'kafshe', label: 'Kafshë' },
  { slug: 'politike', label: 'Politikë' },
  { slug: 'sport', label: 'Sport' },
  { slug: 'makina', label: 'Makina' },
  { slug: 'anime-manga', label: 'Anime & Manga' },
  { slug: 'muzike', label: 'Muzikë' },
  { slug: 'filma-seriale', label: 'Filma & Seriale' },
  { slug: 'humor', label: 'Humor' },
  { slug: 'teknologji', label: 'Teknologji' },
  { slug: 'shendetesi', label: 'Shëndetësi' },
  { slug: 'udhetime', label: 'Udhëtime' },
  { slug: 'ushqim', label: 'Ushqim' },
];

const ALL_CATEGORIES = [...PINNED_CATEGORIES, ...GENERAL_CATEGORIES];
const CATEGORY_SLUGS = ALL_CATEGORIES.map((c) => c.slug);

module.exports = { PINNED_CATEGORIES, GENERAL_CATEGORIES, ALL_CATEGORIES, CATEGORY_SLUGS };
