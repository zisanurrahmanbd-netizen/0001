import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

export const DEMO_USERS: User[] = [
  {
    id: 1,
    name: 'System Administrator',
    email: 'admin@recovery.local',
    role: 'admin',
    employee_id: 'EMP-001',
    phone: '01700-000001',
    status: 'active',
    is_online: true,
  },
  {
    id: 2,
    name: 'Shafiqur Rahman (Dhaka Team)',
    email: 'manager.dhaka@recovery.local',
    role: 'manager',
    employee_id: 'EMP-101',
    phone: '01711-222001',
    status: 'active',
    is_online: true,
  },
  {
    id: 3,
    name: 'Kamal Hossain (CTG Team)',
    email: 'manager.ctg@recovery.local',
    role: 'manager',
    employee_id: 'EMP-102',
    phone: '01711-222002',
    status: 'active',
    is_online: true,
  },
  {
    id: 4,
    name: 'Md. Abdur Rahim',
    email: 'agent.rahim@recovery.local',
    role: 'agent',
    employee_id: 'AGT-001',
    phone: '01812-300001',
    manager_id: 2,
    manager_name: 'Shafiqur Rahman (Dhaka Team)',
    status: 'active',
    last_latitude: 23.7945,
    last_longitude: 90.4088,
    last_ping_at: new Date().toISOString(),
    is_online: true,
  },
  {
    id: 5,
    name: 'Md. Karim Uddin',
    email: 'agent.karim@recovery.local',
    role: 'agent',
    employee_id: 'AGT-002',
    phone: '01812-300002',
    manager_id: 2,
    manager_name: 'Shafiqur Rahman (Dhaka Team)',
    status: 'active',
    last_latitude: 23.7781,
    last_longitude: 90.4172,
    last_ping_at: new Date().toISOString(),
    is_online: true,
  },
  {
    id: 6,
    name: 'Tanvir Ahmed',
    email: 'agent.tanvir@recovery.local',
    role: 'agent',
    employee_id: 'AGT-003',
    phone: '01812-300003',
    manager_id: 2,
    manager_name: 'Shafiqur Rahman (Dhaka Team)',
    status: 'active',
    last_latitude: 23.7465,
    last_longitude: 90.3760,
    last_ping_at: new Date().toISOString(),
    is_online: true,
  },
  {
    id: 7,
    name: 'Faisal Mahmud',
    email: 'agent.faisal@recovery.local',
    role: 'agent',
    employee_id: 'AGT-004',
    phone: '01612-400001',
    manager_id: 3,
    manager_name: 'Kamal Hossain (CTG Team)',
    status: 'active',
    last_latitude: 22.3569,
    last_longitude: 91.7832,
    last_ping_at: new Date().toISOString(),
    is_online: true,
  },
  {
    id: 8,
    name: 'Sultana Begum',
    email: 'agent.sultana@recovery.local',
    role: 'agent',
    employee_id: 'AGT-005',
    phone: '01612-400002',
    manager_id: 3,
    manager_name: 'Kamal Hossain (CTG Team)',
    status: 'active',
    last_latitude: 22.3350,
    last_longitude: 91.8325,
    last_ping_at: new Date(Date.now() - 3600000).toISOString(),
    is_online: false,
  }
];

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (email: string) => boolean;
  addUser: (user: Omit<User, 'id'>) => User;
  updateUser: (id: number, user: Partial<User>) => void;
  deleteUser: (id: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('recovery_all_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEMO_USERS; }
    }
    return DEMO_USERS;
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('recovery_auth_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed && parsed.status === 'inactive') return null;
        return parsed;
      } catch (e) { return null; }
    }
    return DEMO_USERS[0];
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

  const login = (email: string, pass: string): { success: boolean; error?: string } => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      return { success: false, error: 'User account not found with this email address.' };
    }
    if (found.status === 'inactive') {
      return { 
        success: false, 
        error: '⚠️ Account Deactivated: This user account has been disabled by the Administrator. Access is blocked.' 
      };
    }
    if (pass === 'password123' || pass === 'password' || pass.length >= 4) {
      setUser(found);
      return { success: true };
    }
    return { success: false, error: 'Invalid password. Please check your credentials.' };
  };

  const logout = () => {
    setUser(null);
  };

  const switchUser = (email: string): boolean => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.status === 'inactive') {
        alert(`Access Denied: Account "${found.name}" is currently deactivated by the Administrator.`);
        return false;
      }
      setUser(found);
      return true;
    }
    return false;
  };

  const addUser = (newUser: Omit<User, 'id'>): User => {
    const created: User = {
      ...newUser,
      id: Date.now(),
      status: newUser.status || 'active',
      is_online: false,
    };
    setUsers(prev => [created, ...prev]);
    return created;
  };

  const updateUser = (id: number, updated: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
    if (user && user.id === id) {
      if (updated.status === 'inactive') {
        setUser(null);
      } else {
        setUser(prev => prev ? { ...prev, ...updated } : null);
      }
    }
  };

  const deleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <AuthContext.Provider value={{ user, users, login, logout, switchUser, addUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};