import { createContext, useContext, useState, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        setUser(response.user);
        setToken(response.token);
        // TODO: Salvar token no AsyncStorage para persistência
        // await AsyncStorage.setItem('token', response.token);
        // await AsyncStorage.setItem('user', JSON.stringify(response.user));
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
        // TODO: Salvar token no AsyncStorage para persistência
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
      // TODO: Limpar AsyncStorage
      // await AsyncStorage.removeItem('token');
      // await AsyncStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
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
