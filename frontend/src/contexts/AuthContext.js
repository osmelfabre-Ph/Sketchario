import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const AuthContext = createContext(null);

function getStoredToken() {
  return localStorage.getItem('sk_token') || null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState(getStoredToken);

  const setToken = useCallback((t) => {
    if (t) localStorage.setItem('sk_token', t);
    else localStorage.removeItem('sk_token');
    setTokenState(t);
  }, []);

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: API, withCredentials: true });
    instance.interceptors.request.use((config) => {
      const t = localStorage.getItem('sk_token');
      if (t) config.headers.Authorization = `Bearer ${t}`;
      return config;
    });
    instance.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          try {
            const { data } = await axios.post(`${API}/auth/refresh`, {}, { withCredentials: true });
            if (data.access_token) {
              localStorage.setItem('sk_token', data.access_token);
              setTokenState(data.access_token);
              error.config.headers.Authorization = `Bearer ${data.access_token}`;
              return instance(error.config);
            }
          } catch {
            setUser(null);
            setToken(null);
          }
        }
        return Promise.reject(error);
      }
    );
    return instance;
  }, [setToken]);

  useEffect(() => {
    const t = localStorage.getItem('sk_token');
    if (!t) { setLoading(false); return; }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => { setUser(null); setToken(null); })
      .finally(() => setLoading(false));
  }, [api, setToken]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.access_token) setToken(data.access_token);
    setUser(data.user);
    return data;
  }, [api, setToken]);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.access_token) setToken(data.access_token);
    setUser(data.user);
    return data;
  }, [api, setToken]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    setUser(null);
    setToken(null);
  }, [api, setToken]);

  const updateProfile = useCallback(async (updates) => {
    const { data } = await api.put('/profile', updates);
    setUser(data);
    return data;
  }, [api]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, api, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
