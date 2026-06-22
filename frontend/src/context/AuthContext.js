'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/communityApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await apiRequest('me.php');
        setUser(result.user);
        const csrf = await apiRequest('csrf.php');
        sessionStorage.setItem('jhatpatai_csrf', csrf.csrf_token);
      } catch {
        setUser(null);
        sessionStorage.removeItem('jhatpatai_csrf');
      } finally { setLoading(false); }
    })();
  }, []);

  const login = (userData, csrfToken) => {
    setUser(userData);
    if (csrfToken) sessionStorage.setItem('jhatpatai_csrf', csrfToken);
  };

  const logout = async () => {
    try { await apiRequest('logout.php', { method: 'POST', body: '{}' }); } catch {}
    setUser(null);
    sessionStorage.removeItem('jhatpatai_csrf');
    window.location.href = '/login';
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
