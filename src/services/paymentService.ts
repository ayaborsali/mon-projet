import { Payment } from '../types/parking';

const API_BASE_URL = 'http://localhost:3001/api';

export const paymentService = {
  // Récupérer TOUS les paiements DIRECTEMENT depuis MongoDB
  async getAllPayments(): Promise<Payment[]> {
    try {
      console.log('📡 Chargement des paiements depuis:', `${API_BASE_URL}/payments`);
      
      const response = await fetch(`${API_BASE_URL}/payments`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const paymentsFromDB = await response.json();
      console.log(`✅ ${paymentsFromDB.length} paiements chargés depuis MongoDB`);

      // Transformer les données MongoDB en format Payment
      return paymentsFromDB.map((payment: any) => ({
        _id: payment._id,
        id: payment._id,
        sessionId: payment.sessionId,
        amount: payment.amount,
        method: payment.paymentMethod,
        paymentMethod: payment.paymentMethod,
        timestamp: new Date(payment.paymentTime),
        paymentTime: new Date(payment.paymentTime),
        status: payment.status === 'completed' ? 'completé' : 
               payment.status === 'pending' ? 'en_attente' : 
               payment.status === 'failed' ? 'échoué' : payment.status,
        // Ces champs seront affichés comme "N/A" car ils ne sont pas dans la collection payments
        plate: 'N/A',
        vehicleType: 'Non spécifié', 
        spaceNumber: 'N/A',
        reference: payment.reference || `PAY-${payment._id?.toString().slice(-6).toUpperCase() || 'N/A'}`
      }));

    } catch (error) {
      console.error('❌ Erreur chargement paiements:', error);
      throw error;
    }
  },

  // Créer un NOUVEAU paiement
  async createPayment(paymentData: {
    sessionId: string;
    amount: number;
    paymentMethod: string;
    status?: string;
  }): Promise<Payment> {
    try {
      console.log('📤 Création paiement:', paymentData);
      
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const newPayment = await response.json();
      console.log('✅ Paiement créé:', newPayment._id);
      
      return {
        _id: newPayment._id,
        id: newPayment._id,
        sessionId: newPayment.sessionId,
        amount: newPayment.amount,
        method: newPayment.paymentMethod,
        paymentMethod: newPayment.paymentMethod,
        timestamp: new Date(newPayment.paymentTime),
        paymentTime: new Date(newPayment.paymentTime),
        status: newPayment.status === 'completed' ? 'completé' : newPayment.status,
        plate: 'N/A',
        vehicleType: 'Non spécifié',
        spaceNumber: 'N/A',
        reference: newPayment.reference
      };
    } catch (error) {
      console.error('❌ Erreur création paiement:', error);
      throw error;
    }
  },

  // S'abonner aux mises à jour en temps réel
  subscribeToPayments(
    callback: (payments: Payment[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    console.log('💰 Abonnement aux paiements');
    
    let isSubscribed = true;

    const pollPayments = async () => {
      if (!isSubscribed) return;
      
      try {
        const payments = await this.getAllPayments();
        callback(payments);
      } catch (error) {
        console.error('❌ Erreur polling:', error);
        if (errorCallback) errorCallback(error as Error);
      }
    };

    // Polling initial
    pollPayments();

    // Polling toutes les 10 secondes
    const interval = setInterval(pollPayments, 10000);

    return () => {
      console.log('🧹 Nettoyage abonnement');
      isSubscribed = false;
      clearInterval(interval);
    };
  }
};

export default paymentService;