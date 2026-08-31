import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';

// Real production admin only - all demo accounts permanently removed
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

const USERS_VERSION = '6.0_admin_enforced';

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
      // Guarantee zisanurrahmanbd@gmail.com is always role: 'admin'
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
  login: (email: string, pass: string) => { result: 'ok' | 'otp_required' | 'error'; error?: string };
  verifyOtp: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  pendingEmail: string | null;
  generateOtp: (email: string) => string;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => User;
  updateUser: (id: number, user: Partial<User>) => void;
  deleteUser: (id: number) => void;
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
        // Guarantee zisanurrahmanbd@gmail.com is always role: 'admin' when restored
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

  useEffect(() => {
    localStorage.setItem('recovery_all_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (user) {
      if (user.status === 'inactive') {
        setUser(null);
        localStorage.removeItem('recovery_auth_user');
      } else {
        // Always enforce admin role for zisanurrahmanbd@gmail.com
        const toSave = user.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()
          ? { ...user, role: 'admin' }
          : user;
        localStorage.setItem('recovery_auth_user', JSON.stringify(toSave));
      }
    } else {
      localStorage.removeItem('recovery_auth_user');
    }
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

  // Real-time GPS Location Broadcast for Every User (Admin, Manager, Agent)
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
  }, [user]);

  // Automatic Background Geolocation Watcher for Authenticated User
  useEffect(() => {
    if (!user) return;

    if ('geolocation' in navigator) {
      // First quick ping
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateUserLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation initial ping notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );

      // Continuous telemetry watch
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          updateUserLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation continuous telemetry notice:', err.message);
        },
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

  const login = (email: string, pass: string): { result: 'ok' | 'otp_required' | 'error'; error?: string } => {
    const list = getLatestUsers();
    const found = list.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!found) {
      return { result: 'error', error: 'No account found with this email address.' };
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

    // Force admin role for zisanurrahmanbd@gmail.com
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

    // Check 1: Session OTP
    if (otpSession && otpSession.email === email.toLowerCase() && Date.now() <= otpSession.expiresAt) {
      if (cleanCode === otpSession.code) {
        isMatch = true;
      }
    }

    // Check 2: Supabase OTP Verification
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

    // Force admin role for zisanurrahmanbd@gmail.com
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
    if (user) {
      // Mark offline on logout
      setUsers(prev => {
        const next = prev.map(u => u.id === user.id ? { ...u, is_online: false } : u);
        localStorage.setItem('recovery_all_users', JSON.stringify(next));
        return next;
      });
    }
    setUser(null);
    setPendingEmail(null);
    setOtpSession(null);
  };

  const addUser = (newUser: Omit<User, 'id'>): User => {
    const created: User = {
      ...newUser,
      id: Date.now(),
      status: newUser.status || 'active',
      is_online: false,
    };
    setUsers(prev => {
      const next = [created, ...prev];
      localStorage.setItem('recovery_all_users', JSON.stringify(next));
      return next;
    });
    return created;
  };

  const updateUser = (id: number, updated: Partial<User>) => {
    setUsers(prev => {
      const next = prev.map(u => {
        if (u.id === id) {
          // If this is zisanurrahmanbd@gmail.com, protect its admin role
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
  };

  const deleteUser = (id: number) => {
    setUsers(prev => {
      const next = prev.filter(u => {
        // Prevent deleting the root admin
        if (u.email.toLowerCase() === REAL_ADMIN.email.toLowerCase()) return true;
        return u.id !== id;
      });
      localStorage.setItem('recovery_all_users', JSON.stringify(next));
      return next;
    });
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