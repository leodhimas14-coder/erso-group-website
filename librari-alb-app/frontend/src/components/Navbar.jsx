import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CategoryMenu from './CategoryMenu.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <button
        type="button"
        className="navbar-brand navbar-home-button"
        onClick={() => setMenuOpen(true)}
        title="Zgjidh kategorinë"
      >
        🏠 Librari Alb
      </button>
      <nav className="navbar-links">
        {user?.role === 'admin' && <Link to="/admin">Paneli i Adminit</Link>}
        {user ? (
          <>
            <Link to={`/${user.username}`}>@{user.username}</Link>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Dil
            </button>
          </>
        ) : (
          <>
            <Link to="/hyrje">Hyr</Link>
            <Link to="/regjistrohu">Regjistrohu</Link>
          </>
        )}
      </nav>

      {menuOpen && <CategoryMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}
