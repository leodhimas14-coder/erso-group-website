import { useAuth } from '../../context/AuthContext.jsx';

export default function Header({ title }) {
  const { user, logout } = useAuth();

  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#1a1a1a', color: '#fff' }}>
      <h1 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h1>
      {user && (
        <div>
          <span style={{ marginRight: '1rem' }}>{user.name} ({user.role})</span>
          <button onClick={logout}>Log out</button>
        </div>
      )}
    </header>
  );
}
