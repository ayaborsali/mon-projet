import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Camera, 
  Eye, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

interface AIStats {
  plateRecognitionAccuracy: number;
  anomaliesDetected: number;
  predictedOccupancy: number;
  processingSpeed: number;
  camerasOnline: number;
  totalCameras: number;
}

interface DetectedAnomaly {
  id: string;
  type: 'double_counting' | 'illegal_parking' | 'unauthorized_vehicle' | 'long_stay';
  location: string;
  timestamp: Date;
  confidence: number;
  status: 'active' | 'resolved' | 'investigating';
  description: string;
}

const AIModule: React.FC = () => {
  const [aiStats, setAiStats] = useState<AIStats>({
    plateRecognitionAccuracy: 97.8,
    anomaliesDetected: 12,
    predictedOccupancy: 78,
    processingSpeed: 145,
    camerasOnline: 8,
    totalCameras: 10
  });

  const [anomalies, setAnomalies] = useState<DetectedAnomaly[]>([
    {
      id: '1',
      type: 'long_stay',
      location: 'Zone A - Place A5',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      confidence: 95,
      status: 'active',
      description: 'Véhicule TUN-1234 stationné depuis 8h (limite: 4h)'
    },
    {
      id: '2',
      type: 'unauthorized_vehicle',
      location: 'Zone B - Place B12',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      confidence: 87,
      status: 'investigating',
      description: 'Véhicule sans plaque détecté'
    },
    {
      id: '3',
      type: 'double_counting',
      location: 'Entrée principale',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      confidence: 92,
      status: 'resolved',
      description: 'Comptage double détecté et corrigé automatiquement'
    }
  ]);

  const [isCalibrating, setIsCalibrating] = useState(false);

  useEffect(() => {
    // Simulation de mise à jour des stats IA en temps réel
    const interval = setInterval(() => {
      setAiStats(prev => ({
        ...prev,
        plateRecognitionAccuracy: Math.max(95, Math.min(99.9, prev.plateRecognitionAccuracy + (Math.random() - 0.5) * 0.2)),
        predictedOccupancy: Math.max(0, Math.min(100, prev.predictedOccupancy + (Math.random() - 0.5) * 5)),
        processingSpeed: Math.max(100, Math.min(200, prev.processingSpeed + (Math.random() - 0.5) * 10)),
        anomaliesDetected: prev.anomaliesDetected + (Math.random() > 0.95 ? 1 : 0)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'double_counting':
        return <BarChart3 className="w-5 h-5 text-blue-500" />;
      case 'illegal_parking':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'unauthorized_vehicle':
        return <Eye className="w-5 h-5 text-orange-500" />;
      case 'long_stay':
        return <Activity className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAnomalyColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'investigating':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCalibration = () => {
    setIsCalibrating(true);
    setTimeout(() => {
      setIsCalibrating(false);
      setAiStats(prev => ({
        ...prev,
        plateRecognitionAccuracy: Math.min(99.9, prev.plateRecognitionAccuracy + 0.5)
      }));
    }, 3000);
  };

  const resolveAnomaly = (id: string) => {
    setAnomalies(prev => prev.map(anomaly =>
      anomaly.id === id ? { ...anomaly, status: 'resolved' } : anomaly
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Intelligence Artificielle</h2>
            <p className="text-gray-600">Reconnaissance automatique et détection d'anomalies</p>
          </div>
        </div>
        <button
          onClick={handleCalibration}
          disabled={isCalibrating}
          className="flex items-center px-4 py-2 text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 mr-2" />
          {isCalibrating ? 'Calibrage...' : 'Calibrer IA'}
        </button>
      </div>

      {/* AI Performance Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Précision ANPR</p>
              <p className="text-2xl font-bold text-gray-900">{aiStats.plateRecognitionAccuracy.toFixed(1)}%</p>
              <p className="text-sm text-green-600">Excellent niveau</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Anomalies Détectées</p>
              <p className="text-2xl font-bold text-gray-900">{aiStats.anomaliesDetected}</p>
              <p className="text-sm text-orange-600">Aujourd'hui</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Prédiction Occupation</p>
              <p className="text-2xl font-bold text-gray-900">{aiStats.predictedOccupancy}%</p>
              <p className="text-sm text-blue-600">Prochaine heure</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Vitesse Traitement</p>
              <p className="text-2xl font-bold text-gray-900">{aiStats.processingSpeed}</p>
              <p className="text-sm text-purple-600">images/min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Status */}
      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center text-lg font-semibold text-gray-900">
            <Camera className="w-5 h-5 mr-2" />
            État des Caméras
          </h3>
          <span className="text-sm text-gray-600">
            {aiStats.camerasOnline}/{aiStats.totalCameras} en ligne
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {Array.from({ length: aiStats.totalCameras }, (_, i) => {
            const isOnline = i < aiStats.camerasOnline;
            return (
              <div
                key={i}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  isOnline 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    Caméra {i + 1}
                  </span>
                  <div className={`h-2 w-2 rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {isOnline ? 'En ligne' : 'Hors ligne'}
                </p>
                {isOnline && (
                  <p className="text-xs text-green-600">
                    {Math.floor(Math.random() * 30) + 10} fps
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Anomalies Detection */}
      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Anomalies Détectées</h3>
          <div className="flex space-x-2">
            <span className="px-2 py-1 text-xs text-red-800 bg-red-100 rounded-full">
              {anomalies.filter(a => a.status === 'active').length} actives
            </span>
            <span className="px-2 py-1 text-xs text-orange-800 bg-orange-100 rounded-full">
              {anomalies.filter(a => a.status === 'investigating').length} en cours
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={`p-4 rounded-lg border ${getAnomalyColor(anomaly.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAnomalyIcon(anomaly.type)}
                  <div className="flex-1">
                    <div className="flex items-center mb-1 space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {anomaly.location}
                      </h4>
                      <span className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                        {anomaly.confidence}% confiance
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-gray-600">
                      {anomaly.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {anomaly.timestamp.toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {anomaly.status === 'active' && (
                    <button
                      onClick={() => resolveAnomaly(anomaly.id)}
                      className="text-sm text-green-600 hover:text-green-800"
                    >
                      Résoudre
                    </button>
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full ${getAnomalyColor(anomaly.status)}`}>
                    {anomaly.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Configuration */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Configuration ANPR</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Seuil de confiance minimum
              </label>
              <input
                type="range"
                min="70"
                max="99"
                defaultValue="85"
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>70%</span>
                <span>85%</span>
                <span>99%</span>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Zones de détection actives
              </label>
              <div className="space-y-2">
                {['Zone A', 'Zone B', 'Zone C', 'Entrée', 'Sortie'].map((zone) => (
                  <label key={zone} className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{zone}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Prédictions IA</h3>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <h4 className="mb-2 font-medium text-blue-900">Occupation Prévue</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Dans 1h:</span>
                  <span className="font-medium">78%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dans 2h:</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dans 4h:</span>
                  <span className="font-medium">45%</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-50">
              <h4 className="mb-2 font-medium text-green-900">Recommandations</h4>
              <ul className="space-y-1 text-sm text-green-800">
                <li>• Activer tarification dynamique à 14h</li>
                <li>• Augmenter surveillance Zone A</li>
                <li>• Maintenance caméra 3 recommandée</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModule;