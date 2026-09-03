import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { recordLoginSession, pingSession, terminateCurrentSession } from '../services/sessionService';

// Real production admin only
export const REAL_ADMIN: User = {
  id: 1,
  name: 'Zisan Ur Rahman',
  email: 'zisanurrahmanbd@gmail.com',
  role: 'admin',
  employee_id: 'ADMIN-001',
  phone: '01608800026',
  status: 'active',
  is_online: true,
  password: '@01608800026',
};

const USERS_VERSION = '7.0_supabase_cloud_sync';

function getInitialUsers(): User[] {
  const version = localStorage.getItem('recovery_users_version');
  if (version !== USERS_VERSION) {
    localStorage.removeItem('recovery_all_users');
    localStorage.setItem('recovery_users_version', USERS_VERSION);
    const initial = [REAL_ADMIN];
    localStorage.setItem('recovery_all_users', JSON.stringify(initial));
    return initial;
  }
  try {
    const saved = localStorage.getItem('recovery_all_users');
    if (saved) {
      const parsed: User[] = JSON.parse(saved);
      let foundAdmin = false;
      const updated = parsed.map(u => {
        if (u.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()) {
          foundAdmin = true;
          return {
            ...u,
            name: 'Zisan Ur Rahman',
            role: 'admin' as const,
            status: 'active' as const,
            password: u.password || '@01608800026',
          };
        }
        return u;
      });
      if (!foundAdmin) {
        updated.unshift(REAL_ADMIN);
      }
      localStorage.setItem('recovery_all_users', JSON.stringify(updated));
      return updated;
    }
  } catch (_) {}
  return [REAL_ADMIN];
}

interface OtpSession {
  code: string;
  email: string;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, pass: string) => Promise<{ result: 'ok' | 'otp_required' | 'error'; error?: string }>;
  verifyOtp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  pendingEmail: string | null;
  generateOtp: (email: string) => string;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => Promise<User>;
  updateUser: (id: number, user: Partial<User>) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  updateUserLocation: (lat: number, lng: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(getInitialUsers);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('recovery_auth_user');
      if (saved) {
        const parsed: User = JSON.parse(saved);
        if (parsed?.status === 'inactive') return null;
        if (parsed.email?.toLowerCase() === REAL_ADMIN.email.toLowerCase()) {
          parsed.role = 'admin';
        }
        return parsed;
      }
    } catch (_) {}
    return null;
  });

  const [otpSession, setOtpSession] = useState<OtpSession | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [verifiedDevices, setVerifiedDevices] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('recovery_verified_devices');
      return new Set(JSON.parse(saved || '[]'));
    } catch (_) { return new Set(); }
  });

  // ── Sync with Supabase on Startup ──────────────────────────────────────────
  useEffect(() => {
    const fetchCloudUsers = async () => {
      try {
        const { data, error } = await supabase.from('users').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          const cloudUsers: User[] = data.map((row: any) => ({
            id: Number(row.id),
            name: row.name || 'User',
            email: (row.email || '').toLowerCase(),
            phone: row.phone || '',
            employee_id: row.employee_id || '',
            role: (row.role || (row.email?.toLowerCase() === REAL_ADMIN.email ? 'admin' : 'agent')) as UserRole,
            status: row.status || 'active',
            password: row.password || (row.email?.toLowerCase() === REAL_ADMIN.email ? '@01608800026' : '@Pass2026'),
            last_latitude: row.last_latitude ? Number(row.last_latitude) : undefined,
            last_longitude: row.last_longitude ? Number(row.last_longitude) : undefined,
            last_ping_at: row.last_ping_at,
            is_online: row.is_online !== false,
          }));

          // Merge cloud users with local users
          setUsers(prev => {
            const map = new Map<string, User>();
            prev.forEach(u => map.set(u.email.toLowerCase(), u));
            cloudUsers.forEach(u => map.set(u.email.toLowerCase(), { ...map.get(u.email.toLowerCase()), ...u }));
            const merged = Array.from(map.values());
            localStorage.setItem('recovery_all_users', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn('Cloud user sync note:', err);
      }
    };
    fetchCloudUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem('recovery_all_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (user) {
      if (user.status === 'inactive') {
        setUser(null);
        localStorage.removeItem('recovery_auth_user');
      } else {
        const toSave = user.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()
          ? { ...user, role: 'admin' }
          : user;
        localStorage.setItem('recovery_auth_user', JSON.stringify(toSave));
      }
    } else {
      localStorage.removeItem('recovery_auth_user');
    }
  }, [user]);

  // ── Auto-record Device Login Session & Geolocation ─────────────────────────
  useEffect(() => {
    if (!user) return;
    recordLoginSession(user);
    const pingTimer = setInterval(() => {
      pingSession(user);
    }, 30_000);
    return () => clearInterval(pingTimer);
  }, [user?.id]);

  // ── Live Session Watchdog: Force-logout deactivated users within 30s ──────
  useEffect(() => {
    if (!user) return;
    // Primary admin can never be deactivated — skip watchdog
    if (user.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()) return;

    const watchdog = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, status')
          .eq('email', user.email.toLowerCase())
          .single();

        if (error) return; // network issue — keep session alive, retry next tick

        if (data?.status === 'inactive') {
          clearInterval(watchdog);
          localStorage.removeItem('recovery_auth_user');
          localStorage.removeItem('recovery_verified_devices');
          setUser(null);
          // Fire event so Login page can display a clear reason message
          window.dispatchEvent(new CustomEvent('account_deactivated', {
            detail: { message: 'Your account has been deactivated by an administrator. Please contact your manager.' }
          }));
        }
      } catch (_) {
        // Silently ignore network errors — do not terminate session on connectivity issues
      }
    }, 30_000); // Poll every 30 seconds

    return () => clearInterval(watchdog);
  }, [user]);

  const getLatestUsers = (): User[] => {
    try {
      const saved = localStorage.getItem('recovery_all_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(u => {
            if (u.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()) {
              return { ...u, role: 'admin' };
            }
            return u;
          });
        }
      }
    } catch (_) {}
    return users;
  };

  const updateUserLocation = useCallback((lat: number, lng: number) => {
    if (!user) return;
    const nowIso = new Date().toISOString();
    
    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === user.id) {
          return {
            ...u,
            last_latitude: lat,
            last_longitude: lng,
            last_ping_at: nowIso,
            is_online: true,
          };
        }
        return u;
      });
      localStorage.setItem('recovery_all_users', JSON.stringify(next));
      return next;
    });

    setUser(prev => prev ? {
      ...prev,
      last_latitude: lat,
      last_longitude: lng,
      last_ping_at: nowIso,
      is_online: true,
    } : null);

    // Sync location to Supabase
    try {
      supabase.from('users').update({
        last_latitude: lat,
        last_longitude: lng,
        last_ping_at: nowIso,
        is_online: true,
      }).eq('id', user.id).then();
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    if (!user) return;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateUserLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.warn('Geolocation initial ping:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (pos) => updateUserLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.warn('Geolocation watch ping:', err.message),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }
  }, [user?.id, updateUserLocation]);

  const generateOtp = (email: string): string => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const session: OtpSession = {
      code,
      email: email.toLowerCase(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    setOtpSession(session);
    setPendingEmail(email.toLowerCase());
    return code;
  };

  // ── Multi-Device Cross-Cloud Login ─────────────────────────────────────────
  const login = async (email: string, pass: string): Promise<{ result: 'ok' | 'otp_required' | 'error'; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    let list = getLatestUsers();
    let found = list.find(u => u.email.toLowerCase() === cleanEmail);

    // If not in local list, check Supabase cloud database immediately
    if (!found) {
      try {
        const { data, error } = await supabase.from('users').select('*').ilike('email', cleanEmail).maybeSingle();
        if (data && !error) {
          found = {
            id: Number(data.id),
            name: data.name || 'User',
            email: data.email.toLowerCase(),
            phone: data.phone || '',
            employee_id: data.employee_id || '',
            role: (data.role || (data.email.toLowerCase() === REAL_ADMIN.email ? 'admin' : 'agent')) as UserRole,
            status: data.status || 'active',
            password: data.password || '@Pass2026',
            last_latitude: data.last_latitude ? Number(data.last_latitude) : undefined,
            last_longitude: data.last_longitude ? Number(data.last_longitude) : undefined,
            last_ping_at: data.last_ping_at,
            is_online: data.is_online !== false,
          };
          // Save to local cache
          setUsers(prev => {
            const next = [found!, ...prev.filter(u => u.email.toLowerCase() !== cleanEmail)];
            localStorage.setItem('recovery_all_users', JSON.stringify(next));
            return next;
          });
        }
      } catch (err) {
        console.warn('Supabase cloud login check note:', err);
      }
    }

    if (!found) {
      return { result: 'error', error: 'No account found with this email address. Please ensure this user has been added in Team Management.' };
    }
    if (found.status === 'inactive') {
      return { result: 'error', error: 'This account has been deactivated by the Administrator.' };
    }

    const correctPassword = found.password || '';
    if (!correctPassword) {
      return { result: 'error', error: 'Account password not configured. Contact Administrator.' };
    }
    if (pass !== correctPassword) {
      return { result: 'error', error: 'Incorrect password. Please try again.' };
    }

    if (found.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()) {
      found.role = 'admin';
    }

    const deviceKey = `${found.email}:${navigator.userAgent.slice(0, 60)}`;
    if (!verifiedDevices.has(deviceKey)) {
      setPendingEmail(found.email.toLowerCase());
      return { result: 'otp_required' };
    }

    setUser(found);
    return { result: 'ok' };
  };

  const verifyOtp = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    const cleanCode = code.trim();
    let isMatch = false;

    if (otpSession && otpSession.email === email.toLowerCase() && Date.now() <= otpSession.expiresAt) {
      if (cleanCode === otpSession.code) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.toLowerCase(),
          token: cleanCode,
          type: 'email',
        });
        if (data?.user && !error) {
          isMatch = true;
        }
      } catch (err) {
        console.warn('Supabase verifyOtp note:', err);
      }
    }

    if (!isMatch) {
      return { success: false, error: 'Invalid or expired 6-digit verification code. Please check your Gmail and try again.' };
    }

    const list = getLatestUsers();
    const found = list.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { success: false, error: 'User account not found.' };

    if (found.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()) {
      found.role = 'admin';
    }

    const deviceKey = `${found.email}:${navigator.userAgent.slice(0, 60)}`;
    const newVerified = new Set(verifiedDevices);
    newVerified.add(deviceKey);
    setVerifiedDevices(newVerified);
    localStorage.setItem('recovery_verified_devices', JSON.stringify(Array.from(newVerified)));

    setOtpSession(null);
    setPendingEmail(null);
    setUser(found);
    return { success: true };
  };

  const logout = () => {
    terminateCurrentSession();
    if (user) {
      setUsers(prev => {
        const next = prev.map(u => u.id === user.id ? { ...u, is_online: false } : u);
        localStorage.setItem('recovery_all_users', JSON.stringify(next));
        return next;
      });
      try {
        supabase.from('users').update({ is_online: false }).eq('id', user.id).then();
      } catch (_) {}
    }
    setUser(null);
    setPendingEmail(null);
    setOtpSession(null);
  };

  // ── Multi-Device Add User ───────────────────────────────────────────────────
  const addUser = async (newUser: Omit<User, 'id'>): Promise<User> => {
    const created: User = {
      ...newUser,
      id: Date.now(),
      status: newUser.status || 'active',
      is_online: false,
    };

    setUsers(prev => {
      const next = [created, ...prev.filter(u => u.email.toLowerCase() !== created.email.toLowerCase())];
      localStorage.setItem('recovery_all_users', JSON.stringify(next));
      return next;
    });

    // Cloud Database Upsert
    try {
      await supabase.from('users').upsert({
        id: created.id,
        name: created.name,
        email: created.email.toLowerCase(),
        phone: created.phone || '',
        employee_id: created.employee_id || '',
        role: created.role,
        status: created.status,
        password: created.password || '@Pass2026',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' });
      console.log('User synced to Supabase Cloud:', created.email);
    } catch (err) {
      console.warn('Supabase user insert note:', err);
    }

    return created;
  };

  // ── Multi-Device Update User ────────────────────────────────────────────────
  const updateUser = async (id: number, updated: Partial<User>): Promise<void> => {
    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === id) {
          if (u.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()) {
            return { ...u, ...updated, role: 'admin' as const };
          }
          return { ...u, ...updated };
        }
        return u;
      });
      localStorage.setItem('recovery_all_users', JSON.stringify(next));
      return next;
    });

    if (user && user.id === id) {
      if (updated.status === 'inactive') {
        setUser(null);
        localStorage.removeItem('recovery_auth_user');
      } else {
        const updatedRole = (user.email.toLowerCase() === REAL_ADMIN.email.toLowerCase())
          ? 'admin'
          : (updated.role || user.role);
        setUser(prev => prev ? { ...prev, ...updated, role: updatedRole } : null);
      }
    }

    // Cloud Database Update
    try {
      await supabase.from('users').update({
        ...updated,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch (err) {
      console.warn('Supabase user update note:', err);
    }
  };

  // ── Multi-Device Delete User ────────────────────────────────────────────────
  const deleteUser = async (id: number): Promise<void> => {
    setUsers(prev => {
      const next = prev.filter(u => {
        if (u.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()) return true;
        return u.id !== id;
      });
      localStorage.setItem('recovery_all_users', JSON.stringify(next));
      return next;
    });

    try {
      await supabase.from('users').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase user delete note:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, users,
      login, verifyOtp, pendingEmail, generateOtp,
      logout,
      addUser, updateUser, deleteUser,
      updateUserLocation
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};