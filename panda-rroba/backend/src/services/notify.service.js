// Sends a message to the shop owner's phone through a Telegram bot when a new
// order arrives. Does nothing if TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set.

async function notifyOwner(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error('[notify] Telegram failed:', err.message);
  }
}

function formatNewOrder(order) {
  const lines = order.items.map(
    (i) => `• ${i.quantity}× ${i.name}${i.size ? ` (${i.size}` : ''}${i.color ? `${i.size ? ', ' : ' ('}${i.color}` : ''}${i.size || i.color ? ')' : ''}`
  );
  return [
    `🐼 Porosi e re ${order.number}`,
    `${order.customer.name} · ${order.customer.phone}`,
    `${order.customer.city}, ${order.customer.address}`,
    ...lines,
    `Totali: ${order.total.toLocaleString('sq-AL')} L`,
  ].join('\n');
}

module.exports = { notifyOwner, formatNewOrder };
