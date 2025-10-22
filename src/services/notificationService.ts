const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface Notification {
  _id?: string;
  id?: string;
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

export const notificationService = {
  // Créer une nouvelle notification
  async createNotification(notificationData: Omit<Notification, '_id' | 'id'>): Promise<Notification> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notification = await response.json();
      return {
        ...notification,
        timestamp: new Date(notification.timestamp),
        ...(notification.metadata?.reservationExpiresAt && {
          metadata: {
            ...notification.metadata,
            reservationExpiresAt: new Date(notification.metadata.reservationExpiresAt)
          }
        })
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création de la notification:', error);
      throw error;
    }
  },

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notification = await response.json();
      return {
        ...notification,
        timestamp: new Date(notification.timestamp)
      };
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
      throw error;
    }
  },

  // Supprimer une notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la notification:', error);
      throw error;
    }
  },

  // Récupérer les notifications non lues
  async getUnreadNotifications(): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const notifications = await response.json();
      return notifications.map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));
    } catch (error) {
      console.error('❌ Erreur lors du chargement des notifications non lues:', error);
      throw error;
    }
  }
};