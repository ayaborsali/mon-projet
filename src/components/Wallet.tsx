import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, Plus, Minus, History, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  _id?: string;
  userId: string;
  type: 'recharge' | 'payment' | 'refund';
  amount: number;
  description: string;
  timestamp: Date;
  previousBalance: number;
  newBalance: number;
}

const Wallet: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');

  // Récupérer l'utilisateur connecté
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      // Charger le solde de l'utilisateur
      const userResponse = await fetch(`http://localhost:3001/api/users/${userData.id}`);
      if (userResponse.ok) {
        const user = await userResponse.json();
        setBalance(user.walletBalance || 0);
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
      console.error('Erreur lors du chargement du portefeuille:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount) return;
    
    try {
      const amount = parseFloat(rechargeAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('Veuillez entrer un montant valide');
        return;
      }

      const newBalance = balance + amount;

      // Créer la transaction
      const transactionData = {
        userId: userData.id,
        type: 'recharge' as const,
        amount: amount,
        description: `Recharge de portefeuille`,
        timestamp: new Date(),
        previousBalance: balance,
        newBalance: newBalance
      };

      // Mettre à jour le solde de l'utilisateur
      await fetch(`http://localhost:3001/api/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletBalance: newBalance })
      });

      // Créer la transaction
      await fetch('http://localhost:3001/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });

      // Mettre à jour l'état local
      setBalance(newBalance);
      setRechargeAmount('');
      setShowRecharge(false);
      
      // Recharger les données
      await loadWalletData();
      
      alert(`✅ Portefeuille rechargé de ${amount.toFixed(2)} DT avec succès!`);
    } catch (error) {
      console.error('Erreur lors de la recharge:', error);
      alert('❌ Erreur lors de la recharge du portefeuille');
    }
  };

  // Calculer les statistiques
  const monthlySpent = transactions
    .filter(t => t.type === 'payment' && new Date(t.timestamp).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalRecharges = transactions
    .filter(t => t.type === 'recharge')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Chargement du portefeuille...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mon Portefeuille</h1>
          <p className="text-gray-600">Gérez votre solde et consultez vos transactions</p>
        </div>
        <button
          onClick={loadWalletData}
          className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </button>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Solde actuel */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Solde actuel</p>
              <p className="text-3xl font-bold text-gray-900">{balance.toFixed(2)} DT</p>
            </div>
            <WalletIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Dépenses du mois */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dépenses ce mois</p>
              <p className="text-3xl font-bold text-gray-900">{monthlySpent.toFixed(2)} DT</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Recharges totales */}
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recharges totales</p>
              <p className="text-3xl font-bold text-gray-900">{totalRecharges.toFixed(2)} DT</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button
          onClick={() => setShowRecharge(true)}
          className="flex items-center justify-center p-6 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
        >
          <Plus className="w-6 h-6 mr-3 text-blue-500" />
          <div className="text-left">
            <p className="font-semibold text-gray-900">Recharger le portefeuille</p>
            <p className="text-sm text-gray-600">Ajouter des fonds à votre compte</p>
          </div>
        </button>

        <button 
          onClick={() => window.location.href = '/history'}
          className="flex items-center justify-center p-6 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
        >
          <History className="w-6 h-6 mr-3 text-green-500" />
          <div className="text-left">
            <p className="font-semibold text-gray-900">Voir l'historique complet</p>
            <p className="text-sm text-gray-600">Toutes vos transactions</p>
          </div>
        </button>
      </div>

      {/* Historique des transactions récentes */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Dernières transactions</h2>
        </div>
        
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <WalletIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Aucune transaction pour le moment</p>
              <p className="mt-2 text-sm text-gray-400">Vos transactions apparaîtront ici</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                    Solde après
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.slice(0, 10).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(transaction.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.type === 'recharge' ? 'bg-green-100 text-green-800' :
                        transaction.type === 'payment' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'recharge' ? 'Recharge' :
                         transaction.type === 'payment' ? 'Paiement' : 'Retrait'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} DT
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {transaction.newBalance.toFixed(2)} DT
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {transactions.length > 10 && (
          <div className="p-4 text-center border-t border-gray-200">
            <button 
              onClick={() => window.location.href = '/history'}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Voir toutes les transactions ({transactions.length})
            </button>
          </div>
        )}
      </div>

      {/* Modal de recharge */}
      {showRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Recharger votre portefeuille
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Solde actuel: <span className="font-bold">{balance.toFixed(2)} DT</span>
                </label>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Montant à recharger
                </label>
                <input
                  type="number"
                  placeholder="Entrez le montant"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="flex mt-6 space-x-3">
              <button
                onClick={() => setShowRecharge(false)}
                className="flex-1 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleRecharge}
                className="flex items-center justify-center flex-1 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Recharger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;