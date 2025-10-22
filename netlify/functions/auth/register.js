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
    const { email, password, name, role = 'customer' } = JSON.parse(event.body);

    // Validation
    if (!email || !password || !name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Tous les champs sont requis' 
        })
      };
    }

    // Configuration MongoDB
    let MONGODB_URI;
    
    if (process.env.NODE_ENV === 'development' || process.env.NETLIFY_DEV) {
      MONGODB_URI = 'mongodb://localhost:27017/smartparking';
    } else {
      MONGODB_URI = process.env.MONGODB_URI;
    }

    const client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    const db = client.db('smartparking');
    const usersCollection = db.collection('users');

    // Vérifier si l'email existe déjà
    const existingUser = await usersCollection.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingUser) {
      await client.close();
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Un utilisateur avec cet email existe déjà' 
        })
      };
    }

    // Créer le nouvel utilisateur
    const newUser = {
      email: email.toLowerCase().trim(),
      password: password,
      name: name.trim(),
      role: role,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);
    
    // Retourner l'utilisateur sans le mot de passe
    const userResponse = {
      _id: result.insertedId,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt
    };

    await client.close();

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Utilisateur créé avec succès',
        user: userResponse
      })
    };

  } catch (error) {
    console.error('Erreur inscription:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Erreur lors de la création du compte' 
      })
    };
  }
};