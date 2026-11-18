import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi';

const TILES = [
  { label: 'Femra', to: '/dyqani?gjinia=femra', query: 'gender=femra', gender: 'femra' },
  { label: 'Meshkuj', to: '/dyqani?gjinia=meshkuj', query: 'gender=meshkuj', gender: 'meshkuj' },
  { label: 'Fëmijë', to: '/dyqani?gjinia=femije', query: 'gender=femije', gender: 'femije' },
  { label: 'Ofertat', to: '/dyqani?oferta=1', query: 'sale=1' },
];

// Each tile shows the newest product photo from its section, preferring a
// product made for that section over a unisex one.
function Tile({ tile }) {
  const { data } = useApi(`/products?${tile.query}&limit=12`);
  const products = data?.products || [];
  const pick = products.find((p) => p.gender === tile.gender && p.images?.[0]) || products.find((p) => p.images?.[0]);
  const image = pick?.images?.[0];
  return (
    <Link to={tile.to} className="gender-tile">
      {image ? <img src={image} alt="" loading="lazy" /> : <div className="img-placeholder" />}
      <span>{tile.label}</span>
    </Link>
  );
}

export default function GenderTiles() {
  return (
    <section className="container section gender-tiles">
      {TILES.map((t) => <Tile key={t.label} tile={t} />)}
    </section>
  );
}
