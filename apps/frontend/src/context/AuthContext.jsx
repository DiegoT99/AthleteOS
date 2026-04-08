import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('athleteos_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/api/auth/me');
        setUser(data);
      } catch {
        localStorage.removeItem('athleteos_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token]);

  const login = async (payload) => {
    const { data } = await api.post('/api/auth/login', payload);
    localStorage.setItem('athleteos_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/api/auth/register', payload);
    localStorage.setItem('athleteos_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // no-op
    }
    localStorage.removeItem('athleteos_token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
      setUser,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
