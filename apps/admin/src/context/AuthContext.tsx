import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Admin {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('masajid_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('masajid_token');
      const storedAdmin = localStorage.getItem('masajid_admin');

      if (storedToken && storedAdmin) {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin));
        try {
          const freshAdmin = await api.get('/auth/me');
          setAdmin(freshAdmin as any);
          localStorage.setItem('masajid_admin', JSON.stringify(freshAdmin));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('masajid_token');
          localStorage.removeItem('masajid_admin');
          setToken(null);
          setAdmin(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newAdmin: Admin) => {
    localStorage.setItem('masajid_token', newToken);
    localStorage.setItem('masajid_admin', JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
  };

  const logout = () => {
    localStorage.removeItem('masajid_token');
    localStorage.removeItem('masajid_admin');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, isLoading }}>
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
