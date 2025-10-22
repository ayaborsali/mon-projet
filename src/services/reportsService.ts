const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface Payment {
  _id?: string;
  id?: string;
  amount: number;
  createdAt: Date;
  duration: number;
  paymentMethod: string;
  paymentTime: Date;
  plate: string;
  sessionId: string;
  spaceNumber: string;
  status: string;
  vehicleType: string;
}

export const reportsService = {
  // Récupérer les paiements par plage de dates
  async getPaymentsByDateRange(startDate: Date, endDate?: Date): Promise<Payment[]> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        ...(endDate && { endDate: endDate.toISOString() })
      });

      console.log(`📊 Requête paiements: ${API_BASE_URL}/payments/reports?${params}`);

      const response = await fetch(`${API_BASE_URL}/payments/reports?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const payments = await response.json();
      
      // Convertir les dates string en objets Date
      return payments.map((payment: any) => ({
        ...payment,
        createdAt: new Date(payment.createdAt),
        paymentTime: new Date(payment.paymentTime),
        // Gérer la compatibilité des IDs
        ...(payment._id && !payment.id && { id: payment._id })
      }));
    } catch (error) {
      console.error('❌ Erreur lors du chargement des paiements pour les rapports:', error);
      throw error;
    }
  },

  // Récupérer les statistiques globales
  async getPaymentStats(startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`${API_BASE_URL}/payments/stats?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error);
      throw error;
    }
  },

  // Générer un rapport PDF côté serveur
  async generatePDFReport(startDate: Date, endDate?: Date): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        ...(endDate && { endDate: endDate.toISOString() })
      });

      const response = await fetch(`${API_BASE_URL}/reports/pdf?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport PDF:', error);
      throw error;
    }
  },

  // Générer un rapport CSV côté serveur
  async generateCSVReport(startDate: Date, endDate?: Date): Promise<Blob> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        ...(endDate && { endDate: endDate.toISOString() })
      });

      const response = await fetch(`${API_BASE_URL}/reports/csv?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('❌ Erreur lors de la génération du rapport CSV:', error);
      throw error;
    }
  }
};