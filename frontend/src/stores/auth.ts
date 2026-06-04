'use client';
import { create } from 'zustand';
import { authApi, User } from '@/lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  restore: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  async login(phone, password) {
    const { token, user } = await authApi.login(phone, password);
    localStorage.setItem('token', token);
    set({ user });
    return user;
  },
  async register(data) {
    const { token, user } = await authApi.register(data);
    localStorage.setItem('token', token);
    set({ user });
    return user;
  },
  logout() {
    localStorage.removeItem('token');
    set({ user: null });
  },
  async restore() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { set({ loading: false }); return; }
    try {
      const user = await authApi.me();
      set({ user, loading: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, loading: false });
    }
  },
}));
