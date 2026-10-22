import { useEffect, useState } from 'react';

/** Two-step button: the first click asks, the second click (within 4s) runs onConfirm. */
export default function ConfirmButton({ onConfirm, confirmText = 'Kliko përsëri për ta konfirmuar', className, disabled, children }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return undefined;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      className={`${className} ${armed ? 'btn-armed' : ''}`}
      disabled={disabled}
      onClick={() => {
        if (armed) { setArmed(false); onConfirm(); } else setArmed(true);
      }}
    >
      {armed ? confirmText : children}
    </button>
  );
}
