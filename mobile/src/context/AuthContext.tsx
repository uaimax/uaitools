/**
 * Context de autenticação
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '@/types';
import { login as apiLogin, register as apiRegister, getProfile } from '@/services/api/auth';
import {
  saveAuthTokens,
  getAuthTokens,
  clearAuthTokens,
  hasValidTokens,
} from '@/services/storage/secure';
import { saveWorkspaceId, getWorkspaceId } from '@/services/storage/async';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica autenticação ao iniciar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const hasValid = await hasValidTokens();

      if (hasValid) {
        // Busca perfil do usuário
        const userData = await getProfile();
        setUser(userData);

        // Salva workspace ID se disponível
        if (userData.workspace?.id) {
          await saveWorkspaceId(userData.workspace.id);
        }
      }
    } catch (error: any) {
      console.error('Erro ao verificar autenticação:', error);
      // #region agent log
      console.log('[DEBUG AUTH] Token validation failed, clearing tokens', {
        errorMessage: error.message,
        errorCode: error.response?.status,
        errorData: error.response?.data
      });
      // #endregion
      // Limpa tokens inválidos e garante que user é null
      await clearAuthTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiLogin(credentials);

      // Salva tokens
      const tokens = {
        accessToken: response.access,
        refreshToken: response.access, // TODO: Backend deve retornar refresh token
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutos (temporário)
      };
      await saveAuthTokens(tokens);

      // Salva workspace ID
      if (response.user.workspace?.id) {
        await saveWorkspaceId(response.user.workspace.id);
      }

      setUser(response.user);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await apiRegister(data);

      // Salva tokens
      const tokens = {
        accessToken: response.access,
        refreshToken: response.access, // TODO: Backend deve retornar refresh token
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutos (temporário)
      };
      await saveAuthTokens(tokens);

      // Salva workspace ID
      if (response.user.workspace?.id) {
        await saveWorkspaceId(response.user.workspace.id);
      }

      setUser(response.user);
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearAuthTokens();
      await saveWorkspaceId(''); // Limpa workspace
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

