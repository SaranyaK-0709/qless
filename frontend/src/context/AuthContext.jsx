import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('qless_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('qless_token'));
  const [loading, setLoading] = useState(true);

  // Restore session on startup
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('qless_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error('Session restore failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('qless_token', res.data.token);
        localStorage.setItem('qless_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch (err) {
      throw err.response?.data?.message || 'Login failed. Please try again.';
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, phone });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('qless_token', res.data.token);
        localStorage.setItem('qless_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch (err) {
      throw err.response?.data?.message || 'Registration failed.';
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('qless_token');
    localStorage.removeItem('qless_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
