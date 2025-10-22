const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  try {
    const MONGODB_URI = 'mongodb://localhost:27017/smartparking';
    const client = new MongoClient(MONGODB_URI);
    
    await client.connect();
    const db = client.db('smartparking');
    
    // Créer la collection users si elle n'existe pas
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      await db.createCollection('users');
      console.log('Collection "users" créée');
    }
    
    // Ajouter des utilisateurs de test optionnels
    const usersCollection = db.collection('users');
    
    const testUsers = [
      {
        email: 'admin@smartparking.com',
        password: 'admin123',
        name: 'Administrateur',
        role: 'admin',
        createdAt: new Date()
      },
      {
        email: 'operator@smartparking.com',
        password: 'operator123',
        name: 'Opérateur',
        role: 'operator',
        createdAt: new Date()
      },
      {
        email: 'customer@smartparking.com',
        password: 'customer123',
        name: 'Client Test',
        role: 'customer',
        createdAt: new Date()
      }
    ];

    for (const user of testUsers) {
      const exists = await usersCollection.findOne({ email: user.email });
      if (!exists) {
        await usersCollection.insertOne(user);
        console.log(`Utilisateur ${user.email} créé`);
      }
    }
    
    await client.close();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Base de données initialisée avec succès',
        users: testUsers 
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};