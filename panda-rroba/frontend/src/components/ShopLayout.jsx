import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Icon from './Icon';
import SiteFooter from './SiteFooter';
import MenuDrawer from './MenuDrawer';
import SearchOverlay from './SearchOverlay';
import DemoBar from './DemoBar';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useConfig } from '../context/ConfigContext';
import { useCustomer } from '../context/CustomerContext';

export default function ShopLayout() {
  const { count } = useCart();
  const { count: savedCount } = useWishlist();
  const { promoBar, contact } = useConfig();
  const { customer } = useCustomer();
  const whatsapp = contact.whatsapp || import.meta.env.VITE_WHATSAPP;
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuTop, setMenuTop] = useState(0);
  const headerRef = useRef(null);

  // The menu sits right under the header. Measure where the header ends
  // (it moves as the banners above it scroll away) instead of relying on CSS,
  // which iPhone Safari gets wrong for fixed panels inside a sticky header.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const measure = () => setMenuTop(Math.max(0, headerRef.current?.getBoundingClientRect().bottom ?? 0));
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [menuOpen]);

  // Close overlays whenever the page changes.
  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [pathname, search]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <div className="shop">
      <DemoBar />
      <header className="shop-header" ref={headerRef}>
        <div className="container shop-header-inner">
          <div className="header-side">
            <button type="button" className="header-icon" onClick={() => { setSearchOpen(false); setMenuOpen((o) => !o); }} aria-label={menuOpen ? 'Mbyll menunë' : 'Hap menunë'} aria-expanded={menuOpen}>
              <Icon name={menuOpen ? 'x' : 'menu'} />
            </button>
            <button type="button" className="header-icon" onClick={() => { setMenuOpen(false); setSearchOpen(true); }} aria-label="Kërko">
              <Icon name="search" />
            </button>
          </div>

          <Link to="/" className="wordmark" aria-label="Panda.al, kryefaqja">PANDA</Link>

          <div className="header-side right">
            <Link to="/llogaria" className="header-icon" aria-label={customer ? `Llogaria ime (${customer.name})` : 'Hyr ose krijo llogari'}>
              <Icon name="user" />
              {customer && <span className="signed-in-dot" aria-hidden="true" />}
            </Link>
            <Link to="/te-ruajturat" className="header-icon" aria-label={`Të ruajturat, ${savedCount}`}>
              <Icon name="heart" />
              {savedCount > 0 && <span className="badge badge-soft">{savedCount}</span>}
            </Link>
            <Link to="/shporta" className="header-icon" aria-label={`Shporta, ${count} artikuj`}>
              <Icon name="bag" />
              {count > 0 && <span className="badge">{count}</span>}
            </Link>
          </div>
        </div>
      </header>
      {promoBar.enabled && promoBar.text && <div className="promo-bar">{promoBar.text}</div>}
      <MenuDrawer open={menuOpen} onClose={closeMenu} top={menuTop} />
      <SearchOverlay open={searchOpen} onClose={closeSearch} />

      <main className="shop-main">
        <Outlet />
      </main>

      <SiteFooter />

      {whatsapp && (
        <a className="wa-float" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" aria-label="Na shkruani në WhatsApp">
          <Icon name="whatsapp" size={26} />
        </a>
      )}
    </div>
  );
}
