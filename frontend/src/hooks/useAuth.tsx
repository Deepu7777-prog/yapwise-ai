import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import React from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, targetRole?: string, experienceLevel?: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('yapwise_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('yapwise_token');
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const u = await api.getCurrentUser();
      setUser(u);
      setToken(savedToken);
    } catch (err) {
      console.warn('Stored token is invalid or expired:', err);
      localStorage.removeItem('yapwise_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    localStorage.setItem('yapwise_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    targetRole?: string,
    experienceLevel?: string
  ) => {
    const res = await api.register({
      email,
      password,
      full_name: fullName,
      target_role: targetRole,
      experience_level: experienceLevel,
    });
    localStorage.setItem('yapwise_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const loginDemo = async () => {
    try {
      await login('demo@yapwise.ai', 'demopassword123');
    } catch {
      // If demo user was not created yet, create it via register
      try {
        await register('demo@yapwise.ai', 'demopassword123', 'Alex Mercer', 'Senior Full-Stack Engineer', 'Senior');
      } catch (regErr) {
        // Fallback retry login in case of race condition
        await login('demo@yapwise.ai', 'demopassword123');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('yapwise_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginDemo,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
