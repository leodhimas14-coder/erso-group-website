require('dotenv').config();
const { createApp } = require('./app');
const { connectDB } = require('./config/db');
const { expireUnpaidOrders } = require('./services/order.service');

async function main() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not set');
  await connectDB();
  const port = Number(process.env.PORT) || 4000;
  createApp().listen(port, () => console.log(`[api] Panda.al API në http://localhost:${port}`));

  // Release stock held by card checkouts that were never paid.
  setInterval(() => {
    expireUnpaidOrders(60).catch((err) => console.error('[expire]', err.message));
  }, 10 * 60 * 1000).unref();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
