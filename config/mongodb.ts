// config/mongodb.ts
import { MongoClient, Db, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'smart-parking';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Connexion à MongoDB (réutilise la connexion si déjà ouverte)
 */
export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    // Test de la connexion
    await db.command({ ping: 1 });

    cachedClient = client;
    cachedDb = db;

    console.log('✅ Connecté à MongoDB avec succès');
    return { client, db };
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB :', error);
    throw error;
  }
}

/**
 * Retourne la base de données active
 */
export function getDb(): Db {
  if (!cachedDb) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return cachedDb;
}

/**
 * Ferme la connexion MongoDB
 */
export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('🔌 Connexion MongoDB fermée');
  }
}

/**
 * Convertit un ObjectId en string
 */
export function convertObjectIdToString(doc: any): any {
  if (!doc) return doc;

  if (doc._id && doc._id instanceof ObjectId) {
    return {
      id: doc._id.toString(),
      ...doc,
      _id: undefined
    };
  }

  return doc;
}

/**
 * Convertit un string en ObjectId
 */
export function convertStringToObjectId(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch (error) {
    throw new Error(`ID invalide: ${id}`);
  }
}

// Ici tu peux garder ton mongoService, collectionServices et initializeDatabase
// sans changement majeur, mais **assure-toi de n'utiliser ce fichier que côté serveur**
export const mongoService = {
  async find(collection: string, query: any = {}, options: any = {}) {
    const db = getDb();
    let cursor = db.collection(collection).find(query);

    if (options.projection) cursor = cursor.project(options.projection);
    if (options.sort) cursor = cursor.sort(options.sort);
    if (options.skip) cursor = cursor.skip(options.skip);
    if (options.limit) cursor = cursor.limit(options.limit);

    const results = await cursor.toArray();
    return results.map(convertObjectIdToString);
  },

  async findOne(collection: string, query: any, projection: any = {}) {
    const db = getDb();
    const doc = await db.collection(collection).findOne(query, { projection });
    return convertObjectIdToString(doc);
  },

  async insertOne(collection: string, document: any) {
    const db = getDb();
    const documentWithTimestamps = { ...document, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection(collection).insertOne(documentWithTimestamps);
    return { id: result.insertedId.toString(), ...documentWithTimestamps };
  },

  async updateOne(collection: string, id: string, updates: any) {
    const db = getDb();
    const updatesWithTimestamp = { ...updates, updatedAt: new Date() };
    const result = await db.collection(collection).updateOne(
      { _id: convertStringToObjectId(id) },
      { $set: updatesWithTimestamp }
    );
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId ? result.upsertedId.toString() : null
    };
  },

  // Ajoute les autres méthodes CRUD ici si nécessaire
};

export default mongoService;
