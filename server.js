import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartparking';
const client = new MongoClient(MONGODB_URI);

let db;

// Connexion à MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
    
    // Créer les collections et index si elles n'existent pas
    await db.collection('parkingSpaces').createIndex({ number: 1 }, { unique: true });
    await db.collection('spaceStatusHistory').createIndex({ spaceNumber: 1, timestamp: -1 });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ 'vehicle.plate': 1 });
    await db.collection('sessions').createIndex({ userId: 1 }); // Nouvel index pour les sessions utilisateur
    await db.collection('alerts').createIndex({ timestamp: -1 });
    await db.collection('payments').createIndex({ sessionId: 1 });
    await db.collection('payments').createIndex({ paymentTime: -1 });
    await db.collection('transactions').createIndex({ userId: 1, timestamp: -1 }); // Nouvel index pour les transactions
    await db.collection('notifications').createIndex({ userId: 1, timestamp: -1 }); // Nouvel index pour les notifications
    
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Données initiales
const initialParkingData = [
  { _id: 1, number: "A001", zone: "A", type: "voiture", vehicleType: "voiture", status: "libre", createdAt: new Date(), updatedAt: new Date() },
  { _id: 2, number: "A002", zone: "A", type: "voiture", vehicleType: "voiture", status: "libre", createdAt: new Date(), updatedAt: new Date() },
  { _id: 3, number: "A003", zone: "A", type: "camion", vehicleType: "camion", status: "libre", createdAt: new Date(), updatedAt: new Date() },
  { _id: 4, number: "B001", zone: "B", type: "moto", vehicleType: "moto", status: "libre", createdAt: new Date(), updatedAt: new Date() },
  { _id: 5, number: "B002", zone: "B", type: "voiture", vehicleType: "voiture", status: "libre", createdAt: new Date(), updatedAt: new Date() }
];

const demoUsers = [
  {
    _id: new ObjectId(),
    name: 'Administrateur Principal',
    email: 'admin@smartparking.com',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    walletBalance: 0,
    registrationDate: new Date(),
    lastLogin: null,
    totalSessions: 0,
    totalSpent: 0,
    phone: '1234567890',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Opérateur Parking',
    email: 'operator@smartparking.com',
    password: 'operator123',
    role: 'operator',
    status: 'active',
    walletBalance: 0,
    registrationDate: new Date(),
    lastLogin: null,
    totalSessions: 0,
    totalSpent: 0,
    phone: '1122334455',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Client Test',
    email: 'customer@smartparking.com',
    password: 'customer123',
    role: 'customer',
    status: 'active',
    walletBalance: 50.00,
    registrationDate: new Date(),
    lastLogin: null,
    totalSessions: 5,
    totalSpent: 25.50,
    phone: '0987654321',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ==================== ROUTES AUTHENTIFICATION ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email et mot de passe requis' 
      });
    }

    const usersCollection = db.collection('users');
    
    // Initialiser les utilisateurs de démo si nécessaire
    const usersCount = await usersCollection.countDocuments();
    if (usersCount === 0) {
      await usersCollection.insertMany(demoUsers);
      console.log('✅ Utilisateurs de démo créés');
    }

    const user = await usersCollection.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou mot de passe incorrect' 
      });
    }

    // Mettre à jour la dernière connexion
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Générer un token simple
    const token = Buffer.from(JSON.stringify({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    })).toString('base64');

    res.json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        status: user.status,
        name: user.name,
        walletBalance: user.walletBalance || 0
      }
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la connexion' 
    });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token manquant' });
    }

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        status: user.status,
        name: user.name,
        walletBalance: user.walletBalance || 0
      }
    });

  } catch (error) {
    res.status(401).json({ success: false, error: 'Token invalide' });
  }
});

// ==================== ROUTES UTILISATEURS ====================

// GET /api/users - Récupérer tous les utilisateurs
app.get('/api/users', async (req, res) => {
  try {
    console.log('📡 Récupération de tous les utilisateurs');
    
    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const usersCollection = db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log(`✅ ${users.length} utilisateurs récupérés`);
    
    // Transformation pour le frontend
    const transformedUsers = users.map(user => ({
      _id: user._id,
      id: user._id.toString(),
      name: user.name || 'Utilisateur Sans Nom',
      email: user.email,
      phone: user.phone || '0000000000',
      password: user.password || 'password',
      role: user.role || 'customer',
      status: user.status || 'active',
      walletBalance: user.walletBalance || 0,
      registrationDate: user.registrationDate || user.createdAt || new Date(),
      lastLogin: user.lastLogin || null,
      totalSessions: user.totalSessions || 0,
      totalSpent: user.totalSpent || 0,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date()
    }));

    res.json(transformedUsers);
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des utilisateurs',
      details: error.message 
    });
  }
});

// GET /api/users/:id - Récupérer un utilisateur spécifique
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📡 Récupération utilisateur:', id);

    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Transformation pour le frontend
    const transformedUser = {
      _id: user._id,
      id: user._id.toString(),
      name: user.name || 'Utilisateur Sans Nom',
      email: user.email,
      phone: user.phone || '0000000000',
      password: user.password || 'password',
      role: user.role || 'customer',
      status: user.status || 'active',
      walletBalance: user.walletBalance || 0,
      registrationDate: user.registrationDate || user.createdAt || new Date(),
      lastLogin: user.lastLogin || null,
      totalSessions: user.totalSessions || 0,
      totalSpent: user.totalSpent || 0,
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date()
    };

    console.log('✅ Utilisateur récupéré:', id);
    res.json(transformedUser);
  } catch (error) {
    console.error('❌ Erreur récupération utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de l\'utilisateur',
      details: error.message 
    });
  }
});

// POST /api/users - Créer un nouvel utilisateur
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    console.log('📤 Création nouvel utilisateur:', { name, email, phone, role });

    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    // Validation des données requises
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Données manquantes: name, email et password sont requis' 
      });
    }

    const usersCollection = db.collection('users');
    
    // Vérifier si l'email existe déjà
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Créer le nouvel utilisateur
    const newUser = {
      name,
      email,
      phone: phone || '',
      password,
      role: role || 'customer',
      status: 'active',
      walletBalance: 0,
      registrationDate: new Date(),
      lastLogin: null,
      totalSessions: 0,
      totalSpent: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    const savedUser = { 
      _id: result.insertedId, 
      id: result.insertedId.toString(),
      ...newUser 
    };
    
    console.log('✅ NOUVEAU utilisateur créé:', savedUser._id);

    res.status(201).json(savedUser);
  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de l\'utilisateur',
      details: error.message 
    });
  }
});

// PUT /api/users/:id - Mettre à jour un utilisateur
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log('✏️ Mise à jour utilisateur:', id, updates);

    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const usersCollection = db.collection('users');
    
    // Vérifier que l'utilisateur existe
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Mettre à jour l'utilisateur
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updates,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'Aucune modification effectuée' });
    }

    console.log('✅ Utilisateur mis à jour:', id);
    res.json({ success: true, message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur mise à jour utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour de l\'utilisateur',
      details: error.message 
    });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Suppression utilisateur:', id);

    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID utilisateur invalide' });
    }

    const usersCollection = db.collection('users');
    
    // Vérifier que l'utilisateur existe
    const existingUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Supprimer l'utilisateur
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(400).json({ error: 'Échec de la suppression' });
    }

    console.log('✅ Utilisateur supprimé:', id);
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression de l\'utilisateur',
      details: error.message 
    });
  }
});

// ==================== ROUTES TRANSACTIONS ====================

// GET /api/transactions - Récupérer les transactions d'un utilisateur
app.get('/api/transactions', async (req, res) => {
  try {
    const { userId } = req.query;

    console.log('📊 Récupération transactions pour utilisateur:', userId);

    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const transactionsCollection = db.collection('transactions');
    let query = {};
    
    if (userId) {
      query.userId = userId;
    }

    const transactions = await transactionsCollection.find(query)
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`✅ ${transactions.length} transactions récupérées pour l'utilisateur ${userId}`);
    res.json(transactions);
  } catch (error) {
    console.error('❌ Erreur récupération transactions:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des transactions',
      details: error.message 
    });
  }
});

// POST /api/transactions - Créer une transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const transactionData = req.body;

    console.log('💰 Création transaction:', transactionData);

    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const transactionsCollection = db.collection('transactions');
    
    const newTransaction = {
      ...transactionData,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await transactionsCollection.insertOne(newTransaction);
    const savedTransaction = { 
      _id: result.insertedId, 
      id: result.insertedId.toString(),
      ...newTransaction 
    };

    console.log('✅ NOUVELLE transaction créée:', savedTransaction._id);
    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error('❌ Erreur création transaction:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de la transaction',
      details: error.message 
    });
  }
});

// ==================== ROUTES NOTIFICATIONS ====================

// GET /api/notifications - Récupérer les notifications d'un utilisateur
app.get('/api/notifications', async (req, res) => {
  try {
    const { userId } = req.query;

    console.log('🔔 Récupération notifications pour utilisateur:', userId);

    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const notificationsCollection = db.collection('notifications');
    let query = {};
    
    if (userId) {
      query.userId = userId;
    }

    const notifications = await notificationsCollection.find(query)
      .sort({ timestamp: -1 })
      .toArray();

    console.log(`✅ ${notifications.length} notifications récupérées pour l'utilisateur ${userId}`);
    res.json(notifications);
  } catch (error) {
    console.error('❌ Erreur récupération notifications:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des notifications',
      details: error.message 
    });
  }
});

// POST /api/notifications - Créer une notification
app.post('/api/notifications', async (req, res) => {
  try {
    const notificationData = req.body;

    console.log('📨 Création notification:', notificationData);

    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const notificationsCollection = db.collection('notifications');
    
    const newNotification = {
      ...notificationData,
      timestamp: new Date(),
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await notificationsCollection.insertOne(newNotification);
    const savedNotification = { 
      _id: result.insertedId, 
      id: result.insertedId.toString(),
      ...newNotification 
    };

    console.log('✅ NOUVELLE notification créée:', savedNotification._id);
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error('❌ Erreur création notification:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de la notification',
      details: error.message 
    });
  }
});

// ==================== ROUTES SESSIONS ====================

// Créer une session
app.post('/api/sessions', async (req, res) => {
  try {
    const { vehicle, spaceNumber, userId } = req.body;
    const sessionsCollection = db.collection('sessions');
    
    const session = {
      vehicle: {
        plate: vehicle.plate.toUpperCase(),
        type: vehicle.type,
        model: vehicle.model || '',
        color: vehicle.color || ''
      },
      spaceNumber,
      userId,
      status: 'active',
      startTime: new Date(),
      endTime: null,
      amount: 0,
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await sessionsCollection.insertOne(session);
    
    res.json({
      success: true,
      session: {
        id: result.insertedId,
        ...session
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer les sessions avec filtre par utilisateur
app.get('/api/sessions', async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query;
    const sessionsCollection = db.collection('sessions');
    
    let query = {};
    if (status) {
      query.status = status;
    }
    if (userId) {
      query.userId = userId;
    }
    
    const sessions = await sessionsCollection.find(query)
      .sort({ startTime: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .toArray();
    
    const total = await sessionsCollection.countDocuments(query);
    
    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour une session
app.put('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const sessionsCollection = db.collection('sessions');
    
    await sessionsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    
    res.json({ success: true, message: 'Session mise à jour' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROUTES PARKING ====================

// Générer les places de parking (ancienne version)
app.post('/api/parking/generate', async (req, res) => {
  try {
    const { totalSpaces } = req.body;
    const collection = db.collection('parkingSpaces');
    
    const existingCount = await collection.countDocuments();
    
    if (existingCount === 0) {
      await collection.insertMany(initialParkingData);
      console.log(`✅ ${initialParkingData.length} places créées`);
      
      // Créer l'historique initial
      const historyCollection = db.collection('spaceStatusHistory');
      const historyData = initialParkingData.map(space => ({
        spaceNumber: space.number,
        previousStatus: 'none',
        newStatus: 'libre',
        action: 'creation',
        reason: 'Création initiale de la place',
        changedBy: 'system',
        timestamp: new Date(),
        metadata: {
          vehicleType: space.type,
          zone: space.zone
        }
      }));
      
      await historyCollection.insertMany(historyData);
    }
    
    res.json({ success: true, message: `${existingCount} places existent déjà` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NOUVELLE ROUTE - Générer dynamiquement les places basées sur totalSpaces
app.post('/api/parking/generate-spaces', async (req, res) => {
  try {
    const { totalSpaces } = req.body;
    const collection = db.collection('parkingSpaces');
    
    console.log(`🏗️ Génération de ${totalSpaces} places de parking...`);
    
    // Supprimer les places existantes
    await collection.deleteMany({});
    
    // Générer les nouvelles places basées sur totalSpaces
    const zones = ['A', 'B', 'C', 'D', 'E'];
    const spaceTypes = [
      { type: 'voiture', ratio: 0.7 },  // 70% voitures
      { type: 'camion', ratio: 0.2 },   // 20% camions
      { type: 'moto', ratio: 0.1 }      // 10% motos
    ];
    
    const newSpaces = [];
    let spaceCounter = 1;
    
    zones.forEach(zone => {
      const spacesPerZone = Math.ceil(totalSpaces / zones.length);
      
      for (let i = 1; i <= spacesPerZone && newSpaces.length < totalSpaces; i++) {
        // Déterminer le type basé sur les ratios
        const random = Math.random();
        let type;
        if (random < spaceTypes[0].ratio) {
          type = spaceTypes[0].type;
        } else if (random < spaceTypes[0].ratio + spaceTypes[1].ratio) {
          type = spaceTypes[1].type;
        } else {
          type = spaceTypes[2].type;
        }
        
        newSpaces.push({
          _id: spaceCounter,
          number: `${zone}${String(i).padStart(3, '0')}`,
          zone: zone,
          type: type,
          vehicleType: type,
          status: 'libre',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        spaceCounter++;
      }
    });
    
    await collection.insertMany(newSpaces);
    
    // Créer l'historique
    const historyCollection = db.collection('spaceStatusHistory');
    const historyData = newSpaces.map(space => ({
      spaceNumber: space.number,
      previousStatus: 'none',
      newStatus: 'libre',
      action: 'creation',
      reason: `Création de ${totalSpaces} places`,
      changedBy: 'system',
      timestamp: new Date(),
      metadata: {
        vehicleType: space.type,
        zone: space.zone
      }
    }));
    
    await historyCollection.insertMany(historyData);
    
    console.log(`✅ ${newSpaces.length} places créées dynamiquement`);
    res.json({ success: true, message: `${newSpaces.length} places créées`, spaces: newSpaces.length });
  } catch (error) {
    console.error('❌ Erreur génération places:', error);
    res.status(500).json({ error: error.message });
  }
});

// Récupérer toutes les places
app.get('/api/parking/spaces', async (req, res) => {
  try {
    const collection = db.collection('parkingSpaces');
    const spaces = await collection.find({}).sort({ number: 1 }).toArray();
    res.json(spaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer une place par son numéro
app.get('/api/parking/spaces/:number', async (req, res) => {
  try {
    const { number } = req.params;
    const collection = db.collection('parkingSpaces');
    
    const space = await collection.findOne({ number });
    
    if (!space) {
      return res.status(404).json({ error: `Place ${number} non trouvée` });
    }
    
    res.json(space);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Réserver une place
app.post('/api/parking/reserve', async (req, res) => {
  try {
    const { spaceNumber, plate, vehicleType } = req.body;
    const collection = db.collection('parkingSpaces');
    
    const space = await collection.findOne({ number: spaceNumber });
    
    if (!space) {
      return res.status(404).json({ error: `Place ${spaceNumber} non trouvée` });
    }
    
    if (space.status !== 'libre') {
      return res.status(400).json({ error: `Place ${spaceNumber} n'est pas libre` });
    }
    
    if (space.type !== vehicleType) {
      return res.status(400).json({ error: `Type de véhicule incompatible` });
    }
    
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    const result = await collection.updateOne(
      { number: spaceNumber },
      { 
        $set: { 
          status: 'réservé',
          reservation: {
            plate: plate.toUpperCase(),
            vehicleType,
            createdAt: new Date(),
            expiresAt
          },
          updatedAt: new Date()
        }
      }
    );
    
    // Logger l'historique
    await db.collection('spaceStatusHistory').insertOne({
      spaceNumber,
      previousStatus: 'libre',
      newStatus: 'réservé',
      action: 'reservation',
      reason: `Réservation pour ${plate.toUpperCase()} (${vehicleType}) - Expire à ${expiresAt.toLocaleTimeString()}`,
      changedBy: 'user',
      timestamp: new Date(),
      reservationInfo: {
        plate: plate.toUpperCase(),
        vehicleType,
        expiresAt
      },
      metadata: {
        vehicleType: space.type,
        zone: space.zone
      }
    });
    
    res.json({ success: true, message: 'Place réservée avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Occuper une place
app.post('/api/parking/occupy', async (req, res) => {
  try {
    const { spaceNumber, sessionId, plate, vehicleType } = req.body;
    const collection = db.collection('parkingSpaces');
    
    const space = await collection.findOne({ number: spaceNumber });
    
    if (!space) {
      return res.status(404).json({ error: `Place ${spaceNumber} non trouvée` });
    }
    
    const updateData = {
      status: 'occupé',
      updatedAt: new Date()
    };
    
    if (sessionId) {
      updateData.currentSessionId = sessionId;
    }
    
    // Supprimer la réservation si elle existe
    if (space.reservation) {
      updateData.reservation = null;
    }
    
    await collection.updateOne(
      { number: spaceNumber },
      { $set: updateData }
    );
    
    // Logger l'historique
    await db.collection('spaceStatusHistory').insertOne({
      spaceNumber,
      previousStatus: space.status,
      newStatus: 'occupé',
      action: 'occupation',
      reason: plate ? `Arrivée véhicule - ${plate} (${vehicleType})` : 'Occupation manuelle',
      changedBy: 'system',
      sessionId,
      timestamp: new Date(),
      metadata: {
        zone: space.zone,
        plate: plate,
        vehicleType: vehicleType
      }
    });
    
    res.json({ success: true, message: 'Place occupée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Libérer une place
app.post('/api/parking/free', async (req, res) => {
  try {
    const { spaceNumber, sessionId } = req.body;
    const collection = db.collection('parkingSpaces');
    
    const space = await collection.findOne({ number: spaceNumber });
    
    if (!space) {
      return res.status(404).json({ error: `Place ${spaceNumber} non trouvée` });
    }
    
    const updateData = {
      status: 'libre',
      updatedAt: new Date()
    };
    
    if (sessionId) {
      updateData.currentSessionId = null;
    }
    
    await collection.updateOne(
      { number: spaceNumber },
      { $set: updateData }
    );
    
    // Logger l'historique
    await db.collection('spaceStatusHistory').insertOne({
      spaceNumber,
      previousStatus: space.status,
      newStatus: 'libre',
      action: 'liberation',
      reason: sessionId ? 'Départ véhicule (session)' : 'Libération manuelle',
      changedBy: 'system',
      sessionId,
      timestamp: new Date(),
      metadata: {
        vehicleType: space.type,
        zone: space.zone
      }
    });
    
    res.json({ success: true, message: 'Place libérée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Annuler une réservation
app.post('/api/parking/cancel-reservation', async (req, res) => {
  try {
    const { spaceNumber } = req.body;
    const collection = db.collection('parkingSpaces');
    
    const space = await collection.findOne({ number: spaceNumber });
    
    if (!space) {
      return res.status(404).json({ error: `Place ${spaceNumber} non trouvée` });
    }
    
    if (space.status !== 'réservé' || !space.reservation) {
      return res.status(400).json({ error: `La place ${spaceNumber} n'est pas réservée` });
    }
    
    const reservationInfo = space.reservation;
    
    await collection.updateOne(
      { number: spaceNumber },
      { 
        $set: { 
          status: 'libre',
          reservation: null,
          updatedAt: new Date()
        }
      }
    );
    
    // Logger l'historique
    await db.collection('spaceStatusHistory').insertOne({
      spaceNumber,
      previousStatus: 'réservé',
      newStatus: 'libre',
      action: 'reservation_cancelled',
      reason: `Réservation annulée pour ${reservationInfo.plate} (${reservationInfo.vehicleType})`,
      changedBy: 'user',
      timestamp: new Date(),
      reservationInfo: {
        plate: reservationInfo.plate,
        vehicleType: reservationInfo.vehicleType
      },
      metadata: {
        vehicleType: space.type,
        zone: space.zone
      }
    });
    
    res.json({ success: true, message: 'Réservation annulée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mettre une place hors service
app.post('/api/parking/out-of-service', async (req, res) => {
  try {
    const { spaceNumber } = req.body;
    const collection = db.collection('parkingSpaces');
    
    const space = await collection.findOne({ number: spaceNumber });
    
    if (!space) {
      return res.status(404).json({ error: `Place ${spaceNumber} non trouvée` });
    }
    
    if (space.status === 'occupé') {
      return res.status(400).json({ error: `Impossible de mettre hors service une place occupée` });
    }
    
    const previousStatus = space.status;
    
    await collection.updateOne(
      { number: spaceNumber },
      { 
        $set: { 
          status: 'hors-service',
          updatedAt: new Date()
        }
      }
    );
    
    // Logger l'historique
    await db.collection('spaceStatusHistory').insertOne({
      spaceNumber,
      previousStatus,
      newStatus: 'hors-service',
      action: 'out_of_service',
      reason: 'Mise hors service manuelle',
      changedBy: 'user',
      timestamp: new Date(),
      metadata: {
        vehicleType: space.type,
        zone: space.zone
      }
    });
    
    res.json({ success: true, message: 'Place mise hors service' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remettre une place en service
app.post('/api/parking/in-service', async (req, res) => {
  try {
    const { spaceNumber } = req.body;
    const collection = db.collection('parkingSpaces');
    
    const space = await collection.findOne({ number: spaceNumber });
    
    if (!space) {
      return res.status(404).json({ error: `Place ${spaceNumber} non trouvée` });
    }
    
    const previousStatus = space.status;
    
    await collection.updateOne(
      { number: spaceNumber },
      { 
        $set: { 
          status: 'libre',
          updatedAt: new Date()
        }
      }
    );
    
    // Logger l'historique
    await db.collection('spaceStatusHistory').insertOne({
      spaceNumber,
      previousStatus,
      newStatus: 'libre',
      action: 'in_service',
      reason: 'Remise en service manuelle',
      changedBy: 'user',
      timestamp: new Date(),
      metadata: {
        vehicleType: space.type,
        zone: space.zone
      }
    });
    
    res.json({ success: true, message: 'Place remise en service' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROUTES HISTORIQUE ====================

// Récupérer l'historique d'une place
app.get('/api/parking/history/:spaceNumber', async (req, res) => {
  try {
    const { spaceNumber } = req.params;
    const collection = db.collection('spaceStatusHistory');
    
    const history = await collection.find({ spaceNumber })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupérer tout l'historique
app.get('/api/parking/history', async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;
    const collection = db.collection('spaceStatusHistory');
    
    const history = await collection.find({})
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .toArray();
    
    const total = await collection.countDocuments();
    
    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROUTES ALERTES ====================

// Récupérer les alertes
app.get('/api/alerts', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const collection = db.collection('alerts');
    
    const alerts = await collection.find({})
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer une alerte comme lue
app.put('/api/alerts/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = db.collection('alerts');
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { read: true } }
    );
    
    res.json({ success: true, message: 'Alerte marquée comme lue' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ROUTES PAIEMENTS ====================

// GET /api/payments - Récupérer TOUS les paiements
app.get('/api/payments', async (req, res) => {
  try {
    console.log('📊 Endpoint /api/payments appelé');
    
    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    const paymentsCollection = db.collection('payments');
    const payments = await paymentsCollection.find({})
      .sort({ paymentTime: -1 })
      .toArray();
    
    console.log(`✅ ${payments.length} paiements récupérés depuis MongoDB`);
    
    // Transformation des données pour le frontend
    const transformedPayments = payments.map(payment => ({
      _id: payment._id,
      sessionId: payment.sessionId,
      amount: payment.amount || 0,
      paymentMethod: payment.paymentMethod || 'Non spécifié',
      status: payment.status || 'completed',
      paymentTime: payment.paymentTime || new Date(),
      reference: payment.reference || `PAY-${payment._id?.toString().slice(-6).toUpperCase() || 'N/A'}`,
      createdAt: payment.createdAt || new Date(),
      updatedAt: payment.updatedAt || new Date(),
      // Champs pour l'affichage frontend
      plate: 'N/A',
      vehicleType: 'Non spécifié',
      spaceNumber: 'N/A'
    }));

    res.json(transformedPayments);
  } catch (error) {
    console.error('❌ Erreur récupération paiements:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des paiements',
      details: error.message 
    });
  }
});

// POST /api/payments - Créer un NOUVEAU paiement
app.post('/api/payments', async (req, res) => {
  try {
    const { sessionId, amount, paymentMethod, status = 'completed' } = req.body;

    console.log('📤 Création nouveau paiement:', { sessionId, amount, paymentMethod, status });

    if (!db) {
      return res.status(500).json({ error: 'Base de données non connectée' });
    }

    // Validation des données requises
    if (!sessionId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Données manquantes: sessionId, amount et paymentMethod sont requis' 
      });
    }

    const paymentsCollection = db.collection('payments');
    
    // Créer le nouveau paiement
    const newPayment = {
      sessionId: new ObjectId(sessionId),
      amount: parseFloat(amount),
      paymentMethod,
      status,
      paymentTime: new Date(),
      reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await paymentsCollection.insertOne(newPayment);
    const savedPayment = { _id: result.insertedId, ...newPayment };
    
    console.log('✅ NOUVEAU paiement créé:', savedPayment._id);

    res.status(201).json(savedPayment);
  } catch (error) {
    console.error('❌ Erreur création paiement:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du paiement',
      details: error.message 
    });
  }
});

// Endpoint de santé pour payments
app.get('/api/payments/health', async (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'payments',
    timestamp: new Date().toISOString()
  });
});

// ==================== ROUTES SETTINGS ====================

// Récupérer la configuration
app.get('/api/settings', async (req, res) => {
  try {
    const settingsCollection = db.collection('settings');
    
    // Récupérer la configuration parking
    const configDoc = await settingsCollection.findOne({ type: 'parkingConfig' });
    
    // Récupérer les règles de tarification
    const rulesDoc = await settingsCollection.findOne({ type: 'pricingRules' });

    // Configuration par défaut si non trouvée
    const defaultConfig = {
      totalSpaces: 100,
      baseRate: 2.5,
      dynamicPricing: true,
      peakHourMultiplier: 1.5,
      maxDuration: 24,
      graceTime: 15,
      entryCameras: ['Caméra 1 - Entrée A', 'Caméra 2 - Entrée B'],
      exitCameras: ['Caméra 3 - Sortie A', 'Caméra 4 - Sortie B'],
      cameraIpRange: '192.168.1.0/24',
      apiPort: '8080',
      plateRecognition: true,
      anomalyDetection: true
    };

    // Règles par défaut si non trouvées
    const defaultPricingRules = [
      { id: 1, name: 'Tarif de base', rate: '2.50 DT/heure', active: true },
      { id: 2, name: 'Heures de pointe (8h-10h, 17h-19h)', rate: '3.75 DT/heure', active: true },
      { id: 3, name: 'Week-end', rate: '2.00 DT/heure', active: true },
      { id: 4, name: 'Nuit (22h-6h)', rate: '1.50 DT/heure', active: true },
    ];

    res.json({
      success: true,
      config: configDoc ? { ...defaultConfig, ...configDoc } : defaultConfig,
      pricingRules: rulesDoc?.rules || defaultPricingRules
    });

  } catch (error) {
    console.error('❌ Erreur chargement configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du chargement de la configuration' 
    });
  }
});

// Sauvegarder la configuration
app.post('/api/settings', async (req, res) => {
  try {
    const { config, pricingRules } = req.body;
    
    console.log('📥 Données reçues pour sauvegarde:', { config, pricingRules });
    
    const settingsCollection = db.collection('settings');
    const now = new Date();

    // Sauvegarder la configuration parking
    await settingsCollection.updateOne(
      { type: 'parkingConfig' },
      { 
        $set: { 
          ...config,
          type: 'parkingConfig',
          updatedAt: now
        } 
      },
      { upsert: true }
    );

    // Sauvegarder les règles de tarification
    await settingsCollection.updateOne(
      { type: 'pricingRules' },
      { 
        $set: { 
          rules: pricingRules,
          type: 'pricingRules',
          updatedAt: now
        } 
      },
      { upsert: true }
    );

    console.log('✅ Configuration sauvegardée dans MongoDB');

    res.json({ 
      success: true, 
      message: 'Configuration sauvegardée avec succès',
      lastUpdated: now
    });
  } catch (error) {
    console.error('❌ Erreur sauvegarde configuration:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la sauvegarde: ' + error.message 
    });
  }
});

// ==================== ROUTES UTILITAIRES ====================

// Nettoyer les réservations expirées
app.post('/api/parking/cleanup-expired', async (req, res) => {
  try {
    const collection = db.collection('parkingSpaces');
    const now = new Date();
    
    const expiredSpaces = await collection.find({
      'reservation.expiresAt': { $lt: now },
      status: 'réservé'
    }).toArray();
    
    for (const space of expiredSpaces) {
      await collection.updateOne(
        { number: space.number },
        { 
          $set: { 
            status: 'libre',
            reservation: null,
            updatedAt: new Date()
          }
        }
      );
      
      // Logger l'expiration
      await db.collection('spaceStatusHistory').insertOne({
        spaceNumber: space.number,
        previousStatus: 'réservé',
        newStatus: 'libre',
        action: 'reservation_expired',
        reason: 'Réservation expirée automatiquement',
        changedBy: 'system',
        timestamp: new Date(),
        reservationInfo: {
          plate: space.reservation.plate,
          vehicleType: space.reservation.vehicleType
        }
      });
      
      // Créer une alerte
      await db.collection('alerts').insertOne({
        type: 'reservation_expired',
        title: 'Réservation expirée',
        message: `La réservation pour ${space.reservation.plate} a expiré. La place ${space.number} a été libérée automatiquement.`,
        timestamp: new Date(),
        read: false,
        priority: 'low',
        data: {
          plate: space.reservation.plate,
          spaceNumber: space.number,
          vehicleType: space.reservation.vehicleType
        }
      });
    }
    
    res.json({ success: true, freedSpaces: expiredSpaces.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistiques
app.get('/api/stats', async (req, res) => {
  try {
    const spacesCollection = db.collection('parkingSpaces');
    const sessionsCollection = db.collection('sessions');
    
    const totalSpaces = await spacesCollection.countDocuments();
    const freeSpaces = await spacesCollection.countDocuments({ status: 'libre' });
    const occupiedSpaces = await spacesCollection.countDocuments({ status: 'occupé' });
    const reservedSpaces = await spacesCollection.countDocuments({ status: 'réservé' });
    const outOfServiceSpaces = await spacesCollection.countDocuments({ status: 'hors-service' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = await sessionsCollection.countDocuments({
      startTime: { $gte: today }
    });
    
    const activeSessions = await sessionsCollection.countDocuments({
      status: 'active'
    });
    
    res.json({
      spaces: {
        total: totalSpaces,
        free: freeSpaces,
        occupied: occupiedSpaces,
        reserved: reservedSpaces,
        outOfService: outOfServiceSpaces,
        occupancyRate: totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0
      },
      sessions: {
        today: todaySessions,
        active: activeSessions
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    database: db ? 'Connected' : 'Disconnected'
  });
});

// ==================== ROUTE SESSION PAR ID ====================

// Récupérer une session par son ID
app.get('/api/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si l'ID est valide
    if (!id || id === 'undefined' || !ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID de session invalide' 
      });
    }

    const sessionsCollection = db.collection('sessions');
    const session = await sessionsCollection.findOne({ _id: new ObjectId(id) });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        error: 'Session non trouvée' 
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('❌ Erreur récupération session:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la récupération de la session' 
    });
  }
});

// ==================== DÉMARRAGE SERVEUR ====================

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend MongoDB running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💰 Payments API: http://localhost:${PORT}/api/payments`);
    console.log(`👤 Users API: http://localhost:${PORT}/api/users`);
    console.log(`💳 Wallet API: http://localhost:${PORT}/api/transactions`);
    console.log(`🔑 Demo admin: admin@smartparking.com / admin123`);
    console.log(`👤 Demo operator: operator@smartparking.com / operator123`);
    console.log(`👤 Demo customer: customer@smartparking.com / customer123`);
  });
}).catch(console.error);