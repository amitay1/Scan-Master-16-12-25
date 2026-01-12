import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { getStorageData, setStorageData, STORAGE_KEYS } from '@/services/unifiedStorage';

// ============================================================================
// SETTINGS TYPES
// ============================================================================

export interface GeneralSettings {
  language: 'en' | 'he';
  theme: 'light' | 'dark' | 'system';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  timezone: string;
}

export interface UnitsSettings {
  lengthUnit: 'mm' | 'inch';
  angleUnit: 'degrees' | 'radians';
  temperatureUnit: 'celsius' | 'fahrenheit';
  pressureUnit: 'bar' | 'psi' | 'mpa';
  velocityUnit: 'm/s' | 'in/s';
  frequencyDisplay: 'MHz' | 'kHz';
}

export interface DefaultsSettings {
  defaultStandard: 'AMS-STD-2154E' | 'ASTM-A388' | 'BS-EN-10228-3' | 'BS-EN-10228-4';
  defaultMaterial: string;
  defaultFrequency: string;
  defaultCouplant: string;
  defaultProbeType: string;
  autoFillEnabled: boolean;
  autoCalculateEnabled: boolean;
}

export interface ExportSettings {
  defaultExportFormat: 'pdf' | 'docx' | 'both';
  includeCompanyLogo: boolean;
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includeDrawings: boolean;
  include3DViews: boolean;
  pdfQuality: 'draft' | 'standard' | 'high';
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
}

export interface CompanySettings {
  companyName: string;
  companyLogo: string; // Base64 or URL
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  certificationNumber: string;
  nadcapNumber: string;
  iso17025Number: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  validationWarnings: boolean;
  autoSaveReminder: boolean;
  autoSaveInterval: number; // minutes
  showTooltips: boolean;
  soundEffects: boolean;
}

export interface ViewerSettings {
  viewer3DEnabled: boolean;
  viewer3DDefaultSize: 'S' | 'M' | 'L';
  viewer3DAutoRotate: boolean;
  viewer3DShowGrid: boolean;
  viewer3DShowAxes: boolean;
  viewer3DBackgroundColor: string;
  drawingGridEnabled: boolean;
  drawingSnapToGrid: boolean;
  drawingGridSize: number;
}

export interface AdvancedSettings {
  developerMode: boolean;
  debugLogging: boolean;
  experimentalFeatures: boolean;
  cacheEnabled: boolean;
  offlineMode: boolean;
  dataRetentionDays: number;
  maxRecentFiles: number;
}

export interface AppSettings {
  general: GeneralSettings;
  units: UnitsSettings;
  defaults: DefaultsSettings;
  export: ExportSettings;
  company: CompanySettings;
  notifications: NotificationSettings;
  viewer: ViewerSettings;
  advanced: AdvancedSettings;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const defaultSettings: AppSettings = {
  general: {
    language: 'en',
    theme: 'dark',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  },
  units: {
    lengthUnit: 'mm',
    angleUnit: 'degrees',
    temperatureUnit: 'celsius',
    pressureUnit: 'bar',
    velocityUnit: 'm/s',
    frequencyDisplay: 'MHz',
  },
  defaults: {
    defaultStandard: 'AMS-STD-2154E',
    defaultMaterial: 'Aluminum 7075-T6',
    defaultFrequency: '5.0',
    defaultCouplant: 'Water',
    defaultProbeType: 'Straight Beam',
    autoFillEnabled: true,
    autoCalculateEnabled: true,
  },
  export: {
    defaultExportFormat: 'pdf',
    includeCompanyLogo: true,
    includeCoverPage: true,
    includeTableOfContents: true,
    includeDrawings: true,
    include3DViews: false,
    pdfQuality: 'standard',
    pageSize: 'A4',
    orientation: 'portrait',
  },
  company: {
    companyName: '',
    companyLogo: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    certificationNumber: '',
    nadcapNumber: '',
    iso17025Number: '',
  },
  notifications: {
    emailNotifications: false,
    validationWarnings: true,
    autoSaveReminder: true,
    autoSaveInterval: 5,
    showTooltips: true,
    soundEffects: false,
  },
  viewer: {
    viewer3DEnabled: true,
    viewer3DDefaultSize: 'M',
    viewer3DAutoRotate: false,
    viewer3DShowGrid: true,
    viewer3DShowAxes: true,
    viewer3DBackgroundColor: '#1a1a2e',
    drawingGridEnabled: true,
    drawingSnapToGrid: true,
    drawingGridSize: 10,
  },
  advanced: {
    developerMode: false,
    debugLogging: false,
    experimentalFeatures: false,
    cacheEnabled: true,
    offlineMode: false,
    dataRetentionDays: 365,
    maxRecentFiles: 10,
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

export interface SettingsContextType {
  settings: AppSettings;
  updateSettings: <K extends keyof AppSettings>(
    category: K,
    updates: Partial<AppSettings[K]>
  ) => void;
  resetSettings: (category?: keyof AppSettings) => void;
  exportSettings: () => string;
  importSettings: (json: string) => boolean;
  isLoading: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// ============================================================================
// PROVIDER (uses unified storage for cross-browser persistence)
// ============================================================================

const STORAGE_KEY = STORAGE_KEYS.SETTINGS;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadDone = useRef(false);

  // Load settings from unified storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await getStorageData<AppSettings>(STORAGE_KEY, defaultSettings);
        if (stored) {
          // Merge with defaults to handle new settings
          setSettings(deepMerge(defaultSettings, stored));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };

    loadSettings();
  }, []);

  // Save settings to unified storage on change
  useEffect(() => {
    if (!isLoading && initialLoadDone.current) {
      const saveSettings = async () => {
        try {
          await setStorageData(STORAGE_KEY, settings);
        } catch (error) {
          console.error('Failed to save settings:', error);
        }
      };

      saveSettings();
    }
  }, [settings, isLoading]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.general.theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', settings.general.theme === 'dark');
    }
  }, [settings.general.theme]);

  const updateSettings = <K extends keyof AppSettings>(
    category: K,
    updates: Partial<AppSettings[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...updates,
      },
    }));
  };

  const resetSettings = (category?: keyof AppSettings) => {
    if (category) {
      setSettings(prev => ({
        ...prev,
        [category]: defaultSettings[category],
      }));
    } else {
      setSettings(defaultSettings);
    }
  };

  const exportSettings = (): string => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (json: string): boolean => {
    try {
      const imported = JSON.parse(json);
      setSettings(deepMerge(defaultSettings, imported));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        exportSettings,
        importSettings,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// NOTE: useSettings hook is in @/hooks/useSettings

// ============================================================================
// UTILITIES
// ============================================================================

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          target[key] as object,
          source[key] as object
        );
      } else {
        (result as Record<string, unknown>)[key] = source[key];
      }
    }
  }
  
  return result;
}
