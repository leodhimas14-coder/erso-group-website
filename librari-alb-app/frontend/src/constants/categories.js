/**
 * Mirrors backend/src/constants/categories.js. Kept as a plain duplicated
 * constant (not fetched) since the list is small and static for Phase 1.
 */
export const PINNED_CATEGORIES = [
  { slug: 'lajme-urgjente', label: 'Lajme Urgjente' },
  { slug: 'protesta', label: 'Protesta' },
  { slug: 'tema-e-dites', label: 'Tema e Ditës' },
];

export const GENERAL_CATEGORIES = [
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

export const ALL_CATEGORIES = [...PINNED_CATEGORIES, ...GENERAL_CATEGORIES];

export function categoryLabel(slug) {
  return ALL_CATEGORIES.find((c) => c.slug === slug)?.label || slug;
}
