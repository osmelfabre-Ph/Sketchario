import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('sk_token'));

  const authAxios = useCallback(() => {
    const instance = axios.create({ baseURL: API, withCredentials: true });
    if (token) instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return instance;
  }, [token]);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await authAxios().get('/auth/me');
      setUser(data.user);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('sk_token');
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const { data } = await authAxios().post('/auth/login', { email, password });
    if (data.access_token) {
      localStorage.setItem('sk_token', data.access_token);
      setToken(data.access_token);
    }
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await authAxios().post('/auth/register', { name, email, password });
    if (data.access_token) {
      localStorage.setItem('sk_token', data.access_token);
      setToken(data.access_token);
    }
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await authAxios().post('/auth/logout'); } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('sk_token');
  };

  const updateProfile = async (updates) => {
    const { data } = await authAxios().put('/profile', updates);
    setUser(data);
    return data;
  };

  const api = authAxios();

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, api, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
