import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ParkingMap from './components/ParkingMap';
import Sessions from './components/Sessions';
import Payments from './components/Payments';
import Reports from './components/Reports';
import Users from './components/Users';
import Settings from './components/Settings';
import Notifications from './components/Notifications';
import AIModule from './components/AIModule';
import MobileApp from './components/MobileApp';
import Wallet from './components/Wallet';
import History from './components/History';

// Types pour l'authentification
type UserRole = 'admin' | 'operator' | 'customer';

interface UserData {
  role: UserRole;
  name?: string;
  email?: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  userRole?: UserRole | null;
}

// Composant pour protéger les routes selon le rôle
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  userRole 
}) => {
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // Vérification des rôles
  if (requiredRole) {
    const roleHierarchy = {
      'customer': 1,
      'operator': 2,
      'admin': 3
    };

    const userRoleLevel = roleHierarchy[userRole] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      // Redirection selon le rôle de l'utilisateur
      switch (userRole) {
        case 'customer':
          return <Navigate to="/parking" replace />;
        case 'operator':
          return <Navigate to="/sessions" replace />;
        case 'admin':
          return <Navigate to="/dashboard" replace />;
        default:
          return <Navigate to="/parking" replace />;
      }
    }
  }

  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userDataString = localStorage.getItem('user');
      
      if (token && userDataString) {
        try {
          const user = JSON.parse(userDataString);
          setIsAuthenticated(true);
          setUserRole(user.role);
          setUserData(user);
        } catch (error) {
          console.error('Erreur lors du parsing des données utilisateur:', error);
          handleSignOut();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Fonction pour gérer la connexion réussie
  const handleLoginSuccess = (token: string, userData: UserData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUserRole(userData.role);
    setUserData(userData);
  };

  // Fonction pour gérer la déconnexion
  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserRole(null);
    setUserData(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Route pour la page de connexion */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            <Navigate to={
              userRole === 'admin' ? "/dashboard" :
              userRole === 'operator' ? "/sessions" : "/parking"
            } replace /> : 
            <Login onLoginSuccess={handleLoginSuccess} />
          } 
        />
        
        {/* Routes protégées avec Layout */}
        <Route 
          path="/" 
          element={
            isAuthenticated && userRole ? (
              <Layout 
                onSignOut={handleSignOut} 
                userRole={userRole}
                userData={userData}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* Route par défaut - redirection intelligente selon le rôle */}
          <Route 
            index 
            element={
              userRole === 'admin' ? <Navigate to="/dashboard" replace /> :
              userRole === 'operator' ? <Navigate to="/sessions" replace /> :
              <Navigate to="/parking" replace />
            } 
          />
          
          {/* Routes enfants du Layout avec protection par rôle */}
          
          {/* Dashboard - Admin seulement */}
          <Route 
            path="dashboard" 
            element={
              <ProtectedRoute requiredRole="admin" userRole={userRole}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Parking - Tous les rôles */}
          <Route 
            path="parking" 
            element={
              <ProtectedRoute userRole={userRole}>
                <ParkingMap />
              </ProtectedRoute>
            } 
          />
          
          {/* Sessions - Admin et Operator seulement */}
          <Route 
            path="sessions" 
            element={
              <ProtectedRoute requiredRole="operator" userRole={userRole}>
                <Sessions />
              </ProtectedRoute>
            } 
          />
          
          {/* Paiements - Admin et Operator seulement */}
          <Route 
            path="payments" 
            element={
              <ProtectedRoute requiredRole="operator" userRole={userRole}>
                <Payments />
              </ProtectedRoute>
            } 
          />
          
          {/* Rapports - Admin seulement */}
          <Route 
            path="reports" 
            element={
              <ProtectedRoute requiredRole="admin" userRole={userRole}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          
          {/* Utilisateurs - Admin seulement */}
          <Route 
            path="users" 
            element={
              <ProtectedRoute requiredRole="admin" userRole={userRole}>
                <Users />
              </ProtectedRoute>
            } 
          />
          
          {/* Paramètres - Admin seulement */}
          <Route 
            path="settings" 
            element={
              <ProtectedRoute requiredRole="admin" userRole={userRole}>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* Notifications - Admin seulement */}
          <Route 
            path="notifications" 
            element={
              <ProtectedRoute requiredRole="admin" userRole={userRole}>
                <Notifications />
              </ProtectedRoute>
            } 
          />
          
          {/* IA - Admin seulement */}
          <Route 
            path="ai" 
            element={
              <ProtectedRoute requiredRole="admin" userRole={userRole}>
                <AIModule />
              </ProtectedRoute>
            } 
          />
          
          {/* Application Mobile - Admin seulement */}
          <Route 
            path="mobile" 
            element={
              <ProtectedRoute requiredRole="admin" userRole={userRole}>
                <MobileApp />
              </ProtectedRoute>
            } 
          />
          
          {/* Portefeuille - Client seulement */}
          <Route 
            path="wallet" 
            element={
              <ProtectedRoute requiredRole="customer" userRole={userRole}>
                <Wallet />
              </ProtectedRoute>
            } 
          />
          
          {/* Historique - Client seulement */}
          <Route 
            path="history" 
            element={
              <ProtectedRoute requiredRole="customer" userRole={userRole}>
                <History />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Redirection pour toutes les autres routes */}
        <Route 
          path="*" 
          element={
            <Navigate to={
              isAuthenticated && userRole ? 
                (userRole === 'admin' ? "/dashboard" : 
                 userRole === 'operator' ? "/sessions" : "/parking") 
                : "/login"
            } replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;