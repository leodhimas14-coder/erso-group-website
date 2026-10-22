import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MAP } from './introMap';
import Logo from './Logo';

const SEEN_KEY = 'erso_intro_seen';

// Shown once each time the app or website is opened (one browser session),
// only when the visit starts on the home page. A tap opens the catalog.
const shouldShow = (pathname) => {
  if (pathname !== '/') return false;
  try { return !sessionStorage.getItem(SEEN_KEY); } catch { return true; }
};

export default function IntroSplash() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => shouldShow(pathname));
  const [leaving, setLeaving] = useState(false);
  const enterRef = useRef(null);

  const enter = () => {
    if (leaving) return;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    setLeaving(true);
    navigate('/dyqani');
    setTimeout(() => setOpen(false), 450);
  };

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    enterRef.current?.focus();
    const onKey = (e) => { if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); enter(); } };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  });

  if (!open) return null;
  const [ox, oy] = MAP.origin;
  const [dx, dy] = MAP.dest;
  // On phones, zoom in on the stretch between Albania and China so the route reads well.
  const narrow = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 600px)').matches;
  const viewBox = narrow ? `${dx - 60} 0 ${ox - dx + 120} ${MAP.h}` : `0 0 ${MAP.w} ${MAP.h}`;

  return (
    <div className={`intro${leaving ? ' intro-out' : ''}`} role="dialog" aria-modal="true" aria-label="ERSO Market" onClick={enter}>
      <div className="intro-brand"><Logo size={40} /><span>ERSO <em>MARKET</em></span></div>

      <svg className="intro-map" viewBox={viewBox} aria-hidden="true">
        <defs>
          <linearGradient id="introArc" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#c81f2f" />
            <stop offset="1" stopColor="#f2f3f5" />
          </linearGradient>
        </defs>
        <path className="intro-dots" d={MAP.dots} />
        <path className="intro-glow" d={MAP.route} />
        <path className="intro-arc" d={MAP.route} pathLength="1" />
        <circle className="intro-ship" r="5">
          <animateMotion dur="3.2s" begin="1.4s" repeatCount="indefinite" path={MAP.route} />
        </circle>
        <circle className="intro-ring red" cx={ox} cy={oy} r="11" />
        <circle className="intro-pin red" cx={ox} cy={oy} r="5.5" />
        <circle className="intro-ring" cx={dx} cy={dy} r="11" />
        <circle className="intro-pin" cx={dx} cy={dy} r="5.5" />
        <text className="intro-code" x={ox} y={oy + 26} textAnchor="middle">KINË</text>
        <text className="intro-code" x={dx} y={dy - 16} textAnchor="middle">SHQIPËRI</text>
      </svg>

      <h1 className="intro-title">Nga Kina deri te dera <span>e shtëpisë suaj</span></h1>
      <button type="button" ref={enterRef} className="intro-enter" onClick={(e) => { e.stopPropagation(); enter(); }}>
        Prekni për të hyrë në katalog
      </button>
    </div>
  );
}
