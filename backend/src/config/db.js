const mongoose = require('mongoose');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  const isSrv = uri.startsWith('mongodb+srv://');
  // Extract host part without credentials for safe logging
  const hostPart = (() => {
    try {
      const noScheme = uri.replace(/^mongodb(?:\+srv)?:\/\//, '');
      return noScheme.split('@').pop().split('/')[0];
    } catch {
      return 'unknown-host';
    }
  })();

  const dbName = process.env.MONGO_DB_NAME || 'OceanCare';

  const options = {
    dbName,
    serverSelectionTimeoutMS: 10000,
  };

  console.log('[DB] Connecting to MongoDB...', {
    mongooseVersion: mongoose.version,
    isSrv,
    host: hostPart,
    dbName,
  });

  await mongoose.connect(uri, options);
  console.log('✅ MongoDB connected');
}

module.exports = { connectDB };
