import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone, Wallet, TrendingUp, Search, Filter, RefreshCw, Calendar, AlertCircle } from 'lucide-react';
import { Payment } from '../types/parking';
import { paymentService } from '../services/paymentService';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger TOUS les paiements depuis MongoDB
  const loadAllPayments = async () => {
    try {
      console.log('🔄 Chargement de TOUS les paiements depuis MongoDB...');
      setError(null);
      const allPayments = await paymentService.getAllPayments();
      setPayments(allPayments);
      setLastUpdate(new Date());
      console.log(`✅ ${allPayments.length} paiements chargés depuis MongoDB`);
    } catch (error) {
      console.error('❌ Erreur chargement paiements:', error);
      setError('Impossible de charger les paiements depuis la base de données');
      setPayments([]); // Vider les paiements en cas d'erreur
    }
  };

  // Chargement initial et abonnement aux mises à jour
  useEffect(() => {
    setLoading(true);

    const initializePayments = async () => {
      await loadAllPayments();
      setLoading(false);
    };

    initializePayments();

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = paymentService.subscribeToPayments(
      (updatedPayments) => {
        console.log(`🆕 ${updatedPayments.length} paiements mis à jour en temps réel`);
        setPayments(updatedPayments);
        setLastUpdate(new Date());
        setError(null); // Effacer les erreurs si ça fonctionne
      },
      (error) => {
        console.error('❌ Erreur abonnement paiements:', error);
        setError('Erreur de connexion en temps réel');
      }
    );

    return unsubscribe;
  }, []);

  // Filtrer les paiements par date
  const getFilteredPaymentsByDate = () => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all':
      default:
        return payments;
    }

    return payments.filter(payment => payment.timestamp >= startDate);
  };

  const dateFilteredPayments = getFilteredPaymentsByDate();

  // Calculs des statistiques en temps réel
  const completedPayments = payments.filter(p => p.status === 'completé');
  const dateFilteredCompleted = dateFilteredPayments.filter(p => p.status === 'completé');
  
  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const todayCompleted = payments.filter(p => 
    p.status === 'completé' && p.timestamp >= todayStart
  );

  const paymentStats = {
    totalRevenue: completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    periodRevenue: dateFilteredCompleted.reduce((sum, p) => sum + (p.amount || 0), 0),
    todayRevenue: todayCompleted.reduce((sum, p) => sum + (p.amount || 0), 0),
    totalTransactions: completedPayments.length,
    periodTransactions: dateFilteredCompleted.length,
    todayTransactions: todayCompleted.length,
    pending: payments.filter(p => p.status === 'en_attente').length,
    failed: payments.filter(p => p.status === 'échoué').length,
    methods: {
      espèces: completedPayments.filter(p => p.method === 'espèces').reduce((sum, p) => sum + (p.amount || 0), 0),
      carte: completedPayments.filter(p => p.method === 'carte').reduce((sum, p) => sum + (p.amount || 0), 0),
      mobile_money: completedPayments.filter(p => p.method === 'mobile_money').reduce((sum, p) => sum + (p.amount || 0), 0),
      portefeuille: completedPayments.filter(p => p.method === 'portefeuille').reduce((sum, p) => sum + (p.amount || 0), 0),
    }
  };

  // Filtrage combiné
  const filteredPayments = dateFilteredPayments.filter(payment => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      payment.reference?.toLowerCase().includes(searchLower) ||
      (payment.plate !== 'N/A' && payment.plate?.toLowerCase().includes(searchLower)) ||
      (payment.spaceNumber !== 'N/A' && payment.spaceNumber?.toLowerCase().includes(searchLower));
    
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  // Fonctions utilitaires
  const getMethodPercentage = (methodAmount: number) => {
    return paymentStats.totalRevenue > 0 ? (methodAmount / paymentStats.totalRevenue) * 100 : 0;
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'espèces': return <Banknote className="w-5 h-5 text-green-600" />;
      case 'carte': return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'mobile_money': return <Smartphone className="w-5 h-5 text-purple-600" />;
      case 'portefeuille': return <Wallet className="w-5 h-5 text-orange-600" />;
      default: return <CreditCard className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completé': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'échoué': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completé': return 'Payé';
      case 'en_attente': return 'En attente';
      case 'échoué': return 'Échoué';
      default: return status;
    }
  };

  const getDateRangeText = () => {
    switch (dateRange) {
      case 'today': return "Aujourd'hui";
      case 'week': return '7 derniers jours';
      case 'month': return 'Ce mois';
      case 'all': return 'Toute période';
      default: return 'Toute période';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
  };

  const refreshData = async () => {
    console.log('🔄 Actualisation manuelle des paiements...');
    setLoading(true);
    await loadAllPayments();
    setLoading(false);
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-gray-600">Chargement des paiements depuis la base de données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion des Paiements</h2>
          <p className="text-gray-600">
            {payments.length} paiements en temps réel • 
            <span className="ml-1 text-green-600">
              Dernière mise à jour: {formatTimeAgo(lastUpdate)}
            </span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <div className="text-sm text-gray-500">
            Données MongoDB • Temps réel
          </div>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Erreur de connexion</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Période de filtrage */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Période:</span>
          </div>
          <div className="flex space-x-2">
            {[
              { value: 'today', label: "Aujourd'hui" },
              { value: 'week', label: '7 jours' },
              { value: 'month', label: 'Mois' },
              { value: 'all', label: 'Tout' }
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value as any)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  dateRange === range.value
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenus</p>
              <p className="text-2xl font-bold text-gray-900">
                {(paymentStats.totalRevenue || 0).toFixed(2)} DT
              </p>
              <p className="text-sm text-blue-600">
                {paymentStats.totalTransactions} transactions
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenus {getDateRangeText()}</p>
              <p className="text-2xl font-bold text-gray-900">
                {(paymentStats.periodRevenue || 0).toFixed(2)} DT
              </p>
              <p className="text-sm text-green-600">
                {paymentStats.periodTransactions} transaction(s)
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Revenus Aujourd'hui</p>
              <p className="text-2xl font-bold text-gray-900">
                {(paymentStats.todayRevenue || 0).toFixed(2)} DT
              </p>
              <p className="text-sm text-purple-600">
                {paymentStats.todayTransactions} transaction(s)
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Wallet className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-gray-900">{paymentStats.pending}</p>
              <p className="text-sm text-yellow-600">Paiements en attente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Répartition par Méthode (Total)
          </h3>
          <div className="space-y-4">
            {Object.entries(paymentStats.methods).map(([method, amount]) => {
              const percentage = getMethodPercentage(amount);
              const transactionCount = completedPayments.filter(p => 
                p.method === method
              ).length;

              return (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center flex-1 space-x-3">
                    {getPaymentIcon(method)}
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 capitalize">
                          {method.replace('_', ' ')}
                        </span>
                        <span className="font-medium text-gray-900">
                          {(amount || 0).toFixed(2)} DT
                        </span>
                      </div>
                      <div className="w-full h-2 mt-1 bg-gray-200 rounded-full">
                        <div
                          className="h-2 transition-all duration-300 bg-blue-600 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{percentage.toFixed(1)}% du total</span>
                        <span>{transactionCount} transaction(s)</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Résumé total */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Total général:</span>
                <span className="text-lg font-bold text-blue-600">
                  {(paymentStats.totalRevenue || 0).toFixed(2)} DT
                </span>
              </div>
              <div className="flex justify-between mt-1 text-sm text-gray-500">
                <span>Cumul de tous les temps</span>
                <span>{paymentStats.totalTransactions} transactions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Transactions Récentes ({getDateRangeText()})
          </h3>
          <div className="space-y-3">
            {filteredPayments.slice(0, 5).map((payment) => (
              <div key={payment._id || payment.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  {getPaymentIcon(payment.method || 'carte')}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {payment.plate || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {payment.spaceNumber} • {payment.timestamp.toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {(payment.amount || 0).toFixed(2)} DT
                  </p>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                </div>
              </div>
            ))}
            {filteredPayments.length === 0 && (
              <div className="py-4 text-center text-gray-500">
                Aucune transaction trouvée pour {getDateRangeText()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Rechercher par plaque, référence ou place..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les méthodes</option>
              <option value="espèces">Espèces</option>
              <option value="carte">Carte bancaire</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="portefeuille">Portefeuille</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Historique des Paiements ({filteredPayments.length})
            </h3>
            <p className="text-sm text-gray-500">
              Période: {getDateRangeText()} • Total: {(paymentStats.periodRevenue || 0).toFixed(2)} DT
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Temps réel • {formatTimeAgo(lastUpdate)}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Référence
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Véhicule
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Place
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Montant
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Méthode
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment._id || payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {payment.reference}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.plate || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {payment.vehicleType || 'Non spécifié'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.spaceNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {(payment.amount || 0).toFixed(2)} DT
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getPaymentIcon(payment.method || 'carte')}
                      <span className="text-sm text-gray-900 capitalize">
                        {(payment.method || 'Non spécifié').replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.timestamp.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPayments.length === 0 && (
            <div className="py-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">Aucun paiement trouvé</h3>
              <p className="text-gray-500">
                {searchTerm || methodFilter !== 'all' || dateRange !== 'all'
                  ? 'Aucun paiement ne correspond à vos critères de recherche'
                  : 'Aucun paiement enregistré dans la base de données'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;