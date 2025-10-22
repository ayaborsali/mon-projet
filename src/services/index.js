// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios'); // Remplacer fetch par axios
const WebSocket = require('ws'); // WebSocket pour Node.js

admin.initializeApp();

// Service dédié pour les appels API
class ApiService {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'https://ton-backend.herokuapp.com/api';
  }

  async fetchExpiredReservations(thirtyMinutesAgo) {
    try {
      const response = await axios.post(`${this.baseUrl}/reservations/expired`, {
        timestamp: thirtyMinutesAgo.toISOString()
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching expired reservations:', error.message);
      throw error;
    }
  }

  async createSpaceStatusHistory(spaceUpdate) {
    try {
      const response = await axios.post(`${this.baseUrl}/space-status-history`, spaceUpdate);
      return response.data;
    } catch (error) {
      console.error('Error creating space status history:', error.message);
      throw error;
    }
  }

  async createNotification(notification) {
    try {
      const response = await axios.post(`${this.baseUrl}/notifications`, notification);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error.message);
      throw error;
    }
  }

  async batchCreateNotifications(notifications) {
    try {
      const response = await axios.post(`${this.baseUrl}/notifications/batch`, {
        notifications
      });
      return response.data;
    } catch (error) {
      console.error('Error batch creating notifications:', error.message);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.status === 200 ? 'healthy' : 'unhealthy';
    } catch (error) {
      return 'unreachable';
    }
  }
}

// Service WebSocket amélioré
class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
  }

  connect(onMessage, onError) {
    try {
      const wsUrl = process.env.WS_URL || 'wss://ton-backend.herokuapp.com';
      
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected for real-time updates');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.ws.on('message', (data) => {
        try {
          const parsedData = JSON.parse(data.toString());
          onMessage(parsedData);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        onError(error);
      });

      this.ws.on('close', (code, reason) => {
        console.log(`WebSocket disconnected: ${code} - ${reason}`);
        this.isConnected = false;
        this.attemptReconnect(onMessage, onError);
      });

    } catch (error) {
      console.error('WebSocket connection failed:', error);
      onError(error);
    }
  }

  attemptReconnect(onMessage, onError) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * this.reconnectAttempts, 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(onMessage, onError);
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(message) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}

const apiService = new ApiService();
const wsService = new WebSocketService();

// Initialiser la connexion WebSocket
wsService.connect(
  (data) => {
    console.log('Real-time update received:', data);
  },
  (error) => {
    console.error('WebSocket error, continuing without real-time updates:', error);
  }
);

// 🔄 Vérification des réservations expirées
exports.checkExpiredReservations = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  const now = new Date();
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

  try {
    console.log('🔍 Vérification des réservations expirées via API...');

    // Récupérer les réservations expirées via API
    const expiredReservations = await apiService.fetchExpiredReservations(thirtyMinutesAgo);

    console.log(`📊 ${expiredReservations.length} réservations expirées trouvées`);

    const notifications = [];
    const updates = [];

    // Traiter chaque réservation expirée
    for (const reservation of expiredReservations) {
      const spaceNumber = reservation.reservationInfo?.spaceNumber || 'Inconnue';
      const plate = reservation.reservationInfo?.plate || 'Inconnue';

      console.log(`🔄 Libération de la place ${spaceNumber} (${plate})`);

      // Préparer la mise à jour
      const spaceUpdate = {
        action: 'automatic_release',
        changeBy: 'system',
        metadata: {
          vehicleType: reservation.metadata?.vehicleType || 'voiture',
          zone: reservation.metadata?.zone || 'X'
        },
        newStatus: 'libre',
        previousStatus: 'réservé',
        reason: 'Réservation expirée (dépassement de 30 minutes)',
        reservationInfo: {
          plate: plate,
          vehicleType: reservation.reservationInfo?.vehicleType || 'voiture',
          spaceNumber: spaceNumber
        },
        timestamp: new Date().toISOString()
      };

      updates.push(spaceUpdate);

      // Créer une notification
      const notification = {
        type: 'warning',
        title: '⏰ Réservation expirée',
        message: `La réservation pour la place ${spaceNumber} (${plate}) a expiré et a été libérée automatiquement`,
        plate: plate,
        spaceNumber: spaceNumber,
        timestamp: new Date().toISOString(),
        read: false,
        category: 'parking'
      };
      
      notifications.push(notification);
    }

    // Traiter toutes les mises à jour
    for (const update of updates) {
      await apiService.createSpaceStatusHistory(update);
    }

    // Créer les notifications en lot
    if (notifications.length > 0) {
      await apiService.batchCreateNotifications(notifications);
      console.log(`✅ ${notifications.length} notifications créées via API`);
      
      // Notifier via WebSocket
      wsService.send({
        type: 'notifications_updated',
        data: {
          count: notifications.length,
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log('✅ Vérification des réservations expirées terminée avec succès');
    return null;

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des réservations:', error);
    
    // Envoyer une notification d'erreur
    wsService.send({
      type: 'error',
      data: {
        message: 'Erreur vérification réservations expirées',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
    
    return null;
  }
});

// 📧 Fonction pour créer des notifications
exports.createTestNotification = functions.https.onCall(async (data, context) => {
  try {
    // Vérifier l'authentification si nécessaire
    if (context.auth) {
      // L'utilisateur est authentifié
      console.log('User:', context.auth.uid);
    }

    const notification = {
      type: data.type || 'info',
      title: data.title || 'Notification de test',
      message: data.message || 'Ceci est une notification de test',
      timestamp: new Date().toISOString(),
      read: false,
      category: data.category || 'system',
      plate: data.plate,
      spaceNumber: data.spaceNumber
    };

    const result = await apiService.createNotification(notification);
    
    // Notifier via WebSocket
    wsService.send({
      type: 'test_notification_created',
      data: notification
    });

    return { 
      success: true, 
      message: 'Notification créée via API', 
      data: result 
    };

  } catch (error) {
    console.error('Error creating test notification:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// 🩺 Endpoint de santé
exports.checkConnections = functions.https.onRequest(async (req, res) => {
  try {
    const apiStatus = await apiService.healthCheck();
    const wsStatus = wsService.isConnected ? 'connected' : 'disconnected';
    
    res.json({
      status: 'ok',
      api: apiStatus,
      websocket: wsStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🆕 Fonction pour libérer une place spécifique
exports.freeParkingSpace = functions.https.onCall(async (data, context) => {
  try {
    const { spaceNumber, plate, reason } = data;

    if (!spaceNumber) {
      throw new Error('spaceNumber est requis');
    }

    const spaceUpdate = {
      action: 'manual_release',
      changeBy: context.auth ? context.auth.uid : 'system',
      newStatus: 'libre',
      previousStatus: 'occupé',
      reason: reason || 'Libération manuelle',
      spaceNumber: spaceNumber,
      plate: plate,
      timestamp: new Date().toISOString()
    };

    // Mettre à jour via API
    await apiService.createSpaceStatusHistory(spaceUpdate);

    // Créer notification
    const notification = {
      type: 'info',
      title: '🅿️ Place libérée',
      message: `Place ${spaceNumber} libérée${plate ? ` - Véhicule ${plate}` : ''}`,
      plate: plate,
      spaceNumber: spaceNumber,
      timestamp: new Date().toISOString(),
      read: false,
      category: 'parking'
    };

    await apiService.createNotification(notification);

    // Notifier via WebSocket
    wsService.send({
      type: 'space_freed',
      data: {
        spaceNumber,
        plate,
        timestamp: new Date().toISOString()
      }
    });

    return {
      success: true,
      message: `Place ${spaceNumber} libérée avec succès`
    };

  } catch (error) {
    console.error('Error freeing parking space:', error);
    return {
      success: false,
      error: error.message
    };
  }
});