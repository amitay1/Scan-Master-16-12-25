import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StandardCatalog {
  shortCode: string;
  code: string;
  name: string;
  isPurchased: boolean;
  isLocked: boolean;
}

interface LicenseInfo {
  activated: boolean;
  valid: boolean;
  factoryId?: string;
  factoryName?: string;
  purchasedStandards?: string[];
  standardsCodes?: string[];
  expiryDate?: string | null;
  isLifetime?: boolean;
  activatedAt?: string;
  reason?: string;
  error?: string;
}

interface LicenseContextType {
  license: LicenseInfo | null;
  loading: boolean;
  canUseStandard: (standardCode: string) => boolean;
  activateLicense: (licenseKey: string) => Promise<{ success: boolean; error?: string }>;
  getStandards: () => StandardCatalog[];
  refreshLicense: () => Promise<void>;
  isElectron: boolean;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider = ({ children }: { children: ReactNode }) => {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [standards, setStandards] = useState<StandardCatalog[]>([]);

  // Check if running in Electron
  const isElectron = typeof window !== 'undefined' &&
                     window.electron &&
                     window.electron.license;

  // Load license on mount
  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    setLoading(true);
    try {
      if (isElectron) {
        // Electron: Use IPC
        const licenseInfo = await window.electron.license.check();
        setLicense(licenseInfo);

        // Load standards catalog
        const standardsCatalog = await window.electron.license.getStandards();
        setStandards(standardsCatalog);
      } else {
        // Web: Mock for development or use actual implementation
        setLicense({
          activated: true,
          valid: true,
          factoryId: 'WEB-DEV',
          factoryName: 'Development Mode',
          purchasedStandards: [
            'AMS-STD-2154E',
            'ASTM-A388',
            'BS-EN-10228-3',
            'BS-EN-10228-4',
            'MIL-STD-2154'
          ],
          isLifetime: true
        });

        // Mock standards
        setStandards([
          { shortCode: 'AMS', code: 'AMS-STD-2154E', name: 'Aerospace Material Specification', isPurchased: true, isLocked: false },
          { shortCode: 'ASTM', code: 'ASTM-A388', name: 'Steel Forgings', isPurchased: true, isLocked: false },
          { shortCode: 'BS3', code: 'BS-EN-10228-3', name: 'European Steel Standards Part 3', isPurchased: true, isLocked: false },
          { shortCode: 'BS4', code: 'BS-EN-10228-4', name: 'European Steel Standards Part 4', isPurchased: true, isLocked: false },
          { shortCode: 'MIL', code: 'MIL-STD-2154', name: 'Military Standard', isPurchased: true, isLocked: false }
        ]);
      }
    } catch (error) {
      console.error('Failed to load license:', error);
      setLicense({
        activated: false,
        valid: false,
        reason: 'ERROR'
      });
    } finally {
      setLoading(false);
    }
  };

  const canUseStandard = (standardCode: string): boolean => {
    if (!license || !license.valid) {
      return false;
    }

    if (!license.purchasedStandards) {
      return false;
    }

    return license.purchasedStandards.includes(standardCode);
  };

  const activateLicense = async (licenseKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isElectron) {
        const result = await window.electron.license.activate(licenseKey);

        if (result.success) {
          await loadLicense(); // Reload license info
        }

        return result;
      } else {
        // Web mode - mock activation
        return {
          success: false,
          error: 'License activation is only available in the desktop app'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const getStandards = (): StandardCatalog[] => {
    return standards;
  };

  const refreshLicense = async () => {
    await loadLicense();
  };

  const value: LicenseContextType = {
    license,
    loading,
    canUseStandard,
    activateLicense,
    getStandards,
    refreshLicense,
    isElectron
  };

  return (
    <LicenseContext.Provider value={value}>
      {children}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (context === undefined) {
    throw new Error('useLicense must be used within a LicenseProvider');
  }
  return context;
};

// Type augmentation for window.electron
declare global {
  interface Window {
    electron?: {
      license: {
        check: () => Promise<LicenseInfo>;
        activate: (licenseKey: string) => Promise<{ success: boolean; error?: string; license?: LicenseInfo }>;
        getInfo: () => Promise<any>;
        hasStandard: (standardCode: string) => Promise<boolean>;
        getStandards: () => Promise<StandardCatalog[]>;
        deactivate: () => Promise<{ success: boolean }>;
      };
      isElectron: boolean;
      platform: string;
    };
  }
}
