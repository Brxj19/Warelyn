import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import * as authService from '../services/authService.js';

const ACCESS_TOKEN_KEY = 'warelyn.accessToken';
const REFRESH_TOKEN_KEY = 'warelyn.refreshToken';

const AuthContext = createContext(null);

function readStoredTokens() {
  return {
    accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

function storeTokens(accessToken, refreshToken) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [accessToken, setAccessToken] = useState(() => readStoredTokens().accessToken);
  const [refreshToken, setRefreshToken] = useState(() => readStoredTokens().refreshToken);
  const [isLoading, setIsLoading] = useState(Boolean(readStoredTokens().accessToken));

  async function loadMe(token = accessToken) {
    if (!token) {
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const data = await authService.getMe(token);
      setUser(data.user);
      setTenant(data.tenant);
      return data;
    } catch (error) {
      clearTokens();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setTenant(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function login(payload) {
    const data = await authService.login(payload);
    storeTokens(data.access_token, data.refresh_token);
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser(data.user);
    setTenant(data.tenant);
    return data;
  }

  async function register(payload) {
    return authService.register(payload);
  }

  async function logout() {
    const tokenToRevoke = refreshToken;
    clearTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setTenant(null);
    if (tokenToRevoke) {
      try {
        await authService.logout(tokenToRevoke);
      } catch {
        // Local logout should still complete if the server token is already invalid.
      }
    }
  }

  useEffect(() => {
    if (accessToken) {
      loadMe(accessToken).catch(() => undefined);
    } else {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      tenant,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(user && accessToken),
      isLoading,
      login,
      register,
      logout,
      loadMe,
    }),
    [user, tenant, accessToken, refreshToken, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
