import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { api } from '../lib/api';
import { lek } from '../lib/format';

const SUGGESTIONS = ['Çantë', 'Atlete', 'Xhaketë', 'Portofol', 'Bluzë'];

export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Live results, debounced so we don't query on every keystroke.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults(null); return undefined; }
    const t = setTimeout(() => {
      api(`/products?q=${encodeURIComponent(term)}&limit=6`).then((d) => setResults(d)).catch(() => setResults(null));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    onClose();
    navigate(`/dyqani?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Kërko">
      <form className="search-bar" onSubmit={submit} role="search">
        <Icon name="search" size={20} />
        <input ref={inputRef} id="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Çfarë po kërkon?" aria-label="Kërko produkte" enterKeyHint="search" />
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Mbyll kërkimin"><Icon name="x" /></button>
      </form>

      <div className="search-body">
        {!results && (
          <>
            <p className="eyebrow-dark">Kërkimet e njohura</p>
            <div className="chips">
              {SUGGESTIONS.map((s) => <button key={s} type="button" className="chip" onClick={() => setQ(s)}>{s}</button>)}
            </div>
          </>
        )}
        {results && results.products.length === 0 && <p className="muted">Asnjë produkt për "{q}".</p>}
        {results && results.products.length > 0 && (
          <>
            <ul className="search-results">
              {results.products.map((p) => (
                <li key={p._id}>
                  <Link to={`/produkt/${p.slug}`} onClick={onClose}>
                    {p.images[0] ? <img src={p.images[0]} alt="" /> : <div className="img-placeholder" />}
                    <span className="grow">{p.name}</span>
                    <b>{lek(p.price)}</b>
                  </Link>
                </li>
              ))}
            </ul>
            {results.total > results.products.length && (
              <button type="button" className="btn btn-outline btn-block" onClick={submit}>Shiko të gjitha ({results.total})</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
