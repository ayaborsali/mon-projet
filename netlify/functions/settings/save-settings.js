const { connectToDatabase } = require('../mongodb');

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
    console.log('💾 Sauvegarde des paramètres...');
    
    const { config, pricingRules } = JSON.parse(event.body);
    
    console.log('📦 Données reçues - Config:', config.totalSpaces, 'places, Rules:', pricingRules.length);

    const db = await connectToDatabase();
    const settingsCollection = db.collection('settings');

    // Sauvegarder la configuration
    await settingsCollection.updateOne(
      { type: 'parkingConfig' },
      { 
        $set: { 
          type: 'parkingConfig',
          data: config,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    // Sauvegarder les règles de tarification
    await settingsCollection.updateOne(
      { type: 'pricingRules' },
      { 
        $set: { 
          type: 'pricingRules',
          rules: pricingRules,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    console.log('✅ Paramètres sauvegardés dans MongoDB');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Configuration sauvegardée avec succès dans MongoDB!'
      })
    };

  } catch (error) {
    console.error('❌ Erreur save-settings:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Erreur lors de la sauvegarde: ' + error.message 
      })
    };
  }
};