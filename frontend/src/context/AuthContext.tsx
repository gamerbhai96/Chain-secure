/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/api';
import { ChainSecureAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('chainsecure_token');
    if (savedToken) {
      setToken(savedToken);
      ChainSecureAPI.getProfile()
        .then(({ user }) => setUser(user))
        .catch(() => {
          localStorage.removeItem('chainsecure_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await ChainSecureAPI.login({ email, password });
    localStorage.setItem('chainsecure_token', res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await ChainSecureAPI.register({ name, email, password });
    localStorage.setItem('chainsecure_token', res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('chainsecure_token');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: { name?: string }) => {
    const res = await ChainSecureAPI.updateProfile(data);
    setUser(res.user);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, loading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
