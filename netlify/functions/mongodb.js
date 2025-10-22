const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  // URL MongoDB - en développement local
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartparking';

  try {
    const client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db('smartparking');
    cachedDb = db;
    return db;
  } catch (error) {
    console.error('❌ Erreur connexion MongoDB:', error);
    throw error;
  }
}

module.exports = { connectToDatabase };s