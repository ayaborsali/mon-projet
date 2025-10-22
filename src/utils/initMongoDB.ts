// src/utils/initMongoDB.ts
import { connectToDatabase } from '../../config/mongodb';

export const initializeMongoDB = async () => {
  try {
    const { db } = await connectToDatabase();
    
    // Créer les index pour optimiser les performances
    await db.collection('sessions').createIndex({ 'vehicle.plate': 1 });
    await db.collection('sessions').createIndex({ spaceNumber: 1 });
    await db.collection('sessions').createIndex({ status: 1 });
    await db.collection('sessions').createIndex({ entryTime: -1 });
    
    await db.collection('parkingSpaces').createIndex({ number: 1 }, { unique: true });
    await db.collection('parkingSpaces').createIndex({ status: 1 });
    await db.collection('parkingSpaces').createIndex({ type: 1 });
    
    await db.collection('notifications').createIndex({ timestamp: -1 });
    await db.collection('notifications').createIndex({ read: 1 });
    
    await db.collection('paiements').createIndex({ sessionId: 1 });
    await db.collection('paiements').createIndex({ paymentTime: -1 });

    console.log('✅ MongoDB initialisé avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur initialisation MongoDB:', error);
    return false;
  }
};