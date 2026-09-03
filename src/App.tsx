import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CasesList } from './pages/CasesList';
import { CaseDetail } from './pages/CaseDetail';
import { TrackingMap } from './pages/TrackingMap';
import { BankContactsPage } from './pages/BankContacts';
import { AgentPerformancePage } from './pages/AgentPerformance';
import { ExpiryTrackerPage } from './pages/ExpiryTracker';
import { FlaggedCasesPage } from './pages/FlaggedCases';
import { TeamManagementPage } from './pages/TeamManagement';
import { GoogleSheetSyncPage } from './pages/GoogleSheetSync';
import { DeviceLoginsPage } from './pages/DeviceLogins';
import { initGlobalSheetAutoSync } from './services/googleSheetsSync';

export const App: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  useEffect(() => {
    initGlobalSheetAutoSync();
  }, []);
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!user) {
    return <Login />;
  }

  const handleSelectCase = (id: number) => {
    setSelectedCaseId(id);
    setCurrentPage('case_detail');
  };

  const handleBackToCases = () => {
    setSelectedCaseId(null);
    setCurrentPage('cases');
  };

  const renderContent = () => {
    if (currentPage === 'case_detail' && selectedCaseId) {
      return <CaseDetail caseId={selectedCaseId} onBack={handleBackToCases} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onSelectCase={handleSelectCase} onNavigate={setCurrentPage} />;
      case 'cases':
        return <CasesList onSelectCase={handleSelectCase} searchQuery={searchQuery} />;
      case 'map':
        return <TrackingMap />;
      case 'gsheet_sync':
        return <GoogleSheetSyncPage />;
      case 'contacts':
        return <BankContactsPage />;
      case 'reports_perf':
        return <AgentPerformancePage />;
      case 'reports_expiry':
        return <ExpiryTrackerPage />;
      case 'reports_legal':
        return <FlaggedCasesPage onSelectCase={handleSelectCase} />;
      case 'team':
        return <TeamManagementPage />;
      case 'device_logins':
        return <DeviceLoginsPage />;
      default:
        return <Dashboard onSelectCase={handleSelectCase} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={(page) => {
        setSelectedCaseId(null);
        setCurrentPage(page);
      }}
      onSearch={setSearchQuery}
    >
      {renderContent()}
    </Layout>
  );
};