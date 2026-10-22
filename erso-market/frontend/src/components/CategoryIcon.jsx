// Line icons for the starting ERSO categories. A category the owner adds later
// shows its photo or emoji instead (Admin → Kategoritë).
const PATHS = {
  makina: '<path d="M4 33v-8l6-9h21l8 9h5v8z"/><circle cx="13" cy="34" r="4.5"/><circle cx="35" cy="34" r="4.5"/><path class="a" d="M12 25l4-6h7v6zM26 25v-6h3l5 6z"/>',
  makineta: '<circle cx="11" cy="36" r="5"/><circle cx="37" cy="36" r="5"/><path d="M11 36h12l6-7h8M33 29l3-19h6M13 26h12v3"/><path class="a" d="M36 10h-4M16 22h7"/>',
  motorra: '<circle cx="10" cy="33" r="7"/><circle cx="38" cy="33" r="7"/><path d="M10 33l8-12h11l9 12M29 21l4-7h6M18 21l-3-5h-5"/><path class="a" d="M19 25h10"/>',
  shtepiake: '<rect x="4" y="9" width="40" height="17" rx="3"/><path d="M8 21h32"/><path class="a" d="M14 31c-2 3 2 5 0 9M24 31c-2 3 2 5 0 9M34 31c-2 3 2 5 0 9"/>',
  ndertim: '<path d="M4 41h30"/><rect x="5" y="33" width="26" height="8" rx="4"/><path d="M9 33v-9h13v9"/><path class="a" d="M22 27l9-14 11 8-3 6M39 27l4 6h-9z"/>',
  'pista-detare': '<path d="M4 29h40M6 29v-6h10v6M19 29v-6h10v6M32 29v-6h10v6M11 23v-9M37 23v-9"/><path class="a" d="M3 36c3-2 5 2 8 0s5 2 8 0 5 2 8 0 5 2 8 0 5 2 7 0"/>',
};

export default function CategoryIcon({ category, size = 40 }) {
  if (category.image) return <img className="category-img" src={category.image} alt="" />;
  const path = PATHS[category.key];
  if (!path) return <span className="category-emoji" aria-hidden="true">{category.emoji || '📦'}</span>;
  return (
    <svg className="line-icon" width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" dangerouslySetInnerHTML={{ __html: path }} />
  );
}
