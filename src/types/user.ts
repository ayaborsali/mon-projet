// src/types/user.ts
export interface User {
  id: string;
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

export interface Transaction {
  id: string;
  userId: string;
  type: 'recharge' | 'payment' | 'refund';
  amount: number;
  description: string;
  timestamp: Date;
  previousBalance: number;
  newBalance: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}