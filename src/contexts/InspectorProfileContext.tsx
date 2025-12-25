import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  InspectorProfile,
  InspectorProfileFormData,
  InspectorProfileStorage,
  generateInitials,
} from '@/types/inspectorProfile';

const STORAGE_KEY = 'scanmaster_inspector_profiles';

interface InspectorProfileContextValue {
  profiles: InspectorProfile[];
  currentProfile: InspectorProfile | null;
  rememberSelection: boolean;
  isLoading: boolean;
  needsProfileSelection: boolean;

  // Actions
  selectProfile: (id: string) => void;
  createProfile: (data: InspectorProfileFormData) => InspectorProfile;
  updateProfile: (id: string, data: InspectorProfileFormData) => void;
  deleteProfile: (id: string) => void;
  setDefaultProfile: (id: string) => void;
  setRememberSelection: (remember: boolean) => void;
  clearCurrentProfile: () => void;
}

const InspectorProfileContext = createContext<InspectorProfileContextValue | null>(null);

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function loadFromStorage(): InspectorProfileStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load inspector profiles from storage:', error);
  }
  return {
    profiles: [],
    currentProfileId: null,
    rememberSelection: false,
  };
}

function saveToStorage(data: InspectorProfileStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save inspector profiles to storage:', error);
  }
}

interface InspectorProfileProviderProps {
  children: ReactNode;
}

export function InspectorProfileProvider({ children }: InspectorProfileProviderProps) {
  const [profiles, setProfiles] = useState<InspectorProfile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const [rememberSelection, setRememberSelectionState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load from storage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    setProfiles(stored.profiles);
    setRememberSelectionState(stored.rememberSelection);

    // Only auto-select if remember is enabled
    if (stored.rememberSelection && stored.currentProfileId) {
      const profileExists = stored.profiles.some(p => p.id === stored.currentProfileId);
      if (profileExists) {
        setCurrentProfileId(stored.currentProfileId);
      }
    }

    setIsLoading(false);
  }, []);

  // Save to storage whenever data changes
  useEffect(() => {
    if (!isLoading) {
      saveToStorage({
        profiles,
        currentProfileId,
        rememberSelection,
      });
    }
  }, [profiles, currentProfileId, rememberSelection, isLoading]);

  const currentProfile = profiles.find(p => p.id === currentProfileId) || null;

  // Show profile selection if no profile is selected and we have profiles OR no profiles at all
  const needsProfileSelection = !isLoading && !currentProfile;

  const selectProfile = useCallback((id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      setCurrentProfileId(id);
    }
  }, [profiles]);

  const createProfile = useCallback((data: InspectorProfileFormData): InspectorProfile => {
    const now = new Date().toISOString();
    const newProfile: InspectorProfile = {
      id: generateUUID(),
      name: data.name.trim(),
      initials: generateInitials(data.name),
      certificationLevel: data.certificationLevel,
      certificationNumber: data.certificationNumber.trim(),
      certifyingOrganization: data.certifyingOrganization.trim(),
      employeeId: data.employeeId?.trim() || undefined,
      department: data.department?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      isDefault: profiles.length === 0, // First profile is default
    };

    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  }, [profiles.length]);

  const updateProfile = useCallback((id: string, data: InspectorProfileFormData) => {
    setProfiles(prev => prev.map(profile => {
      if (profile.id !== id) return profile;
      return {
        ...profile,
        name: data.name.trim(),
        initials: generateInitials(data.name),
        certificationLevel: data.certificationLevel,
        certificationNumber: data.certificationNumber.trim(),
        certifyingOrganization: data.certifyingOrganization.trim(),
        employeeId: data.employeeId?.trim() || undefined,
        department: data.department?.trim() || undefined,
        email: data.email?.trim() || undefined,
        phone: data.phone?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
    }));
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => {
      const newProfiles = prev.filter(p => p.id !== id);

      // If we deleted the default, make the first one default
      if (newProfiles.length > 0 && !newProfiles.some(p => p.isDefault)) {
        newProfiles[0].isDefault = true;
      }

      return newProfiles;
    });

    // Clear current if it was the deleted one
    if (currentProfileId === id) {
      setCurrentProfileId(null);
    }
  }, [currentProfileId]);

  const setDefaultProfile = useCallback((id: string) => {
    setProfiles(prev => prev.map(profile => ({
      ...profile,
      isDefault: profile.id === id,
      updatedAt: profile.id === id ? new Date().toISOString() : profile.updatedAt,
    })));
  }, []);

  const setRememberSelection = useCallback((remember: boolean) => {
    setRememberSelectionState(remember);
  }, []);

  const clearCurrentProfile = useCallback(() => {
    setCurrentProfileId(null);
  }, []);

  const value: InspectorProfileContextValue = {
    profiles,
    currentProfile,
    rememberSelection,
    isLoading,
    needsProfileSelection,
    selectProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    setDefaultProfile,
    setRememberSelection,
    clearCurrentProfile,
  };

  return (
    <InspectorProfileContext.Provider value={value}>
      {children}
    </InspectorProfileContext.Provider>
  );
}

export function useInspectorProfile(): InspectorProfileContextValue {
  const context = useContext(InspectorProfileContext);
  if (!context) {
    throw new Error('useInspectorProfile must be used within an InspectorProfileProvider');
  }
  return context;
}
