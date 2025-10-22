// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { mongoService } from '../../config/mongodb';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'customer';
  status: 'active' | 'inactive' | 'suspended';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          
          // Vérifier que l'utilisateur existe toujours dans MongoDB
          const currentUser = await mongoService.findOne('users', { id: user.id });
          
          if (currentUser && currentUser.status === 'active') {
            setAuthState({
              user: currentUser,
              token,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            // Utilisateur supprimé ou désactivé
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            setAuthState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('❌ Erreur vérification auth:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_data', JSON.stringify(userData));
    
    setAuthState({
      user: userData,
      token,
      isAuthenticated: true,
      isLoading: false
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const updateUser = (updates: Partial<User>) => {
    if (authState.user) {
      const updatedUser = { ...authState.user, ...updates };
      setAuthState(prev => ({ ...prev, user: updatedUser }));
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
    }
  };

  return {
    ...authState,
    login,
    logout,
    updateUser
  };
};