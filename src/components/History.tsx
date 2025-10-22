import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Car, CreditCard, MapPin, Filter, Download, RefreshCw, Clock, Calendar } from 'lucide-react';

interface Session {
  id: string;
  _id?: string;
  vehicle: {
    plate: string;
    type: string;
    model?: string;
    color?: string;
  };
  spaceNumber: string;
  startTime: Date;
  endTime?: Date;
  amount: number;
  status: string;
}

interface Transaction {
  id: string;
  _id?: string;
  type: 'recharge' | 'payment' | 'refund';
  amount: number;
  description: string;
  timestamp: Date;
}

const History: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'transactions'>('sessions');
  const [filter, setFilter] = useState('all');

  // Récupérer l'utilisateur connecté
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadHistoryData();
  }, []);

  const loadHistoryData = async () => {
    try {
      setLoading(true);

      // Charger les sessions de l'utilisateur
      const sessionsResponse = await fetch(`http://localhost:3001/api/sessions?userId=${userData.id}`);
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        // Trier par date décroissante
        const sortedSessions = (sessionsData.sessions || sessionsData)
          .sort((a: Session, b: Session) => 
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          );
        setSessions(sortedSessions);
      }

      // Charger les transactions de l'utilisateur
      const transactionsResponse = await fetch(`http://localhost:3001/api/transactions?userId=${userData.id}`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        // Trier par date décroissante
        const sortedTransactions = transactionsData.sort((a: Transaction, b: Transaction) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setTransactions(sortedTransactions);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'active') return session.status === 'active';
    if (filter === 'completed') return session.status === 'completed';
    return true;
  });

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'recharge') return transaction.type === 'recharge';
    if (filter === 'payment') return transaction.type === 'payment';
    if (filter === 'refund') return transaction.type === 'refund';
    return true;
  });

  const calculateDuration = (startTime: Date, endTime?: Date) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Chargement de l'historique...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Historique</h1>
          <p className="text-gray-600">Consultez vos sessions de stationnement et transactions</p>
        </div>
        <button
          onClick={loadHistoryData}
          className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </button>
      </div>

      {/* Navigation par onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Car className="inline w-4 h-4 mr-2" />
            Sessions de stationnement ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CreditCard className="inline w-4 h-4 mr-2" />
            Transactions ({transactions.length})
          </button>
        </nav>
      </div>

      {/* Filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous</option>
            {activeTab === 'sessions' ? (
              <>
                <option value="active">En cours</option>
                <option value="completed">Terminées</option>
              </>
            ) : (
              <>
                <option value="recharge">Recharges</option>
                <option value="payment">Paiements</option>
                <option value="refund">Retraits</option>
              </>
            )}
          </select>
        </div>
        
        <button className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'sessions' ? (
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">
              <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Aucune session de stationnement</p>
              <p className="mt-2 text-sm text-gray-400">
                {filter === 'all' 
                  ? "Vous n'avez aucune session de stationnement"
                  : `Aucune session ${filter === 'active' ? 'en cours' : 'terminée'}`
                }
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <div key={session.id} className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Car className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Stationnement</p>
                      <p className="text-sm text-gray-600">
                        Véhicule: {session.vehicle.plate} • {session.vehicle.type}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    session.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status === 'active' ? 'En cours' : 'Terminée'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-600">Place</p>
                      <p className="text-gray-900">{session.spaceNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-600">Date</p>
                      <p className="text-gray-900">{formatDate(session.startTime)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-600">Durée</p>
                      <p className="text-gray-900">
                        {calculateDuration(session.startTime, session.endTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-600">Montant</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {session.amount.toFixed(2)} DT
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Début: {formatTime(session.startTime)}</span>
                    {session.endTime && (
                      <span>Fin: {formatTime(session.endTime)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Aucune transaction</p>
              <p className="mt-2 text-sm text-gray-400">
                {filter === 'all' 
                  ? "Vous n'avez effectué aucune transaction"
                  : `Aucune transaction de type ${filter}`
                }
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <CreditCard className={`w-5 h-5 ${
                      transaction.type === 'recharge' ? 'text-green-500' :
                      transaction.type === 'payment' ? 'text-blue-500' :
                      'text-red-500'
                    }`} />
                    <div>
                      <p className="font-semibold text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    transaction.type === 'recharge' 
                      ? 'bg-green-100 text-green-800' 
                      : transaction.type === 'payment'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type === 'recharge' ? 'Recharge' :
                     transaction.type === 'payment' ? 'Paiement' : 'Retrait'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {transaction.type === 'recharge' ? 'Ajout de fonds' :
                     transaction.type === 'payment' ? 'Frais de stationnement' : 
                     'Retrait de fonds'}
                  </p>
                  <p className={`text-lg font-semibold ${
                    transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} DT
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default History;