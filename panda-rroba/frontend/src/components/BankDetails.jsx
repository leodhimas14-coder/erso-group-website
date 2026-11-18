import { useState } from 'react';
import { lek } from '../lib/format';

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* the value is selectable anyway */ }
  };
  return (
    <div className="copy-row">
      <span className="muted small">{label}</span>
      <b className="copy-value">{value}</b>
      <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>{copied ? 'U kopjua ✓' : 'Kopjo'}</button>
    </div>
  );
}

const groupIban = (iban) => iban.replace(/(.{4})/g, '$1 ').trim();

/** Where and how to send a bank transfer for an order. */
export default function BankDetails({ bank, order }) {
  if (!bank?.iban) return null;
  return (
    <div className="card bank-details">
      <h3>Paguaj me transfertë bankare</h3>
      <p className="muted small">Dërgo shumën e saktë dhe shkruaj numrin e porosisë te përshkrimi. Porosia niset sapo të mbërrijë pagesa (zakonisht 1–2 ditë pune).</p>
      <CopyRow label="Shuma" value={lek(order.total)} />
      <CopyRow label="Përshkrimi" value={order.number} />
      <CopyRow label="Përfituesi" value={bank.holder} />
      <CopyRow label="IBAN" value={groupIban(bank.iban)} />
      {bank.bankName && <CopyRow label="Banka" value={bank.bankName} />}
      {bank.swift && <CopyRow label="SWIFT/BIC" value={bank.swift} />}
    </div>
  );
}
