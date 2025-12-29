import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  InspectorProfile,
  InspectorProfileFormData,
  InspectorProfileStorage,
  generateInitials,
} from '@/types/inspectorProfile';

const STORAGE_KEY = 'scanmaster_inspector_profiles';
const API_BASE_URL = '/api/inspector-profiles';

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
  const [useServerSync, setUseServerSync] = useState(true); // Enable server sync by default

  // Fetch profiles from server
  const fetchProfilesFromServer = useCallback(async () => {
    try {
      const response = await fetch(API_BASE_URL, {
        headers: {
          'x-user-id': getUserId(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profiles from server');
      }

      const serverProfiles = await response.json();
      return serverProfiles;
    } catch (error) {
      console.error('Failed to fetch profiles from server:', error);
      return null;
    }
  }, []);

  // Get or create user ID for anonymous users
  function getUserId(): string {
    let userId = localStorage.getItem('scanmaster_user_id');
    if (!userId) {
      userId = generateUUID();
      localStorage.setItem('scanmaster_user_id', userId);
    }
    return userId;
  }

  // Load from server or localStorage on mount
  useEffect(() => {
    const loadProfiles = async () => {
      if (useServerSync) {
        // Try to load from server first
        const serverProfiles = await fetchProfilesFromServer();

        if (serverProfiles && Array.isArray(serverProfiles)) {
          // Successfully loaded from server
          setProfiles(serverProfiles);

          // Load remember selection from localStorage
          const stored = loadFromStorage();
          setRememberSelectionState(stored.rememberSelection);

          // Only auto-select if remember is enabled
          if (stored.rememberSelection && stored.currentProfileId) {
            const profileExists = serverProfiles.some((p: InspectorProfile) => p.id === stored.currentProfileId);
            if (profileExists) {
              setCurrentProfileId(stored.currentProfileId);
            }
          }

          // Also save to localStorage as backup
          saveToStorage({
            profiles: serverProfiles,
            currentProfileId: stored.currentProfileId,
            rememberSelection: stored.rememberSelection,
          });
        } else {
          // Fallback to localStorage if server fails
          console.log('Falling back to localStorage');
          const stored = loadFromStorage();
          setProfiles(stored.profiles);
          setRememberSelectionState(stored.rememberSelection);

          if (stored.rememberSelection && stored.currentProfileId) {
            const profileExists = stored.profiles.some(p => p.id === stored.currentProfileId);
            if (profileExists) {
              setCurrentProfileId(stored.currentProfileId);
            }
          }
        }
      } else {
        // Use localStorage only
        const stored = loadFromStorage();
        setProfiles(stored.profiles);
        setRememberSelectionState(stored.rememberSelection);

        if (stored.rememberSelection && stored.currentProfileId) {
          const profileExists = stored.profiles.some(p => p.id === stored.currentProfileId);
          if (profileExists) {
            setCurrentProfileId(stored.currentProfileId);
          }
        }
      }

      setIsLoading(false);
    };

    loadProfiles();
  }, [useServerSync, fetchProfilesFromServer]);

  // Save to localStorage whenever data changes (for offline backup)
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

    // Save to server if sync is enabled
    if (useServerSync) {
      fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId(),
        },
        body: JSON.stringify(newProfile),
      })
        .then(response => {
          if (!response.ok) {
            console.error('Failed to save profile to server');
          }
          return response.json();
        })
        .then(serverProfile => {
          console.log('Profile saved to server:', serverProfile);
        })
        .catch(error => {
          console.error('Error saving profile to server:', error);
        });
    }

    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  }, [profiles.length, useServerSync]);

  const updateProfile = useCallback((id: string, data: InspectorProfileFormData) => {
    const updatedData = {
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

    // Update on server if sync is enabled
    if (useServerSync) {
      fetch(`${API_BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': getUserId(),
        },
        body: JSON.stringify(updatedData),
      })
        .then(response => {
          if (!response.ok) {
            console.error('Failed to update profile on server');
          }
          return response.json();
        })
        .then(serverProfile => {
          console.log('Profile updated on server:', serverProfile);
        })
        .catch(error => {
          console.error('Error updating profile on server:', error);
        });
    }

    setProfiles(prev => prev.map(profile => {
      if (profile.id !== id) return profile;
      return {
        ...profile,
        ...updatedData,
      };
    }));
  }, [useServerSync]);

  const deleteProfile = useCallback((id: string) => {
    // Delete from server if sync is enabled
    if (useServerSync) {
      fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': getUserId(),
        },
      })
        .then(response => {
          if (!response.ok) {
            console.error('Failed to delete profile from server');
          } else {
            console.log('Profile deleted from server');
          }
        })
        .catch(error => {
          console.error('Error deleting profile from server:', error);
        });
    }

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
  }, [currentProfileId, useServerSync]);

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
