import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

// Real production admin only - all demo accounts permanently removed
const REAL_ADMIN: User = {
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

const USERS_VERSION = '5.0_real_users_only';

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
      const hasAdmin = parsed.some(u => u.email === REAL_ADMIN.email);
      if (!hasAdmin) return [REAL_ADMIN, ...parsed];
      return parsed;
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
  verifyOtp: (email: string, code: string) => { success: boolean; error?: string };
  pendingEmail: string | null;
  generateOtp: (email: string) => string;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => User;
  updateUser: (id: number, user: Partial<User>) => void;
  deleteUser: (id: number) => void;
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
        localStorage.setItem('recovery_auth_user', JSON.stringify(user));
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return users;
  };

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

    const deviceKey = `${found.email}:${navigator.userAgent.slice(0, 60)}`;
    if (!verifiedDevices.has(deviceKey)) {
      setPendingEmail(found.email.toLowerCase());
      return { result: 'otp_required' };
    }

    setUser(found);
    return { result: 'ok' };
  };

  const verifyOtp = (email: string, code: string): { success: boolean; error?: string } => {
    if (!otpSession) {
      return { success: false, error: 'No OTP session active. Please request a new code.' };
    }
    if (otpSession.email !== email.toLowerCase()) {
      return { success: false, error: 'OTP email mismatch.' };
    }
    if (Date.now() > otpSession.expiresAt) {
      setOtpSession(null);
      return { success: false, error: 'OTP expired. Please request a new code.' };
    }
    if (code.trim() !== otpSession.code) {
      return { success: false, error: 'Incorrect code. Please check your email and try again.' };
    }

    const list = getLatestUsers();
    const found = list.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { success: false, error: 'User not found.' };

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
      const next = prev.map(u => u.id === id ? { ...u, ...updated } : u);
      localStorage.setItem('recovery_all_users', JSON.stringify(next));
      return next;
    });
    if (user && user.id === id) {
      if (updated.status === 'inactive') {
        setUser(null);
        localStorage.removeItem('recovery_auth_user');
      } else {
        setUser(prev => prev ? { ...prev, ...updated } : null);
      }
    }
  };

  const deleteUser = (id: number) => {
    setUsers(prev => {
      const next = prev.filter(u => u.id !== id);
      localStorage.setItem('recovery_all_users', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{
      user, users,
      login, verifyOtp, pendingEmail, generateOtp,
      logout,
      addUser, updateUser, deleteUser
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