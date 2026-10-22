/* Creates the first admin account and a few sample products.
 * Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');

const { SAMPLE_PRODUCTS } = require('./sample-products');

async function main() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';
  if (email && password) {
    if (password.length < 8) throw new Error('ADMIN_PASSWORD duhet të ketë të paktën 8 karaktere');
    await User.updateOne(
      { email },
      { $set: { name: process.env.ADMIN_NAME || 'Admin', role: 'admin', active: true, passwordHash: await bcrypt.hash(password, 10) } },
      { upsert: true }
    );
    console.log(`[seed] Admin gati: ${email}`);
  } else {
    console.log('[seed] ADMIN_EMAIL/ADMIN_PASSWORD nuk janë vendosur, admini nuk u krijua');
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany(SAMPLE_PRODUCTS);
    console.log(`[seed] U shtuan ${SAMPLE_PRODUCTS.length} produkte shembull`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
