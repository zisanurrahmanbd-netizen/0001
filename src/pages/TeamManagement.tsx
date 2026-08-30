import React, { useState } from 'react';
import { DEMO_USERS } from '../context/AuthContext';
import { User, UserRole } from '../types';
import { Users, Plus, Shield, CheckCircle2, Phone, Mail } from 'lucide-react';

export const TeamManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filtered = users.filter(u => roleFilter === 'all' || u.role === roleFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Team & User Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage recovery managers, field agents, roles, and hierarchy assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="manager">Team Managers</option>
            <option value="agent">Field Agents</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => (
          <div
            key={u.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{u.name}</h3>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                    u.role === 'admin' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300' :
                    u.role === 'manager' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' :
                    'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                  }`}>
                    {u.role}
                  </span>
                </div>
              </div>

              <span className={`w-2.5 h-2.5 rounded-full ${u.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            </div>

            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span>Employee ID:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{u.employee_id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="truncate max-w-[150px]">{u.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phone:</span>
                <span>{u.phone || 'N/A'}</span>
              </div>
              {u.manager_name && (
                <div className="flex items-center justify-between">
                  <span>Reporting To:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{u.manager_name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};