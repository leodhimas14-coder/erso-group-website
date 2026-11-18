import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';
import DemoBar from '../../components/DemoBar';

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) return <div className="admin-loading">Duke u ngarkuar…</div>;
  if (!user) return <Navigate to="/admin/hyr" replace state={{ from: location.pathname }} />;

  const isAdmin = user.role === 'admin';
  return (
    <div className="admin">
      <aside className="admin-nav">
        <div className="admin-brand"><Logo size={26} /> <span>Panda Admin</span></div>
        <nav>
          <NavLink to="/admin" end>Paneli</NavLink>
          <NavLink to="/admin/porosite">Porositë</NavLink>
          <NavLink to="/admin/per-te-blere">Për të blerë</NavLink>
          <NavLink to="/admin/dergesat">Dërgesat (kargo)</NavLink>
          {isAdmin && <NavLink to="/admin/produktet">Produktet</NavLink>}
          {isAdmin && <NavLink to="/admin/kategorite">Kategoritë</NavLink>}
          {isAdmin && <NavLink to="/admin/klientet">Klientët</NavLink>}
          {isAdmin && <NavLink to="/admin/cilesimet">Cilësimet</NavLink>}
          {isAdmin && <NavLink to="/admin/abonentet">Abonentët</NavLink>}
        </nav>
        <div className="admin-user">
          <span>{user.name}</span>
          <button type="button" className="link-btn" onClick={logout}>Dil</button>
        </div>
      </aside>
      <main className="admin-main">
        <DemoBar admin />
        <Outlet />
      </main>
    </div>
  );
}
