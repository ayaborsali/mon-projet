import { MongoClient } from 'mongodb';

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

  let client;
  try {
    console.log('🔵 Fonction login appelée - Body:', event.body);
    
    // Validation du body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Body manquant dans la requête' 
        })
      };
    }

    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Format JSON invalide' 
        })
      };
    }

    const { email, password } = parsedBody;
    
    // Validation des champs requis
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Email et mot de passe requis' 
        })
      };
    }

    console.log('📧 Tentative de connexion pour:', email);

    // URL MongoDB - avec fallback
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartparking';
    
    console.log('🔗 Connexion à MongoDB...', MONGODB_URI);

    client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 secondes timeout
      connectTimeoutMS: 10000
    });

    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db('smartparking');
    const usersCollection = db.collection('users');

    // Vérifier si la collection existe
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      console.log('❌ Collection users non trouvée');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Base de données non initialisée. Collection users manquante.' 
        })
      };
    }

    // Recherche de l'utilisateur
    const user = await usersCollection.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      console.log('❌ Utilisateur non trouvé:', email);
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
      console.log('❌ Mot de passe incorrect pour:', email);
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
      _id: user._id ? user._id.toString() : 'unknown-id',
      email: user.email,
      role: user.role || 'customer',
      name: user.name || 'Utilisateur',
      createdAt: user.createdAt || new Date().toISOString()
    };

    console.log('✅ Connexion réussie pour:', email, '- Rôle:', userResponse.role);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token: `token-${Date.now()}-${userResponse.role}`,
        user: userResponse
      })
    };

  } catch (error) {
    console.error('💥 Erreur complète dans login:', error);
    
    let errorMessage = 'Erreur serveur';
    
    if (error.name === 'MongoServerSelectionError') {
      errorMessage = 'Impossible de se connecter à MongoDB. Vérifiez que MongoDB est démarré.';
    } else if (error.name === 'MongoNetworkError') {
      errorMessage = 'Erreur réseau avec MongoDB. Vérifiez la connexion.';
    } else {
      errorMessage = `Erreur serveur: ${error.message}`;
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: errorMessage 
      })
    };
  } finally {
    // Fermer la connexion client si elle existe
    if (client) {
      try {
        await client.close();
        console.log('🔌 Connexion MongoDB fermée');
      } catch (closeError) {
        console.error('❌ Erreur fermeture MongoDB:', closeError);
      }
    }
  }
};