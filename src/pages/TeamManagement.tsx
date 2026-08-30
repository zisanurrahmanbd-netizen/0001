import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
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
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'agent' as UserRole,
    employee_id: '',
    manager_id: 2,
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
      status: u.status || 'active',
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mgr = managers.find(m => m.id === Number(formData.manager_id));
    addUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      employee_id: formData.employee_id,
      manager_id: formData.role === 'agent' ? Number(formData.manager_id) : undefined,
      manager_name: formData.role === 'agent' ? mgr?.name : undefined,
      status: formData.status,
    });
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const mgr = managers.find(m => m.id === Number(formData.manager_id));
    updateUser(selectedUser.id, {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      employee_id: formData.employee_id,
      manager_id: formData.role === 'agent' ? Number(formData.manager_id) : undefined,
      manager_name: formData.role === 'agent' ? mgr?.name : undefined,
      status: formData.status,
    });
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete user "${name}"?`)) {
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
            Team & User Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, edit, assign roles, and manage field agents and recovery managers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User / Agent</span>
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
            placeholder="Search by name, email, or employee ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="admin">Administrators</option>
            <option value="manager">Team Managers</option>
            <option value="agent">Field Agents</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(u => (
          <div
            key={u.id}
            className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm space-y-3 transition-all ${
              u.status === 'inactive' ? 'border-rose-500/20 opacity-75' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl font-bold flex items-center justify-center text-sm ${
                  u.role === 'admin' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                  u.role === 'manager' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{u.name}</span>
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300' :
                      u.role === 'manager' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-300' :
                      'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                    }`}>
                      {u.role}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      u.status === 'inactive' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {u.status === 'inactive' ? 'Inactive' : 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <span className={`w-2.5 h-2.5 rounded-full ${u.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} title={u.is_online ? 'Online' : 'Offline'} />
            </div>

            <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span>Employee ID:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{u.employee_id || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="truncate max-w-[170px] text-slate-700 dark:text-slate-300">{u.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Phone:</span>
                <a href={'tel:' + u.phone} className="hover:underline text-slate-700 dark:text-slate-300">{u.phone || 'N/A'}</a>
              </div>
              {u.manager_name && (
                <div className="flex items-center justify-between">
                  <span>Manager:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">{u.manager_name}</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Edit, Toggle Status, Delete */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-xs">
              <button
                onClick={() => toggleUserStatus(u)}
                className={`px-2.5 py-1 rounded-xl font-bold text-[11px] flex items-center gap-1 transition-all ${
                  u.status === 'inactive'
                    ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500'
                }`}
                title="Toggle Active/Inactive"
              >
                <Power className="w-3 h-3" />
                <span>{u.status === 'inactive' ? 'Activate' : 'Deactivate'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(u)}
                  className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 font-bold flex items-center gap-1 text-[11px]"
                  title="Edit user details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    className="p-1.5 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 font-bold"
                    title="Delete user"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};