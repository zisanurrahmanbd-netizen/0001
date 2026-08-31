import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dataService } from '../services/dataService';
import { BankContact } from '../types';
import { 
  PhoneCall, 
  Mail, 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  UserCheck 
} from 'lucide-react';

export const BankContactsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const banks = dataService.getBanks();
  const [contacts, setContacts] = useState<BankContact[]>(() => dataService.getContacts());
  const [bankFilter, setBankFilter] = useState<string>('all');
  const [searchQ, setSearchQ] = useState('');

  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<BankContact | null>(null);
  const [formBankId, setFormBankId] = useState(1);
  const [formName, setFormName] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBranch, setFormBranch] = useState('');

  const reload = () => {
    setContacts(dataService.getContacts());
  };

  const openAddModal = () => {
    setEditingContact(null);
    setFormBankId(1);
    setFormName('');
    setFormDesignation('');
    setFormDept('');
    setFormPhone('');
    setFormEmail('');
    setFormBranch('');
    setShowModal(true);
  };

  const openEditModal = (c: BankContact) => {
    setEditingContact(c);
    setFormBankId(c.bank_id);
    setFormName(c.name);
    setFormDesignation(c.designation);
    setFormDept(c.department);
    setFormPhone(c.phone);
    setFormEmail(c.email);
    setFormBranch(c.branch);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Delete this bank contact?')) {
      dataService.deleteContact(id);
      reload();
    }
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      dataService.updateContact(editingContact.id, {
        bank_id: formBankId,
        name: formName,
        designation: formDesignation,
        department: formDept,
        phone: formPhone,
        email: formEmail,
        branch: formBranch,
      });
    } else {
      dataService.addContact({
        bank_id: formBankId,
        name: formName,
        designation: formDesignation,
        department: formDept,
        phone: formPhone,
        email: formEmail,
        branch: formBranch,
      });
    }
    setShowModal(false);
    reload();
  };

  const filtered = contacts.filter(c => {
    if (bankFilter !== 'all' && String(c.bank_id) !== bankFilter) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.branch.toLowerCase().includes(q) ||
        c.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('contacts.title', 'Partner Bank & Institutional Directory')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('contacts.subtitle', 'Direct phone numbers and email contacts for bank liaisons and credit managers')}
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={openAddModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('contacts.add_new', 'Add Bank Officer')}</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('contacts.search', 'Search officer name, phone, department, branch...')}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div>
          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100"
          >
            <option value="all">{t('cases.all_banks', 'All Partner Banks')}</option>
            {banks.map(b => (
              <option key={b.id} value={String(b.id)}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Contacts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center gap-3 text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <UserCheck className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">{t('contacts.no_records', 'No bank contacts found')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('contacts.no_records_hint', 'Add a new contact using the button above')}</p>
            </div>
          </div>
        )}
        {filtered.map(contact => (
          <div
            key={contact.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                    {contact.bank?.name || 'Bank'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{contact.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{contact.designation} • {contact.department}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{contact.branch}</p>
                </div>

                {user?.role === 'admin' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(contact)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <a
                href={`tel:${contact.phone}`}
                className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>

              <a
                href={`mailto:${contact.email}`}
                className="py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Add / Edit Contact */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span>{editingContact ? 'Edit Bank Officer' : 'Add Bank Officer'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Partner Bank</label>
                <select
                  value={formBankId}
                  onChange={(e) => setFormBankId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Officer Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Mr. Tanzim Ahmed"
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    placeholder="e.g. Recovery Manager"
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    placeholder="e.g. Cards Recovery"
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="01711-XXXXXX"
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="officer@bank.com"
                    className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Branch / Location</label>
                <input
                  type="text"
                  required
                  value={formBranch}
                  onChange={(e) => setFormBranch(e.target.value)}
                  placeholder="e.g. Head Office, Motijheel, Chittagong"
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Officer Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};