import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'bn';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Nav Items
    'nav.dashboard': 'Dashboard',
    'nav.cases': 'Bank & MNC Files',
    'nav.map': 'Live Agent Map',
    'nav.imports': 'Excel Templates & Import',
    'nav.contacts': 'Bank Contacts',
    'nav.reports_perf': 'Agent Performance',
    'nav.reports_expiry': 'Expiry Tracker',
    'nav.reports_legal': 'Legal & Flagged Cases',
    'nav.team': 'Team Management',
    
    // Top Bar & Controls
    'top.permissions': 'Permissions',
    'top.branding': 'Edit Logo & Brand',
    'top.search_placeholder': 'Quick search file #, customer, phone...',
    'top.live_status': 'Supabase Live',
    'top.sign_out': 'Sign Out',
    'top.quick_persona': 'Quick Persona Switch',
    'top.dark_mode': 'Dark Mode',
    'top.light_mode': 'Light Mode',
    'top.language': 'English',
    'top.switch_lang': 'বাংলা',

    // Dashboard
    'dash.title': 'Recovery Operations Control Center',
    'dash.subtitle': 'Real-time telemetry, portfolio recovery KPIs and field team operations',
    'dash.total_allocated': 'Total Portfolio Assigned',
    'dash.total_collected': 'Total Cash Collected',
    'dash.recovery_rate': 'Recovery Success Rate',
    'dash.active_agents': 'Active Field Agents',
    'dash.overdue_portfolio': 'Overdue & At-Risk Balance',
    'dash.ptp_today': 'Promises Due Today (PTP)',
    'dash.recent_collections': 'Live Field Collections',
    'dash.performance_overview': 'Bank Recovery Portfolio Mix',
    'dash.urgent_followups': 'Urgent Follow-Ups & Missed PTP',

    // Case Registry
    'cases.title': 'Bank & MNC Files',
    'cases.subtitle': 'assigned institutional bank & corporate recovery files',
    'cases.search': 'Search file, name, phone, account...',
    'cases.all_banks': 'All Partner Banks',
    'cases.all_statuses': 'All Statuses',
    'cases.export_excel': 'Export Excel (.XLSX)',
    'cases.file_no': 'File Number',
    'cases.customer': 'Customer & Details',
    'cases.bank_product': 'Bank / Product',
    'cases.outstanding': 'Outstanding',
    'cases.status': 'Status',
    'cases.agent': 'Assigned Agent',
    'cases.action': 'Action',

    // Case Detail
    'detail.back': 'Back to Bank & MNC Files',
    'detail.gps_checkin': 'GPS Visit Check-In',
    'detail.log_remark': 'Log Remark / PTP',
    'detail.record_payment': 'Record Payment',
    'detail.reassign': 'Reassign',
    'detail.financials': 'Financial Balances',
    'detail.outstanding_amount': 'Total Outstanding',
    'detail.collected_amount': 'Total Collected',
    'detail.present_address': 'Present Residence Address',
    'detail.permanent_address': 'Permanent Origin Address',
    'detail.visit_history': 'Verified Field GPS Check-In History',
    'detail.open_google_maps': 'Open in Google Maps',
    'detail.contact_remarks': 'Contact History & Remarks',
    'detail.receipts': 'Payment Receipts & Slips',

    // Login
    'login.signin_title': 'Recovery Agent & Staff Portal',
    'login.signin_subtitle': 'Enter your institutional credentials to access debt portfolio operations',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.remember': 'Remember this device',
    'login.submit': 'Sign In to Dashboard',
    'login.demo_personas': '1-Click Demo Personas',
    'login.demo_ready': 'Demo Ready',
  },
  bn: {
    // Nav Items
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.cases': 'ব্যাংক ও এমএনসি ফাইলসমূহ',
    'nav.map': 'লাইভ এজেন্ট ম্যাপ',
    'nav.imports': 'এক্সেল টেমপ্লেট ও ইমপোর্ট',
    'nav.contacts': 'ব্যাংক পরিচিতি ও নম্বর',
    'nav.reports_perf': 'এজেন্ট পারফরম্যান্স',
    'nav.reports_expiry': 'মেয়াদ ট্র্যাকার',
    'nav.reports_legal': 'আইনি ও চিহ্নিত ফাইলসমূহ',
    'nav.team': 'টিম ও ইউজার ম্যানেজমেন্ট',
    
    // Top Bar & Controls
    'top.permissions': 'অনুমতিসমূহ',
    'top.branding': 'লোগো ও ব্র্যান্ড পরিবর্তন',
    'top.search_placeholder': 'ফাইল নম্বর, নাম বা মোবাইল দিয়ে খুঁজুন...',
    'top.live_status': 'সুপাবেস লাইভ',
    'top.sign_out': 'লগআউট',
    'top.quick_persona': 'দ্রুত ইউজার পরিবর্তন',
    'top.dark_mode': 'ডার্ক মোড',
    'top.light_mode': 'লাইট মোড',
    'top.language': 'বাংলা',
    'top.switch_lang': 'English',

    // Dashboard
    'dash.title': 'রিকভারি অপারেশন কন্ট্রোল সেন্টার',
    'dash.subtitle': 'রিয়েল-টাইম তথ্য, পোর্টফোলিও আদায় ট্র্যাকিং ও ফিল্ড টিম পরিচালনা',
    'dash.total_allocated': 'মোট বরাদ্দকৃত পোর্টফোলিও',
    'dash.total_collected': 'মোট সংগৃহীত নগদ টাকা',
    'dash.recovery_rate': 'আদায়ের সাফল্যের হার',
    'dash.active_agents': 'সক্রিয় ফিল্ড এজেন্ট',
    'dash.overdue_portfolio': 'মেয়াদোত্তীর্ণ ও ঝুঁকিপূর্ণ বকেয়া',
    'dash.ptp_today': 'আজকের প্রতিশ্রুত আদায় (PTP)',
    'dash.recent_collections': 'সর্বশেষ ফিল্ড কালেকশন',
    'dash.performance_overview': 'ব্যাংক রিকভারি পোর্টফোলিও পরিসংখ্যান',
    'dash.urgent_followups': 'জরুরি ফলো-আপ ও বকেয়া প্রতিশ্রুতি',

    // Case Registry
    'cases.title': 'ব্যাংক ও এমএনসি ফাইলসমূহ',
    'cases.subtitle': 'বরাদ্দকৃত প্রাতিষ্ঠানিক ব্যাংক ও কর্পোরেট রিকভারি ফাইল',
    'cases.search': 'ফাইল নং, নাম, ফোন বা একাউন্ট দিয়ে খুঁজুন...',
    'cases.all_banks': 'সকল অংশীদার ব্যাংক',
    'cases.all_statuses': 'সকল স্ট্যাটাস',
    'cases.export_excel': 'এক্সেল ডাউনলোড (.XLSX)',
    'cases.file_no': 'ফাইল নম্বর',
    'cases.customer': 'গ্রাহক ও বিস্তারিত',
    'cases.bank_product': 'ব্যাংক / পণ্য',
    'cases.outstanding': 'মোট বকেয়া',
    'cases.status': 'অবস্থা',
    'cases.agent': 'নিয়োজিত এজেন্ট',
    'cases.action': 'পদক্ষেপ',

    // Case Detail
    'detail.back': 'ব্যাংক ও এমএনসি ফাইলে ফিরে যান',
    'detail.gps_checkin': 'জিপিএস ভিজিট চেক-ইন',
    'detail.log_remark': 'মন্তব্য ও পিটিপি সংরক্ষণ',
    'detail.record_payment': 'পেমেন্ট জমা দিন',
    'detail.reassign': 'পুনর্বণ্টন করুন',
    'detail.financials': 'আর্থিক হিসাব বিবরণী',
    'detail.outstanding_amount': 'মোট বকেয়া টাকা',
    'detail.collected_amount': 'মোট আদায়কৃত টাকা',
    'detail.present_address': 'বর্তমান বাসস্থান ঠিকানা',
    'detail.permanent_address': 'স্থায়ী মূল ঠিকানা',
    'detail.visit_history': 'যাচাইকৃত ফিল্ড জিপিএস চেক-ইন ইতিহাস',
    'detail.open_google_maps': 'গুগল ম্যাপে দেখুন',
    'detail.contact_remarks': 'যোগাযোগ ও মন্তব্যের ইতিহাস',
    'detail.receipts': 'মানি রসিদ ও ভাউচার',

    // Login
    'login.signin_title': 'রিকভারি এজেন্ট ও অফিসার পোর্টাল',
    'login.signin_subtitle': 'ঋণ ও বকেয়া আদায় পোর্টাল ব্যবহারে আপনার প্রাতিষ্ঠানিক একাউন্টে প্রবেশ করুন',
    'login.email': 'ইমেইল ঠিকানা',
    'login.password': 'পাসওয়ার্ড',
    'login.remember': 'ডিভাইস মনে রাখুন',
    'login.submit': 'ড্যাশবোর্ডে প্রবেশ করুন',
    'login.demo_personas': '১-ক্লিক ডেমো একাউন্ট',
    'login.demo_ready': 'ডেমো প্রস্তুত',
  }
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('recovery_app_language');
    if (saved === 'bn' || saved === 'en') return saved;
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('recovery_app_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'en' ? 'bn' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const fallback = TRANSLATIONS.en[key];
    if (fallback) return fallback;
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};