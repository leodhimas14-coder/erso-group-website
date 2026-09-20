import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        Librari Alb
      </Link>
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
    </header>
  );
}
