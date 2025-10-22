import React, { useState, useEffect } from 'react';
import { 
  Car, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalSpaces: number;
  occupiedSpaces: number;
  freeSpaces: number;
  todayRevenue: number;
  todayVisitors: number;
  averageStay: number;
}

interface ParkingSession {
  id: string;
  vehicle: {
    plate: string;
    type: string;
    model?: string;
    color?: string;
  };
  spaceNumber: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'cancelled';
  amount?: number;
}

interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  read: boolean;
}

interface StatsResponse {
  spaces: {
    total: number;
    free: number;
    occupied: number;
    reserved: number;
    outOfService: number;
    occupancyRate: number;
  };
  sessions: {
    today: number;
    active: number;
  };
  timestamp: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSpaces: 0,
    occupiedSpaces: 0,
    freeSpaces: 0,
    todayRevenue: 0,
    todayVisitors: 0,
    averageStay: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSessions, setActiveSessions] = useState<ParkingSession[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Formater l'heure
  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Erreur formatage heure:', error);
      return '--:--';
    }
  };

  // Calculer la durée en minutes
  const calculateDuration = (startTime: string): number => {
    try {
      const start = new Date(startTime);
      return Math.floor((Date.now() - start.getTime()) / (1000 * 60));
    } catch (error) {
      console.error('Erreur calcul durée:', error);
      return 0;
    }
  };

  // Charger les statistiques
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Charger les statistiques globales
      const statsResponse = await fetch('http://localhost:3001/api/stats');
      const statsData: StatsResponse = await statsResponse.json();

      // Charger les sessions actives
      const sessionsResponse = await fetch('http://localhost:3001/api/sessions?status=active&limit=10');
      const sessionsData = await sessionsResponse.json();

      // Charger les alertes récentes
      const alertsResponse = await fetch('http://localhost:3001/api/alerts?limit=3');
      const alertsData = await alertsResponse.json();

      // Calculer les revenus du jour (à adapter selon votre logique)
      const todayRevenue = await calculateTodayRevenue();

      setStats({
        totalSpaces: statsData.spaces.total,
        occupiedSpaces: statsData.spaces.occupied,
        freeSpaces: statsData.spaces.free,
        todayRevenue,
        todayVisitors: statsData.sessions.today,
        averageStay: 2.5 // Valeur par défaut, à calculer selon vos données
      });

      setActiveSessions(sessionsData.sessions || []);
      setRecentAlerts(alertsData.alerts || []);

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
      
      // Données de démo en cas d'erreur
      setStats({
        totalSpaces: 50,
        occupiedSpaces: 35,
        freeSpaces: 15,
        todayRevenue: 450.75,
        todayVisitors: 28,
        averageStay: 2.5
      });

      setActiveSessions([
        {
          id: '1',
          vehicle: { plate: 'AB-123-CD', type: 'voiture' },
          spaceNumber: 'A001',
          startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          status: 'active'
        },
        {
          id: '2', 
          vehicle: { plate: 'EF-456-GH', type: 'camion' },
          spaceNumber: 'B002',
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'active'
        }
      ]);

      setRecentAlerts([
        {
          id: '1',
          type: 'warning',
          message: 'Place A003 en panne technique',
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          type: 'success', 
          message: 'Nouvelle réservation pour place C001',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          read: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les revenus du jour
  const calculateTodayRevenue = async (): Promise<number> => {
    try {
      const response = await fetch('http://localhost:3001/api/sessions?status=completed&limit=100');
      const data = await response.json();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySessions = data.sessions.filter((session: ParkingSession) => {
        const sessionDate = new Date(session.endTime || session.startTime);
        return sessionDate >= today && session.amount;
      });

      return todaySessions.reduce((total: number, session: ParkingSession) => 
        total + (session.amount || 0), 0
      );
    } catch (error) {
      console.error('Erreur calcul revenus:', error);
      return 0;
    }
  };

  // Charger les données au montage
  useEffect(() => {
    fetchDashboardData();

    // Mettre à jour toutes les 30 secondes
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mettre à jour l'heure actuelle
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const occupancyPercentage = stats.totalSpaces > 0 
    ? (stats.occupiedSpaces / stats.totalSpaces) * 100 
    : 0;

  // Fonction pour actualiser manuellement
  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Chargement du dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">
            {currentTime.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} - {currentTime.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50">
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Places Occupées</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.occupiedSpaces}/{stats.totalSpaces}
              </p>
              <p className="text-sm text-gray-500">{occupancyPercentage.toFixed(1)}% d'occupation</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenus du Jour</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayRevenue.toFixed(2)} DT</p>
              <p className="flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                Revenus aujourd'hui
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Visiteurs Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayVisitors}</p>
              <p className="text-sm text-orange-600">En cours: {activeSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Durée Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageStay}h</p>
              <p className="text-sm text-gray-500">Par session</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Occupancy Chart */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm lg:col-span-2 rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Taux d'Occupation - 24h</h3>
          <div className="flex items-end h-64 space-x-2">
            {Array.from({ length: 24 }, (_, i) => {
              const height = Math.random() * 80 + 20;
              return (
                <div
                  key={`hour-${i}`} 
                  className="flex-1 rounded-t bg-gradient-to-t from-blue-500 to-blue-300"
                  style={{ height: `${height}%` }}
                  title={`${i}:00 - ${height.toFixed(0)}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Alertes Récentes</h3>
          <div className="space-y-3">
            {recentAlerts.length === 0 ? (
              <p className="py-4 text-center text-gray-500">Aucune alerte récente</p>
            ) : (
              recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start p-3 space-x-3 rounded-lg bg-gray-50"> {/* ✅ Key unique ajoutée */}
                  <div className="flex-shrink-0">
                    {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-orange-500" />}
                    {alert.type === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatTime(alert.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Sessions */}
      <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sessions Actives</h3>
          <span className="px-3 py-1 text-sm text-green-800 bg-green-100 rounded-full">
            {activeSessions.length} actives
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                <th className="pb-3">Plaque</th>
                <th className="pb-3">Place</th>
                <th className="pb-3">Entrée</th>
                <th className="pb-3">Durée</th>
                <th className="pb-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {activeSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    Aucune session active
                  </td>
                </tr>
              ) : (
                activeSessions.map((session) => (
                  <tr key={session.id} className="border-t border-gray-100"> {/* ✅ Key unique ajoutée */}
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-10 h-10 mr-3 bg-gray-200 rounded">
                          <Car className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="font-medium text-gray-900">{session.vehicle.plate}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{session.spaceNumber}</td>
                    <td className="py-3 text-gray-600">
                      {formatTime(session.startTime)}
                    </td>
                    <td className="py-3 text-gray-600">
                      {calculateDuration(session.startTime)} min
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;