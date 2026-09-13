import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanySettings } from '../types';
import { api } from '../services/api';

interface BrandingContextType {
  settings: CompanySettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: CompanySettings = {
  id: 'default',
  companyName: 'ApexBuild Construction & Engineering SaaS',
  logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=128&auto=format&fit=crop&q=80',
  faviconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%230090FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  loginBannerUrl: '',
  dashboardBannerUrl: '',
  contactEmail: 'operations@apexbuild-saas.com',
  currencySymbol: '₱',
  primaryColor: '#0090FF',
  updatedAt: new Date().toISOString()
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyFaviconAndTitle = (brand: CompanySettings) => {
    // Dynamic document title
    if (brand.companyName) {
      document.title = `${brand.companyName} | Enterprise Portal`;
    }
    // Dynamic favicon
    if (brand.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[id='dynamic-favicon']");
      if (!link) {
        link = document.createElement('link');
        link.id = 'dynamic-favicon';
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = brand.faviconUrl;
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.settings) {
        setSettings(res.settings);
        applyFaviconAndTitle(res.settings);
      }
    } catch (err) {
      console.warn('Could not load company branding from server, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    const res = await api.updateSettings(newSettings);
    if (res.settings) {
      setSettings(res.settings);
      applyFaviconAndTitle(res.settings);
    }
  };

  return (
    <BrandingContext.Provider value={{ settings, isLoading, updateSettings, refreshSettings: fetchSettings }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
