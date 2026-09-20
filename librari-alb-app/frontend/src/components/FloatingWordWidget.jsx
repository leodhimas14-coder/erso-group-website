import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STORAGE_KEY = 'librari_alb_widget_pos';
const SIZE = 72;
const DRAG_THRESHOLD = 6; // px of movement before a press counts as a drag, not a click

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function defaultPosition() {
  return { x: window.innerWidth - SIZE - 16, y: window.innerHeight - SIZE - 24 };
}

function loadPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.x === 'number' && typeof saved.y === 'number') return saved;
  } catch (err) {
    // ignore malformed/missing saved position, fall back to default
  }
  return defaultPosition();
}

/**
 * Small square button, draggable anywhere on screen, that opens the
 * "Fjala e Ditës" word game. It floats above every page (not just the feed)
 * so the game is always one tap away.
 */
export default function FloatingWordWidget() {
  const [pos, setPos] = useState(loadPosition);
  const dragState = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => {
      setPos((prev) => ({
        x: clamp(prev.x, 0, window.innerWidth - SIZE),
        y: clamp(prev.y, 0, window.innerHeight - SIZE),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragState.current) return;
    const { startX, startY, originX, originY } = dragState.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragState.current.moved = true;
    }

    setPos({
      x: clamp(originX + dx, 0, window.innerWidth - SIZE),
      y: clamp(originY + dy, 0, window.innerHeight - SIZE),
    });
  };

  const handlePointerUp = (e) => {
    const state = dragState.current;
    dragState.current = null;
    if (!state) return;

    if (state.moved) {
      setPos((current) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        return current;
      });
    } else {
      navigate('/fjala-e-dites');
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <button
      type="button"
      className="floating-word-widget"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      title="Fjala e Ditës"
    >
      <span className="floating-word-widget-icon">🗨️</span>
      <span className="floating-word-widget-label">Fjala e Ditës</span>
    </button>
  );
}
