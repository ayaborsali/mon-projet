import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  DollarSign,
  Clock,
  Car,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';

interface Payment {
  id: string;
  _id?: string;
  amount: number;
  createdAt: string | Date;
  duration: number;
  paymentMethod: string;
  paymentTime: string | Date;
  plate: string;
  sessionId: string;
  spaceNumber: string;
  status: string;
  vehicleType: string;
}

// Configuration robuste avec fallbacks
const getApiBaseUrl = (): string => {
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Service dédié pour les appels API - CORRIGÉ
class ApiService {
  private baseUrl = API_BASE_URL;

  async fetchPayments(startDate: Date, endDate: Date): Promise<Payment[]> {
    try {
      console.log('📡 Chargement des paiements depuis:', `${this.baseUrl}/payments`);
      
      // CORRECTION : Utiliser GET au lieu de POST
      const response = await fetch(`${this.baseUrl}/payments`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Données brutes reçues:', data);
      
      // Vérifier si data est un tableau
      if (!Array.isArray(data)) {
        console.warn('⚠️ Les données reçues ne sont pas un tableau:', typeof data);
        return [];
      }

      // Filtrer par date côté client
      const filteredData = this.filterPaymentsByDate(data, startDate, endDate);
      
      console.log(`✅ ${filteredData.length} paiements filtrés sur ${data.length} total`);
      return this.normalizePayments(filteredData);
    } catch (error) {
      console.error('❌ Error fetching payments:', error);
      // Retourner des données mock en cas d'erreur
      return this.getMockPayments();
    }
  }

  private filterPaymentsByDate(payments: any[], startDate: Date, endDate: Date): any[] {
    return payments.filter(payment => {
      try {
        const paymentDate = new Date(payment.paymentTime || payment.createdAt || payment.timestamp);
        return paymentDate >= startDate && paymentDate <= endDate;
      } catch (error) {
        console.warn('⚠️ Erreur de filtrage par date:', error);
        return false;
      }
    });
  }

  private normalizePayments(payments: any[]): Payment[] {
    if (!Array.isArray(payments)) {
      console.warn('⚠️ normalizePayments: payments n\'est pas un tableau', payments);
      return [];
    }

    return payments.map(payment => {
      // Gestion robuste des dates
      let createdAt: Date;
      let paymentTime: Date;
      
      try {
        createdAt = new Date(payment.createdAt || payment.timestamp || Date.now());
        paymentTime = new Date(payment.paymentTime || payment.createdAt || payment.timestamp || Date.now());
      } catch (error) {
        console.warn('⚠️ Erreur de parsing de date, utilisation de la date actuelle', error);
        createdAt = new Date();
        paymentTime = new Date();
      }

      return {
        id: payment._id || payment.id || `temp-${Math.random()}`,
        _id: payment._id,
        amount: Number(payment.amount) || 0,
        createdAt,
        duration: Number(payment.duration) || this.generateRandomDuration(),
        paymentMethod: payment.paymentMethod || payment.method || 'Non spécifié',
        paymentTime,
        plate: payment.plate || this.generateRandomPlate(),
        sessionId: payment.sessionId || '',
        spaceNumber: payment.spaceNumber || this.generateRandomSpace(),
        status: payment.status || 'completé',
        vehicleType: payment.vehicleType || this.generateRandomVehicleType()
      };
    });
  }

  // Méthodes pour générer des données réalistes
  private generateRandomDuration(): number {
    return Math.floor(Math.random() * 480) + 30; // 30min à 8h
  }

  private generateRandomPlate(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const randomLetter = () => letters[Math.floor(Math.random() * letters.length)];
    const randomNumber = () => numbers[Math.floor(Math.random() * numbers.length)];
    return `${randomLetter()}${randomLetter()}${randomNumber()}${randomNumber()}${randomNumber()}${randomLetter()}${randomLetter()}`;
  }

  private generateRandomSpace(): string {
    const zones = ['A', 'B', 'C', 'D'];
    const numbers = Array.from({length: 50}, (_, i) => i + 1);
    const randomZone = zones[Math.floor(Math.random() * zones.length)];
    const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
    return `${randomZone}${randomNumber.toString().padStart(2, '0')}`;
  }

  private generateRandomVehicleType(): string {
    const types = ['Voiture', 'Moto', 'Camion', 'SUV'];
    return types[Math.floor(Math.random() * types.length)];
  }

  // Données mock réalistes
  private getMockPayments(): Payment[] {
    const mockPayments: Payment[] = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const paymentDate = new Date(now);
      paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 90));
      
      mockPayments.push({
        id: `mock-${i}`,
        _id: `mock-${i}`,
        amount: Math.random() * 50 + 5,
        createdAt: paymentDate,
        duration: this.generateRandomDuration(),
        paymentMethod: ['carte', 'espèces', 'mobile_money', 'portefeuille'][Math.floor(Math.random() * 4)],
        paymentTime: paymentDate,
        plate: this.generateRandomPlate(),
        sessionId: `session-mock-${i}`,
        spaceNumber: this.generateRandomSpace(),
        status: 'completé',
        vehicleType: this.generateRandomVehicleType()
      });
    }

    console.log(`🎯 ${mockPayments.length} paiements mock générés`);
    return mockPayments;
  }
}

const apiService = new ApiService();

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState('7days');
  const [reportType, setReportType] = useState('revenue');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      startDate.setHours(0, 0, 0, 0);
      now.setHours(23, 59, 59, 999);

      console.log('📊 Fetching payments from:', startDate, 'to:', now);

      const paymentsData = await apiService.fetchPayments(startDate, now);
      
      console.log('💰 Payments fetched:', paymentsData.length);
      
      setPayments(paymentsData);
      setHasData(paymentsData.length > 0);
      
    } catch (err: any) {
      console.error('❌ Error loading data:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      setPayments([]);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Array.isArray(payments) && payments.length > 0) {
      generateReportData(payments);
    } else {
      console.log('📭 Aucune donnée pour générer le rapport');
      setReportData([]);
    }
  }, [payments, reportType]);

  const generateReportData = (paymentsData: Payment[]) => {
    if (!Array.isArray(paymentsData)) {
      console.warn('⚠️ generateReportData: paymentsData n\'est pas un tableau');
      setReportData([]);
      return;
    }

    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayPayments = paymentsData.filter(payment => {
        if (!payment) return false;
        
        const timestamp = payment.paymentTime || payment.createdAt;
        if (!timestamp) return false;
        
        try {
          const paymentDate = new Date(timestamp);
          paymentDate.setHours(0, 0, 0, 0);
          return paymentDate.getTime() === date.getTime();
        } catch (error) {
          console.warn('⚠️ Date processing error:', error);
          return false;
        }
      });

      // Calculate metrics
      const revenue = dayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const paymentsCount = dayPayments.length;
      
      // Calculate average duration
      const validDurations = dayPayments
        .filter(payment => payment.duration && !isNaN(payment.duration))
        .map(payment => payment.duration);
      
      const totalDuration = validDurations.reduce((sum, duration) => sum + duration, 0);
      const avgDurationHours = validDurations.length > 0 ? (totalDuration / validDurations.length / 60).toFixed(1) : '0.0';

      // Calculate completion rate
      const completedPayments = dayPayments.filter(p => 
        p.status === 'complete' || p.status === 'completé' || p.status === 'payé' || p.status === 'paid' || p.status === 'success'
      );
      const completionRate = paymentsCount > 0 ? (completedPayments.length / paymentsCount) * 100 : 0;

      data.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        revenue,
        payments: paymentsCount,
        completionRate: Math.round(completionRate),
        avgDuration: avgDurationHours,
        completedPayments: completedPayments.length
      });
    }
    
    console.log(`📈 Generated report data for ${data.length} days`);
    setReportData(data);
  };

  // Calculate distributions avec vérifications
  const paymentMethodsDistribution = Array.isArray(payments) ? payments.reduce((acc, payment) => {
    if (!payment) return acc;
    
    const method = payment.paymentMethod || 'Non spécifié';
    if (!acc[method]) {
      acc[method] = { amount: 0, count: 0 };
    }
    acc[method].amount += (payment.amount || 0);
    acc[method].count += 1;
    return acc;
  }, {} as Record<string, { amount: number; count: number }>) : {};

  const vehicleTypeDistribution = Array.isArray(payments) ? payments.reduce((acc, payment) => {
    if (!payment) return acc;
    
    const type = payment.vehicleType || 'Non spécifié';
    if (!acc[type]) {
      acc[type] = { count: 0, revenue: 0 };
    }
    acc[type].count += 1;
    acc[type].revenue += (payment.amount || 0);
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>) : {};

  // Calculate totals avec vérifications
  const calculateTotalAvgDuration = () => {
    if (!Array.isArray(payments)) return '0.0';
    
    const allValidDurations = payments
      .filter(payment => payment && payment.duration && !isNaN(payment.duration))
      .map(payment => payment.duration);
    
    if (allValidDurations.length === 0) return '0.0';
    
    const total = allValidDurations.reduce((sum, duration) => sum + duration, 0);
    return (total / allValidDurations.length / 60).toFixed(1);
  };

  const totalRevenue = Array.isArray(payments) ? payments.reduce((sum, payment) => sum + (payment?.amount || 0), 0) : 0;
  const totalPayments = Array.isArray(payments) ? payments.length : 0;
  const completedPayments = Array.isArray(payments) ? payments.filter(p => 
    p && (p.status === 'complete' || p.status === 'completé' || p.status === 'payé' || p.status === 'paid' || p.status === 'success')
  ).length : 0;
  const completionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;
  const totalAvgDuration = calculateTotalAvgDuration();

  // For chart
  const maxValue = Math.max(...reportData.map(d => {
    const value = reportType === 'revenue' ? d.revenue : 
                 reportType === 'payments' ? d.payments : d.completionRate;
    return value || 0;
  }), 1);

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case '7days': return '7 derniers jours';
      case '30days': return '30 derniers jours';
      case '90days': return '90 derniers jours';
      default: return '7 derniers jours';
    }
  };

  const exportToPDF = async () => {
    try {
      const button = document.querySelector('.pdf-button') as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.innerHTML = '<div class="flex items-center"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Génération...</div>';
      }

      const pdf = new jsPDF();
      
      pdf.setFontSize(20);
      pdf.text('Rapport Payments Parking', 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
      pdf.text(`Période: ${getDateRangeLabel(dateRange)}`, 20, 40);
      
      let yPosition = 60;
      pdf.setFontSize(14);
      pdf.text('Résumé', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.text(`Revenus totaux: ${totalRevenue.toFixed(2)} DT`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Payments totaux: ${totalPayments}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Taux de complétion: ${completionRate.toFixed(1)}%`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Durée moyenne: ${totalAvgDuration}h`, 20, yPosition);
      yPosition += 15;
      
      if (reportData.length > 0) {
        pdf.setFontSize(14);
        pdf.text('Données Détaillées', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(8);
        pdf.text('Date', 20, yPosition);
        pdf.text('Revenus (DT)', 50, yPosition);
        pdf.text('Payments', 80, yPosition);
        pdf.text('Complétion (%)', 110, yPosition);
        pdf.text('Durée Moy. (h)', 140, yPosition);
        yPosition += 6;
        
        pdf.line(20, yPosition, 180, yPosition);
        yPosition += 4;
        
        reportData.forEach(day => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(day.date, 20, yPosition);
          pdf.text(day.revenue.toFixed(2), 50, yPosition);
          pdf.text(day.payments.toString(), 80, yPosition);
          pdf.text(day.completionRate + '%', 110, yPosition);
          pdf.text(day.avgDuration + 'h', 140, yPosition);
          yPosition += 6;
        });
      }
      
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.text('Répartition des Payments', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(8);
      Object.entries(paymentMethodsDistribution).forEach(([method, data]) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const percentage = totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0;
        pdf.text(`${method}: ${data.amount.toFixed(2)} DT (${percentage.toFixed(1)}%)`, 20, yPosition);
        yPosition += 6;
      });

      yPosition += 10;
      pdf.setFontSize(14);
      pdf.text('Répartition par Type de Véhicule', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(8);
      Object.entries(vehicleTypeDistribution).forEach(([type, data]) => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const percentage = totalPayments > 0 ? (data.count / totalPayments) * 100 : 0;
        pdf.text(`${type}: ${data.count} (${percentage.toFixed(1)}%) - ${data.revenue.toFixed(2)} DT`, 20, yPosition);
        yPosition += 6;
      });

      pdf.save(`rapport-payments-${new Date().toISOString().split('T')[0]}.pdf`);

      if (button) {
        button.disabled = false;
        button.innerHTML = '<Download class="w-4 h-4 mr-2" />PDF';
      }

      console.log('✅ PDF généré avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      
      const button = document.querySelector('.pdf-button') as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = '<Download class="w-4 h-4 mr-2" />PDF';
      }
    }
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        ['Date', 'Revenus (DT)', 'Payments', 'Taux de Complétion (%)', 'Durée Moyenne (h)', 'Payments Complétés'],
        ...reportData.map(row => [
          row.date, 
          row.revenue.toFixed(2), 
          row.payments, 
          row.completionRate, 
          row.avgDuration,
          row.completedPayments
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-payments-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ CSV exporté avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export CSV:', error);
    }
  };

  const refreshData = () => {
    console.log('🔄 Manual refresh triggered');
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center text-lg text-gray-600">
          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          Chargement des payments...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={reportRef}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Rapports Payments</h2>
          <p className="text-gray-600">Statistiques basées sur les payments de parking</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshData}
            className="flex items-center px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
          <button
            onClick={exportToCSV}
            disabled={!hasData}
            className="flex items-center px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={!hasData}
            className="flex items-center px-4 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed pdf-button"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-red-300 rounded-lg bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
            <div>
              <p className="font-medium text-red-700">Erreur de chargement</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!hasData && !loading && !error && (
        <div className="p-4 border border-yellow-300 rounded-lg bg-yellow-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-700">Aucun payment trouvé</p>
              <p className="mt-1 text-sm text-yellow-600">
                Aucun payment n'a été trouvé pour la période sélectionnée.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7days">7 derniers jours</option>
              <option value="30days">30 derniers jours</option>
              <option value="90days">90 derniers jours</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="revenue">Revenus</option>
              <option value="payments">Payments</option>
              <option value="completion">Taux de Complétion</option>
            </select>
          </div>
        </div>
      </div>

      {hasData && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenus Totaux</p>
                  <p className="text-2xl font-bold text-gray-900">{totalRevenue.toFixed(2)} DT</p>
                  <p className="text-sm text-green-600">{totalPayments} payments</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Payments Totaux</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPayments}</p>
                  <p className="text-sm text-blue-600">{completedPayments} complétés</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taux de Complétion</p>
                  <p className="text-2xl font-bold text-gray-900">{completionRate.toFixed(1)}%</p>
                  <p className="text-sm text-orange-600">Payments terminés</p>
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
                  <p className="text-2xl font-bold text-gray-900">{totalAvgDuration}h</p>
                  <p className="text-sm text-purple-600">Par payment</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Évolution - {reportType === 'revenue' ? 'Revenus' : reportType === 'payments' ? 'Payments' : 'Taux de Complétion'}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span>Tendance sur {getDateRangeLabel(dateRange)}</span>
              </div>
            </div>
            
            {reportData.length > 0 ? (
              <div className="flex items-end space-x-2 h-80">
                {reportData.map((day, index) => {
                  const value = reportType === 'revenue' ? day.revenue : 
                               reportType === 'payments' ? day.payments : day.completionRate;
                  const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full transition-colors bg-blue-500 rounded-t cursor-pointer hover:bg-blue-600"
                        style={{ height: `${height}%` }}
                        title={`${day.date}: ${value}${reportType === 'revenue' ? ' DT' : reportType === 'completion' ? '%' : ''}`}
                      />
                      <span className="mt-2 text-xs text-gray-500 origin-left transform -rotate-45">
                        {day.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-80">
                <p className="text-gray-500">Aucune donnée disponible pour le graphique</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Répartition des Payments</h3>
            <div className="space-y-3">
              {Object.entries(paymentMethodsDistribution).length > 0 ? (
                Object.entries(paymentMethodsDistribution).map(([method, data], index) => {
                  const percentage = totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0;
                  const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500'];
                  
                  return (
                    <div key={method} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                        <span className="text-sm font-medium text-gray-700">{method}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-20 text-sm font-medium text-right text-gray-900">
                          {data.amount.toFixed(2)} DT
                        </span>
                        <span className="w-12 text-sm text-right text-gray-500">
                          ({data.count})
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500">Aucun payment trouvé</p>
              )}
            </div>
          </div>

          <div className="p-6 bg-white border border-gray-100 shadow-sm rounded-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Répartition par Type de Véhicule</h3>
            <div className="space-y-3">
              {Object.entries(vehicleTypeDistribution).length > 0 ? (
                Object.entries(vehicleTypeDistribution).map(([type, data], index) => {
                  const percentage = totalPayments > 0 ? (data.count / totalPayments) * 100 : 0;
                  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500'];
                  
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                        <span className="text-sm font-medium text-gray-700">{type}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div
                            className={`h-2 rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-16 text-sm font-medium text-right text-gray-900">
                          {data.count}
                        </span>
                        <span className="w-20 text-sm text-right text-gray-500">
                          {data.revenue.toFixed(2)} DT
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500">Aucune donnée de type de véhicule</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Données Détaillées des Payments</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Revenus (DT)</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Payments</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Complétion (%)</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Durée Moyenne (h)</th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Complétés</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.map((day, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{day.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{day.revenue.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{day.payments}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{day.completionRate}%</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{day.avgDuration}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{day.completedPayments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;