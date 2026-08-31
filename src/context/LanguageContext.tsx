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

    // Status Badges
    'status.new': 'New',
    'status.in_progress': 'In Progress',
    'status.visited': 'Visited',
    'status.broken_promise': 'Broken Promise',
    'status.disputed': 'Disputed',
    'status.legal': 'Legal Case',
    'status.untraceable': 'Untraceable',
    'status.settled': 'Settled',
    'status.closed': 'Closed',

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
    'dash.due_today_desc': 'Click to view & follow up',
    'dash.overdue_desc': 'Overdue commitment dates',
    'dash.cases_count': 'Cases',
    'dash.active_recovery_cases': 'active recovery cases',

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
    'cases.view_detail': 'View File',

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
    'detail.account_no': 'Account / Card #',
    'detail.phone': 'Primary Phone',
    'detail.alt_phone': 'Secondary Phone',
    'detail.allocation_date': 'Allocation Date',
    'detail.expiry_date': 'Expiry Date',
    'detail.visit_outcome': 'Visit Outcome',
    'detail.satellite_locked': 'GPS Coordinates Locked',
    'detail.satellite_acquiring': 'Acquiring GPS Satellite Signal...',
    'detail.select_visited_addr': 'Select Address Visited:',
    'detail.visit_notes_label': 'Visit Notes / Observations:',
    'detail.submit_checkin': 'Submit Verified Check-In',
    'detail.cancel': 'Cancel',
    'detail.save_payment': 'Save Payment',
    'detail.save_remark': 'Save Remark',
    'detail.save_reassign': 'Save Assignment',

    // Live Map
    'map.title': 'Live Field Agent Telemetry & GPS Tracking',
    'map.subtitle': 'Real-time satellite & cellular check-in locations of field recovery agents',
    'map.online_agents': 'Online Field Agents',
    'map.search_agents': 'Search agent by name or ID...',
    'map.active_status': 'Active On Field',
    'map.offline_status': 'Offline / Away',
    'map.last_ping': 'Last GPS Ping',
    'map.accuracy': 'Precision',

    // Excel Importer
    'import.title': 'Excel File Importer & Institutional Templates',
    'import.subtitle': 'Upload portfolio files, map standard banking columns and bulk ingest accounts',
    'import.upload_box': 'Drag and drop .xlsx file here or browse device',
    'import.download_template': 'Download Standard Bank Template',
    'import.select_bank': 'Select Partner Bank',
    'import.select_sheet': 'Select Worksheet',
    'import.inspect_preview': 'Inspect & Validate File',
    'import.start_import': 'Queue & Execute Import',
    'import.recent_jobs': 'Recent File Import Jobs',

    // Bank Contacts
    'contacts.title': 'Partner Bank & Institutional Directory',
    'contacts.subtitle': 'Direct official phone & email contacts for recovery managers and branch coordinators',
    'contacts.add_new': 'Add New Bank Contact',
    'contacts.search': 'Search contact, designation, or branch...',
    'contacts.name': 'Name & Designation',
    'contacts.department': 'Department',
    'contacts.phone': 'Phone Number',
    'contacts.email': 'Official Email',
    'contacts.bank': 'Institution',
    'contacts.branch': 'Branch',

    // Agent Performance
    'perf.title': 'Agent Performance & KPI Leaderboard',
    'perf.subtitle': 'Recovery targets, field visit frequency, and collected volume rankings',
    'perf.export': 'Export Performance CSV',
    'perf.from_date': 'From Date',
    'perf.to_date': 'To Date',
    'perf.manager_filter': 'Reporting Manager',
    'perf.rank': 'Rank',
    'perf.agent_name': 'Agent Name',
    'perf.total_files': 'Total Files',
    'perf.visited_files': 'Visited',
    'perf.collections_count': 'Receipts',
    'perf.total_collected': 'Collected Amount',
    'perf.avg_collection': 'Avg. / Collection',

    // Expiry Tracker
    'expiry.title': 'Portfolio Expiry Matrix & Allocation Tracker',
    'expiry.subtitle': 'Monitor contract expiration buckets across partner banks and recovery mandates',
    'expiry.expiring_7': 'Expiring in 7 Days',
    'expiry.expiring_30': 'Expiring in 30 Days',
    'expiry.expired': 'Expired Mandates',
    'expiry.active': 'Active Accounts',

    // Flagged Cases
    'legal.title': 'Legal & Flagged Accounts Registry',
    'legal.subtitle': 'Litigation cases, broken promises, dispute resolutions and untraceable accounts',
    'legal.all': 'All Flagged Files',
    'legal.proceedings': 'Legal Proceedings',
    'legal.untraceable': 'Untraceable / Shifted',
    'legal.broken': 'Broken Promises (PTP)',
    'legal.disputed': 'Disputed Accounts',

    // Team Management
    'team.title': 'Team & User Management',
    'team.subtitle': 'Create, edit, assign roles, and manage field agents and recovery managers',
    'team.add_user': 'Add New User / Agent',
    'team.perms_btn': 'Roles & Permissions Control',
    'team.search': 'Search by name, email, or employee ID...',
    'team.all_roles': 'All Roles',
    'team.role_admin': 'Administrator',
    'team.role_manager': 'Team Manager',
    'team.role_agent': 'Field Agent',
    'team.activate': 'Activate',
    'team.deactivate': 'Deactivate',
    'team.edit': 'Edit',
    'team.delete': 'Delete',
    'team.perms': 'Perms',

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

    // Status Badges
    'status.new': 'নতুন',
    'status.in_progress': 'চলমান',
    'status.visited': 'ভিজিট সম্পন্ন',
    'status.broken_promise': 'ভাঙ্গা প্রতিশ্রুতি',
    'status.disputed': 'বিতর্কিত',
    'status.legal': 'আইনি মামলা',
    'status.untraceable': 'অচিহ্নিত',
    'status.settled': 'নিষ্পত্তিকৃত',
    'status.closed': 'বন্ধ',

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
    'dash.due_today_desc': 'দেখতে ও ফলো-আপ করতে ক্লিক করুন',
    'dash.overdue_desc': 'মেয়াদোত্তীর্ণ প্রতিশ্রুতির তারিখ',
    'dash.cases_count': 'টি ফাইল',
    'dash.active_recovery_cases': 'টি সক্রিয় রিকভারি ফাইল',

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
    'cases.view_detail': 'ফাইল দেখুন',

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
    'detail.account_no': 'একাউন্ট / কার্ড নং',
    'detail.phone': 'প্রধান মোবাইল নম্বর',
    'detail.alt_phone': 'বিকল্প মোবাইল নম্বর',
    'detail.allocation_date': 'বরাদ্দের তারিখ',
    'detail.expiry_date': 'মেয়াদোত্তীর্ণের তারিখ',
    'detail.visit_outcome': 'ভিজিটের ফলাফল',
    'detail.satellite_locked': 'জিপিএস স্থানাঙ্ক লক করা হয়েছে',
    'detail.satellite_acquiring': 'জিপিএস স্যাটেলাইট সংকেত খোঁজা হচ্ছে...',
    'detail.select_visited_addr': 'পরিদর্শনকৃত ঠিকানা নির্বাচন করুন:',
    'detail.visit_notes_label': 'ভিজিটের পর্যবেক্ষণ / মন্তব্য:',
    'detail.submit_checkin': 'যাচাইকৃত চেক-ইন জমা দিন',
    'detail.cancel': 'বাতিল',
    'detail.save_payment': 'পেমেন্ট সংরক্ষণ করুন',
    'detail.save_remark': 'মন্তব্য সংরক্ষণ করুন',
    'detail.save_reassign': 'নিয়োগ সংরক্ষণ করুন',

    // Live Map
    'map.title': 'লাইভ ফিল্ড এজেন্ট ট্র্যাকিং ও জিপিএস ম্যাপ',
    'map.subtitle': 'ফিল্ড রিকভারি এজেন্টদের রিয়েল-টাইম স্যাটেলাইট ও নেটওয়ার্ক চেক-ইন অবস্থান',
    'map.online_agents': 'অনলাইন ফিল্ড এজেন্টসমূহ',
    'map.search_agents': 'নাম বা আইডি দিয়ে খুঁজুন...',
    'map.active_status': 'ফিল্ডে সক্রিয়',
    'map.offline_status': 'অফলাইন / দূরে',
    'map.last_ping': 'সর্বশেষ জিপিএস পিং',
    'map.accuracy': 'নির্ভুলতা',

    // Excel Importer
    'import.title': 'এক্সেল ফাইল ইমপোর্টার ও প্রাতিষ্ঠানিক টেমপ্লেট',
    'import.subtitle': 'পোর্টফোলিও ফাইল আপলোড, স্ট্যান্ডার্ড ব্যাংকিং কলাম ম্যাপিং এবং বাল্ক ফাইল সংযোজন',
    'import.upload_box': '.xlsx ফাইল এখানে ড্রপ করুন অথবা ডিভাইস থেকে বেছে নিন',
    'import.download_template': 'স্ট্যান্ডার্ড ব্যাংক টেমপ্লেট ডাউনলোড',
    'import.select_bank': 'অংশীদার ব্যাংক নির্বাচন করুন',
    'import.select_sheet': 'ওয়ার্কশিট নির্বাচন করুন',
    'import.inspect_preview': 'ফাইল যাচাই ও প্রিভিউ',
    'import.start_import': 'ইমপোর্ট শুরু করুন',
    'import.recent_jobs': 'সাম্প্রতিক ফাইল ইমপোর্ট ইতিহাস',

    // Bank Contacts
    'contacts.title': 'অংশীদার ব্যাংক ও প্রাতিষ্ঠানিক পরিচিতি ডিরেক্টরি',
    'contacts.subtitle': 'রিকভারি ম্যানেজার ও শাখা সমন্বয়কারীদের অফিসিয়াল ফোন ও ইমেইল তালিকা',
    'contacts.add_new': 'নতুন ব্যাংক পরিচিতি যোগ করুন',
    'contacts.search': 'নাম, পদবি বা শাখা দিয়ে খুঁজুন...',
    'contacts.name': 'নাম ও পদবি',
    'contacts.department': 'বিভাগ',
    'contacts.phone': 'ফোন নম্বর',
    'contacts.email': 'অফিসিয়াল ইমেইল',
    'contacts.bank': 'ব্যাংক / প্রতিষ্ঠান',
    'contacts.branch': 'শাখা',

    // Agent Performance
    'perf.title': 'এজেন্ট পারফরম্যান্স ও কেপিআই লিডারবোর্ড',
    'perf.subtitle': 'আদায় লক্ষ্যমাত্রা, ফিল্ড ভিজিট ও সংগৃহীত টাকার ভিত্তিতে তৈরি রেটিং',
    'perf.export': 'পারফরম্যান্স সিএসভি ডাউনলোড',
    'perf.from_date': 'শুরুর তারিখ',
    'perf.to_date': 'শেষ তারিখ',
    'perf.manager_filter': 'দায়িত্বপ্রাপ্ত ম্যানেজার',
    'perf.rank': 'র‍্যাংক',
    'perf.agent_name': 'এজেন্টের নাম',
    'perf.total_files': 'মোট ফাইল',
    'perf.visited_files': 'ভিজিট সম্পন্ন',
    'perf.collections_count': 'রসিদ সংখ্যা',
    'perf.total_collected': 'মোট আদায়কৃত টাকা',
    'perf.avg_collection': 'গড় আদায় / রসিদ',

    // Expiry Tracker
    'expiry.title': 'পোর্টফোলিও মেয়াদ ট্র্যাকিং ম্যাট্রিক্স',
    'expiry.subtitle': 'অংশীদার ব্যাংক এবং রিকভারি মেয়াদের সময়সীমা পর্যবেক্ষণ করুন',
    'expiry.expiring_7': '৭ দিনের মধ্যে মেয়াদোত্তীর্ণ',
    'expiry.expiring_30': '৩০ দিনের মধ্যে মেয়াদোত্তীর্ণ',
    'expiry.expired': 'মেয়াদোত্তীর্ণ ফাইল',
    'expiry.active': 'সক্রিয় পোর্টফোলিও',

    // Flagged Cases
    'legal.title': 'আইনি ও চিহ্নিত মামলা রেজিস্ট্রি',
    'legal.subtitle': 'আদালতের মামলা, প্রতিশ্রুতি ভঙ্গ, বিরোধ ও নিখোঁজ গ্রাহকের ফাইলসমূহ',
    'legal.all': 'সকল চিহ্নিত ফাইল',
    'legal.proceedings': 'আইনি কার্যক্রম',
    'legal.untraceable': 'নিখোঁজ / স্থানান্তরিত',
    'legal.broken': 'ভাঙ্গা প্রতিশ্রুতি (PTP)',
    'legal.disputed': 'বিতর্কিত একাউন্ট',

    // Team Management
    'team.title': 'টিম ও ইউজার ম্যানেজমেন্ট',
    'team.subtitle': 'ফিল্ড এজেন্ট ও রিকভারি ম্যানেজার তৈরি, সম্পাদনা, পদবি নির্ধারণ ও পরিচালনা',
    'team.add_user': 'নতুন ইউজার / এজেন্ট যোগ করুন',
    'team.perms_btn': 'ভূমিকা ও অনুমতি নিয়ন্ত্রণ',
    'team.search': 'নাম, ইমেইল বা আইডি দিয়ে খুঁজুন...',
    'team.all_roles': 'সকল পদবি',
    'team.role_admin': 'অ্যাডমিনিস্ট্রেটর',
    'team.role_manager': 'টিম ম্যানেজার',
    'team.role_agent': 'ফিল্ড এজেন্ট',
    'team.activate': 'সক্রিয় করুন',
    'team.deactivate': 'নিষ্ক্রিয় করুন',
    'team.edit': 'সম্পাদনা',
    'team.delete': 'মুছুন',
    'team.perms': 'অনুমতি',

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

// Automatic English -> Bengali word mapper for dynamic text
export const AUTO_WORD_MAP: Record<string, string> = {
  'Dashboard': 'ড্যাশবোর্ড',
  'Bank & MNC Files': 'ব্যাংক ও এমএনসি ফাইলসমূহ',
  'Live Agent Map': 'লাইভ এজেন্ট ম্যাপ',
  'Excel Templates & Import': 'এক্সেল টেমপ্লেট ও ইমপোর্ট',
  'Bank Contacts': 'ব্যাংক পরিচিতি ও নম্বর',
  'Agent Performance': 'এজেন্ট পারফরম্যান্স',
  'Expiry Tracker': 'মেয়াদ ট্র্যাকার',
  'Legal & Flagged Cases': 'আইনি ও চিহ্নিত ফাইলসমূহ',
  'Team Management': 'টিম ও ইউজার ম্যানেজমেন্ট',
  'Outstanding': 'বকেয়া',
  'Collected': 'আদায়কৃত',
  'Overdue': 'মেয়াদোত্তীর্ণ',
  'Status': 'অবস্থা',
  'Active': 'সক্রিয়',
  'Inactive': 'নিষ্ক্রিয়',
  'Admin': 'অ্যাডমিন',
  'Manager': 'ম্যানেজার',
  'Agent': 'এজেন্ট',
  'Field Agent': 'ফিল্ড এজেন্ট',
  'Administrator': 'অ্যাডমিনিস্ট্রেটর',
  'Team Manager': 'টিম ম্যানেজার',
  'Present Residence': 'বর্তমান বাসস্থান',
  'Permanent Origin': 'স্থায়ী মূল ঠিকানা',
  'Open in Google Maps': 'গুগল ম্যাপে দেখুন',
  'GPS Visit Check-In': 'জিপিএস ভিজিট চেক-ইন',
  'Record Payment': 'পেমেন্ট জমা দিন',
  'Log Remark / PTP': 'মন্তব্য ও পিটিপি সংরক্ষণ',
  'Reassign': 'পুনর্বণ্টন',
  'Financial Balances': 'আর্থিক হিসাব বিবরণী',
  'Due Today (PTP)': 'আজকের প্রতিশ্রুত আদায় (PTP)',
  'Missed PTP / Broken': 'মেয়াদোত্তীর্ণ প্রতিশ্রুতি',
  'Total Portfolio': 'মোট পোর্টফোলিও',
  'Total Collected': 'মোট আদায়কৃত টাকা',
  'All Statuses': 'সকল অবস্থা',
  'All Partner Banks': 'সকল পার্টনার ব্যাংক',
  'Export Excel (.XLSX)': 'এক্সেল ডাউনলোড (.XLSX)',
  'Search': 'অনুসন্ধান',
  'Cancel': 'বাতিল',
  'Save': 'সংরক্ষণ',
  'Close': 'বন্ধ করুন',
  'Actions': 'পদক্ষেপ',
  'Customer': 'গ্রাহক',
  'Phone': 'ফোন নম্বর',
  'Account': 'একাউন্ট',
  'File No': 'ফাইল নং',
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
  trans: (text: string) => string;
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

  const trans = (text: string): string => {
    if (language === 'en' || !text) return text;
    if (AUTO_WORD_MAP[text]) return AUTO_WORD_MAP[text];
    // Check if key matches
    const found = Object.entries(TRANSLATIONS.en).find(([k, v]) => v === text);
    if (found && TRANSLATIONS.bn[found[0]]) {
      return TRANSLATIONS.bn[found[0]];
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t, trans }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};