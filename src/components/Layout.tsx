import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, 
  BarChart3, 
  CreditCard, 
  Settings, 
  Users, 
  Bell, 
  Menu, 
  X,
  Camera,
  FileText,
  Brain,
  Smartphone,
  LogOut,
  User,
  Shield,
  HelpCircle,
  Search,
  Sun,
  Moon,
  MapPin,
  History,
  Wallet
} from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  onSignOut: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: string;
}

interface UserData {
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'customer';
  status: string;
}

const Layout: React.FC<LayoutProps> = ({ onSignOut }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Obtenir la page actuelle à partir de l'URL
  const currentPage = location.pathname.split('/')[1] || 'dashboard';

  // Fermer les menus en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Appliquer le mode sombre
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Récupérer les données utilisateur depuis localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserData(user);
      } catch (error) {
        console.error('Erreur lors du parsing des données utilisateur:', error);
      }
    }
  }, []);

  // Récupérer les notifications depuis le backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/alerts?limit=10');
        if (response.ok) {
          const data = await response.json();
          const notificationsData: Notification[] = data.alerts.map((alert: any) => ({
            id: alert._id || alert.id,
            title: alert.title,
            message: alert.message,
            timestamp: alert.timestamp,
            read: alert.read || false,
            type: alert.priority || 'info'
          }));
          
          setNotifications(notificationsData);
          
          // Calculer les notifications non lues
          const unread = notificationsData.filter(notification => !notification.read).length;
          setUnreadNotifications(unread);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        // Notifications de démo en cas d'erreur
        setNotifications([
          {
            id: '1',
            title: 'Bienvenue sur SmartPark',
            message: 'Système initialisé avec succès',
            timestamp: new Date().toISOString(),
            read: false,
            type: 'success'
          }
        ]);
      }
    };

    fetchNotifications();

    // Mettre à jour les notifications toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`http://localhost:3001/api/alerts/${notificationId}/read`, {
        method: 'PUT'
      });
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };

  // Items de menu avec permissions par rôle
  const getMenuItems = () => {
    const baseItems = [
      { 
        id: 'parking', 
        label: 'Places de Parking', 
        icon: MapPin, 
        category: 'principal',
        roles: ['admin', 'operator', 'customer']
      },
    ];

    const adminItems = [
      { 
        id: 'dashboard', 
        label: 'Tableau de Bord', 
        icon: BarChart3, 
        category: 'principal',
        roles: ['admin']
      },
      { 
        id: 'sessions', 
        label: 'Sessions Actives', 
        icon: Camera, 
        category: 'principal',
        roles: ['admin', 'operator']
      },
      { 
        id: 'payments', 
        label: 'Paiements', 
        icon: CreditCard, 
        category: 'principal',
        roles: ['admin', 'operator']
      },
      { 
        id: 'reports', 
        label: 'Rapports & Stats', 
        icon: FileText, 
        category: 'analyse',
        roles: ['admin']
      },
      { 
        id: 'ai', 
        label: 'Intelligence Artificielle', 
        icon: Brain, 
        category: 'analyse',
        roles: ['admin']
      },
      { 
        id: 'users', 
        label: 'Gestion Utilisateurs', 
        icon: Users, 
        category: 'administration',
        roles: ['admin']
      },
      { 
        id: 'settings', 
        label: 'Paramètres Système', 
        icon: Settings, 
        category: 'administration',
        roles: ['admin']
      },
      { 
        id: 'mobile', 
        label: 'Application Mobile', 
        icon: Smartphone, 
        category: 'administration',
        roles: ['admin']
      },
      { 
        id: 'notifications', 
        label: 'Centre de Notifications', 
        icon: Bell, 
        category: 'administration',
        roles: ['admin']
      },
    ];

    const customerItems = [
      {
        id: 'wallet',
        label: 'Mon Portefeuille',
        icon: Wallet,
        category: 'principal',
        roles: ['customer']
      },
      {
        id: 'history',
        label: 'Mon Historique',
        icon: History,
        category: 'principal',
        roles: ['customer']
      }
    ];

    // Fusionner tous les items et filtrer par rôle
    const allItems = [...baseItems, ...adminItems, ...customerItems];
    return allItems.filter(item => 
      item.roles.includes(userData?.role || 'customer')
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onSignOut();
    navigate('/login');
  };

  const handlePageChange = (page: string) => {
    // Vérifier les permissions avant la navigation
    const menuItems = getMenuItems();
    const targetItem = menuItems.find(item => item.id === page);
    
    if (targetItem && targetItem.roles.includes(userData?.role || 'customer')) {
      navigate(`/${page}`);
      setIsMobileMenuOpen(false);
    } else {
      // Rediriger vers une page autorisée selon le rôle
      switch (userData?.role) {
        case 'admin':
          navigate('/dashboard');
          break;
        case 'operator':
          navigate('/sessions');
          break;
        case 'customer':
          navigate('/parking');
          break;
        default:
          navigate('/parking');
      }
      
      // Afficher un message d'erreur
      alert('❌ Accès non autorisé. Vous n\'avez pas les permissions nécessaires pour accéder à cette page.');
    }
  };

  const menuItems = getMenuItems();

  const menuItemsByCategory = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'principal': return 'Navigation Principale';
      case 'analyse': return 'Analyse & Rapports';
      case 'administration': return 'Administration';
      default: return category;
    }
  };

  // Formater la date des notifications
  const formatNotificationTime = (timestamp: string) => {
    if (!timestamp) return 'Date inconnue';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'À l\'instant';
      if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
      if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
      return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
    } catch (error) {
      return 'Date inconnue';
    }
  };

  // Récupérer les informations utilisateur
  const displayName = userData?.name || 'Utilisateur';
  const email = userData?.email || 'email@exemple.com';
  const userRole = userData?.role || 'customer';

  // Obtenir la couleur du rôle
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return darkMode ? 'text-red-400' : 'text-red-600';
      case 'operator':
        return darkMode ? 'text-blue-400' : 'text-blue-600';
      case 'customer':
        return darkMode ? 'text-green-400' : 'text-green-600';
      default:
        return darkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  // Obtenir le libellé du rôle
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'operator': return 'Opérateur';
      case 'customer': return 'Client';
      default: return 'Utilisateur';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode 
        ? 'dark bg-gray-900 text-gray-100' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b transition-colors ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      } shadow-sm`}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et Bouton Menu Mobile */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-md transition-colors lg:hidden ${
                  darkMode 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                }`}
                aria-label="Ouvrir le menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              
              <div className="flex items-center ml-4 lg:ml-0">
                <div className={`p-2 rounded-lg ${
                  darkMode ? 'bg-blue-900' : 'bg-blue-100'
                }`}>
                  <Car className={`w-6 h-6 ${
                    darkMode ? 'text-blue-300' : 'text-blue-600'
                  }`} />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold">SmartPark</h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {getRoleLabel(userRole)}
                  </p>
                </div>
              </div>
            </div>

            {/* Barre de Recherche (Desktop) */}
            <div className="flex-1 hidden max-w-md mx-8 md:block">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:ring-2 focus:outline-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>

            {/* Actions Utilisateur */}
            <div className="flex items-center space-x-3">
              {/* Bouton Mode Sombre/Clair */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'text-yellow-400 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Bouton Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2 rounded-lg transition-colors relative ${
                    darkMode 
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Dropdown Notifications */}
                {isNotificationsOpen && (
                  <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <div className={`p-4 border-b ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        <span className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {unreadNotifications} non lues
                        </span>
                      </div>
                    </div>
                    
                    <div className="overflow-y-auto max-h-96">
                      {notifications.length === 0 ? (
                        <div className={`p-4 text-center ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Aucune notification</p>
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <div 
                            key={notification.id}
                            className={`p-4 border-b cursor-pointer transition-colors ${
                              darkMode 
                                ? 'border-gray-700 hover:bg-gray-750' 
                                : 'border-gray-100 hover:bg-gray-50'
                            } ${!notification.read ? (
                              darkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50'
                            ) : ''}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <Bell className={`w-4 h-4 mt-0.5 ${
                                notification.read 
                                  ? (darkMode ? 'text-gray-500' : 'text-gray-400')
                                  : 'text-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${
                                  darkMode ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                  {notification.title}
                                </p>
                                <p className={`text-sm mt-1 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {notification.message}
                                </p>
                                <p className={`text-xs mt-1 ${
                                  darkMode ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  {formatNotificationTime(notification.timestamp)}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className={`w-2 h-2 rounded-full ${
                                  darkMode ? 'bg-blue-400' : 'bg-blue-500'
                                }`} />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className={`p-2 ${
                      darkMode ? 'bg-gray-750' : 'bg-gray-50'
                    }`}>
                      <button 
                        onClick={() => {
                          if (userRole === 'admin') {
                            handlePageChange('notifications');
                          }
                          setIsNotificationsOpen(false);
                        }}
                        className={`w-full text-center py-2 text-sm rounded transition-colors ${
                          userRole !== 'admin' ? 'opacity-50 cursor-not-allowed' :
                          darkMode 
                            ? 'text-blue-400 hover:text-blue-300' 
                            : 'text-blue-600 hover:text-blue-700'
                        }`}
                        disabled={userRole !== 'admin'}
                      >
                        {userRole === 'admin' ? 'Voir toutes les notifications' : 'Centre de notifications (Admin seulement)'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Utilisateur */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'hover:bg-gray-700' 
                      : 'hover:bg-gray-100'
                  }`}
                  aria-label="Menu utilisateur"
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    userRole === 'admin' ? (darkMode ? 'bg-red-900' : 'bg-red-100') :
                    userRole === 'operator' ? (darkMode ? 'bg-blue-900' : 'bg-blue-100') :
                    darkMode ? 'bg-green-900' : 'bg-green-100'
                  }`}>
                    <User className={`w-4 h-4 ${
                      userRole === 'admin' ? (darkMode ? 'text-red-300' : 'text-red-600') :
                      userRole === 'operator' ? (darkMode ? 'text-blue-300' : 'text-blue-600') :
                      darkMode ? 'text-green-300' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="hidden text-left md:block">
                    <p className={`text-sm font-medium ${
                      darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {displayName}
                    </p>
                    <p className={`text-xs ${getRoleColor(userRole)}`}>
                      {getRoleLabel(userRole)}
                    </p>
                  </div>
                </button>

                {/* Dropdown Utilisateur */}
                {isUserMenuOpen && (
                  <div className={`absolute right-0 mt-2 w-64 rounded-lg shadow-lg border transition-all duration-200 ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}>
                    {/* En-tête Profil */}
                    <div className={`p-4 border-b ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          userRole === 'admin' ? (darkMode ? 'bg-red-900' : 'bg-red-100') :
                          userRole === 'operator' ? (darkMode ? 'bg-blue-900' : 'bg-blue-100') :
                          darkMode ? 'bg-green-900' : 'bg-green-100'
                        }`}>
                          <User className={`w-5 h-5 ${
                            userRole === 'admin' ? (darkMode ? 'text-red-300' : 'text-red-600') :
                            userRole === 'operator' ? (darkMode ? 'text-blue-300' : 'text-blue-600') :
                            darkMode ? 'text-green-300' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <p className={`font-medium ${
                            darkMode ? 'text-gray-200' : 'text-gray-900'
                          }`}>
                            {displayName}
                          </p>
                          <p className={`text-sm ${getRoleColor(userRole)} font-medium`}>
                            {getRoleLabel(userRole)}
                          </p>
                          <p className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Utilisateur */}
                    <div className="p-2">
                      <button className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                        darkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                        <User className="w-4 h-4 mr-3" />
                        Mon Profil
                      </button>
                      
                      {userRole === 'admin' && (
                        <button 
                          onClick={() => handlePageChange('settings')}
                          className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                            darkMode 
                              ? 'text-gray-300 hover:bg-gray-700' 
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Paramètres
                        </button>
                      )}
                      
                      <button className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                        darkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                        <Shield className="w-4 h-4 mr-3" />
                        Sécurité
                      </button>
                      <button className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                        darkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}>
                        <HelpCircle className="w-4 h-4 mr-3" />
                        Aide & Support
                      </button>
                    </div>

                    {/* Séparateur */}
                    <div className={`border-t ${
                      darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`} />

                    {/* Déconnexion */}
                    <div className="p-2">
                      <button
                        onClick={handleLogout}
                        className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                          darkMode 
                            ? 'text-red-400 hover:bg-red-900 hover:bg-opacity-20' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Se Déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav 
          ref={mobileMenuRef}
          className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } ${
            darkMode 
              ? 'bg-gray-800 border-r border-gray-700' 
              : 'bg-white border-r border-gray-200'
          } shadow-sm min-h-screen`}
        >
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4">
              {/* Barre de Recherche Mobile */}
              <div className="mb-6 md:hidden">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:ring-2 focus:outline-none ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Navigation par Catégories */}
              <div className="space-y-6">
                {Object.entries(menuItemsByCategory).map(([category, items]) => (
                  <div key={category}>
                    <h3 className={`px-3 mb-2 text-xs font-semibold uppercase tracking-wider ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {getCategoryLabel(category)}
                    </h3>
                    <ul className="space-y-1">
                      {items.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = currentPage === item.id;
                        
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => handlePageChange(item.id)}
                              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                isActive
                                  ? darkMode
                                    ? 'bg-blue-900 text-blue-100 shadow-lg shadow-blue-900/30'
                                    : 'bg-blue-50 text-blue-700 shadow-lg shadow-blue-100 border-r-2 border-blue-600'
                                  : darkMode
                                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <IconComponent className={`w-5 h-5 mr-3 transition-transform ${
                                isActive ? 'scale-110' : ''
                              }`} />
                              {item.label}
                              {isActive && (
                                <div className={`ml-auto w-2 h-2 rounded-full ${
                                  darkMode ? 'bg-blue-400' : 'bg-blue-600'
                                }`} />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Version et Statut */}
            <div className={`p-4 border-t ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`p-3 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      SmartPark v2.1.0
                    </p>
                    <p className={`text-xs ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      ● Système en ligne
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    darkMode ? 'bg-green-400' : 'bg-green-500'
                  }`} />
                </div>
                <p className={`text-xs mt-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Connecté en tant que {getRoleLabel(userRole)}
                </p>
              </div>
            </div>
          </div>
        </nav>

        {/* Overlay Mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          isMobileMenuOpen ? 'lg:ml-0' : 'lg:ml-0'
        }`}>
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;