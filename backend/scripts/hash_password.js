/*
  Usage:
    node scripts/hash_password.js --email imasha@oceancare.com --password "Ohealth@1234"

  This one-off maintenance script hashes a plaintext password for an existing user
  and updates the `passwordHash` field accordingly.
*/

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../src/models/User');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const val = args[i + 1];
    if (key && key.startsWith('--')) out[key.slice(2)] = val;
  }
  return out;
}

async function main() {
  const { email, password } = parseArgs();
  if (!email || !password) {
    console.error('Missing required args. Example: node scripts/hash_password.js --email you@example.com --password "YourNewP@ss1"');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB_NAME || 'oceancare';
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }

  console.log(`[SCRIPT] Connecting to MongoDB (db: ${dbName})...`);
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });
  console.log('[SCRIPT] Connected');

  try {
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      console.error('User not found for email:', email);
      process.exit(1);
    }

    // If the stored value already looks like a bcrypt hash, warn and exit.
    if (typeof user.passwordHash === 'string' && user.passwordHash.startsWith('$2')) {
      console.log('User already has a bcrypt hash. No update performed.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    user.passwordHash = passwordHash;
    await user.save();

    console.log('✅ Updated passwordHash for', email);
  } catch (err) {
    console.error('Error updating passwordHash:', err?.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('[SCRIPT] Disconnected');
  }
}

main();
