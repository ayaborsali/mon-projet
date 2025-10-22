const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Méthode non autorisée' })
    };
  }

  try {
    const { email, password } = JSON.parse(event.body);
    
    console.log('Tentative de connexion:', email);

    // Configuration MongoDB
    let MONGODB_URI;
    
    // En développement (local) vs production (Netlify)
    if (process.env.NODE_ENV === 'development' || process.env.NETLIFY_DEV) {
      MONGODB_URI = 'mongodb://localhost:27017/smartparking';
    } else {
      MONGODB_URI = process.env.MONGODB_URI; // Pour production
    }

    // Connexion à MongoDB
    const client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout de 5s
    });

    await client.connect();
    const db = client.db('smartparking');
    const usersCollection = db.collection('users');

    // Recherche de l'utilisateur
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      await client.close();
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Utilisateur non trouvé' 
        })
      };
    }

    // Vérification du mot de passe
    if (user.password !== password) {
      await client.close();
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Mot de passe incorrect' 
        })
      };
    }

    // Connexion réussie
    const userResponse = {
      _id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt
    };

    await client.close();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token: `smartparking-token-${user._id}-${Date.now()}`,
        user: userResponse
      })
    };

  } catch (error) {
    console.error('Erreur MongoDB:', error);
    
    let errorMessage = 'Erreur de connexion à la base de données';
    
    if (error.name === 'MongoServerSelectionError') {
      errorMessage = 'Impossible de se connecter à MongoDB. Vérifiez que MongoDB est démarré localement.';
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: errorMessage 
      })
    };
  }
};