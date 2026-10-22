import Icon from './Icon';
import { useWishlist } from '../context/WishlistContext';

export default function SaveButton({ product, className = 'save-btn', size = 20 }) {
  const { has, toggle } = useWishlist();
  const saved = has(product._id);
  return (
    <button
      type="button"
      className={`${className} ${saved ? 'saved' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? 'Hiqe nga të ruajturat' : 'Ruaje produktin'}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product); }}
    >
      <Icon name="heart" size={size} filled={saved} />
    </button>
  );
}
