// Example products used by `npm run seed` and `npm run dev:memory`. Replace them
// with the real catalog from Admin → Produktet.
const img = (seed) => `https://picsum.photos/seed/${seed}/1000/800`;

const SAMPLE_PRODUCTS = [
  {
    name: 'Skuter elektrik 72V 3000W',
    slug: 'skuter-elektrik-72v-3000w',
    category: 'makineta',
    description: 'Skuter me dy bateri litium, frena disku dhe ndriçim LED. Për qytet dhe distanca të mesme.',
    images: [img('erso-scooter')],
    price: 1290,
    minQty: 2,
    featured: true,
    specs: [{ label: 'Motori', value: '3000 W' }, { label: 'Autonomia', value: '~110 km' }, { label: 'Shpejtësia', value: 'deri 70 km/h' }],
    variants: ['E zezë', 'Gri'].map((color) => ({ color, stock: 0 })),
    supplier: { name: 'Fabrikë në Wuxi', url: '', costCny: 5200 },
  },
  {
    name: 'Kondicioner inverter 12000 BTU',
    slug: 'kondicioner-inverter-12000-btu',
    category: 'shtepiake',
    description: 'Klasa A++, gaz R32, funksion ngrohje dhe WiFi opsional.',
    images: [img('erso-ac')],
    price: 260,
    minQty: 10,
    featured: true,
    specs: [{ label: 'Fuqia', value: '12000 BTU' }, { label: 'Klasa', value: 'A++' }],
    supplier: { name: 'Fabrikë në Ningbo', url: '', costCny: 1100 },
  },
  {
    name: 'Mini ekskavator 1.8 ton',
    slug: 'mini-ekskavator-1-8-ton',
    category: 'ndertim',
    description: 'Motor 3 cilindra, kovë standarde, çekiç hidraulik opsional.',
    images: [img('erso-excavator')],
    price: 11000,
    featured: true,
    specs: [{ label: 'Pesha', value: '1 800 kg' }, { label: 'Thellësia e gërmimit', value: '2.2 m' }],
    supplier: { name: 'Fabrikë në Jining', url: '', costCny: 52000 },
  },
  {
    name: 'Pistë lundruese alumini 12 m',
    slug: 'piste-lundruese-alumini-12-m',
    category: 'pista-detare',
    description: 'Module 3 m me pontone, dysheme WPC kundër rrëshqitjes. Çmimi varet nga ankorimi dhe gjatësia.',
    images: [img('erso-dock')],
    price: 0,
    priceOnRequest: true,
    specs: [{ label: 'Gjatësia', value: '12 m (4 module)' }, { label: 'Garancia', value: '5 vjet struktura' }],
    supplier: { name: 'Fabrikë në Guangzhou', url: '', costCny: 0 },
  },
];

module.exports = { SAMPLE_PRODUCTS };
