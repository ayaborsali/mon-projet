// src/services/userService.ts
import { mongoService, collectionServices } from '../../config/mongodb';
import { User, Transaction, Notification } from '../types/user';

export const userService = {
  // Charger tous les utilisateurs
  loadUsers: async (): Promise<User[]> => {
    return await mongoService.find('users', {}, { 
      sort: { registrationDate: -1 } 
    });
  },

  // Charger les utilisateurs avec filtres
  loadUsersWithFilters: async (searchTerm: string, roleFilter: string, statusFilter: string): Promise<User[]> => {
    let query: any = {};

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    if (roleFilter !== 'all') {
      query.role = roleFilter;
    }

    if (statusFilter !== 'all') {
      query.status = statusFilter;
    }

    return await mongoService.find('users', query, { 
      sort: { registrationDate: -1 } 
    });
  },

  // Ajouter un nouvel utilisateur
  addUser: async (userData: Omit<User, 'id' | 'walletBalance' | 'registrationDate' | 'totalSessions' | 'totalSpent'>): Promise<string> => {
    const newUser = {
      ...userData,
      walletBalance: 0,
      registrationDate: new Date(),
      totalSessions: 0,
      totalSpent: 0,
      status: 'active' as const
    };

    const result = await mongoService.insertOne('users', newUser);
    return result.id;
  },

  // Mettre à jour un utilisateur
  updateUser: async (userId: string, updates: Partial<User>): Promise<void> => {
    await mongoService.updateOne('users', userId, updates);
  },

  // Supprimer un utilisateur
  deleteUser: async (userId: string): Promise<void> => {
    await mongoService.deleteOne('users', userId);
  },

  // Changer le statut d'un utilisateur
  updateUserStatus: async (userId: string, status: User['status']): Promise<void> => {
    await mongoService.updateOne('users', userId, { status });
  },

  // Recharger le portefeuille
  rechargeWallet: async (userId: string, amount: number, description: string = 'Recharge de portefeuille'): Promise<number> => {
    const user = await mongoService.findById('users', userId);
    if (!user) throw new Error('Utilisateur non trouvé');

    const newBalance = user.walletBalance + amount;

    // Mettre à jour le solde de l'utilisateur
    await mongoService.updateOne('users', userId, { walletBalance: newBalance });

    // Créer la transaction
    await mongoService.insertOne('transactions', {
      userId,
      type: 'recharge',
      amount,
      description,
      timestamp: new Date(),
      previousBalance: user.walletBalance,
      newBalance
    });

    return newBalance;
  },

  // Retirer du portefeuille
  withdrawWallet: async (userId: string, amount: number, description: string = 'Retrait de portefeuille'): Promise<number> => {
    const user = await mongoService.findById('users', userId);
    if (!user) throw new Error('Utilisateur non trouvé');

    if (user.walletBalance < amount) {
      throw new Error('Solde insuffisant');
    }

    const newBalance = user.walletBalance - amount;

    // Mettre à jour le solde de l'utilisateur
    await mongoService.updateOne('users', userId, { walletBalance: newBalance });

    // Créer la transaction
    await mongoService.insertOne('transactions', {
      userId,
      type: 'refund',
      amount: -amount,
      description,
      timestamp: new Date(),
      previousBalance: user.walletBalance,
      newBalance
    });

    return newBalance;
  },

  // Charger les transactions d'un utilisateur
  loadUserTransactions: async (userId: string): Promise<Transaction[]> => {
    return await mongoService.find('transactions', 
      { userId }, 
      { sort: { timestamp: -1 } }
    );
  },

  // Envoyer une notification
  sendNotification: async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<string> => {
    const notification = {
      ...notificationData,
      timestamp: new Date(),
      read: false
    };

    const result = await mongoService.insertOne('notifications', notification);
    return result.id;
  },

  // Charger les notifications d'un utilisateur
  loadUserNotifications: async (userId: string): Promise<Notification[]> => {
    return await mongoService.find('notifications', 
      { userId }, 
      { sort: { timestamp: -1 } }
    );
  },

  // Obtenir les statistiques des utilisateurs
  getUserStats: async (): Promise<{
    total: number;
    active: number;
    customers: number;
    totalWalletBalance: number;
  }> => {
    const users = await mongoService.find('users');
    
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      customers: users.filter(u => u.role === 'customer').length,
      totalWalletBalance: users.reduce((sum, u) => sum + u.walletBalance, 0)
    };
  },

  // Rechercher des utilisateurs
  searchUsers: async (searchTerm: string): Promise<User[]> => {
    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    return await mongoService.find('users', query, { 
      sort: { registrationDate: -1 } 
    });
  }
};