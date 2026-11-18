import { Link } from 'react-router-dom';
import { IS_DEMO } from '../lib/api';

/** Banner shown only in the demo build: explains the demo and links shop ↔ admin. */
export default function DemoBar({ admin = false }) {
  if (!IS_DEMO) return null;
  const reset = () => import('../lib/demoApi').then((m) => { m.resetDemo(); window.location.reload(); });
  return (
    <div className="demo-bar">
      <span><b>Demo</b> · të dhënat ruhen vetëm në këtë shfletues</span>
      <span className="demo-actions">
        {admin ? <Link to="/">← Shiko dyqanin</Link> : <Link to="/admin">Paneli i adminit →</Link>}
        <button type="button" onClick={reset}>Rifillo demon</button>
      </span>
    </div>
  );
}
