import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'operator' | 'customer';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Vérification des rôles
    if (requiredRole) {
      const roleHierarchy = {
        'customer': 1,
        'operator': 2,
        'admin': 3
      };

      if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
        // Redirection selon le rôle de l'utilisateur
        switch (user.role) {
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
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
}