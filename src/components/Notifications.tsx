import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Clock,
  Car,
  CreditCard,
  Settings,
  Users,
  RefreshCw,
  X,
  Filter
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: 'system' | 'payment' | 'parking' | 'user';
  plate?: string;
  spaceNumber?: string;
  actionUrl?: string;
  sessionId?: string;
  vehicleType?: string;
  reservationId?: string;
  metadata?: {
    entryTime?: string;
    spaceNumber?: string;
    vehicleType?: string;
    reservationExpiresAt?: string;
    outOfServiceTime?: string;
    freedTime?: string;
    occupiedTime?: string;
    reason?: string;
  };
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'system' | 'payment' | 'parking' | 'user'>('all');
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Service API pour MongoDB
  const ApiService = {
    async getNotifications(): Promise<Notification[]> {
      const response = await fetch('http://localhost:3001/api/alerts');
      const data = await response.json();
      return data.alerts || [];
    },

    async markAsRead(notificationId: string): Promise<void> {
      await fetch(`http://localhost:3001/api/alerts/${notificationId}/read`, {
        method: 'PUT'
      });
    },

    async markAllAsRead(notificationIds: string[]): Promise<void> {
      await Promise.all(
        notificationIds.map(id => 
          fetch(`http://localhost:3001/api/alerts/${id}/read`, {
            method: 'PUT'
          })
        )
      );
    },

    async deleteNotification(notificationId: string): Promise<void> {
      await fetch(`http://localhost:3001/api/alerts/${notificationId}`, {
        method: 'DELETE'
      });
    },

    async deleteMultipleNotifications(notificationIds: string[]): Promise<void> {
      await Promise.all(
        notificationIds.map(id => 
          fetch(`http://localhost:3001/api/alerts/${id}`, {
            method: 'DELETE'
          })
        )
      );
    }
  };

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔔 Chargement des notifications...');
      const notificationsData = await ApiService.getNotifications();
      
      setNotifications(notificationsData);
      setLoading(false);
      console.log(`✅ ${notificationsData.length} notification(s) chargée(s)`);
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
      setError('Impossible de charger les notifications: ' + (error as Error).message);
      setLoading(false);
    }
  };

  // Charger les notifications au démarrage
  useEffect(() => {
    loadNotifications();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      await ApiService.markAsRead(notificationId);
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      console.log('✅ Notification marquée comme lue:', notificationId);
    } catch (error) {
      console.error('❌ Erreur marquage comme lu:', error);
      alert('Erreur lors du marquage comme lu: ' + (error as Error).message);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      if (unreadNotifications.length === 0) {
        console.log('ℹ️ Aucune notification non lue à marquer');
        return;
      }

      console.log(`📝 Marquage de ${unreadNotifications.length} notification(s) comme lue(s)`);
      
      const unreadIds = unreadNotifications.map(n => n.id);
      await ApiService.markAllAsRead(unreadIds);
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => 
          unreadIds.includes(notif.id) ? { ...notif, read: true } : notif
        )
      );
      
      console.log('✅ Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('❌ Erreur marquage tout comme lu:', error);
      alert('Erreur lors du marquage de toutes les notifications: ' + (error as Error).message);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      if (!confirm('Voulez-vous vraiment supprimer cette notification ?')) {
        return;
      }
      
      await ApiService.deleteNotification(notificationId);
      
      // Mettre à jour localement
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      console.log('🗑️ Notification supprimée:', notificationId);
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
      alert('Erreur lors de la suppression: ' + (error as Error).message);
    }
  };

  // Supprimer toutes les notifications lues
  const deleteAllRead = async () => {
    try {
      const readNotifications = notifications.filter(n => n.read);
      
      if (readNotifications.length === 0) {
        console.log('ℹ️ Aucune notification lue à supprimer');
        alert('Aucune notification lue à supprimer');
        return;
      }

      if (!confirm(`Voulez-vous vraiment supprimer ${readNotifications.length} notification(s) lue(s) ?`)) {
        return;
      }

      console.log(`🗑️ Suppression de ${readNotifications.length} notification(s) lue(s)`);
      
      const readIds = readNotifications.map(n => n.id);
      await ApiService.deleteMultipleNotifications(readIds);
      
      // Mettre à jour localement
      setNotifications(prev => prev.filter(notif => !readIds.includes(notif.id)));
      
      console.log('✅ Toutes les notifications lues supprimées');
    } catch (error) {
      console.error('❌ Erreur suppression notifications lues:', error);
      alert('Erreur lors de la suppression des notifications lues: ' + (error as Error).message);
    }
  };

  // Supprimer toutes les notifications
  const deleteAllNotifications = async () => {
    try {
      if (notifications.length === 0) {
        console.log('ℹ️ Aucune notification à supprimer');
        alert('Aucune notification à supprimer');
        return;
      }

      if (!confirm(`Voulez-vous vraiment supprimer toutes les ${notifications.length} notifications ? Cette action est irréversible.`)) {
        return;
      }

      console.log(`🗑️ Suppression de toutes les ${notifications.length} notifications`);
      
      const allIds = notifications.map(n => n.id);
      await ApiService.deleteMultipleNotifications(allIds);
      
      // Mettre à jour localement
      setNotifications([]);
      
      console.log('✅ Toutes les notifications supprimées');
    } catch (error) {
      console.error('❌ Erreur suppression toutes les notifications:', error);
      alert('Erreur lors de la suppression de toutes les notifications: ' + (error as Error).message);
    }
  };

  // Filtrer les notifications selon le filtre sélectionné
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.category === filter;
  });

  // Compter les notifications non lues
  const unreadCount = notifications.filter(n => !n.read).length;

  // Obtenir l'icône appropriée pour chaque notification
  const getNotificationIcon = (type: string, category: string) => {
    if (type === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    if (type === 'error') return <AlertTriangle className="w-5 h-5 text-red-500" />;
    
    switch (category) {
      case 'parking':
        return <Car className="w-5 h-5 text-blue-500" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'user':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Obtenir la couleur de bordure selon le type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 hover:bg-green-100';
      case 'warning':
        return 'border-l-orange-500 bg-orange-50 hover:bg-orange-100';
      case 'error':
        return 'border-l-red-500 bg-red-50 hover:bg-red-100';
      default:
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
    }
  };

  // Obtenir la couleur de texte selon le type
  const getNotificationTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'warning':
        return 'text-orange-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-blue-700';
    }
  };

  // Formater la date relative
  const getTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'À l\'instant';
      if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
      if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
      if (diffInMinutes < 10080) return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
      
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur formatage date relative:', error);
      return 'Date inconnue';
    }
  };

  // Formater la date complète
  const getFullDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur formatage date complète:', error);
      return 'Date inconnue';
    }
  };

  // Obtenir le count par catégorie
  const getCategoryCount = (category: string) => {
    return notifications.filter(n => n.category === category).length;
  };

  // Obtenir le count non lu par catégorie
  const getUnreadCategoryCount = (category: string) => {
    return notifications.filter(n => n.category === category && !n.read).length;
  };

  // État de chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <RefreshCw className="w-12 h-12 mb-4 text-blue-500 animate-spin" />
        <p className="text-lg text-gray-600">Chargement des notifications...</p>
        <p className="mt-2 text-sm text-gray-500">Connexion à la base de données</p>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-gray-700" />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Notifications</h2>
              <p className="text-gray-600">Gestion des alertes système</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 text-center bg-white border border-red-200 rounded-lg shadow-sm">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="mb-2 text-xl font-semibold text-red-900">Erreur de chargement</h3>
          <p className="mb-4 text-red-700">{error}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={loadNotifications}
              className="px-6 py-2 text-white transition-colors bg-red-600 rounded-lg hover:bg-red-700"
            >
              Réessayer
            </button>
            <button
              onClick={() => setError(null)}
              className="px-6 py-2 text-red-600 transition-colors border border-red-300 rounded-lg hover:bg-red-50"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec compteur et actions */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="w-10 h-10 text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full -top-2 -right-2">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">
              {unreadCount > 0 ? (
                <span className="font-semibold">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>
              ) : (
                'Toutes les notifications sont lues'
              )}
              {' '}sur {notifications.length} au total
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center px-4 py-2 text-sm text-blue-600 transition-colors border border-blue-300 rounded-lg hover:bg-blue-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </button>
          )}
          
          {notifications.length > 0 && (
            <>
              <button
                onClick={deleteAllRead}
                className="flex items-center px-4 py-2 text-sm text-orange-600 transition-colors border border-orange-300 rounded-lg hover:bg-orange-50"
              >
                <X className="w-4 h-4 mr-2" />
                Supprimer les lues
              </button>
              
              <button
                onClick={deleteAllNotifications}
                className="flex items-center px-4 py-2 text-sm text-red-600 transition-colors border border-red-300 rounded-lg hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Tout supprimer
              </button>
            </>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 text-sm text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres
          </button>

          <button
            onClick={loadNotifications}
            className="flex items-center px-4 py-2 text-sm text-gray-600 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      {showFilters && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Filtrer les notifications</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'all', label: '📋 Toutes', count: notifications.length, unread: unreadCount },
              { key: 'unread', label: '👁️ Non lues', count: unreadCount, unread: unreadCount },
              { key: 'parking', label: '🚗 Parking', count: getCategoryCount('parking'), unread: getUnreadCategoryCount('parking') },
              { key: 'payment', label: '💳 Paiements', count: getCategoryCount('payment'), unread: getUnreadCategoryCount('payment') },
              { key: 'system', label: '⚙️ Système', count: getCategoryCount('system'), unread: getUnreadCategoryCount('system') },
              { key: 'user', label: '👤 Utilisateurs', count: getCategoryCount('user'), unread: getUnreadCategoryCount('user') }
            ].map(({ key, label, count, unread }) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key as any);
                  setShowFilters(false);
                }}
                className={`flex items-center px-4 py-3 rounded-lg border-2 transition-all ${
                  filter === key
                    ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full ${
                  filter === key
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                  {unread > 0 && (
                    <span className="ml-1 text-red-500">
                      ({unread})
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      {notifications.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="p-4 text-center bg-white border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="p-4 text-center bg-white border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{getCategoryCount('parking')}</div>
            <div className="text-sm text-gray-600">Parking</div>
          </div>
          <div className="p-4 text-center bg-white border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{getCategoryCount('payment')}</div>
            <div className="text-sm text-gray-600">Paiements</div>
          </div>
          <div className="p-4 text-center bg-white border border-gray-200 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <div className="text-sm text-gray-600">Non lues</div>
          </div>
        </div>
      )}

      {/* Liste des notifications */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
            </h3>
            <p className="mb-6 text-gray-600">
              {filter === 'unread' 
                ? 'Toutes les notifications ont été lues. Revenez plus tard pour de nouvelles notifications.' 
                : `Aucune notification dans la catégorie "${filter}". Changez de filtre pour voir plus de notifications.`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="px-6 py-2 text-blue-600 transition-colors border border-blue-300 rounded-lg hover:bg-blue-50"
              >
                Voir toutes les notifications
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Affichage de {filteredNotifications.length} notification{filteredNotifications.length > 1 ? 's' : ''}
                {filter !== 'all' && ` (filtrées)`}
              </p>
              
              {filteredNotifications.length > 5 && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 transition-colors hover:text-blue-800"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white border-l-4 rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:shadow-md ${
                  getNotificationColor(notification.type)
                } ${!notification.read ? 'ring-2 ring-blue-100' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1 space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type, notification.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2 space-x-3">
                        <h3 className={`text-lg font-semibold ${getNotificationTextColor(notification.type)} ${
                          !notification.read ? '' : 'opacity-90'
                        }`}>
                          {notification.title}
                        </h3>
                        
                        {!notification.read && (
                          <span className="px-2 py-1 text-xs font-bold text-white bg-blue-500 rounded-full">
                            NOUVEAU
                          </span>
                        )}
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          notification.category === 'parking' ? 'bg-blue-100 text-blue-800' :
                          notification.category === 'payment' ? 'bg-green-100 text-green-800' :
                          notification.category === 'system' ? 'bg-gray-100 text-gray-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {notification.category}
                        </span>
                      </div>
                      
                      <p className="mb-3 leading-relaxed text-gray-700">
                        {notification.message}
                      </p>
                      
                      {/* Informations supplémentaires */}
                      {(notification.plate || notification.spaceNumber || notification.vehicleType) && (
                        <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-600">
                          {notification.plate && (
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">Plaque:</span>
                              <span className="px-2 py-1 font-mono bg-gray-100 border rounded">
                                {notification.plate}
                              </span>
                            </div>
                          )}
                          
                          {notification.spaceNumber && (
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">Place:</span>
                              <span className="px-2 py-1 font-medium bg-gray-100 border rounded">
                                {notification.spaceNumber}
                              </span>
                            </div>
                          )}
                          
                          {notification.vehicleType && (
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">Type:</span>
                              <span className="px-2 py-1 capitalize bg-gray-100 border rounded">
                                {notification.vehicleType}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Métadonnées supplémentaires */}
                      {notification.metadata && (
                        <div className="mb-3 space-y-2 text-sm text-gray-600">
                          {notification.metadata.reason && (
                            <p>
                              <span className="font-medium">Raison:</span> {notification.metadata.reason}
                            </p>
                          )}
                          
                          {notification.metadata.reservationExpiresAt && (
                            <p>
                              <span className="font-medium">Expiration:</span>{' '}
                              {getFullDate(notification.metadata.reservationExpiresAt)}
                            </p>
                          )}
                          
                          {(notification.metadata.entryTime || notification.metadata.occupiedTime) && (
                            <p>
                              <span className="font-medium">Heure:</span>{' '}
                              {getFullDate(notification.metadata.entryTime || notification.metadata.occupiedTime)}
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span title={getFullDate(notification.timestamp)}>
                              {getTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                          
                          {notification.actionUrl && (
                            <a 
                              href={notification.actionUrl}
                              className="text-blue-600 transition-colors hover:text-blue-800 hover:underline"
                              onClick={(e) => {
                                e.preventDefault();
                                window.location.href = notification.actionUrl!;
                              }}
                            >
                              Voir les détails
                            </a>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-sm text-blue-600 transition-colors hover:text-blue-800"
                              title="Marquer comme lu"
                            >
                              Marquer lu
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-gray-400 transition-colors rounded-full hover:text-red-600 hover:bg-red-50"
                            title="Supprimer la notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Pied de page avec informations */}
      {notifications.length > 0 && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex flex-col text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong>{notifications.length}</strong> notification{notifications.length > 1 ? 's' : ''} au total • 
              {' '}<strong>{unreadCount}</strong> non lue{unreadCount > 1 ? 's' : ''}
            </div>
            <div className="mt-2 sm:mt-0">
              Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;