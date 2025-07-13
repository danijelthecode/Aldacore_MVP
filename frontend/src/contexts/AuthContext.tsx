import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, UserCreate } from '../types';
import { authService, handleApiError, ApiError } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.login(credentials);
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserCreate): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.register(userData);
      
      // Automatically log in after registration
      await login({
        email: userData.email,
        password: userData.password
      });
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const clearError = (): void => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!user && authService.isAuthenticated(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;