const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  // Headers CORS essentiels
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Gérer les pré-vols CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Vérifier que c'est une requête POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Méthode non autorisée' 
      })
    };
  }

  try {
    console.log('Requête reçue:', event.body);
    const { email, password } = JSON.parse(event.body);
    
    console.log('Tentative de connexion pour:', email);

    // URL MongoDB - en développement local
    const MONGODB_URI = 'mongodb://localhost:27017/smartparking';

    let client;
    try {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
      console.log('Connecté à MongoDB');
      
      const db = client.db('smartparking');
      const usersCollection = db.collection('users');

      // Recherche de l'utilisateur
      const user = await usersCollection.findOne({ 
        email: email.toLowerCase().trim() 
      });

      if (!user) {
        console.log('Utilisateur non trouvé:', email);
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
        console.log('Mot de passe incorrect pour:', email);
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
        _id: user._id.toString(),
        email: user.email,
        role: user.role || 'customer',
        name: user.name,
        createdAt: user.createdAt || new Date()
      };

      console.log('Connexion réussie pour:', email);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          token: `token-${user._id}-${Date.now()}`,
          user: userResponse
        })
      };

    } finally {
      if (client) {
        await client.close();
      }
    }

  } catch (error) {
    console.error('Erreur complète:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Erreur serveur: ' + error.message 
      })
    };
  }
};