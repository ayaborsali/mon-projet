import { ParkingSpace, Vehicle, ParkingSession, Payment, DashboardStats } from '../types/parking';

export const mockSpaces: ParkingSpace[] = Array.from({ length: 100 }, (_, i) => ({
  id: `space-${i + 1}`,
  number: `${String.fromCharCode(65 + Math.floor(i / 10))}${(i % 10) + 1}`,
  status: Math.random() > 0.7 ? 'occupé' : Math.random() > 0.9 ? 'réservé' : 'libre',
  zone: `Zone ${String.fromCharCode(65 + Math.floor(i / 20))}`,
  type: i % 15 === 0 ? 'handicapé' : i % 10 === 0 ? 'électrique' : 'standard'
}));

export const mockVehicles: Vehicle[] = [
  { id: '1', plate: 'TUN-1234', type: 'voiture', photo: 'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg' },
  { id: '2', plate: 'TUN-5678', type: 'voiture', photo: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg' },
  { id: '3', plate: 'TUN-9012', type: 'moto', photo: 'https://images.pexels.com/photos/2393816/pexels-photo-2393816.jpeg' },
];

export const mockSessions: ParkingSession[] = [
  {
    id: '1',
    vehicle: mockVehicles[0],
    spaceNumber: 'A1',
    entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'active',
    photos: { entry: 'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg' }
  },
  {
    id: '2',
    vehicle: mockVehicles[1],
    spaceNumber: 'B3',
    entryTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    exitTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
    status: 'payé',
    amount: 15.5,
    paymentMethod: 'carte',
    photos: { 
      entry: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
      exit: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg'
    }
  },
];

export const mockPayments: Payment[] = [
  {
    id: '1',
    sessionId: '2',
    amount: 15.5,
    method: 'carte',
    status: 'payé',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    reference: 'PAY-001'
  }
];

export const mockStats: DashboardStats = {
  totalSpaces: 100,
  occupiedSpaces: mockSpaces.filter(s => s.status === 'occupé').length,
  freeSpaces: mockSpaces.filter(s => s.status === 'libre').length,
  reservedSpaces: mockSpaces.filter(s => s.status === 'réservé').length,
  todayRevenue: 1248.50,
  todayVisitors: 87,
  averageStay: 2.3,
  occupancyRate: 0.73
};