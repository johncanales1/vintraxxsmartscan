'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface AdminUser {
  id: string;
  email: string;
}

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setAdmin: (admin: AdminUser) => void;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('admin_token');
    if (stored) {
      setTokenState(stored);
      api.getProfile()
        .then((res) => setAdmin(res.admin))
        .catch(() => {
          localStorage.removeItem('admin_token');
          setTokenState(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('admin_token', res.token);
    setTokenState(res.token);
    setAdmin(res.admin);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setTokenState(null);
    setAdmin(null);
  };

  const setToken = (t: string) => {
    localStorage.setItem('admin_token', t);
    setTokenState(t);
  };

  return (
    <AuthContext.Provider value={{ admin, token, isLoading, login, logout, setAdmin, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
