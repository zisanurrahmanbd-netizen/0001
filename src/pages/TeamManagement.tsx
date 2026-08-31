import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, UserRole } from '../types';
import { RolePermissionsModal } from '../components/RolePermissionsModal';
import { 
  Users, 
  Plus, 
  Shield, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Edit3, 
  Trash2, 
  Search, 
  UserCheck, 
  Building2,
  X,
  Lock,
  Power
} from 'lucide-react';

export const TeamManagementPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, user: currentUser } = useAuth();
  const { t } = useLanguage();
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermsModal, setShowPermsModal] = useState(false);
  const [permsUserId, setPermsUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent' as UserRole,
    employee_id: '',
    manager_id: 2,
    password: '',
    status: 'active' as 'active' | 'inactive',
  });

  const managers = users.filter(u => u.role === 'manager');

  const filtered = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = !searchQuery || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.employee_id && u.employee_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const openAddModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'agent',
      employee_id: `AGT-00${users.length + 1}`,
      manager_id: managers[0]?.id || 2,
      password: '',
      status: 'active',
    });
    setShowAddModal(true);
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      employee_id: u.employee_id || '',
      manager_id: u.manager_id || (managers[0]?.id || 2),
      password: u.password || '',
      status: u.status || 'active',
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    addUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      employee_id: formData.employee_id,
      manager_id: formData.role === 'agent' ? Number(formData.manager_id) : undefined,
      manager_name: formData.role === 'agent' ? managers.find(m => m.id === Number(formData.manager_id))?.name : undefined,
      password: formData.password || '@Pass2026',
      status: formData.status,
    });
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formData.name || !formData.email) return;

    const updates: Partial<User> = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      employee_id: formData.employee_id,
      manager_id: formData.role === 'agent' ? Number(formData.manager_id) : undefined,
      manager_name: formData.role === 'agent' ? managers.find(m => m.id === Number(formData.manager_id))?.name : undefined,
      status: formData.status,
    };
    if (formData.password) {
      updates.password = formData.password;
    }

    updateUser(selectedUser.id, updates);
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleDelete = (id: number, name: string) => {
    if (id === currentUser?.id) {
      alert("You cannot delete your own account!");
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${name} from the team?`)) {
      deleteUser(id);
    }
  };

  const toggleUserStatus = (u: User) => {
    const nextStatus = u.status === 'active' ? 'inactive' : 'active';
    updateUser(u.id, { status: nextStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('team.title', 'Team & User Management')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('team.subtitle', 'Create, edit, assign roles, and manage field agents and recovery managers')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setPermsUserId(null); setShowPermsModal(true); }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all"
          >
            <Shield className="w-4 h-4" />
            <span>{t('team.perms_btn', 'Roles & Permissions Control')}</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('team.add_user', 'Add New User / Agent')}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('team.search', 'Search by name, email, or employee ID...')}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold">{t('cases.status') === 'অবস্থা' ? 'পদবি:' : 'Role:'}</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">{t('team.all_roles', 'All Roles')} ({users.length})</option>
            <option value="admin">{t('team.role_admin', 'Administrators')}</option>
            <option value="manager">{t('team.role_manager', 'Team Managers')}</option>
            <option value="agent">{t('team.role_agent', 'Field Agents')}</option>
          </select>
        </div>
      </div>

      {/* Users Grid - Responsive Auto Adjust */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-5">
        {filtered.map(u => (
          <div
            key={u.id}
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col justify-between space-y-3 transition-all hover:shadow-md ${
              u.status === 'inactive' ? 'border-rose-500/30 opacity-75 bg-rose-500/5' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl font-bold flex items-center justify-center text-xs sm:text-sm flex-shrink-0 shadow-sm ${
                    u.role === 'admin' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                    u.role === 'manager' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate" title={u.name}>
                      {u.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300' :
                        u.role === 'manager' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300' :
                        'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      }`}>
                        {u.role === 'admin' ? t('team.role_admin', 'Admin') : u.role === 'manager' ? t('team.role_manager', 'Manager') : t('team.role_agent', 'Agent')}
                      </span>
                      <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        u.status === 'inactive' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}>
                        {u.status === 'inactive' ? (t('cases.status') === 'অবস্থা' ? 'নিষ্ক্রিয়' : 'Inactive') : (t('cases.status') === 'অবস্থা' ? 'সক্রিয়' : 'Active')}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${u.is_online ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50' : 'bg-slate-400'}`}
                  title={u.is_online ? 'Online & Active' : 'Offline'}
                />
              </div>

              {/* Details List */}
              <div className="space-y-1.5 text-xs pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <div className="grid grid-cols-[85px_1fr] items-center gap-1">
                  <span className="text-slate-400 font-semibold">{t('cases.status') === 'অবস্থা' ? 'আইডি:' : 'Employee ID:'}</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">{u.employee_id || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[85px_1fr] items-center gap-1">
                  <span className="text-slate-400 font-semibold">{t('cases.status') === 'অবস্থা' ? 'ইমেইল:' : 'Email:'}</span>
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium" title={u.email}>{u.email}</span>
                </div>
                <div className="grid grid-cols-[85px_1fr] items-center gap-1">
                  <span className="text-slate-400 font-semibold">{t('cases.status') === 'অবস্থা' ? 'মোবাইল:' : 'Phone:'}</span>
                  <a href={'tel:' + u.phone} className="hover:underline text-emerald-600 dark:text-emerald-400 font-medium truncate">{u.phone || 'N/A'}</a>
                </div>
                {u.manager_name && (
                  <div className="grid grid-cols-[85px_1fr] items-center gap-1">
                    <span className="text-slate-400 font-semibold">{t('cases.status') === 'অবস্থা' ? 'ম্যানেজার:' : 'Manager:'}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate" title={u.manager_name}>{u.manager_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Edit, Toggle Status, Delete */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5 text-xs">
              <button
                onClick={() => toggleUserStatus(u)}
                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all ${
                  u.status === 'inactive'
                    ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500/10 hover:text-rose-500'
                }`}
                title="Toggle Active/Inactive"
              >
                <Power className="w-3 h-3" />
                <span>{u.status === 'inactive' ? t('team.activate', 'Activate') : t('team.deactivate', 'Deactivate')}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setPermsUserId(u.id); setShowPermsModal(true); }}
                  className="px-2 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 font-bold flex items-center gap-1 text-[11px] border border-indigo-500/20 shadow-sm"
                  title="Configure specific permissions for this user"
                >
                  <Shield className="w-3 h-3" />
                  <span>{t('team.perms', 'Perms')}</span>
                </button>

                <button
                  onClick={() => openEditModal(u)}
                  className="px-2 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold flex items-center gap-1 text-[11px] border border-blue-500/20 shadow-sm"
                  title="Edit user details"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{t('team.edit', 'Edit')}</span>
                </button>

                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="p-1 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-bold border border-rose-500/20 shadow-sm"
                    title="Delete user"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Add New Team Member / Agent</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tariqul Islam"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold"
                  >
                    <option value="agent">Field Agent</option>
                    <option value="manager">Team Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    placeholder="e.g. AGT-006"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@recovery.local"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01711-000000"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Password</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="e.g. @Pass2026 (Defaults to @Pass2026 if empty)"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <Shield className="w-3 h-3 flex-shrink-0" />
                  <span>2-Step Verification (2FA OTP) will automatically protect this user's email on login.</span>
                </p>
              </div>

              {formData.role === 'agent' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reporting Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.employee_id})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" />
                <span>Edit User Details</span>
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={formData.role}
                    disabled={selectedUser?.email.toLowerCase() === 'zisanurrahmanbd@gmail.com'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="admin">Administrator (Super Admin)</option>
                    <option value="manager">Team Manager</option>
                    <option value="agent">Field Agent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Employee ID</label>
                  <input
                    type="text"
                    required
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reset Password (Optional)</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password to change"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              {formData.role === 'agent' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reporting Manager</label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    {managers.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.employee_id})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role & Permissions Control Modal */}
      <RolePermissionsModal
        isOpen={showPermsModal}
        onClose={() => setShowPermsModal(false)}
        initialUserId={permsUserId}
      />
    </div>
  );
};