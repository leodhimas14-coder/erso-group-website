import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Gates a route to signed-in users, optionally restricted to specific roles. */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Duke ngarkuar...</p>;
  if (!user) return <Navigate to="/hyrje" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
