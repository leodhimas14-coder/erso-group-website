import { useConfig } from '../../context/ConfigContext';
import RichText from '../../lib/RichText';
import { lek } from '../../lib/format';

export default function InfoPage() {
  const { pages, shipping, payments } = useConfig();
  if (pages?.info) {
    return (
      <div className="container section narrow prose">
        <h1 className="page-title">Dërgesa dhe pagesa</h1>
        <RichText text={pages.info} />
      </div>
    );
  }
  return (
    <div className="container section narrow prose">
      <h1 className="page-title">Dërgesa dhe pagesa</h1>
      <h3>Sa zgjat dërgesa?</h3>
      <p>Produktet me shenjën <b>"Gati në Shqipëri"</b> dorëzohen për {shipping.localText}. Produktet e tjera i blejmë në fabrikë pas porosisë dhe dorëzohen zakonisht për {shipping.chinaText}, sipas transportit (det, tokë ose ajër).</p>
      <h3>Si paguaj?</h3>
      {payments.card && <p>Me kartë (Visa ose Mastercard) në momentin e porosisë, përmes faqes së sigurt të bankës. Ne nuk i shohim të dhënat e kartës.</p>}
      {payments.cod && <p>Me para në dorë kur të merrni porosinë.</p>}
      <h3>Sa kushton transporti?</h3>
      <p>
        {shipping.fee > 0 ? <>Transporti kushton {lek(shipping.fee)}</> : <>Transporti deri në Shqipëri dhe zhdoganimi përfshihen në çmim, përveç kur shkruhet ndryshe te produkti</>}
        {shipping.fee > 0 && shipping.freeFrom > 0 && <>, dhe është <b>falas</b> për porosi mbi {lek(shipping.freeFrom)}</>}.
      </p>
      <h3>A ka garanci?</h3>
      <p>Çdo produkt vjen me garancinë e fabrikës, që shkruhet te specifikimet. Mallin e inspektojmë në fabrikë para pagesës dhe ju dërgojmë foto e video.</p>
      <h3>Po nëse produkti vjen i dëmtuar?</h3>
      <p>Na dërgoni foto brenda 48 orëve dhe ne e zëvendësojmë ose ju kthejmë paratë.</p>
    </div>
  );
}
