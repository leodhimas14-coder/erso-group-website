/* Starts the API with a temporary in-memory MongoDB, an admin account and
 * sample products, so the shop can be tried without installing anything.
 * Data is lost when the process stops.  Usage: npm run dev:memory
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret';

  const { connectDB } = require('../config/db');
  const { createApp } = require('../app');
  const User = require('../models/User');
  const Product = require('../models/Product');

  await connectDB();
  await User.create({ name: 'Admin', email: 'admin@panda.al', role: 'admin', passwordHash: await bcrypt.hash('panda1234', 10) });
  const { SAMPLE_PRODUCTS } = require('./sample-products');
  await Product.insertMany(SAMPLE_PRODUCTS);

  const port = Number(process.env.PORT) || 4000;
  createApp().listen(port, () => {
    console.log(`[dev] API në http://localhost:${port} (databazë e përkohshme)`);
    console.log('[dev] Admin: admin@panda.al / panda1234');
  });

  const stop = async () => { await mongoose.disconnect(); await mongo.stop(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
