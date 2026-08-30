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
    name: 'Nasrin Akter',
    email: 'agent.nasrin@recovery.local',
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
    name: 'Jahangir Alam',
    email: 'agent.jahangir@recovery.local',
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
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  switchUser: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('recovery_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return DEMO_USERS[0]; // default to Admin
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('recovery_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('recovery_auth_user');
    }
  }, [user]);

  const login = (email: string, pass: string): boolean => {
    const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found && (pass === 'password123' || pass === 'password' || pass.length >= 4)) {
      setUser(found);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const switchUser = (email: string) => {
    const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) setUser(found);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};