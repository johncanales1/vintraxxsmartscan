'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, UnauthorizedError } from './api';
import { gpsAdminWs } from './gpsAdminWs';

interface AdminUser {
  id: string;
  email: string;
  /**
   * True for the seeded super-admin. The backend gates destructive routes
   * (e.g. DELETE /admin/users/:id, DELETE /admin/gps/terminals/:id) behind
   * `requireSuperAdmin`, so the UI must hide those buttons for non-super
   * admins to avoid surprise 403s.
   */
  superAdmin?: boolean;
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
        .catch((err) => {
          // Only clear the token on a genuine auth failure. Network hiccups,
          // 5xx, or CORS preflight failures shouldn't force the admin to
          // log back in — the next request will retry naturally.
          if (err instanceof UnauthorizedError) {
            localStorage.removeItem('admin_token');
            setTokenState(null);
          }
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
    // Tear down the realtime socket BEFORE we drop the token so the close
    // frame can use the still-valid auth context if the server cares.
    gpsAdminWs.disconnect();
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
