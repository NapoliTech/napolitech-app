import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restaurar sessao ao iniciar o app
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const result = await authService.restoreSession();
      if (result.success) {
        setUser(result.user);
        setToken(result.token);
      }
    } catch (error) {
      console.error('Erro ao restaurar sessao:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        setUser(response.user);
        setToken(response.token);
      }

      return response;
    } catch (error) {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);

      if (response.success) {
        setUser(response.user);
        setToken(response.token);
      }

      return response;
    } catch (error) {
      return { success: false, error: 'Erro ao conectar com o servidor' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser(prev => ({
      ...prev,
      ...updatedUserData,
    }));
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isInitialized,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export default AuthContext;
