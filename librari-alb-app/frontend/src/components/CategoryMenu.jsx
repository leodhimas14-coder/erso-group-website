import { useNavigate } from 'react-router-dom';
import { PINNED_CATEGORIES, GENERAL_CATEGORIES } from '../constants/categories.js';

/**
 * The drawer opened by tapping the Home button - lets the user jump straight
 * to a topic channel (Protesta, Sport, Anime & Manga, ...) instead of the
 * unfiltered feed. "Lajmet e Fundit" clears the filter and shows everything.
 */
export default function CategoryMenu({ onClose }) {
  const navigate = useNavigate();

  const goTo = (slug) => {
    if (slug) {
      navigate(`/?kategoria=${slug}`);
    } else {
      navigate('/');
    }
    onClose();
  };

  return (
    <div className="category-menu-overlay" onClick={onClose}>
      <div className="category-menu" onClick={(e) => e.stopPropagation()}>
        <div className="category-menu-header">
          <h2>Shtëpia</h2>
          <button type="button" className="category-menu-close" onClick={onClose} aria-label="Mbyll">
            ✕
          </button>
        </div>

        <ul className="category-menu-list">
          <li>
            <button type="button" onClick={() => goTo(null)}>
              📰 Lajmet e Fundit
            </button>
          </li>
          {PINNED_CATEGORIES.map((c) => (
            <li key={c.slug}>
              <button type="button" onClick={() => goTo(c.slug)}>
                {c.slug === 'lajme-urgjente' && '🔴 '}
                {c.slug === 'protesta' && '✊ '}
                {c.slug === 'tema-e-dites' && '📌 '}
                {c.label}
              </button>
            </li>
          ))}
        </ul>

        <h3 className="category-menu-subheading">Kategori</h3>
        <ul className="category-menu-list">
          {GENERAL_CATEGORIES.map((c) => (
            <li key={c.slug}>
              <button type="button" onClick={() => goTo(c.slug)}>
                {c.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
