// src/services/settingsService.ts
import { ObjectId } from 'mongodb';
import { getDb } from '../../config/mongodb';
import { ParkingConfig, PricingRule } from '../types/parking';

export const settingsService = {
  // Charger la configuration
  loadConfig: async (): Promise<{ config: ParkingConfig; pricingRules: PricingRule[] }> => {
    try {
      const db = getDb();
      const settingsCollection = db.collection('settings');

      // Charger la configuration parking
      const configDoc = await settingsCollection.findOne({ type: 'parkingConfig' });
      
      // Configuration par défaut
      const defaultConfig: ParkingConfig = {
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

      // Fusionner avec la configuration sauvegardée
      const config: ParkingConfig = configDoc ? { 
        ...defaultConfig, 
        ...configDoc,
        // Éviter de surcharger les tableaux s'ils existent
        entryCameras: configDoc.entryCameras || defaultConfig.entryCameras,
        exitCameras: configDoc.exitCameras || defaultConfig.exitCameras
      } : defaultConfig;

      // Charger les règles de tarification
      const rulesDoc = await settingsCollection.findOne({ type: 'pricingRules' });
      const defaultPricingRules: PricingRule[] = [
        { id: 1, name: 'Tarif de base', rate: '2.50 DT/heure', active: true },
        { id: 2, name: 'Heures de pointe (8h-10h, 17h-19h)', rate: '3.75 DT/heure', active: true },
        { id: 3, name: 'Week-end', rate: '2.00 DT/heure', active: true },
        { id: 4, name: 'Nuit (22h-6h)', rate: '1.50 DT/heure', active: true },
      ];

      const pricingRules: PricingRule[] = rulesDoc?.rules ? 
        rulesDoc.rules.map((rule: any, index: number) => ({
          id: rule.id || index + 1,
          _id: rule._id,
          name: rule.name || 'Nouvelle règle',
          rate: rule.rate || '0.00 DT/heure',
          active: rule.active !== false
        })) : defaultPricingRules;

      return { config, pricingRules };
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la configuration:', error);
      throw error;
    }
  },

  // Sauvegarder la configuration
  saveConfig: async (config: ParkingConfig, pricingRules: PricingRule[]): Promise<void> => {
    try {
      const db = getDb();
      const settingsCollection = db.collection('settings');
      const now = new Date();

      console.log('💾 Sauvegarde configuration:', { config, pricingRules });

      // Nettoyer les règles de tarification pour MongoDB
      const cleanPricingRules = pricingRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        rate: rule.rate,
        active: rule.active
      }));

      // Sauvegarder la configuration parking
      const configResult = await settingsCollection.updateOne(
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
      const rulesResult = await settingsCollection.updateOne(
        { type: 'pricingRules' },
        { 
          $set: { 
            rules: cleanPricingRules,
            type: 'pricingRules',
            updatedAt: now
          } 
        },
        { upsert: true }
      );

      console.log('✅ Configuration sauvegardée:', {
        config: configResult,
        rules: rulesResult
      });

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la configuration:', error);
      throw error;
    }
  }
};