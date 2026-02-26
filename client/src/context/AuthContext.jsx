import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api.js';

const AuthContext = createContext(null);

const TOKEN_KEY = 'gift_token';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isTokenExpired = (token) => {
  try {
    const { exp } = jwtDecode(token);
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
};

// JWT payload shape: { id, name, email, walletAddress, iat, exp }
const decodeUser = (token) => {
  try {
    const { id, name, email, walletAddress, exp } = jwtDecode(token);
    return { id, name, email, walletAddress: walletAddress ?? null, exp };
  } catch {
    return null;
  }
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persist token + user state helpers
  const persist = useCallback((rawToken, userData) => {
    localStorage.setItem(TOKEN_KEY, rawToken);
    setToken(rawToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && !isTokenExpired(stored)) {
      const decoded = decodeUser(stored);
      setToken(stored);
      setUser(decoded);
    } else if (stored) {
      // Token present but expired — clean up
      logout();
    }
    setLoading(false);
  }, [logout]);

  // ─── Auth actions ───────────────────────────────────────────────────────────

  const register = async (name, email, password) => {
    const { data } = await api.post('/api/auth/register', { name, email, password });
    persist(data.token, data.user);
    return data;
  };

  const login = async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    persist(data.token, data.user);
    return data;
  };

  const web3Login = async (address, signature) => {
    const { data } = await api.post('/api/auth/web3', { address, signature });
    persist(data.token, data.user);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, web3Login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export default AuthContext;
