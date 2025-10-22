// src/utils/initializeSettings.ts
import { getDb } from '../../config/mongodb';

export const initializeDefaultSettings = async () => {
  try {
    const db = getDb();
    const settingsCollection = db.collection('settings');

    // Vérifier si les paramètres existent déjà
    const existingConfig = await settingsCollection.findOne({ _id: 'parkingConfig' });
    
    if (!existingConfig) {
      // Configuration parking par défaut
      const defaultConfig = {
        _id: 'parkingConfig',
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
        anomalyDetection: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Règles de tarification par défaut
      const defaultPricingRules = {
        _id: 'pricingRules',
        rules: [
          { id: 1, name: 'Tarif de base', rate: '2.50 DT/heure', active: true },
          { id: 2, name: 'Heures de pointe (8h-10h, 17h-19h)', rate: '3.75 DT/heure', active: true },
          { id: 3, name: 'Week-end', rate: '2.00 DT/heure', active: true },
          { id: 4, name: 'Nuit (22h-6h)', rate: '1.50 DT/heure', active: true },
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await settingsCollection.insertMany([defaultConfig, defaultPricingRules]);
      console.log('✅ Paramètres par défaut initialisés');
    }
  } catch (error) {
    console.error('❌ Erreur initialisation paramètres:', error);
  }
};