import React, { useState, useEffect } from 'react';
import { ParkingSpace, ParkingConfig, ParkingSession } from '../types/parking';
import { Car, Truck, Bike, AlertCircle, RefreshCw, Clock, User } from 'lucide-react';

const ParkingMap: React.FC = () => {
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVehicleType, setFilterVehicleType] = useState<string>('all');
  const [parkingConfig, setParkingConfig] = useState<ParkingConfig | null>(null);
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [activeSessions, setActiveSessions] = useState<ParkingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // États pour la réservation
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [reservationData, setReservationData] = useState({
    plate: '',
  });

  // Service API pour MongoDB
  const ApiService = {
    // Parking Spaces
    async getParkingSpaces(): Promise<ParkingSpace[]> {
      const response = await fetch('http://localhost:3001/api/parking/spaces');
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    },

    async updateParkingSpace(spaceNumber: string, updates: any): Promise<void> {
      const response = await fetch(`http://localhost:3001/api/parking/spaces/${spaceNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
    },

    // Sessions
    async getActiveSessions(): Promise<ParkingSession[]> {
      const response = await fetch('http://localhost:3001/api/sessions?status=active');
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.sessions || [];
    },

    // Réservations
    async reserveSpace(spaceNumber: string, plate: string, vehicleType: string): Promise<void> {
      const response = await fetch('http://localhost:3001/api/parking/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceNumber, plate, vehicleType })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
      }
    },

    async cancelReservation(spaceNumber: string): Promise<void> {
      const response = await fetch('http://localhost:3001/api/parking/cancel-reservation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceNumber })
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
    },

    async setOutOfService(spaceNumber: string): Promise<void> {
      const response = await fetch('http://localhost:3001/api/parking/out-of-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceNumber })
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
    },

    async setInService(spaceNumber: string): Promise<void> {
      const response = await fetch('http://localhost:3001/api/parking/in-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceNumber })
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
    },

    async occupySpace(spaceNumber: string, sessionId: string, plate: string, vehicleType: string): Promise<void> {
      const response = await fetch('http://localhost:3001/api/parking/occupy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceNumber, sessionId, plate, vehicleType })
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
    },

    async freeSpace(spaceNumber: string, sessionId: string): Promise<void> {
      const response = await fetch('http://localhost:3001/api/parking/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceNumber, sessionId })
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
    },

    async cleanupExpiredReservations(): Promise<void> {
      const response = await fetch('http://localhost:3001/api/parking/cleanup-expired', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
    },

    // Configuration - Récupérer les settings complets
    async getParkingConfig(): Promise<ParkingConfig> {
      const response = await fetch('http://localhost:3001/api/settings');
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.config;
    },

    // Générer les places avec le totalSpaces de la configuration
    async generateParkingSpaces(totalSpaces: number): Promise<void> {
      const response = await fetch('http://localhost:3001/api/parking/generate-spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalSpaces })
      });
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }
    }
  };

  // Charger la configuration depuis MongoDB
  useEffect(() => {
    loadParkingConfig();
  }, []);

  // Charger les places depuis MongoDB quand la config est prête
  useEffect(() => {
    if (parkingConfig) {
      console.log('🔍 Début du chargement des places MongoDB...');
      loadParkingSpaces();

      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(loadParkingSpaces, 30000);
      return () => clearInterval(interval);
    }
  }, [parkingConfig]);

  // Charger les sessions actives
  useEffect(() => {
    loadActiveSessions();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadActiveSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Nettoyer les réservations expirées au chargement
  useEffect(() => {
    ApiService.cleanupExpiredReservations().catch(console.error);
  }, []);

  const loadParkingConfig = async () => {
    try {
      console.log('🔧 Chargement de la configuration...');
      const config = await ApiService.getParkingConfig();
      setParkingConfig(config);
      console.log('✅ Configuration chargée:', config);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la configuration:', error);
      setError('Impossible de charger la configuration du parking');
      // Configuration par défaut
      const defaultConfig: ParkingConfig = {
        totalSpaces: 100,
        baseRate: 2.5,
        dynamicPricing: true,
        peakHourMultiplier: 1.5,
        maxDuration: 24,
        graceTime: 15,
        entryCameras: [],
        exitCameras: [],
        cameraIpRange: '',
        apiPort: '',
        plateRecognition: true,
        anomalyDetection: true
      };
      setParkingConfig(defaultConfig);
    }
  };

  const loadParkingSpaces = async () => {
    try {
      console.log('🔄 Chargement des places...');
      const spaces = await ApiService.getParkingSpaces();
      
      // Vérifier si le nombre de places correspond à la configuration
      if (parkingConfig && spaces.length !== parkingConfig.totalSpaces) {
        console.log(`🔄 Correction nécessaire: ${spaces.length} places vs ${parkingConfig.totalSpaces} configurées`);
        await ApiService.generateParkingSpaces(parkingConfig.totalSpaces);
        // Recharger après génération
        const newSpaces = await ApiService.getParkingSpaces();
        setParkingSpaces(newSpaces);
        console.log(`✅ ${newSpaces.length} places générées et chargées (basé sur config: ${parkingConfig.totalSpaces} places)`);
      } else {
        setParkingSpaces(spaces);
        console.log(`✅ ${spaces.length} places chargées (correspond à la configuration)`);
      }
      
      setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
      setError(null);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des places:', error);
      setError('Impossible de charger les places de parking. Vérifiez que le serveur est démarré.');
      setParkingSpaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveSessions = async () => {
    try {
      console.log('🔄 Chargement des sessions actives...');
      const sessions = await ApiService.getActiveSessions();
      setActiveSessions(sessions);
      console.log(`✅ ${sessions.length} sessions actives chargées`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des sessions actives:', error);
      setActiveSessions([]);
    }
  };

  // Fonctions pour gérer les actions sur les places
  const handleReserveSpace = async (spaceNumber: string) => {
    try {
      setActionLoading(spaceNumber);
      
      // Récupérer la place sélectionnée pour obtenir son type
      const space = parkingSpaces.find(s => s.number === spaceNumber);
      if (!space) {
        throw new Error('Place non trouvée');
      }

      await ApiService.reserveSpace(
        spaceNumber, 
        reservationData.plate, 
        space.type
      );
      
      console.log(`✅ Place ${spaceNumber} réservée avec succès pour ${reservationData.plate} (${space.type})`);
      setSelectedSpace(null);
      setShowReservationModal(false);
      setReservationData({ plate: '' });
      
      // Recharger les places
      await loadParkingSpaces();
    } catch (error) {
      console.error(`❌ Erreur lors de la réservation de la place ${spaceNumber}:`, error);
      setError(`Erreur: ${error instanceof Error ? error.message : 'Impossible de réserver la place'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelReservation = async (spaceNumber: string) => {
    try {
      setActionLoading(spaceNumber);
      await ApiService.cancelReservation(spaceNumber);
      console.log(`✅ Réservation annulée pour la place ${spaceNumber}`);
      setSelectedSpace(null);
      
      await loadParkingSpaces();
    } catch (error) {
      console.error(`❌ Erreur lors de l'annulation de la réservation ${spaceNumber}:`, error);
      setError(`Erreur: ${error instanceof Error ? error.message : 'Impossible d\'annuler la réservation'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetOutOfService = async (spaceNumber: string) => {
    try {
      setActionLoading(spaceNumber);
      await ApiService.setOutOfService(spaceNumber);
      console.log(`✅ Place ${spaceNumber} mise hors service`);
      setSelectedSpace(null);
      
      await loadParkingSpaces();
    } catch (error) {
      console.error(`❌ Erreur lors de la mise hors service de la place ${spaceNumber}:`, error);
      setError(`Erreur: ${error instanceof Error ? error.message : 'Impossible de mettre hors service'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetInService = async (spaceNumber: string) => {
    try {
      setActionLoading(spaceNumber);
      await ApiService.setInService(spaceNumber);
      console.log(`✅ Place ${spaceNumber} remise en service`);
      setSelectedSpace(null);
      
      await loadParkingSpaces();
    } catch (error) {
      console.error(`❌ Erreur lors de la remise en service de la place ${spaceNumber}:`, error);
      setError(`Erreur: ${error instanceof Error ? error.message : 'Impossible de remettre en service'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getSpaceColor = (space: ParkingSpace) => {
    switch (space.status) {
      case 'libre':
        return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
      case 'occupé':
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200';
      case 'réservé':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200';
      case 'hors-service':
        return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getSpaceIcon = (space: ParkingSpace) => {
    switch (space.type) {
      case 'camion':
        return <Truck className="w-4 h-4" />;
      case 'moto':
        return <Bike className="w-4 h-4" />;
      case 'voiture':
      default:
        return <Car className="w-4 h-4" />;
    }
  };

  const getVehicleTypeColor = (vehicleType: string) => {
    switch (vehicleType) {
      case 'voiture':
        return 'text-blue-600';
      case 'camion':
        return 'text-orange-600';
      case 'moto':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSessionForSpace = (spaceNumber: string) => {
    return activeSessions.find(session => session.spaceNumber === spaceNumber);
  };

  const filteredSpaces = parkingSpaces.filter(space => {
    const statusMatch = filterStatus === 'all' || space.status === filterStatus;
    const vehicleTypeMatch = filterVehicleType === 'all' || space.type === filterVehicleType;
    return statusMatch && vehicleTypeMatch;
  });

  const statusCounts = {
    libre: parkingSpaces.filter(s => s.status === 'libre').length,
    occupé: parkingSpaces.filter(s => s.status === 'occupé').length,
    réservé: parkingSpaces.filter(s => s.status === 'réservé').length,
    'hors-service': parkingSpaces.filter(s => s.status === 'hors-service').length,
  };

  const vehicleTypeCounts = {
    voiture: parkingSpaces.filter(s => s.type === 'voiture').length,
    camion: parkingSpaces.filter(s => s.type === 'camion').length,
    moto: parkingSpaces.filter(s => s.type === 'moto').length,
  };

  const refreshData = async () => {
    console.log('🔄 Actualisation manuelle...');
    setIsLoading(true);
    setError(null);
    await Promise.all([
      loadParkingConfig(),
      loadParkingSpaces(),
      loadActiveSessions()
    ]);
    setIsLoading(false);
  };

  const openReservationModal = (space: ParkingSpace) => {
    setSelectedSpace(space);
    setShowReservationModal(true);
  };

  // Fonction pour organiser les places en grille
  const organizeSpacesInGrid = (spaces: ParkingSpace[]) => {
    const zones = ['A', 'B', 'C', 'D', 'E'];
    const organizedSpaces: ParkingSpace[][] = [];
    
    // Organiser par zone
    zones.forEach(zone => {
      const zoneSpaces = spaces.filter(space => space.zone === zone);
      if (zoneSpaces.length > 0) {
        organizedSpaces.push(zoneSpaces);
      }
    });
    
    return organizedSpaces;
  };

  const organizedSpaces = organizeSpacesInGrid(filteredSpaces);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <div className="text-lg">Chargement du plan de parking...</div>
          <div className="text-sm text-gray-500">Connexion à MongoDB...</div>
        </div>
      </div>
    );
  }

  if (error && parkingSpaces.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-6 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="mb-2 text-xl font-bold text-red-600">Erreur de chargement</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Réessayer
          </button>
          <div className="mt-4 text-sm text-gray-500">
            <p>Assurez-vous que le serveur backend est démarré sur le port 3001</p>
            <p>Vérifiez que MongoDB est en cours d'exécution</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Plan du Parking</h2>
          <p className="text-gray-600">
            {parkingConfig?.totalSpaces || 0} places totales - Gestion en temps réel
          </p>
          {error && (
            <div className="p-3 mt-2 text-red-700 bg-red-100 rounded-lg">
              <AlertCircle className="inline w-4 h-4 mr-2" />
              {error}
            </div>
          )}
          <div className="mt-2 space-y-1">
            <p className="text-sm text-green-600">
              ✓ {activeSessions.length} véhicule(s) en stationnement
            </p>
            <p className="text-sm text-blue-600">
              🔄 Dernière mise à jour: {lastUpdate}
            </p>
            {parkingConfig && (
              <p className="text-sm text-purple-600">
                ⚙️ Configuration: {parkingConfig.totalSpaces} places totales configurées
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="p-4 border border-green-200 rounded-lg bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Libres</p>
              <p className="text-2xl font-bold text-green-800">{statusCounts.libre}</p>
              <p className="text-xs text-green-600">
                {parkingConfig ? `${Math.round((statusCounts.libre / parkingConfig.totalSpaces) * 100)}%` : '0%'}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Car className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Occupées</p>
              <p className="text-2xl font-bold text-red-800">{statusCounts.occupé}</p>
              <p className="text-xs text-red-600">
                {parkingConfig ? `${Math.round((statusCounts.occupé / parkingConfig.totalSpaces) * 100)}%` : '0%'}
              </p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <Car className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Réservées</p>
              <p className="text-2xl font-bold text-yellow-800">{statusCounts.réservé}</p>
              <p className="text-xs text-yellow-600">
                {parkingConfig ? `${Math.round((statusCounts.réservé / parkingConfig.totalSpaces) * 100)}%` : '0%'}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Car className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hors Service</p>
              <p className="text-2xl font-bold text-gray-800">{statusCounts['hors-service']}</p>
              <p className="text-xs text-gray-600">
                {parkingConfig ? `${Math.round((statusCounts['hors-service'] / parkingConfig.totalSpaces) * 100)}%` : '0%'}
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Type Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Voitures</p>
              <p className="text-2xl font-bold text-blue-800">{vehicleTypeCounts.voiture}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Camions</p>
              <p className="text-2xl font-bold text-orange-800">{vehicleTypeCounts.camion}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Motos</p>
              <p className="text-2xl font-bold text-purple-800">{vehicleTypeCounts.moto}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Bike className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Filtrer par statut:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Toutes ({parkingSpaces.length})
              </button>
              {Object.entries(statusCounts).map(([status, count]) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Filtrer par type de véhicule:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterVehicleType('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterVehicleType === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tous types
              </button>
              {Object.entries(vehicleTypeCounts).map(([type, count]) => (
                <button
                  key={type}
                  onClick={() => setFilterVehicleType(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterVehicleType === type
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Parking Grid */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        {organizedSpaces.map((zoneSpaces, zoneIndex) => (
          <div key={zoneIndex} className="mb-8">
            <h3 className="pb-2 mb-4 text-lg font-semibold text-gray-900 border-b">
              Zone {zoneSpaces[0]?.zone} ({zoneSpaces.length} places)
            </h3>
            <div className="grid grid-cols-10 gap-2 mb-6">
              {zoneSpaces.map((space) => {
                const session = getSessionForSpace(space.number);
                
                return (
                  <button
                    key={space._id || space.number}
                    onClick={() => setSelectedSpace(space)}
                    className={`aspect-square p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center text-xs font-medium relative ${getSpaceColor(space)}`}
                    title={`Place ${space.number} - ${space.type} - ${space.status}`}
                  >
                    <div className={getVehicleTypeColor(space.type)}>
                      {getSpaceIcon(space)}
                    </div>
                    <span className="mt-1 font-bold">{space.number.replace(zoneSpaces[0]?.zone, '')}</span>
                    
                    {session && (
                      <div className="absolute w-2 h-2 bg-red-500 border border-white rounded-full -top-0.5 -right-0.5"></div>
                    )}
                    
                    {space.reservation && (
                      <div className="absolute w-2 h-2 bg-yellow-500 border border-white rounded-full -top-0.5 -left-0.5"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <Car className="w-3 h-3 text-blue-600" />
            <span>Voiture</span>
          </div>
          <div className="flex items-center space-x-1">
            <Truck className="w-3 h-3 text-orange-600" />
            <span>Camion</span>
          </div>
          <div className="flex items-center space-x-1">
            <Bike className="w-3 h-3 text-purple-600" />
            <span>Moto</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Libre</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Occupé</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Réservé</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span>Hors service</span>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReservationModal && selectedSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Réserver la place {selectedSpace.number}
              </h3>
              <button
                onClick={() => {
                  setShowReservationModal(false);
                  setReservationData({ plate: '' });
                }}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Plaque d'immatriculation *
                </label>
                <input
                  type="text"
                  value={reservationData.plate}
                  onChange={(e) => setReservationData(prev => ({ 
                    ...prev, 
                    plate: e.target.value.toUpperCase() 
                  }))}
                  placeholder="ex: TUN-1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Type de véhicule
                </label>
                <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2">
                    {getSpaceIcon(selectedSpace)}
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {selectedSpace.type}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Type déterminé automatiquement par la place sélectionnée
                </p>
              </div>
            </div>

            <div className="flex mt-6 space-x-3">
              <button
                onClick={() => {
                  setShowReservationModal(false);
                  setReservationData({ plate: '' });
                }}
                className="flex-1 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReserveSpace(selectedSpace.number)}
                disabled={!reservationData.plate || actionLoading === selectedSpace.number}
                className="flex-1 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === selectedSpace.number ? (
                  <RefreshCw className="w-4 h-4 mx-auto animate-spin" />
                ) : (
                  'Confirmer la Réservation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Space Details Modal */}
      {selectedSpace && !showReservationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Place {selectedSpace.number}
              </h3>
              <button
                onClick={() => setSelectedSpace(null)}
                className="text-2xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600">Statut:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  selectedSpace.status === 'libre' ? 'bg-green-100 text-green-800' :
                  selectedSpace.status === 'occupé' ? 'bg-red-100 text-red-800' :
                  selectedSpace.status === 'réservé' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedSpace.status}
                </span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-600">Zone:</span>
                <span className="ml-2 text-sm text-gray-900">{selectedSpace.zone}</span>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <span className="flex items-center ml-2 text-sm text-gray-900">
                  <div className={getVehicleTypeColor(selectedSpace.type)}>
                    {getSpaceIcon(selectedSpace)}
                  </div>
                  <span className="ml-1 capitalize">{selectedSpace.type}</span>
                </span>
              </div>

              {selectedSpace.reservation && (
                <div className="p-3 rounded-lg bg-yellow-50">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Réservée pour:</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-yellow-700">
                      <strong>Plaque:</strong> {selectedSpace.reservation.plate}
                    </p>
                    <p className="text-sm text-yellow-700">
                      <strong>Type:</strong> {selectedSpace.reservation.vehicleType}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex mt-6 space-x-3">
              {selectedSpace.status === 'libre' && (
                <button 
                  onClick={() => openReservationModal(selectedSpace)}
                  className="flex-1 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Réserver
                </button>
              )}
              
              {selectedSpace.status === 'réservé' && (
                <button 
                  onClick={() => handleCancelReservation(selectedSpace.number)}
                  disabled={actionLoading === selectedSpace.number}
                  className="flex-1 py-2 text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedSpace.number ? (
                    <RefreshCw className="w-4 h-4 mx-auto animate-spin" />
                  ) : (
                    'Annuler Réservation'
                  )}
                </button>
              )}
              
              {selectedSpace.status === 'hors-service' && (
                <button 
                  onClick={() => handleSetInService(selectedSpace.number)}
                  disabled={actionLoading === selectedSpace.number}
                  className="flex-1 py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedSpace.number ? (
                    <RefreshCw className="w-4 h-4 mx-auto animate-spin" />
                  ) : (
                    'Remettre en Service'
                  )}
                </button>
              )}
              
              {selectedSpace.status !== 'hors-service' && selectedSpace.status !== 'occupé' && selectedSpace.status !== 'réservé' && (
                <button 
                  onClick={() => handleSetOutOfService(selectedSpace.number)}
                  disabled={actionLoading === selectedSpace.number}
                  className="flex-1 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === selectedSpace.number ? (
                    <RefreshCw className="w-4 h-4 mx-auto animate-spin" />
                  ) : (
                    'Mettre Hors Service'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingMap;