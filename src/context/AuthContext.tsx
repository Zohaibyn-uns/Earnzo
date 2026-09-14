import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/database';
import { DEFAULT_ADMIN_PROFILE, DEFAULT_USER_PROFILE } from '../lib/mockData';
import { supabase, isLiveSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  role: UserRole;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isImpersonating: boolean;
  impersonatorAdmin: Profile | null;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    referralCode?: string;
  }) => Promise<{ success: boolean; error?: string; requireOtp?: boolean }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  resendEmailOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  impersonateUser: (targetUser: Profile) => Promise<{ success: boolean; error?: string }>;
  exitImpersonation: () => void;
  logout: () => void;
  switchRole: (role: 'user' | 'admin') => void;
  updateProfile: (data: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'watchearn_active_user_v3';
const IMPERSONATOR_STORAGE_KEY = 'earnzo_impersonator_admin_v3';

export const isValidUUID = (id?: string | null): boolean => {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [impersonatorAdmin, setImpersonatorAdmin] = useState<Profile | null>(() => {
    const saved = sessionStorage.getItem(IMPERSONATOR_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [user, setUser] = useState<Profile | null>(() => {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If live Supabase is configured, reject any non-UUID user from localStorage
        if (isLiveSupabaseConfigured) {
          if (parsed && isValidUUID(parsed.id)) {
            return parsed;
          }
          localStorage.removeItem(AUTH_STORAGE_KEY);
          return null;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    // Fresh visitors start logged out
    return null;
  });

  const syncUserFromSession = async (sessionUser: any) => {
    if (!sessionUser || !isValidUUID(sessionUser.id)) {
      setUser(null);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      const isDesignatedAdminEmail = (email?: string | null) =>
        Boolean(email && (email.toLowerCase() === 'admin@earnzo.com' || email.toLowerCase().endsWith('@earnzo.com')));

      if (profile) {
        if (isDesignatedAdminEmail(profile.email) && profile.role !== 'admin') {
          setUser({ ...profile, role: 'admin' });
        } else {
          setUser(profile);
        }
      } else {
        // Construct profile using real Supabase Auth UUID while DB trigger finalizes
        const effectiveRole = isDesignatedAdminEmail(sessionUser.email)
          ? 'admin'
          : ((sessionUser.user_metadata?.role as any) || 'user');

        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          full_name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'Member',
          phone: sessionUser.user_metadata?.phone || '',
          role: effectiveRole,
          status: 'active',
          referral_code: sessionUser.user_metadata?.referral_code || '',
          created_at: sessionUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to load profile for Supabase user:', err);
    }
  };

  // Supabase Auth Session Synchronization
  useEffect(() => {
    if (!isLiveSupabaseConfigured) return;

    // Purge any stale legacy demo user state
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed || !isValidUUID(parsed.id)) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
        }
      } catch (e) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    // 1. Initial Session Check on app mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        syncUserFromSession(session.user);
      }
    });

    // 2. Realtime Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await syncUserFromSession(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Realtime profile listener (Catches admin suspend/terminate/role changes instantly)
  useEffect(() => {
    if (!isLiveSupabaseConfigured || !user?.id || !isValidUUID(user.id)) return;

    const channel = supabase
      .channel(`earnzo-profile-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload?.new) {
            setUser((prev) => (prev ? { ...prev, ...payload.new } : (payload.new as Profile)));
          }
        }
      )
      .subscribe();

    const checkProfile = async () => {
      try {
        const { data: latestProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (latestProfile) {
          setUser((prev) => {
            if (!prev) return latestProfile;
            if (prev.status !== latestProfile.status || prev.role !== latestProfile.role) {
              return { ...prev, ...latestProfile };
            }
            return prev;
          });
        }
      } catch (e) {
        // silent
      }
    };

    window.addEventListener('focus', checkProfile);

    return () => {
      window.removeEventListener('focus', checkProfile);
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      // In live Supabase mode, only persist if user has a valid UUID
      if (isLiveSupabaseConfigured && !isValidUUID(user.id)) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } else {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      }
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  // Login
  const login = async (email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
    // If live Supabase is configured, use official SDK with zero mock fallback
    if (isLiveSupabaseConfigured) {
      if (!_password) {
        return { success: false, error: 'Password is required to sign in.' };
      }
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: _password,
        });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
          if (profile) {
            setUser(profile);
          } else {
            setUser({
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || email.split('@')[0],
              phone: data.user.user_metadata?.phone || '',
              role: (data.user.user_metadata?.role as any) || 'user',
              status: 'active',
              referral_code: data.user.user_metadata?.referral_code || '',
              created_at: data.user.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
          return { success: true };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Authentication failed' };
      }
    }

    // Local / Offline Sandbox Fallback only when Supabase is not configured
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
  }): Promise<{ success: boolean; error?: string; requireOtp?: boolean }> => {
    if (isLiveSupabaseConfigured) {
      if (!data.password) {
        return { success: false, error: 'Password is required to register.' };
      }
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
          const hasSession = Boolean(authData.session);
          const newProfile: Profile = {
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
            phone: data.phone,
            role: 'user',
            status: 'active',
            referral_code: data.referralCode || '',
            created_at: authData.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (hasSession) {
            setUser(newProfile);
          }

          // If no immediate session returned by Supabase, email OTP/confirmation is required
          return { success: true, requireOtp: !hasSession };
        }
      } catch (err: any) {
        return { success: false, error: err.message || 'Registration failed' };
      }
    }

    // Offline Sandbox registration
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
    return { success: true, requireOtp: false };
  };

  // Verify Email OTP
  const verifyEmailOtp = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
    if (isLiveSupabaseConfigured) {
      try {
        const cleanToken = token.trim();
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: cleanToken,
          type: 'signup',
        });

        if (error) {
          // Fallback to type 'email'
          const retry = await supabase.auth.verifyOtp({
            email,
            token: cleanToken,
            type: 'email',
          });
          if (retry.error) {
            return { success: false, error: retry.error.message || error.message };
          }
          if (retry.data?.user) {
            await syncUserFromSession(retry.data.user);
            return { success: true };
          }
        }

        if (data?.user) {
          await syncUserFromSession(data.user);
          return { success: true };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'OTP verification failed' };
      }
    }

    // Offline sandbox verification
    if (token.trim().length >= 4) {
      return { success: true };
    }
    return { success: false, error: 'Invalid verification code. Please enter valid digits.' };
  };

  // Resend Email OTP
  const resendEmailOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (isLiveSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to resend code' };
      }
    }
    return { success: true };
  };

  // Impersonate User ("Login as User")
  const impersonateUser = async (targetUser: Profile): Promise<{ success: boolean; error?: string }> => {
    const isActorAdmin =
      user?.role === 'admin' ||
      user?.role === 'manager' ||
      user?.email?.toLowerCase() === 'admin@earnzo.com' ||
      Boolean(user?.email?.toLowerCase().endsWith('@earnzo.com'));

    if (!isActorAdmin) {
      return { success: false, error: 'Unauthorized: Only platform administrators can enter user view mode.' };
    }

    if (targetUser.id === user?.id) {
      return { success: false, error: 'Cannot impersonate yourself.' };
    }

    if (
      targetUser.role === 'admin' ||
      targetUser.email.toLowerCase() === 'admin@earnzo.com' ||
      targetUser.email.toLowerCase().endsWith('@earnzo.com')
    ) {
      return { success: false, error: 'Security restriction: Cannot impersonate administrative accounts.' };
    }

    const currentAdmin = user;
    if (!currentAdmin) {
      return { success: false, error: 'Administrator authentication required.' };
    }
    sessionStorage.setItem(IMPERSONATOR_STORAGE_KEY, JSON.stringify(currentAdmin));
    setImpersonatorAdmin(currentAdmin);
    setUser(targetUser);

    // Record immutable audit log in database
    if (isLiveSupabaseConfigured) {
      supabase.from('audit_logs').insert({
        actor_id: currentAdmin.id,
        actor_email: currentAdmin.email,
        action: 'admin_impersonate_user',
        entity: 'profiles',
        entity_id: targetUser.id,
        details: {
          admin_id: currentAdmin.id,
          admin_email: currentAdmin.email,
          target_user_id: targetUser.id,
          target_user_email: targetUser.email,
          started_at: new Date().toISOString(),
        },
      }).then(() => {});
    }

    return { success: true };
  };

  // Exit Impersonation Mode
  const exitImpersonation = () => {
    if (!impersonatorAdmin) return;
    const admin = impersonatorAdmin;
    const targetUserId = user?.id;

    if (isLiveSupabaseConfigured) {
      supabase.from('audit_logs').insert({
        actor_id: admin.id,
        actor_email: admin.email,
        action: 'admin_exit_impersonation',
        entity: 'profiles',
        entity_id: targetUserId,
        details: {
          admin_id: admin.id,
          admin_email: admin.email,
          target_user_id: targetUserId,
          ended_at: new Date().toISOString(),
        },
      }).then(() => {});
    }

    sessionStorage.removeItem(IMPERSONATOR_STORAGE_KEY);
    setUser(admin);
    setImpersonatorAdmin(null);
  };

  const logout = () => {
    if (impersonatorAdmin) {
      exitImpersonation();
      return;
    }
    if (isLiveSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(IMPERSONATOR_STORAGE_KEY);
    setUser(null);
    setImpersonatorAdmin(null);
  };

  const switchRole = (role: 'user' | 'admin') => {
    if (isLiveSupabaseConfigured) {
      // In live Supabase mode, never inject fake IDs like 'user-usr-001'
      if (user && isValidUUID(user.id)) {
        setUser({ ...user, role });
      }
      return;
    }
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
        isAdmin:
          !impersonatorAdmin && (
            user?.role === 'admin' ||
            user?.role === 'manager' ||
            user?.email?.toLowerCase() === 'admin@earnzo.com' ||
            Boolean(user?.email?.toLowerCase().endsWith('@earnzo.com'))
          ),
        isImpersonating: Boolean(impersonatorAdmin),
        impersonatorAdmin,
        login,
        register,
        verifyEmailOtp,
        resendEmailOtp,
        impersonateUser,
        exitImpersonation,
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
