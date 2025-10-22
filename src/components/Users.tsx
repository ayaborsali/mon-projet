import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  Mail,
  Phone,
  Calendar,
  Wallet,
  RefreshCw,
  Send,
  History,
  Plus,
  Minus,
  Eye,
  EyeOff
} from 'lucide-react';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'operator' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
  walletBalance: number;
  registrationDate: Date;
  lastLogin?: Date;
  totalSessions: number;
  totalSpent: number;
}

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

interface Notification {
  id: string;
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

// Service dédié pour les appels API
class UsersApiService {
private baseUrl = 'http://localhost:3001/api';
 ;

  async fetchUsers(): Promise<User[]> {
    try {
      console.log('📡 Chargement des utilisateurs depuis:', `${this.baseUrl}/users`);
      const response = await fetch(`${this.baseUrl}/users`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Utilisateurs chargés:', data.length);
      return this.normalizeUsers(data);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      // Retourner des données mock en cas d'erreur
      return this.getMockUsers();
    }
  }

  async createUser(userData: Omit<User, 'id' | '_id'>): Promise<User> {
    try {
      console.log('📤 Création utilisateur:', userData);
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Utilisateur créé:', data);
      return this.normalizeUser(data);
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  // Créer un paiement pour l'utilisateur
  async createPaymentForUser(paymentData: {
    sessionId: string;
    amount: number;
    paymentMethod: string;
    status: string;
  }): Promise<any> {
    try {
      console.log('💰 Création paiement pour utilisateur:', paymentData);
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          paymentTime: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.warn('⚠️ Impossible de créer le paiement, continuation sans...');
        return null; // Continuer même si le paiement échoue
      }

      const data = await response.json();
      console.log('✅ Paiement créé:', data);
      return data;
    } catch (error) {
      console.warn('⚠️ Erreur création paiement, continuation sans:', error);
      return null; // Continuer même si le paiement échoue
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  async fetchUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeTransactions(data);
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      throw error;
    }
  }

  async createTransaction(transactionData: Omit<Transaction, 'id' | '_id'>): Promise<Transaction> {
    try {
      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeTransaction(data);
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      throw error;
    }
  }

  async createNotification(notificationData: Omit<Notification, 'id' | '_id'>): Promise<Notification> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeNotification(data);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  async fetchUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${this.baseUrl}/notifications?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeNotifications(data);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  }

  private normalizeUsers(users: any[]): User[] {
    return users.map(user => this.normalizeUser(user));
  }

  private normalizeUser(user: any): User {
    return {
      id: user._id || user.id || `user-${Math.random()}`,
      _id: user._id,
      name: user.name || 'Utilisateur Sans Nom',
      email: user.email || 'email@exemple.com',
      phone: user.phone || '0000000000',
      password: user.password || 'password',
      role: user.role || 'customer',
      status: user.status || 'active',
      walletBalance: user.walletBalance || 0,
      registrationDate: new Date(user.registrationDate || user.createdAt || new Date()),
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
      totalSessions: user.totalSessions || 0,
      totalSpent: user.totalSpent || 0
    };
  }

  private normalizeTransactions(transactions: any[]): Transaction[] {
    return transactions.map(transaction => this.normalizeTransaction(transaction));
  }

  private normalizeTransaction(transaction: any): Transaction {
    return {
      id: transaction._id || transaction.id,
      _id: transaction._id,
      userId: transaction.userId,
      type: transaction.type || 'payment',
      amount: transaction.amount || 0,
      description: transaction.description || '',
      timestamp: new Date(transaction.timestamp || transaction.createdAt || new Date()),
      previousBalance: transaction.previousBalance || 0,
      newBalance: transaction.newBalance || 0
    };
  }

  private normalizeNotifications(notifications: any[]): Notification[] {
    return notifications.map(notification => this.normalizeNotification(notification));
  }

  private normalizeNotification(notification: any): Notification {
    return {
      id: notification._id || notification.id,
      _id: notification._id,
      userId: notification.userId,
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'info',
      timestamp: new Date(notification.timestamp || notification.createdAt || new Date()),
      read: notification.read || false
    };
  }

  // Données mock pour le développement
  private getMockUsers(): User[] {
    console.log('🎯 Utilisation des données mock pour les utilisateurs');
    return [
      {
        id: 'user-1',
        name: 'Admin Principal',
        email: 'admin@smartparking.com',
        phone: '1234567890',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        walletBalance: 0,
        registrationDate: new Date('2024-01-01'),
        lastLogin: new Date(),
        totalSessions: 0,
        totalSpent: 0
      },
      {
        id: 'user-2',
        name: 'Client Test',
        email: 'client@test.com',
        phone: '0987654321',
        password: 'client123',
        role: 'customer',
        status: 'active',
        walletBalance: 50.00,
        registrationDate: new Date('2024-01-15'),
        lastLogin: new Date('2024-01-20'),
        totalSessions: 5,
        totalSpent: 25.50
      },
      {
        id: 'user-3',
        name: 'Opérateur Parking',
        email: 'operateur@parking.com',
        phone: '1122334455',
        password: 'operateur123',
        role: 'operator',
        status: 'active',
        walletBalance: 0,
        registrationDate: new Date('2024-01-10'),
        lastLogin: new Date('2024-01-18'),
        totalSessions: 0,
        totalSpent: 0
      }
    ];
  }
}

const apiService = new UsersApiService();

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer' as 'admin' | 'operator' | 'customer'
  });

  // États pour les actions rapides
  const [showRecharge, setShowRecharge] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSendNotification, setShowSendNotification] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userNotifications, setUserNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Charger les utilisateurs depuis l'API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const usersData = await apiService.fetchUsers();
      setUsers(usersData);
      
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', err);
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  // Charger l'historique des transactions d'un utilisateur
  const loadUserTransactions = async (userId: string) => {
    try {
      const transactions = await apiService.fetchUserTransactions(userId);
      setUserTransactions(transactions);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des transactions:', err);
      setError(err.message || 'Erreur lors du chargement des transactions');
    }
  };

  // Charger les notifications d'un utilisateur
  const loadUserNotifications = async (userId: string) => {
    try {
      const notifications = await apiService.fetchUserNotifications(userId);
      setUserNotifications(notifications);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des notifications:', err);
      setError(err.message || 'Erreur lors du chargement des notifications');
    }
  };

  // Filtrer les utilisateurs
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'operator':
        return 'bg-blue-100 text-blue-800';
      case 'customer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // AJOUTER UN UTILISATEUR ET CRÉER UN PAIEMENT
  const handleAddUser = async () => {
    try {
      setError(null);
      
      const userData = {
        name: newUserData.name,
        email: newUserData.email,
        phone: newUserData.phone,
        password: newUserData.password,
        role: newUserData.role,
        status: 'active' as const,
        walletBalance: 0,
        registrationDate: new Date(),
        lastLogin: undefined,
        totalSessions: 0,
        totalSpent: 0
      };

      console.log('👤 Création utilisateur avec données:', userData);

      // 1. Créer l'utilisateur d'abord
      const newUser = await apiService.createUser(userData);
      
      // 2. Créer un paiement d'inscription pour cet utilisateur
      if (newUserData.role === 'customer') {
        console.log('💰 Création paiement pour nouvel utilisateur client');
        await apiService.createPaymentForUser({
          sessionId: newUser.id, // Utiliser l'ID de l'utilisateur comme sessionId
          amount: 0, // Montant à 0 pour l'inscription
          paymentMethod: 'inscription', // Méthode de paiement spéciale pour l'inscription
          status: 'completed' // Statut complété
        });
      }

      // Réinitialiser le formulaire
      setNewUserData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer'
      });
      setShowAddUser(false);
      setShowPassword(false);
      
      // Recharger la liste des utilisateurs
      await loadUsers();
      
      alert('✅ Utilisateur ajouté avec succès!');
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'ajout de l\'utilisateur:', err);
      setError(err.message || 'Erreur lors de l\'ajout de l\'utilisateur');
    }
  };

  // Supprimer un utilisateur via l'API
  const handleDeleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        setError(null);
        await apiService.deleteUser(userId);
        
        // Recharger la liste des utilisateurs
        await loadUsers();
        
        alert('✅ Utilisateur supprimé avec succès!');
      } catch (err: any) {
        console.error('❌ Erreur lors de la suppression:', err);
        setError(err.message || 'Erreur lors de la suppression de l\'utilisateur');
      }
    }
  };

  // Changer le statut d'un utilisateur via l'API
  const handleStatusChange = async (userId: string, newStatus: User['status']) => {
    try {
      setError(null);
      await apiService.updateUser(userId, { status: newStatus });
      
      // Mettre à jour localement
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      // Mettre à jour l'utilisateur sélectionné si c'est le même
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }

      alert(`✅ Statut mis à jour: ${newStatus}`);
    } catch (err: any) {
      console.error('❌ Erreur lors du changement de statut:', err);
      setError(err.message || 'Erreur lors du changement de statut');
    }
  };

  // Recharger le portefeuille d'un utilisateur
  const handleRechargeWallet = async () => {
    if (!selectedUser || !rechargeAmount) return;
    
    try {
      setError(null);
      const amount = parseFloat(rechargeAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('❌ Veuillez entrer un montant valide');
        return;
      }

      const newBalance = selectedUser.walletBalance + amount;

      // Créer une transaction
      const transactionData = {
        userId: selectedUser.id,
        type: 'recharge' as const,
        amount: amount,
        description: `Recharge de portefeuille`,
        timestamp: new Date(),
        previousBalance: selectedUser.walletBalance,
        newBalance: newBalance
      };

      // Mettre à jour le solde et créer la transaction
      await apiService.updateUser(selectedUser.id, { walletBalance: newBalance });
      await apiService.createTransaction(transactionData);

      // Mettre à jour l'utilisateur localement
      setSelectedUser({ ...selectedUser, walletBalance: newBalance });
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { ...user, walletBalance: newBalance } : user
      ));
      
      setRechargeAmount('');
      setShowRecharge(false);
      
      alert(`✅ Portefeuille rechargé de ${amount.toFixed(2)} DT avec succès!`);
    } catch (err: any) {
      console.error('❌ Erreur lors de la recharge:', err);
      setError(err.message || 'Erreur lors de la recharge du portefeuille');
    }
  };

  // Envoyer une notification à l'utilisateur
  const handleSendNotification = async () => {
    if (!selectedUser || !notificationData.title || !notificationData.message) return;
    
    try {
      setError(null);
      
      const notification = {
        userId: selectedUser.id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        timestamp: new Date(),
        read: false
      };

      await apiService.createNotification(notification);

      // Réinitialiser le formulaire
      setNotificationData({
        title: '',
        message: '',
        type: 'info'
      });
      setShowSendNotification(false);
      
      alert('✅ Notification envoyée avec succès!');
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'envoi de la notification:', err);
      setError(err.message || 'Erreur lors de l\'envoi de la notification');
    }
  };

  // Retirer de l'argent du portefeuille
  const handleWithdrawWallet = async () => {
    if (!selectedUser || !rechargeAmount) return;
    
    try {
      setError(null);
      const amount = parseFloat(rechargeAmount);
      if (isNaN(amount) || amount <= 0) {
        alert('❌ Veuillez entrer un montant valide');
        return;
      }

      if (selectedUser.walletBalance < amount) {
        alert('❌ Solde insuffisant');
        return;
      }

      const newBalance = selectedUser.walletBalance - amount;

      // Créer une transaction
      const transactionData = {
        userId: selectedUser.id,
        type: 'refund' as const,
        amount: -amount,
        description: `Retrait de portefeuille`,
        timestamp: new Date(),
        previousBalance: selectedUser.walletBalance,
        newBalance: newBalance
      };

      // Mettre à jour le solde et créer la transaction
      await apiService.updateUser(selectedUser.id, { walletBalance: newBalance });
      await apiService.createTransaction(transactionData);

      // Mettre à jour l'utilisateur localement
      setSelectedUser({ ...selectedUser, walletBalance: newBalance });
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { ...user, walletBalance: newBalance } : user
      ));
      
      setRechargeAmount('');
      setShowRecharge(false);
      
      alert(`✅ Retrait de ${amount.toFixed(2)} DT effectué avec succès!`);
    } catch (err: any) {
      console.error('❌ Erreur lors du retrait:', err);
      setError(err.message || 'Erreur lors du retrait du portefeuille');
    }
  };

  // Recharger les données manuellement
  const handleRefresh = async () => {
    console.log('🔄 Actualisation manuelle des utilisateurs');
    await loadUsers();
  };

  // Calculer les statistiques
  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    customers: users.filter(u => u.role === 'customer').length,
    totalWalletBalance: users.reduce((sum, u) => sum + u.walletBalance, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-600">Chargement des utilisateurs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h2>
          <p className="text-gray-600">Administration des comptes et permissions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 text-white transition-colors bg-gray-600 rounded-lg hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nouvel Utilisateur
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 border border-red-300 rounded-lg bg-red-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
              <p className="text-sm text-blue-600">{userStats.active} actifs</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clients</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.customers}</p>
              <p className="text-sm text-green-600">Utilisateurs finaux</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Solde Total</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.totalWalletBalance.toFixed(2)} DT</p>
              <p className="text-sm text-purple-600">Portefeuilles clients</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nouveaux ce mois</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => {
                  const regDate = u.registrationDate;
                  const now = new Date();
                  return regDate.getMonth() === now.getMonth() && 
                         regDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
              <p className="text-sm text-orange-600">Inscriptions ce mois</p>
            </div>
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
              placeholder="Rechercher par nom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="operator">Opérateur</option>
              <option value="customer">Client</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="suspended">Suspendu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Utilisateurs ({filteredUsers.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Rôle
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Statut
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Portefeuille
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Dernière Connexion
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                        <span className="text-sm font-medium text-blue-600">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">ID: {user.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <Mail className="w-4 h-4 mr-1 text-gray-400" />
                      {user.email}
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-500">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {user.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.role === 'customer' ? `${user.walletBalance.toFixed(2)} DT` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.lastLogin ? user.lastLogin.toLocaleString('fr-FR') : 'Jamais'}
                  </td>
                  <td className="px-6 py-4 space-x-2 text-sm font-medium">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.status === 'active' ? (
                      <button
                        onClick={() => handleStatusChange(user.id, 'suspended')}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Suspendre
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(user.id, 'active')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Activer
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Nouvel Utilisateur</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nom complet"
                value={newUserData.name}
                onChange={(e) => setNewUserData({...newUserData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({...newUserData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute transform -translate-y-1/2 right-3 top-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <select 
                value={newUserData.role}
                onChange={(e) => setNewUserData({...newUserData, role: e.target.value as 'admin' | 'operator' | 'customer'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="customer">Client</option>
                <option value="operator">Opérateur</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>
            <div className="flex mt-6 space-x-3">
              <button
                onClick={() => setShowAddUser(false)}
                className="flex-1 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddUser}
                className="flex-1 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={!newUserData.name || !newUserData.email || !newUserData.phone || !newUserData.password}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Détails Utilisateur - {selectedUser.name}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Informations Personnelles</h4>
                  <div className="p-3 space-y-2 rounded-lg bg-gray-50">
                    <p><span className="font-medium">Nom:</span> {selectedUser.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                    <p><span className="font-medium">Téléphone:</span> {selectedUser.phone}</p>
                    <p><span className="font-medium">Mot de passe:</span> {selectedUser.password}</p>
                    <p><span className="font-medium">Inscription:</span> {selectedUser.registrationDate.toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Statut & Permissions</h4>
                  <div className="p-3 space-y-2 rounded-lg bg-gray-50">
                    <p><span className="font-medium">Rôle:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                    </p>
                    <p><span className="font-medium">Statut:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Dernière connexion:</span> {selectedUser.lastLogin?.toLocaleString('fr-FR') || 'Jamais'}</p>
                  </div>
                </div>
              </div>

              {selectedUser.role === 'customer' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium text-gray-900">Activité Client</h4>
                    <div className="p-3 space-y-2 rounded-lg bg-gray-50">
                      <p><span className="font-medium">Sessions totales:</span> {selectedUser.totalSessions}</p>
                      <p><span className="font-medium">Montant dépensé:</span> {selectedUser.totalSpent.toFixed(2)} DT</p>
                      <p><span className="font-medium">Solde portefeuille:</span> {selectedUser.walletBalance.toFixed(2)} DT</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-gray-900">Actions Rapides</h4>
                    <div className="space-y-2">
                      <button 
                        onClick={() => {
                          setShowRecharge(true);
                          setRechargeAmount('');
                        }}
                        className="flex items-center justify-center w-full py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Recharger Portefeuille
                      </button>
                      <button 
                        onClick={() => {
                          setShowHistory(true);
                          loadUserTransactions(selectedUser.id);
                        }}
                        className="flex items-center justify-center w-full py-2 text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        <History className="w-4 h-4 mr-2" />
                        Voir Historique
                      </button>
                      <button 
                        onClick={() => {
                          setShowSendNotification(true);
                          setNotificationData({
                            title: `Notification pour ${selectedUser.name}`,
                            message: '',
                            type: 'info'
                          });
                        }}
                        className="flex items-center justify-center w-full py-2 text-white transition-colors bg-orange-600 rounded-lg hover:bg-orange-700"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Envoyer Notification
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recharge Wallet Modal */}
      {showRecharge && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Gérer le portefeuille - {selectedUser.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Solde actuel: <span className="font-bold">{selectedUser.walletBalance.toFixed(2)} DT</span>
                </label>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Montant
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
                onClick={handleWithdrawWallet}
                className="flex items-center justify-center flex-1 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
                disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0}
              >
                <Minus className="w-4 h-4 mr-2" />
                Retirer
              </button>
              <button
                onClick={handleRechargeWallet}
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

      {/* History Modal */}
      {showHistory && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Historique des transactions - {selectedUser.name}
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {userTransactions.length === 0 ? (
              <p className="py-8 text-center text-gray-500">Aucune transaction trouvée</p>
            ) : (
              <div className="overflow-x-auto">
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
                        Montant
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Solde avant
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Nouveau solde
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.timestamp.toLocaleString('fr-FR')}
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
                        <td className={`px-6 py-4 text-sm font-medium ${
                          transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} DT
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {transaction.previousBalance.toFixed(2)} DT
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {transaction.newBalance.toFixed(2)} DT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send Notification Modal */}
      {showSendNotification && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md p-6 bg-white rounded-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Envoyer une notification à {selectedUser.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Titre
                </label>
                <input
                  type="text"
                  placeholder="Titre de la notification"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({...notificationData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  placeholder="Message de la notification"
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={notificationData.type}
                  onChange={(e) => setNotificationData({...notificationData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="info">Information</option>
                  <option value="success">Succès</option>
                  <option value="warning">Avertissement</option>
                  <option value="error">Erreur</option>
                </select>
              </div>
            </div>
            <div className="flex mt-6 space-x-3">
              <button
                onClick={() => setShowSendNotification(false)}
                className="flex-1 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSendNotification}
                className="flex items-center justify-center flex-1 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={!notificationData.title || !notificationData.message}
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;