import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Car, 
  Truck, 
  Bike, 
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  Ban,
  Settings,
  RefreshCw,
  Bell
} from 'lucide-react';
import { ParkingSpace } from '../types/parking';
import { parkingSpaceService } from '../services/parkingService';
import { notificationService } from '../services/notificationService';

// Service de notification pour le composant ParkingSpaces (adapté pour MongoDB)
const ParkingNotificationService = {
  createReservationNotification: async (spaceNumber: string, plate: string, vehicleType: string, expiresAt: Date): Promise<void> => {
    try {
      const now = new Date();

      const notificationData = {
        type: 'warning',
        title: '📋 Réservation Créée',
        message: `Place ${spaceNumber} réservée pour ${plate.toUpperCase()} (${vehicleType}) - Expire à ${expiresAt.toLocaleTimeString()}`,
        timestamp: now,
        read: false,
        category: 'parking',
        plate: plate.toUpperCase(),
        spaceNumber: spaceNumber,
        vehicleType: vehicleType,
        actionUrl: '/sessions',
        metadata: {
          reservationExpiresAt: expiresAt,
          spaceNumber: spaceNumber,
          vehicleType: vehicleType
        }
      };

      await notificationService.createNotification(notificationData);
      
      console.log('🔔 Notification créée pour réservation:', {
        plate: plate,
        space: spaceNumber,
        vehicleType: vehicleType
      });

    } catch (error) {
      console.error('❌ Erreur création notification réservation:', error);
    }
  },

  createOutOfServiceNotification: async (spaceNumber: string, reason: string): Promise<void> => {
    try {
      const now = new Date();

      const notificationData = {
        type: 'error',
        title: '🚧 Place Hors Service',
        message: `Place ${spaceNumber} mise hors service - ${reason}`,
        timestamp: now,
        read: false,
        category: 'parking',
        spaceNumber: spaceNumber,
        actionUrl: '/parking-spaces',
        metadata: {
          reason: reason,
          spaceNumber: spaceNumber,
          outOfServiceTime: now
        }
      };

      await notificationService.createNotification(notificationData);
      
      console.log('🔔 Notification créée pour place hors service:', {
        space: spaceNumber,
        reason: reason
      });

    } catch (error) {
      console.error('❌ Erreur création notification hors service:', error);
    }
  },

  createSpaceFreedNotification: async (spaceNumber: string, plate?: string, reason?: string): Promise<void> => {
    try {
      const now = new Date();

      const message = plate 
        ? `Place ${spaceNumber} libérée - Véhicule ${plate.toUpperCase()} parti`
        : `Place ${spaceNumber} libérée${reason ? ` - ${reason}` : ''}`;

      const notificationData = {
        type: 'success',
        title: '🅿️ Place Libérée',
        message: message,
        timestamp: now,
        read: false,
        category: 'parking',
        plate: plate?.toUpperCase(),
        spaceNumber: spaceNumber,
        actionUrl: '/parking-spaces',
        metadata: {
          reason: reason,
          spaceNumber: spaceNumber,
          freedTime: now
        }
      };

      await notificationService.createNotification(notificationData);
      
      console.log('🔔 Notification créée pour place libérée:', {
        space: spaceNumber,
        plate: plate,
        reason: reason
      });

    } catch (error) {
      console.error('❌ Erreur création notification place libérée:', error);
    }
  },

  createReservationCancelledNotification: async (spaceNumber: string, plate: string, vehicleType: string): Promise<void> => {
    try {
      const now = new Date();

      const notificationData = {
        type: 'info',
        title: '❌ Réservation Annulée',
        message: `Réservation annulée pour la place ${spaceNumber} - Véhicule: ${plate} (${vehicleType})`,
        timestamp: now,
        read: false,
        category: 'parking',
        plate: plate.toUpperCase(),
        spaceNumber: spaceNumber,
        vehicleType: vehicleType,
        actionUrl: '/parking-spaces',
        metadata: {
          spaceNumber: spaceNumber,
          vehicleType: vehicleType,
          cancelledTime: now
        }
      };

      await notificationService.createNotification(notificationData);
      
      console.log('🔔 Notification créée pour annulation réservation:', {
        plate: plate,
        space: spaceNumber,
        vehicleType: vehicleType
      });

    } catch (error) {
      console.error('❌ Erreur création notification annulation réservation:', error);
    }
  }
};

const ParkingSpaces: React.FC = () => {
  const [parkingSpaces, setParkingSpaces] = useState<ParkingSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [showOutOfServiceForm, setShowOutOfServiceForm] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<ParkingSpace | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // États pour la réservation
  const [reservationData, setReservationData] = useState({
    plate: '',
    vehicleType: 'voiture' as 'voiture' | 'camion' | 'moto'
  });

  // États pour hors service
  const [outOfServiceData, setOutOfServiceData] = useState({
    reason: 'Maintenance'
  });

  // Charger les places de parking
  useEffect(() => {
    const unsubscribe = parkingSpaceService.subscribeToParkingSpaces((spaces) => {
      console.log('🔄 Places de parking mises à jour:', spaces.length);
      setParkingSpaces(spaces);
      setLoading(false);
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Réserver une place
  const handleReserveSpace = async (space: ParkingSpace) => {
    setSelectedSpace(space);
    setReservationData({
      plate: '',
      vehicleType: space.type
    });
    setShowReservationForm(true);
  };

  const confirmReservation = async () => {
    if (!selectedSpace || !reservationData.plate) return;

    try {
      // Appeler le service de réservation existant
      await parkingSpaceService.reserveSpace(
        selectedSpace.number,
        reservationData.plate.toUpperCase(),
        reservationData.vehicleType
      );

      // 🔔 CRÉER LA NOTIFICATION DE RÉSERVATION
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await ParkingNotificationService.createReservationNotification(
        selectedSpace.number,
        reservationData.plate.toUpperCase(),
        reservationData.vehicleType,
        expiresAt
      );

      console.log('✅ Place réservée avec notification:', selectedSpace.number);
      
      setShowReservationForm(false);
      setSelectedSpace(null);
      setReservationData({ plate: '', vehicleType: 'voiture' });
      
      alert(`Place ${selectedSpace.number} réservée avec succès! Expire à ${expiresAt.toLocaleTimeString()}`);

    } catch (error: any) {
      console.error('❌ Erreur réservation:', error);
      alert(`Erreur lors de la réservation: ${error.message}`);
    }
  };

  // Mettre une place hors service
  const handleSetOutOfService = async (space: ParkingSpace) => {
    setSelectedSpace(space);
    setShowOutOfServiceForm(true);
  };

  const confirmOutOfService = async () => {
    if (!selectedSpace || !outOfServiceData.reason) return;

    try {
      // Appeler le service existant pour mettre hors service
      await parkingSpaceService.setOutOfService(selectedSpace.number);

      // 🔔 CRÉER LA NOTIFICATION HORS SERVICE
      await ParkingNotificationService.createOutOfServiceNotification(
        selectedSpace.number,
        outOfServiceData.reason
      );

      console.log('✅ Place mise hors service avec notification:', selectedSpace.number);
      
      setShowOutOfServiceForm(false);
      setSelectedSpace(null);
      setOutOfServiceData({ reason: 'Maintenance' });
      
      alert(`Place ${selectedSpace.number} mise hors service!`);

    } catch (error: any) {
      console.error('❌ Erreur mise hors service:', error);
      alert(`Erreur lors de la mise hors service: ${error.message}`);
    }
  };

  // Remettre une place en service
  const handleSetInService = async (space: ParkingSpace) => {
    if (!confirm(`Voulez-vous remettre la place ${space.number} en service ?`)) return;

    try {
      await parkingSpaceService.setInService(space.number);

      // 🔔 CRÉER LA NOTIFICATION DE REMISE EN SERVICE
      await ParkingNotificationService.createSpaceFreedNotification(
        space.number,
        undefined,
        'Remise en service'
      );

      console.log('✅ Place remise en service avec notification:', space.number);
      alert(`Place ${space.number} remise en service!`);

    } catch (error: any) {
      console.error('❌ Erreur remise en service:', error);
      alert(`Erreur lors de la remise en service: ${error.message}`);
    }
  };

  // Annuler une réservation
  const handleCancelReservation = async (space: ParkingSpace) => {
    if (!space.reservation) return;

    if (!confirm(`Voulez-vous annuler la réservation pour la place ${space.number} (${space.reservation.plate}) ?`)) return;

    try {
      await parkingSpaceService.cancelReservation(space.number);

      // 🔔 CRÉER LA NOTIFICATION D'ANNULATION
      await ParkingNotificationService.createReservationCancelledNotification(
        space.number,
        space.reservation.plate,
        space.reservation.vehicleType
      );

      console.log('✅ Réservation annulée avec notification:', space.number);
      alert(`Réservation annulée pour la place ${space.number}!`);

    } catch (error: any) {
      console.error('❌ Erreur annulation réservation:', error);
      alert(`Erreur lors de l'annulation: ${error.message}`);
    }
  };

  // Libérer une place manuellement
  const handleFreeSpace = async (space: ParkingSpace) => {
    if (!confirm(`Voulez-vous libérer la place ${space.number} ?`)) return;

    try {
      await parkingSpaceService.freeSpace(space.number);

      // 🔔 CRÉER LA NOTIFICATION DE LIBÉRATION
      await ParkingNotificationService.createSpaceFreedNotification(
        space.number,
        undefined,
        'Libération manuelle'
      );

      console.log('✅ Place libérée avec notification:', space.number);
      alert(`Place ${space.number} libérée avec succès!`);

    } catch (error: any) {
      console.error('❌ Erreur libération:', error);
      alert(`Erreur lors de la libération: ${error.message}`);
    }
  };

  // Fonctions utilitaires pour l'affichage
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'libre': return 'bg-green-100 text-green-800';
      case 'occupé': return 'bg-red-100 text-red-800';
      case 'réservé': return 'bg-orange-100 text-orange-800';
      case 'hors-service': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'libre': return <CheckCircle className="w-4 h-4" />;
      case 'occupé': return <Car className="w-4 h-4" />;
      case 'réservé': return <Clock className="w-4 h-4" />;
      case 'hors-service': return <Ban className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'camion': return <Truck className="w-4 h-4" />;
      case 'moto': return <Bike className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirée';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  // Filtrage des places
  const filteredSpaces = parkingSpaces.filter(space => {
    const matchesSearch = space.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         space.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (space.reservation?.plate || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || space.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <div className="text-lg">Chargement des places de parking...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Places de Parking</h2>
          <p className="text-gray-600">Gestion des places et réservations</p>
        </div>
        <button 
          onClick={() => window.location.href = '/notifications'}
          className="relative flex items-center px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Bell className="w-4 h-4 mr-2" />
          Notifications
          <span className="absolute flex w-3 h-3 -top-1 -right-1">
            <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
            <span className="relative inline-flex w-3 h-3 bg-red-500 rounded-full"></span>
          </span>
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="p-4 text-center bg-white border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {parkingSpaces.filter(s => s.status === 'libre').length}
          </div>
          <div className="text-sm text-gray-600">Libres</div>
        </div>
        <div className="p-4 text-center bg-white border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {parkingSpaces.filter(s => s.status === 'occupé').length}
          </div>
          <div className="text-sm text-gray-600">Occupées</div>
        </div>
        <div className="p-4 text-center bg-white border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {parkingSpaces.filter(s => s.status === 'réservé').length}
          </div>
          <div className="text-sm text-gray-600">Réservées</div>
        </div>
        <div className="p-4 text-center bg-white border border-gray-200 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {parkingSpaces.filter(s => s.status === 'hors-service').length}
          </div>
          <div className="text-sm text-gray-600">Hors Service</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Rechercher par numéro, zone ou plaque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="libre">Libre</option>
              <option value="occupé">Occupé</option>
              <option value="réservé">Réservé</option>
              <option value="hors-service">Hors Service</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des places */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSpaces.map((space) => (
          <div
            key={space._id || space.id}
            className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getVehicleIcon(space.type)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Place {space.number}
                  </h3>
                  <p className="text-sm text-gray-500">Zone {space.zone}</p>
                </div>
              </div>
              <span className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(space.status)}`}>
                {getStatusIcon(space.status)}
                <span className="capitalize">{space.status}</span>
              </span>
            </div>

            {/* Informations de réservation */}
            {space.status === 'réservé' && space.reservation && (
              <div className="p-3 mb-4 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Réservé pour {space.reservation.plate}
                    </p>
                    <p className="text-xs text-orange-600 capitalize">
                      {space.reservation.vehicleType}
                    </p>
                  </div>
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex items-center text-xs text-orange-700">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>
                    Expire dans {formatTimeRemaining(new Date(space.reservation.expiresAt))}
                  </span>
                </div>
              </div>
            )}

            {/* Informations hors service */}
            {space.status === 'hors-service' && (
              <div className="p-3 mb-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2">
                  <Ban className="w-4 h-4 text-gray-500" />
                  <p className="text-sm text-gray-700">Place hors service</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {space.status === 'libre' && (
                <>
                  <button
                    onClick={() => handleReserveSpace(space)}
                    className="flex-1 px-3 py-2 text-sm text-orange-600 transition-colors border border-orange-300 rounded-lg hover:bg-orange-50"
                  >
                    Réserver
                  </button>
                  <button
                    onClick={() => handleSetOutOfService(space)}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hors Service
                  </button>
                </>
              )}
              
              {space.status === 'réservé' && (
                <>
                  <button
                    onClick={() => handleCancelReservation(space)}
                    className="flex-1 px-3 py-2 text-sm text-red-600 transition-colors border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleSetOutOfService(space)}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Hors Service
                  </button>
                </>
              )}
              
              {space.status === 'occupé' && (
                <button
                  onClick={() => handleFreeSpace(space)}
                  className="flex-1 px-3 py-2 text-sm text-green-600 transition-colors border border-green-300 rounded-lg hover:bg-green-50"
                >
                  Libérer
                </button>
              )}
              
              {space.status === 'hors-service' && (
                <>
                  <button
                    onClick={() => handleSetInService(space)}
                    className="flex-1 px-3 py-2 text-sm text-green-600 transition-colors border border-green-300 rounded-lg hover:bg-green-50"
                  >
                    Remettre en service
                  </button>
                  <button
                    onClick={() => handleFreeSpace(space)}
                    className="flex-1 px-3 py-2 text-sm text-blue-600 transition-colors border border-blue-300 rounded-lg hover:bg-blue-50"
                  >
                    Libérer
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Réservation */}
      {showReservationForm && selectedSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Réserver la Place {selectedSpace.number}
              </h3>
              <button
                onClick={() => {
                  setShowReservationForm(false);
                  setSelectedSpace(null);
                  setReservationData({ plate: '', vehicleType: 'voiture' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
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
                  placeholder="Ex: 1234TU123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Type de véhicule *
                </label>
                <select
                  value={reservationData.vehicleType}
                  onChange={(e) => setReservationData(prev => ({ 
                    ...prev, 
                    vehicleType: e.target.value as 'voiture' | 'camion' | 'moto'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="voiture">Voiture</option>
                  <option value="camion">Camion</option>
                  <option value="moto">Moto</option>
                </select>
              </div>

              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    ⏰ La réservation expirera automatiquement après 30 minutes.
                  </p>
                </div>
              </div>

              <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <p className="text-sm text-orange-700">
                    🚗 Seul le véhicule avec cette plaque pourra occuper cette place.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex mt-6 space-x-3">
              <button
                onClick={() => {
                  setShowReservationForm(false);
                  setSelectedSpace(null);
                  setReservationData({ plate: '', vehicleType: 'voiture' });
                }}
                className="flex-1 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmReservation}
                disabled={!reservationData.plate}
                className="flex-1 py-2 text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer la Réservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hors Service */}
      {showOutOfServiceForm && selectedSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Mettre Hors Service - Place {selectedSpace.number}
              </h3>
              <button
                onClick={() => {
                  setShowOutOfServiceForm(false);
                  setSelectedSpace(null);
                  setOutOfServiceData({ reason: 'Maintenance' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Raison *
                </label>
                <select
                  value={outOfServiceData.reason}
                  onChange={(e) => setOutOfServiceData({ reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Maintenance">Maintenance</option>
                  <option value="Nettoyage">Nettoyage</option>
                  <option value="Réparation">Réparation</option>
                  <option value="Événement spécial">Événement spécial</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              {outOfServiceData.reason === 'Autre' && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Précisez la raison
                  </label>
                  <input
                    type="text"
                    value={outOfServiceData.reason}
                    onChange={(e) => setOutOfServiceData({ reason: e.target.value })}
                    placeholder="Entrez la raison..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center space-x-2">
                  <Ban className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700">
                    Cette place ne sera plus disponible jusqu'à ce qu'elle soit remise en service.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex mt-6 space-x-3">
              <button
                onClick={() => {
                  setShowOutOfServiceForm(false);
                  setSelectedSpace(null);
                  setOutOfServiceData({ reason: 'Maintenance' });
                }}
                className="flex-1 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmOutOfService}
                disabled={!outOfServiceData.reason}
                className="flex-1 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer Hors Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pied de page avec informations */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex flex-col text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <strong>{parkingSpaces.length}</strong> place(s) au total • 
            {' '}<strong>{parkingSpaces.filter(s => s.status === 'libre').length}</strong> libre(s)
          </div>
          <div className="mt-2 sm:mt-0">
            Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingSpaces;