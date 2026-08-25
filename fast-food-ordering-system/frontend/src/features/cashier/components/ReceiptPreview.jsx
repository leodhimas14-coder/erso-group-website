export default function ReceiptPreview({ order }) {
  return (
    <div>
      <strong>#{order.orderNumber}</strong> {order.customerName && `- ${order.customerName}`}
      <ul style={{ paddingLeft: '1.2rem' }}>
        {order.items.map((item) => (
          <li key={item._id}>
            {item.quantity}x {item.nameSnapshot} - {(item.unitPrice * item.quantity).toFixed(2)} L
          </li>
        ))}
      </ul>
      <p>Subtotal: {order.subtotal.toFixed(2)} L</p>
      <p>Tax: {order.tax.toFixed(2)} L</p>
      <p>
        <strong>Total: {order.total.toFixed(2)} L</strong>
      </p>
    </div>
  );
}
