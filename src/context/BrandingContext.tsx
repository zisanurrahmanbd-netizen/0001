import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BrandingConfig {
  headerText: string;
  underText: string;
  loginTitle: string;
  loginSubtitle: string;
  logoIcon: string;
  customLogoUrl: string;
  brandColor: 'emerald' | 'blue' | 'purple' | 'indigo' | 'amber';
}

export const DEFAULT_BRANDING: BrandingConfig = {
  headerText: 'RecoveryPRO',
  underText: 'Bank Telemetry V2',
  loginTitle: 'Bank Recovery Tracking',
  loginSubtitle: 'Multi-Bank Loan & Credit Card File Tracking System',
  logoIcon: 'fa-vault',
  customLogoUrl: '',
  brandColor: 'emerald',
};

interface BrandingContextType {
  branding: BrandingConfig;
  updateBranding: (config: Partial<BrandingConfig>) => void;
  resetBranding: () => void;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingConfig>(() => {
    const saved = localStorage.getItem('app_branding_config');
    if (saved) {
      try {
        return { ...DEFAULT_BRANDING, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_BRANDING;
      }
    }
    return DEFAULT_BRANDING;
  });

  useEffect(() => {
    localStorage.setItem('app_branding_config', JSON.stringify(branding));
    document.title = `${branding.headerText} - ${branding.underText}`;
  }, [branding]);

  const updateBranding = (config: Partial<BrandingConfig>) => {
    setBranding(prev => ({ ...prev, ...config }));
  };

  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
    localStorage.removeItem('app_branding_config');
  };

  return (
    <BrandingContext.Provider value={{ branding, updateBranding, resetBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) throw new Error('useBranding must be used within BrandingProvider');
  return context;
};