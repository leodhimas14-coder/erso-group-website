import { STATUS_FLOW, STATUS_LABEL, dateTime } from '../lib/format';

// Customers see a simplified journey; internal steps are merged.
const CUSTOMER_STEPS = [
  { label: 'Porosia u pranua', statuses: ['e_re', 'e_konfirmuar'] },
  { label: 'Po përgatitet', statuses: ['e_blere', 'ne_magazine'] },
  { label: 'Në rrugë për Shqipëri', statuses: ['ne_rruge'] },
  { label: 'Në Shqipëri', statuses: ['ne_shqiperi', 'ne_dorezim'] },
  { label: 'U dorëzua', statuses: ['e_dorezuar'] },
];

export default function StatusTimeline({ order }) {
  if (order.status === 'pa_paguar') {
    return <div className="alert alert-info">{order.paymentMethod === 'bank' ? 'Kjo porosi pret transfertën bankare.' : 'Kjo porosi pret pagesën me kartë.'}</div>;
  }
  if (order.status === 'e_anuluar') {
    return <div className="alert alert-error">Kjo porosi është anuluar.</div>;
  }
  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const reachedAt = (statuses) => order.statusHistory.find((h) => statuses.includes(h.status))?.at;

  return (
    <ol className="timeline">
      {CUSTOMER_STEPS.map((step) => {
        const done = step.statuses.some((s) => STATUS_FLOW.indexOf(s) <= currentIndex);
        const current = step.statuses.includes(order.status);
        const at = reachedAt(step.statuses);
        return (
          <li key={step.label} className={`${done ? 'done' : ''} ${current ? 'current' : ''}`}>
            <span className="dot" />
            <div>
              <strong>{step.label}</strong>
              {current && order.status !== step.statuses[0] && <div className="muted small">{STATUS_LABEL[order.status]}</div>}
              {done && at && <div className="muted small">{dateTime(at)}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
