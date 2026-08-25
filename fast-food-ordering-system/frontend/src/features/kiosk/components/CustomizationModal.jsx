import { useState } from 'react';
import { useCart } from '../../../context/CartContext.jsx';

/** Lets the customer pick required/optional option groups (size, extras, sauce...) before adding to cart. */
export default function CustomizationModal({ product, onClose }) {
  const { addItem } = useCart();
  const [selections, setSelections] = useState({}); // groupName -> choiceName[]
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const toggleChoice = (group, choice) => {
    setSelections((prev) => {
      const current = prev[group.name] || [];
      if (group.multiSelect) {
        const next = current.includes(choice.name)
          ? current.filter((c) => c !== choice.name)
          : [...current, choice.name];
        return { ...prev, [group.name]: next };
      }
      return { ...prev, [group.name]: [choice.name] };
    });
  };

  const missingRequired = product.optionGroups
    .filter((g) => g.required)
    .some((g) => !(selections[g.name] || []).length);

  const handleAdd = () => {
    const selectedOptions = product.optionGroups.flatMap((group) =>
      (selections[group.name] || []).map((choiceName) => {
        const choice = group.choices.find((c) => c.name === choiceName);
        return { groupName: group.name, choiceName, priceDelta: choice.priceDelta };
      })
    );

    addItem({
      productId: product._id,
      name: product.name,
      basePrice: product.basePrice,
      quantity,
      selectedOptions,
      notes,
    });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ background: '#fff', borderRadius: 8, padding: '1.5rem', width: 400, maxHeight: '80vh', overflowY: 'auto' }}>
        <h2>{product.name}</h2>
        <p>{product.description}</p>

        {product.optionGroups.map((group) => (
          <fieldset key={group.name} style={{ marginBottom: '1rem' }}>
            <legend>
              {group.name} {group.required && '*'}
            </legend>
            {group.choices.map((choice) => (
              <label key={choice.name} style={{ display: 'block' }}>
                <input
                  type={group.multiSelect ? 'checkbox' : 'radio'}
                  name={group.name}
                  checked={(selections[group.name] || []).includes(choice.name)}
                  onChange={() => toggleChoice(group, choice)}
                />
                {choice.name} {choice.priceDelta ? `(+${choice.priceDelta.toFixed(2)} L)` : ''}
              </label>
            ))}
          </fieldset>
        ))}

        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ width: '100%' }} />
        </label>

        <label style={{ display: 'block', marginBottom: '1rem' }}>
          Quantity
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            style={{ width: 60, marginLeft: '0.5rem' }}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleAdd} disabled={missingRequired}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
