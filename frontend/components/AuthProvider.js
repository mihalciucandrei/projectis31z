'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export default function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [favIds, setFavIds] = useState(new Set());
  const [unread, setUnread] = useState(0);

  const loadUserData = useCallback(async () => {
    const [fav, un] = await Promise.all([api.get('/favorites/ids'), api.get('/messages/unread-count')]);
    setFavIds(new Set(fav.data));
    setUnread(un.data.count);
  }, []);

  const refreshUnread = useCallback(async () => {
    try { setUnread((await api.get('/messages/unread-count')).data.count); } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      if (localStorage.getItem('am_token')) {
        try {
          setUser((await api.get('/auth/me')).data);
          await loadUserData();
        } catch {
          localStorage.removeItem('am_token');
        }
      }
      setReady(true);
    })();
  }, [loadUserData]);

  useEffect(() => {
    if (!user) return;
    const t = setInterval(refreshUnread, 30000);
    return () => clearInterval(t);
  }, [user, refreshUnread]);

  const finish = async (data) => {
    localStorage.setItem('am_token', data.access_token);
    setUser(data.user);
    await loadUserData();
    return data.user;
  };

  const login = async (email, password) => {
    const body = new URLSearchParams({ username: email, password });
    return finish((await api.post('/auth/login', body)).data);
  };
  const register = async (payload) => finish((await api.post('/auth/register', payload)).data);

  const logout = () => {
    localStorage.removeItem('am_token');
    setUser(null);
    setFavIds(new Set());
    setUnread(0);
    router.push('/');
  };

  const toggleFavorite = async (carId) => {
    if (!user) return router.push('/login');
    const has = favIds.has(carId);
    const next = new Set(favIds);
    has ? next.delete(carId) : next.add(carId);
    setFavIds(next);
    try {
      await (has ? api.delete(`/favorites/${carId}`) : api.post(`/favorites/${carId}`));
    } catch {
      setFavIds(favIds);
    }
  };

  return (
    <Ctx.Provider value={{ user, ready, favIds, unread, login, register, logout, toggleFavorite, refreshUnread }}>
      {children}
    </Ctx.Provider>
  );
}

/** Редиректит на /login, если пользователь не вошёл или роль не подходит. */
export function useRequireAuth(roles) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const allowed = !!user && (!roles || roles.includes(user.role));
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
    else if (!allowed) router.replace('/');
  }, [ready, user, allowed, router]);
  return { user, ready: ready && allowed };
}
