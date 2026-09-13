import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/database';
import { DEFAULT_ADMIN_PROFILE, DEFAULT_USER_PROFILE } from '../lib/mockData';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    referralCode?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: 'user' | 'admin') => void;
  updateProfile: (data: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'watchearn_active_user_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    // Fresh visitors start logged out
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // Login
  const login = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    // If live Supabase is configured, use official SDK
    if (isLiveSupabaseConfigured && _password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: _password,
        });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          // fetch profile
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
          if (profile) {
            setUser(profile);
            return { success: true };
          }
        }
      } catch (err: any) {
        console.warn('Supabase live auth error, using fallback:', err.message);
      }
    }

    // Local / Sandbox Auth
    if (email.toLowerCase().includes('admin')) {
      setUser(DEFAULT_ADMIN_PROFILE);
      return { success: true };
    } else {
      const existingUser: Profile = {
        id: `usr-${Date.now()}`,
        email,
        full_name: email.split('@')[0].toUpperCase(),
        phone: '03001234567',
        role: 'user',
        status: 'active',
        referral_code: 'REF' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUser(existingUser);
      return { success: true };
    }
  };

  // Register
  const register = async (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    referralCode?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (isLiveSupabaseConfigured && data.password) {
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              phone: data.phone,
              referral_code: data.referralCode,
            },
          },
        });
        if (error) return { success: false, error: error.message };
        if (authData.user) {
          const newProfile: Profile = {
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone,
            role: 'user',
            status: 'active',
            referral_code: 'WE' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setUser(newProfile);
          return { success: true };
        }
      } catch (err: any) {
        console.warn('Supabase live signup error, using fallback:', err.message);
      }
    }

    // Sandbox registration
    const newProfile: Profile = {
      id: `usr-${Date.now()}`,
      email: data.email,
      full_name: data.fullName,
      phone: data.phone,
      role: 'user',
      status: 'active',
      referral_code: 'WE' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      referred_by: data.referralCode ? 'referrer-uuid' : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUser(newProfile);
    return { success: true };
  };

  const logout = () => {
    if (isLiveSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
    setUser(null);
  };

  const switchRole = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      setUser(DEFAULT_ADMIN_PROFILE);
    } else {
      setUser(DEFAULT_USER_PROFILE);
    }
  };

  const updateProfile = (data: Partial<Profile>) => {
    if (!user) return;
    setUser({ ...user, ...data, updated_at: new Date().toISOString() });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'user',
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.role === 'manager',
        login,
        register,
        logout,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
