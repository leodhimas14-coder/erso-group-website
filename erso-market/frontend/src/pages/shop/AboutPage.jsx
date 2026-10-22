import { useConfig } from '../../context/ConfigContext';
import RichText from '../../lib/RichText';
export default function AboutPage() {
  const { pages } = useConfig();
  if (pages?.about) {
    return (
      <div className="container section narrow prose">
        <h1 className="page-title">Kush jemi</h1>
        <RichText text={pages.about} />
      </div>
    );
  }
  return (
    <div className="container section narrow prose">
      <h1 className="page-title">Kush jemi</h1>
      <p>ERSO Market është dyqani i ERSO GROUP SHPK, kompani shqiptare transporti dhe importi me bazë në Durrës. Sjellim direkt nga fabrikat në Kinë makina, makineta, motorra, pajisje shtëpiake, makineri ndërtimi dhe pista detare.</p>
      <p>Punojmë drejtpërdrejt me fabrikat, pa ndërmjetës të panevojshëm. Mallin e kontrollojmë në fabrikë para pagesës, e paketojmë, e transportojmë me det, tokë ose ajër dhe e zhdoganojmë në Shqipëri.</p>
      <p>Çdo porosi mund ta ndjekësh hap pas hapi, nga fabrika deri te dera. Për çdo pyetje na shkruaj në WhatsApp.</p>
    </div>
  );
}
