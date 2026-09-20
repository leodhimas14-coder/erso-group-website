/**
 * One-off CLI helper: promotes an existing user to admin so they can post
 * the daily topic. There's no in-app admin invite flow yet.
 *
 * Usage: node src/scripts/makeAdmin.js <username>
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error('Usage: node src/scripts/makeAdmin.js <username>');
    process.exit(1);
  }

  await connectDB();
  const user = await User.findOneAndUpdate(
    { username: username.toLowerCase() },
    { role: 'admin' },
    { new: true }
  );

  if (!user) {
    console.error(`No user found with username "${username}"`);
  } else {
    console.log(`"${user.username}" is now an admin.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
