export const lek = (n) => `${Math.round(Number(n) || 0).toLocaleString('sq-AL').replace(/,/g, '.')} L`;

export const date = (d) =>
  new Date(d).toLocaleDateString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const dateTime = (d) =>
  new Date(d).toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export const CITIES = [
  'Tiranë', 'Durrës', 'Vlorë', 'Elbasan', 'Shkodër', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Kavajë',
  'Pogradec', 'Gjirokastër', 'Sarandë', 'Laç', 'Kukës', 'Lezhë', 'Patos', 'Kuçovë', 'Krujë', 'Burrel',
  'Peshkopi', 'Gramsh', 'Librazhd', 'Tepelenë', 'Përmet', 'Memaliaj', 'Mamurras', 'Fushë-Krujë',
  'Vorë', 'Rrogozhinë', 'Peqin', 'Cërrik', 'Divjakë', 'Ballsh', 'Delvinë', 'Himarë', 'Ersekë', 'Bilisht',
  'Bulqizë', 'Rrëshen', 'Lezhë', 'Shëngjin', 'Koplik', 'Pukë', 'Tropojë', 'Has', 'Tjetër',
].filter((c, i, a) => a.indexOf(c) === i);

export const STATUS_LABEL = {
  pa_paguar: 'Pret pagesën',
  e_re: 'Porosi e re',
  e_konfirmuar: 'E konfirmuar',
  e_blere: 'Blerë te furnitori',
  ne_magazine: 'Në magazinë në Kinë',
  ne_rruge: 'Në rrugë për Shqipëri',
  ne_shqiperi: 'Mbërriti në Shqipëri',
  ne_dorezim: 'Te korrieri',
  e_dorezuar: 'E dorëzuar',
  e_anuluar: 'E anuluar',
};

export const STATUS_FLOW = ['e_re', 'e_konfirmuar', 'e_blere', 'ne_magazine', 'ne_rruge', 'ne_shqiperi', 'ne_dorezim', 'e_dorezuar'];

export const GENDER_LABEL = { femra: 'Femra', meshkuj: 'Meshkuj', femije: 'Fëmijë', unisex: 'Unisex' };

// What the admin's main button says for each step, and the status it moves to.
export const ORDER_ACTIONS = {
  pa_paguar: { label: 'Shëno si të paguar', to: 'e_re' },
  e_re: { label: '✓ Prano porosinë', to: 'e_konfirmuar' },
  e_konfirmuar: { label: 'U ble te furnitori', to: 'e_blere' },
  e_blere: { label: 'Mbërriti në magazinë', to: 'ne_magazine' },
  ne_magazine: { label: 'U nis me transport', to: 'ne_rruge' },
  ne_rruge: { label: 'Mbërriti në Shqipëri', to: 'ne_shqiperi' },
  ne_shqiperi: { label: 'Iu dha korrierit', to: 'ne_dorezim' },
  ne_dorezim: { label: '✓ U dorëzua te klienti', to: 'e_dorezuar' },
};

export const CATEGORY_LABEL = { rroba: 'Rroba', kepuce: 'Këpucë', canta: 'Çanta', portofola: 'Portofola', aksesore: 'Aksesorë' };

export const SHIPMENT_LABEL = { ne_pergatitje: 'Në përgatitje', nisur: 'U nis nga Kina', mberritur: 'Mbërriti në Shqipëri' };
