import { useConfig } from '../../context/ConfigContext';
import RichText from '../../lib/RichText';
// Plain-language summary. Have it reviewed by a lawyer before launch.
export default function TermsPage() {
  const { pages } = useConfig();
  if (pages?.terms) {
    return (
      <div className="container section narrow prose">
        <h1 className="page-title">Privatësia dhe kushtet</h1>
        <RichText text={pages.terms} />
      </div>
    );
  }
  return (
    <div className="container section narrow prose">
      <h1 className="page-title">Privatësia dhe kushtet</h1>

      <h3>Çfarë të dhënash mbledhim</h3>
      <p>Kur bën një porosi: emrin, numrin e telefonit, qytetin dhe adresën, që ta dorëzojmë porosinë dhe të të kontaktojmë për të. Kur regjistrohesh për njoftime: adresën e email-it.</p>

      <h3>Si i përdorim</h3>
      <p>Të dhënat e porosisë i përdorim vetëm për konfirmimin, dërgesën dhe shërbimin pas shitjes. I ndajmë vetëm me korrierin që e dorëzon pakon. Email-in e përdorim për të të dërguar oferta dhe lajme për produktet e reja, vetëm nëse ke dhënë pëlqimin.</p>

      <h3>Njoftimet me email</h3>
      <p>Mund të çregjistrohesh kurdo duke na shkruar. Pas çregjistrimit nuk të dërgojmë më asnjë mesazh promocional.</p>

      <h3>Të dhënat në telefonin tënd</h3>
      <p>Shporta, produktet e ruajtura dhe adresa për porosinë e radhës ruhen vetëm në shfletuesin e telefonit tënd. Nuk përdorim cookies reklamash.</p>

      <h3>Porositë dhe pagesa</h3>
      <p>Çmimet janë në lekë dhe përfshijnë TVSH-në. Pagesa bëhet me kartë në momentin e porosisë, përmes faqes së sigurt të bankës; ne nuk i shohim dhe nuk i ruajmë të dhënat e kartës. Nëse e anulon porosinë para se të blihet produkti, të kthejmë paratë në kartë.</p>

      <h3>Kthimet</h3>
      <p>Masën mund ta ndërrosh brenda 7 ditëve nga marrja, me produktin të papërdorur dhe me etiketa. Nëse produkti vjen i dëmtuar, na dërgo foto brenda 48 orëve.</p>

      <h3>Kontakti</h3>
      <p>Për çdo pyetje mbi të dhënat e tua ose porositë, na shkruaj në WhatsApp ose në email.</p>
    </div>
  );
}
