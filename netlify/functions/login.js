// netlify/functions/login.ts
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}');

    // Ici tu ferais la vérification dans MongoDB
    // Exemple simulé :
    if (email === 'admin@smartparking.com' && password === 'admin123') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          token: 'fake-jwt-token',
          user: { email, role: 'admin' }
        })
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, error: 'Email ou mot de passe invalide' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Erreur serveur' })
    };
  }
};
