const { connectToDatabase } = require('../mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Méthode non autorisée' })
    };
  }

  try {
    console.log('🔄 Récupération des paramètres...');
    
    const db = await connectToDatabase();
    const settingsCollection = db.collection('settings');

    // Récupérer la configuration
    const config = await settingsCollection.findOne({ type: 'parkingConfig' });
    
    // Récupérer les règles de tarification
    const pricingRules = await settingsCollection.findOne({ type: 'pricingRules' });

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

    const defaultPricingRules = [
      { id: 1, name: 'Tarif de base', rate: '2.50 DT/heure', active: true },
      { id: 2, name: 'Heures de pointe (8h-10h, 17h-19h)', rate: '3.75 DT/heure', active: true },
      { id: 3, name: 'Week-end', rate: '2.00 DT/heure', active: true },
      { id: 4, name: 'Nuit (22h-6h)', rate: '1.50 DT/heure', active: true },
    ];

    const responseData = {
      success: true,
      config: config ? config.data : defaultConfig,
      pricingRules: pricingRules ? pricingRules.rules : defaultPricingRules
    };

    console.log('✅ Paramètres récupérés:', responseData.config.totalSpaces, 'places');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('❌ Erreur get-settings:', error);
    
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