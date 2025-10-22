// types/parking.ts

export interface ParkingSpace {
  id: string;
  number: string;
  zone: string;
  type: 'voiture' | 'camion' | 'moto';
  status: 'libre' | 'occupé' | 'réservé' | 'hors-service';
  reservation?: {
    plate: string;
    vehicleType: string;
    expiresAt: Date;
    createdAt: Date;
  };
  currentSessionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Vehicle {
  id: string;
  plate: string;
  type: 'voiture' | 'camion' | 'moto';
  model?: string;
  color?: string;
  createdAt?: Date;
}

export interface Reservation {
  id: string;
  plate: string;
  spaceNumber: string;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'expired' | 'cancelled';
  vehicleType: 'voiture' | 'camion' | 'moto';
  createdAt?: Date;
}

export interface PricingRule {
  id: number;
  name: string;
  rate: string;
  active: boolean;
}

export interface ParkingSession {
  id: string;
  vehicle: {
    id: string;
    plate: string;
    type: 'voiture' | 'camion' | 'moto';
  };
  spaceNumber: string;
  entryTime: Date;
  exitTime?: Date;
  status: 'active' | 'terminé' | 'payé';
  amount?: number;
  paymentMethod?: 'espèces' | 'carte' | 'mobile_money' | 'portefeuille';
  photos: {
    entry: string;
    exit?: string;
  };
  duration?: number;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface SpaceStatusHistory {
  id: string;
  spaceNumber: string;
  previousStatus: string;
  newStatus: string;
  action: 'reservation' | 'out_of_service' | 'in_service' | 'occupation' | 'liberation' | 'reservation_cancelled';
  reason: string;
  timestamp: Date;
  changedBy: 'user' | 'system' | 'session';
  userId?: string;
  userInfo?: {
    userName: string;
  };
  sessionId?: string;
  reservationInfo?: {
    plate: string;
    vehicleType: string;
    expiresAt?: Date;
  };
  metadata?: {
    zone?: string;
    plate?: string;
    vehicleType?: string;
  };
}

export interface Payment {
  _id: string;
  id: string;s
  sessionId: string;
  amount: number;
  method: string;
  paymentMethod: string;
  timestamp: Date;
  paymentTime: Date;
  status: string;
  plate: string;
  vehicleType: string;
  spaceNumber: string;
  reference: string;
}

export interface ParkingConfig {
  totalSpaces: number;
  baseRate: number;
  dynamicPricing: boolean;
  peakHourMultiplier: number;
  maxDuration: number;
  graceTime: number;
  entryCameras: string[];
  exitCameras: string[];
  cameraIpRange: string;
  apiPort: string;
  plateRecognition: boolean;
  anomalyDetection: boolean;
}

export interface ParkingSpace {
  _id?: string;
  id?: string; // Pour la compatibilité
  number: string;
  zone: string;
  type: 'voiture' | 'camion' | 'moto';
  status: 'libre' | 'occupé' | 'réservé' | 'hors-service';
  reservation?: {
    plate: string;
    vehicleType: string;
    expiresAt: Date;
  };
  metadata?: {
    lastOccupied?: Date;
    maintenanceNotes?: string;
  };
}

export interface Camera {
  id: string;
  name: string;
  ip: string;
  location: string;
  type: 'entry' | 'exit' | 'surveillance';
  status: 'online' | 'offline' | 'maintenance';
  lastActive?: Date;
  createdAt?: Date;
}

export interface Anomaly {
  id: string;
  type: 'overstay' | 'wrong_vehicle_type' | 'unauthorized_access' | 'payment_issue';
  severity: 'low' | 'medium' | 'high';
  description: string;
  spaceNumber?: string;
  vehiclePlate?: string;
  sessionId?: string;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  phone?: string;
  role: 'admin' | 'operator' | 'customer';
  permissions?: string[];
  lastLogin?: Date;
  createdAt?: Date;
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: Date;
  totalSessions: number;
  totalSpent: number;
  walletBalance: number;
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
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'system' | 'payment' | 'parking' | 'user';
  plate?: string;
  spaceNumber?: string;
  actionUrl?: string;
  sessionId?: string;
  vehicleType?: string;
  reservationId?: string;
  userId?: string;
  metadata?: {
    entryTime?: Date;
    spaceNumber?: string;
    vehicleType?: string;
    reservationExpiresAt?: Date;
    outOfServiceTime?: Date;
    freedTime?: Date;
    occupiedTime?: Date;
    reason?: string;
  };
}

export interface Report {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  periodStart: Date;
  periodEnd: Date;
  data: {
    revenue: number;
    sessions: number;
    occupancy: number;
    averageStay: number;
    vehicleTypes: {
      voiture: number;
      camion: number;
      moto: number;
    };
  };
  generatedAt: Date;
  generatedBy: string;
}

export interface DashboardStats {
  totalSpaces: number;
  occupiedSpaces: number;
  freeSpaces: number;
  reservedSpaces: number;
  todayRevenue: number;
  todayVisitors: number;
  averageStay: number;
  occupancyRate: number;
  monthlyRevenue: number;
  activeSessions: number;
  availableSpacesByType: {
    voiture: number;
    camion: number;
    moto: number;
  };
}

// Types utilitaires pour MongoDB
export interface MongoDocument {
  _id?: any;
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Types pour les requêtes
export interface QueryOptions {
  sort?: { [key: string]: 1 | -1 };
  limit?: number;
  skip?: number;
}