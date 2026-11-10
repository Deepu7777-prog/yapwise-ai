import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Profile } from '../lib/types';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Profile | null>;
  register: (email: string, password: string, fullName: string) => Promise<Profile | null>;
  loginWithGoogle: (email: string, fullName?: string, credential?: string) => Promise<Profile | null>;
  logout: () => void;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    try {
      const p = await api.profile.get();
      setProfile(p);
      return p;
    } catch (err) {
      console.warn('Could not refresh profile:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    async function initAuth() {
      const currentToken = getStoredToken();
      if (!currentToken) {
        setIsLoading(false);
        return;
      }

      try {
        const [meUser, prof] = await Promise.all([
          api.auth.me(),
          api.profile.get().catch(() => null),
        ]);
        setUser(meUser);
        setProfile(prof);
        setToken(currentToken);
      } catch (err) {
        console.warn('Failed to restore session:', err);
        removeStoredToken();
        setToken(null);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<Profile | null> => {
    const res = await api.auth.login({ email, password });
    setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    const prof = await refreshProfile();
    return prof;
  };

  const register = async (email: string, password: string, fullName: string): Promise<Profile | null> => {
    const res = await api.auth.register({ email, password, full_name: fullName });
    setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    const prof = await refreshProfile();
    return prof;
  };

  const loginWithGoogle = async (email: string, fullName?: string, credential?: string): Promise<Profile | null> => {
    const res = await api.auth.googleLogin({ email, full_name: fullName, credential });
    setStoredToken(res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    const prof = await refreshProfile();
    return prof;
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
