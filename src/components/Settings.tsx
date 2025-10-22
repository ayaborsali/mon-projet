import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, DollarSign, Clock, Camera, Wifi, Trash2, Plus } from 'lucide-react';
import { ParkingConfig, PricingRule } from '../types/parking';

// Service dédié pour les appels API
class SettingsApiService {
  private baseUrl = 'http://localhost:3001/api';

  async fetchConfig(): Promise<{ config: ParkingConfig; pricingRules: PricingRule[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      return {
        config: this.normalizeConfig(data.config),
        pricingRules: this.normalizePricingRules(data.pricingRules)
      };
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  async saveConfig(config: ParkingConfig, pricingRules: PricingRule[]): Promise<void> {
    try {
      console.log('💾 Envoi des données au serveur:', { config, pricingRules });
      
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config,
          pricingRules
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      console.log('✅ Réponse du serveur:', data.message);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  private normalizeConfig(config: any): ParkingConfig {
    return {
      totalSpaces: config?.totalSpaces || 100,
      baseRate: config?.baseRate || 2.5,
      dynamicPricing: config?.dynamicPricing ?? true,
      peakHourMultiplier: config?.peakHourMultiplier || 1.5,
      maxDuration: config?.maxDuration || 24,
      graceTime: config?.graceTime || 15,
      entryCameras: config?.entryCameras || ['Caméra 1 - Entrée A', 'Caméra 2 - Entrée B'],
      exitCameras: config?.exitCameras || ['Caméra 3 - Sortie A', 'Caméra 4 - Sortie B'],
      cameraIpRange: config?.cameraIpRange || '192.168.1.0/24',
      apiPort: config?.apiPort || '8080',
      plateRecognition: config?.plateRecognition ?? true,
      anomalyDetection: config?.anomalyDetection ?? true
    };
  }

  private normalizePricingRules(rules: any[]): PricingRule[] {
    if (!rules || !Array.isArray(rules)) {
      return [
        { id: 1, name: 'Tarif de base', rate: '2.50 DT/heure', active: true },
        { id: 2, name: 'Heures de pointe (8h-10h, 17h-19h)', rate: '3.75 DT/heure', active: true },
        { id: 3, name: 'Week-end', rate: '2.00 DT/heure', active: true },
        { id: 4, name: 'Nuit (22h-6h)', rate: '1.50 DT/heure', active: true },
      ];
    }

    return rules.map((rule, index) => ({
      id: rule.id || index + 1,
      name: rule.name || 'Nouvelle règle',
      rate: rule.rate || '0.00 DT/heure',
      active: rule.active !== false
    }));
  }
}

const apiService = new SettingsApiService();

const Settings: React.FC = () => {
  const [config, setConfig] = useState<ParkingConfig>({
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
  });

  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger la configuration depuis l'API
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Chargement de la configuration...');
      const { config: savedConfig, pricingRules: savedRules } = await apiService.fetchConfig();
      
      setConfig(savedConfig);
      setPricingRules(savedRules);
      
      console.log('✅ Configuration chargée depuis MongoDB');
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement:', err);
      setError(err.message || 'Erreur lors du chargement de la configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      console.log('💾 Tentative de sauvegarde dans MongoDB...');
      
      await apiService.saveConfig(config, pricingRules);

      setNotification('Configuration sauvegardée avec succès dans MongoDB!');
      setTimeout(() => setNotification(null), 3000);
      
    } catch (err: any) {
      console.error('❌ Erreur lors de la sauvegarde:', err);
      setError(err.message || 'Erreur lors de la sauvegarde dans MongoDB');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = (key: keyof ParkingConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePricingRuleChange = (id: number, field: keyof PricingRule, value: any) => {
    setPricingRules(prev => 
      prev.map(rule => 
        rule.id === id ? { ...rule, [field]: value } : rule
      )
    );
  };

  const addPricingRule = () => {
    const newId = pricingRules.length > 0 ? Math.max(...pricingRules.map(r => r.id)) + 1 : 1;
    setPricingRules(prev => [
      ...prev,
      { id: newId, name: 'Nouvelle règle', rate: '0.00 DT/heure', active: true }
    ]);
  };

  const deletePricingRule = (id: number) => {
    setPricingRules(prev => prev.filter(rule => rule.id !== id));
  };

  const togglePricingRule = (id: number) => {
    setPricingRules(prev => 
      prev.map(rule => 
        rule.id === id ? { ...rule, active: !rule.active } : rule
      )
    );
  };

  const refreshSettings = () => {
    loadConfig();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center text-lg text-gray-600">
          <div className="w-6 h-6 mr-3 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          Chargement de la configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Paramètres</h2>
          <p className="text-gray-600">Configuration du système de parking</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshSettings}
            className="flex items-center px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <div className="w-4 h-4 mr-2">⟳</div>
            Actualiser
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-green-600" />
            <span className="text-green-800">{notification}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Parking Configuration */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 mr-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Configuration Parking</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Nombre total de places
              </label>
              <input
                type="number"
                value={config.totalSpaces}
                onChange={(e) => handleConfigChange('totalSpaces', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Tarif de base (DT/heure)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.baseRate}
                onChange={(e) => handleConfigChange('baseRate', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Durée maximale (heures)
              </label>
              <input
                type="number"
                value={config.maxDuration}
                onChange={(e) => handleConfigChange('maxDuration', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Temps de grâce (minutes)
              </label>
              <input
                type="number"
                value={config.graceTime}
                onChange={(e) => handleConfigChange('graceTime', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Temps gratuit accordé après la première heure
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Pricing */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 mr-3 bg-green-100 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Tarification Dynamique</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Activer la tarification dynamique</p>
                <p className="text-xs text-gray-500">Ajuste les prix selon l'occupation et l'heure</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.dynamicPricing}
                  onChange={(e) => handleConfigChange('dynamicPricing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {config.dynamicPricing && (
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Multiplicateur heures de pointe
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.peakHourMultiplier}
                  onChange={(e) => handleConfigChange('peakHourMultiplier', parseFloat(e.target.value) || 1.5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Multiplicateur appliqué au tarif de base (ex: 1.5 = +50%)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Camera Settings */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 mr-3 bg-purple-100 rounded-lg">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Caméras & IA</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Caméras d'entrée
                </label>
                <select 
                  value={config.entryCameras[0]}
                  onChange={(e) => handleConfigChange('entryCameras', [e.target.value, config.entryCameras[1]])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Caméra 1 - Entrée A</option>
                  <option>Caméra 2 - Entrée B</option>
                  <option>Caméra 5 - Entrée C</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Caméras de sortie
                </label>
                <select 
                  value={config.exitCameras[0]}
                  onChange={(e) => handleConfigChange('exitCameras', [e.target.value, config.exitCameras[1]])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Caméra 3 - Sortie A</option>
                  <option>Caméra 4 - Sortie B</option>
                  <option>Caméra 6 - Sortie C</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Reconnaissance automatique des plaques</p>
                <p className="text-xs text-gray-500">
                  Précision actuelle: 97.8% | Dernière calibration: Il y a 2 jours
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.plateRecognition}
                  onChange={(e) => handleConfigChange('plateRecognition', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Détection d'anomalies</p>
                <p className="text-xs text-gray-500">
                  Double comptage, occupation illégale, véhicules non autorisés
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.anomalyDetection}
                  onChange={(e) => handleConfigChange('anomalyDetection', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Network Settings */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="p-2 mr-3 bg-orange-100 rounded-lg">
              <Wifi className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Connectivité</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Adresse IP caméras
                </label>
                <input
                  type="text"
                  value={config.cameraIpRange}
                  onChange={(e) => handleConfigChange('cameraIpRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Port API
                </label>
                <input
                  type="text"
                  value={config.apiPort}
                  onChange={(e) => handleConfigChange('apiPort', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-sm text-green-800">Base de données</span>
                <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">Connecté</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-sm text-green-800">Serveur de paiement</span>
                <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">Opérationnel</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <span className="text-sm text-yellow-800">Service SMS</span>
                <span className="px-2 py-1 text-xs text-yellow-800 bg-yellow-100 rounded-full">En attente</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Rules */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Règles de Tarification</h3>
          <button
            onClick={addPricingRule}
            className="flex items-center px-3 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Règle
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Tarif
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricingRules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={rule.name}
                      onChange={(e) => handlePricingRuleChange(rule.id, 'name', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      value={rule.rate}
                      onChange={(e) => handlePricingRuleChange(rule.id, 'rate', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      rule.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button 
                      onClick={() => togglePricingRule(rule.id)}
                      className="mr-3 text-blue-600 hover:text-blue-900"
                    >
                      {rule.active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button 
                      onClick={() => deletePricingRule(rule.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="inline w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;