require('dotenv').config();
const http = require('http');
const { createApp } = require('./app');
const { connectDB } = require('./config/db');
const { initSockets } = require('./sockets/index');

async function start() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);
  initSockets(server);

  const port = process.env.PORT || 4000;
  server.listen(port, () => {
    console.log(`[server] Sheshi API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
