import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';

export const isVideo = (url) => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url || '');

/** The banner the owner sets in Admin → Kryefaqja. Renders nothing when empty. */
export default function HomeBanner({ banner: override }) {
  const { homeBanner } = useConfig();
  const banner = override || homeBanner;
  if (!banner?.url) return null;

  const media = isVideo(banner.url) ? (
    <video src={banner.url} poster={banner.posterUrl || undefined} autoPlay muted loop playsInline preload="metadata" aria-label="Video e koleksionit" />
  ) : (
    <img src={banner.url} alt="Koleksioni i ri" />
  );

  if (!banner.link) return <section className="home-banner">{media}</section>;
  return banner.link.startsWith('/')
    ? <Link to={banner.link} className="home-banner">{media}</Link>
    : <a href={banner.link} className="home-banner" target="_blank" rel="noreferrer">{media}</a>;
}
